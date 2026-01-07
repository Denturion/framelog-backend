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
		console.log('\n=== POST /movies DEBUG ===');
		console.log('req.user.userId:', userId);

		const { movie_id, title, year, poster_url } = req.body;

		if (!movie_id || !title) {
			return res.status(400).json({ message: 'Missing required fields' });
		}

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		console.log('BEFORE push - user.movies:');
		user.movies.forEach((m, idx) => {
			console.log(
				`  [${idx}] _id: ${m._id}, _id type: ${m._id?.constructor.name}, title: ${m.title}`
			);
		});

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

		console.log('AFTER save - user.movies:');
		user.movies.forEach((m, idx) => {
			console.log(
				`  [${idx}] _id: ${m._id}, _id type: ${m._id?.constructor.name}, title: ${m.title}`
			);
		});
		console.log('=== END POST DEBUG ===\n');

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

		console.log('\n=== PUT /movies/:id DEBUG ===');
		console.log('req.user.userId:', userId);
		console.log('req.params.id:', id);
		console.log('req.params.id type:', typeof id);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		console.log('user.movies list:');
		user.movies.forEach((m, idx) => {
			console.log(
				`  [${idx}] _id: ${m._id}, _id type: ${
					m._id?.constructor.name
				}, toString: ${m._id?.toString()}, title: ${m.title}`
			);
		});

		const movie = user.movies.find((m) => m._id.toString() === id);
		console.log('Found movie:', movie ? `Yes - ${movie.title}` : 'No');

		if (!movie) {
			return res.status(404).json({ message: 'Movie not found' });
		}

		if (rating !== undefined) movie.rating = rating;
		if (note !== undefined) movie.note = note;

		await user.save();
		console.log('=== END PUT DEBUG ===\n');

		res.json(movie);
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

		console.log('\n=== DELETE /movies/:id DEBUG ===');
		console.log('req.user.userId:', userId);
		console.log('req.params.id:', id);
		console.log('req.params.id type:', typeof id);

		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		console.log('user.movies list:');
		user.movies.forEach((m, idx) => {
			console.log(
				`  [${idx}] _id: ${m._id}, _id type: ${
					m._id?.constructor.name
				}, toString: ${m._id?.toString()}, title: ${m.title}`
			);
		});

		user.movies.pull({ _id: id });
		await user.save();
		console.log('Movie removed successfully');
		console.log('=== END DELETE DEBUG ===\n');

		res.status(204).send();
	} catch (err) {
		console.error('DELETE /movies error', err);
		res.status(500).json({ message: 'Server error' });
	}
});

module.exports = router;
