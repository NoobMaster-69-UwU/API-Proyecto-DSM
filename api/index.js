require("dotenv").config();
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const { initFirebase } = require("./utils/firebaseInit");
const eventsRouter = require("./routes/events");
const usersRouter = require("./routes/users");
const verifyToken = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

const admin = initFirebase();

// Health endpoint
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/events", eventsRouter(admin, verifyToken));
app.use("/users", usersRouter(admin, verifyToken));

module.exports = serverless(app);
