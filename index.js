require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

/* =========================
   ENV & FLAGS
========================= */

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;
const isProd = process.env.NODE_ENV === 'production';

/* =========================
   MIDDLEWARE
========================= */

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
	})
);

// Explicit preflight support
app.options('*', cors());
app.use(express.json());
app.use(cookieParser());

/* =========================
   AUTH MIDDLEWARE
========================= */

const authMiddleware = require('./middleware/auth');

/* =========================
   ROUTES
========================= */

// Health check
app.get('/', (req, res) => {
	res.send('FrameLog API running');
});

// Test protected route
app.get('/api/protected', authMiddleware, (req, res) => {
	res.json({
		message: 'You are authorized',
		userId: req.user.userId,
	});
});

// Auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Movies (protected)
const moviesRoutes = require('./routes/movies');
app.use('/api/movies', authMiddleware, moviesRoutes);

// Follow (protected)
const followRoutes = require('./routes/follow');
app.use('/api/follow', authMiddleware, followRoutes);

// Feed (protected)
const feedRoutes = require('./routes/feed');
app.use('/api/feed', authMiddleware, feedRoutes);

// Users (protected but returns public data)
const usersRoutes = require('./routes/users');
app.use('/api/users', authMiddleware, usersRoutes);

/* =========================
   DATABASE
========================= */

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log('MongoDB connected'))
	.catch((err) => {
		console.error('MongoDB connection error:', err);
		process.exit(1);
	});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
	console.log(`API running on port ${PORT}`);
	console.log(`Environment: ${isProd ? 'production' : 'development'}`);
	console.log(`Client URL: ${CLIENT_URL}`);
});
