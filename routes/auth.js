const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

//Register user

router.post('/register', async (req, res) => {
	try {
		const { username, email, password } = req.body;

		if (!username || !email || !password) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: 'Email already in use.' });
		}

		const salt = await bcrypt.genSalt(10);
		const password_hash = await bcrypt.hash(password, salt);

		const newUser = new User({
			username,
			email,
			password_hash,
		});

		await newUser.save();

		const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
			expiresIn: '7d',
		});

		res.cookie('token', token, {
			httpOnly: true,
			sameSite: isProd ? 'none' : 'lax',
			secure: isProd,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/',
		});

		res.status(201).json({
			message: 'User registrered successfully',
			userId: newUser._id,
		});
	} catch (err) {
		console.error('Register error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

// Login user
router.post('/login', async (req, res) => {
	try {
		const { username, password } = req.body;

		if (!username || !password) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: 'Invalid credentials' });
		}

		const isMatch = await bcrypt.compare(password, user.password_hash);
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid credentials' });
		}

		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: '7d',
		});
		res.cookie('token', token, {
			httpOnly: true,
			sameSite: isProd ? 'none' : 'lax',
			secure: isProd,
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/',
		});

		res.status(200).json({
			message: 'Login successful',
			user: {
				id: user._id,
				username: user.username,
			},
		});
	} catch (err) {
		console.error('login error:', err);
		res.status(500).json({ message: 'Server error' });
	}
});

router.post('/logout', (req, res) => {
	res.clearCookie('token', {
		httpOnly: true,
		sameSite: isProd ? 'none' : 'lax',
		secure: isProd,
		path: '/',
	});

	res.status(200).json({ message: 'Logged out' });
});

module.exports = router;
