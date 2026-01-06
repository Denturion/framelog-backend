const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// GET /api/follow/search?q=...&limit=8
// Simple username search used by the feed's search dropdown
router.get('/search/users', async (req, res) => {
	try {
		const q = (req.query.q || '').toString().trim();

		console.log('QUERY:', q);

		const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

		//  TEST 1 – UTAN FILTER
		const users = await User.find({
			username: { $regex: regex },
		}).select('username');

		console.log(
			'MATCHING USERS:',
			users.map((u) => u.username)
		);

		res.json(users.map((u) => ({ _id: u._id, username: u.username })));
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: err.message });
	}
});

// POST /api/follow/:target  -> follow a user by id OR username
router.post('/:target', async (req, res) => {
	try {
		const currentUserId = req.user.userId;
		const { target } = req.params;

		// Resolve target user by id or username
		let targetUser = null;
		if (mongoose.Types.ObjectId.isValid(target)) {
			targetUser = await User.findById(target);
		} else {
			targetUser = await User.findOne({ username: target });
		}

		if (!targetUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		if (currentUserId === String(targetUser._id)) {
			return res.status(400).json({ message: "You can't follow yourself" });
		}

		const currentUser = await User.findById(currentUserId);
		if (!currentUser)
			return res.status(404).json({ message: 'User not found' });

		// Add if not already following
		if (!currentUser.users_followed.some((id) => id.equals(targetUser._id))) {
			currentUser.users_followed.push(targetUser._id);
		}

		if (!targetUser.followers.some((id) => id.equals(currentUser._id))) {
			targetUser.followers.push(currentUser._id);
		}

		await currentUser.save();
		await targetUser.save();

		res.json({
			message: 'Followed',
			users_followed: currentUser.users_followed,
		});
	} catch (err) {
		console.error('POST /follow error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// DELETE /api/follow/:target -> unfollow by id OR username
router.delete('/:target', async (req, res) => {
	try {
		const currentUserId = req.user.userId;
		const { target } = req.params;

		// Resolve target user by id or username
		let targetUser = null;
		if (mongoose.Types.ObjectId.isValid(target)) {
			targetUser = await User.findById(target);
		} else {
			targetUser = await User.findOne({ username: target });
		}

		if (!targetUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		const currentUser = await User.findById(currentUserId);
		if (!currentUser)
			return res.status(404).json({ message: 'User not found' });

		currentUser.users_followed = currentUser.users_followed.filter(
			(id) => !id.equals(targetUser._id)
		);
		targetUser.followers = targetUser.followers.filter(
			(id) => !id.equals(currentUser._id)
		);

		await currentUser.save();
		await targetUser.save();

		res.json({
			message: 'Unfollowed',
			users_followed: currentUser.users_followed,
		});
	} catch (err) {
		console.error('DELETE /follow error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
