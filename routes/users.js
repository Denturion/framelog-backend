const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// GET /api/users/:identifier/movies - public (protected by auth in index.js)
// Returns the user's movie list sorted newest first, and whether the current user follows them
router.get('/:identifier/movies', async (req, res) => {
	try {
		const { identifier } = req.params;
		if (!identifier || typeof identifier !== 'string')
			return res.status(400).json({ message: 'Invalid identifier' });

		// Resolve by id or username
		let user = null;
		if (mongoose.Types.ObjectId.isValid(identifier)) {
			user = await User.findById(identifier).select('username movies');
		}
		if (!user) {
			user = await User.findOne({ username: identifier }).select(
				'username movies'
			);
		}
		if (!user) return res.status(404).json({ message: 'User not found' });

		// Determine if the current logged-in user follows this user
		let is_followed = false;
		try {
			const currentUserId = req.user?.userId;
			if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
				const currentUser = await User.findById(currentUserId).select(
					'users_followed'
				);
				if (
					currentUser &&
					currentUser.users_followed.some((id) => id.equals(user._id))
				) {
					is_followed = true;
				}
			}
		} catch (e) {
			// don't fail the request if follow-check errors; default to false
			console.warn('Follow-check error', e);
		}

		// Sort movies by date_added desc
		const movies = (user.movies || [])
			.slice()
			.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

		res.json({
			owner: { _id: user._id, username: user.username, is_followed },
			movies,
		});
	} catch (err) {
		console.error('GET /users/:identifier/movies error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
