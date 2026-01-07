const express = require('express');
const router = express.Router();
const User = require('../models/User');

//GET USER MOVIE LIST
router.get('/', async (req, res) => {
	try {
		const userId = req.user.userId;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.json(user.movies);
	} catch (err) {
		console.error('GET /movies error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

//POST MOVIE TO LIST
router.post('/', async (req, res) => {
	try {
		const userId = req.user.userId;

		const { movie_id, title, year, poster_url } = req.body;

		if (!movie_id || !title) {
			return res.status(400).json({ message: 'Missing required fields' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		user.movies.push({
			movie_id,
			title,
			year,
			poster_url,
			rating: null,
			note: '',
			date_added: Date.now(),
		});

		await user.save();

		res.json(user.movies);
	} catch (err) {
		console.error('POST /movies error', err);
		res.status(500).json({ message: 'Server error' });
	}
});

//EDIT MOVIE RATING AND PERSONAL NOTE
router.put('/:id', async (req, res) => {
	try {
		const userId = req.user.userId;
		const { id } = req.params;
		const { rating, note } = req.body;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const movie = user.movies.id(id);

		if (!movie) {
			return res.status(404).json({ message: 'Movie not found' });
		}

		if (rating !== undefined) movie.rating = rating;
		if (note !== undefined) movie.note = note;
		await user.save();

		res.json(user.movies);
	} catch (err) {
		console.error('PUT /movies error', err);
		res.status(500).json({ message: 'Server error' });
	}
});

//REMOVE MOVIE FROM LIST
router.delete('/:id', async (req, res) => {
	try {
		const userId = req.user.userId;
		const { id } = req.params;

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const movie = user.movies.id(id);
		if (!movie) {
			return res.status(404).json({ message: 'Movie not found' });
		}

		movie.deleteOne(); // 👈 tar bort exakt EN post
		await user.save();

		res.json(user.movies);
	} catch (err) {
		console.error('DELETE /movies error', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
