const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
	movie_id: String,
	title: String,
	year: String,
	poster_url: String,
	date_added: {
		type: Date,
		default: Date.now,
	},
	rating: Number,
	note: String,
});

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password_hash: {
		type: String,
		required: true,
	},
	created_at: {
		type: Date,
		default: Date.now,
	},
	movies: [movieSchema],
	users_followed: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
	followers: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
	],
});

module.exports = mongoose.model('User', userSchema);
