const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// GET /api/feed?limit=20
// Returns most recent movies from users the current user follows
router.get('/', async (req, res) => {
	try {
		const currentUserId = req.user.userId;
		const limit = Math.min(parseInt(req.query.limit) || 20, 100);

		const currentUser = await User.findById(currentUserId).select(
			'users_followed'
		);
		if (!currentUser)
			return res.status(404).json({ message: 'User not found' });

		const followed = currentUser.users_followed || [];
		if (followed.length === 0) return res.json([]);

		// Aggregation: get the recent movies from followed users, include owner's username
		const pipeline = [
			{
				$match: {
					_id: { $in: followed },
				},
			},
			{ $project: { username: 1, movies: 1 } },
			{ $unwind: '$movies' },
			{
				$replaceRoot: {
					newRoot: {
						owner: { _id: '$_id', username: '$username' },
						movie: '$movies',
					},
				},
			},
			{ $sort: { 'movie.date_added': -1 } },
			{ $limit: limit },
		];

		const results = await User.aggregate(pipeline);
		// Normalize date fields: ensure movie.date_added is a Date or ISO string
		const feed = results.map((r) => ({
			owner: r.owner,
			movie: r.movie,
		}));

		res.json(feed);
	} catch (err) {
		console.error('GET /feed error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
