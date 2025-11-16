require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initFirebase } = require('./utils/firebaseInit');
const verifyToken = require('./middleware/auth');
const eventsRouter = require('./routes/events');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

// Firebase admin
const admin = initFirebase();

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/events', eventsRouter(admin, verifyToken));
app.use('/users', usersRouter(admin, verifyToken));

module.exports = app;
