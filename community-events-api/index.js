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

// Initialize Firebase Admin SDK
const admin = initFirebase();

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routers (events is public-read for GETs; protected routes require token)
app.use('/api/events', eventsRouter(admin, verifyToken));
app.use('/api/users', usersRouter(admin, verifyToken));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on port', PORT));
