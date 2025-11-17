require("dotenv").config();
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");

const { initFirebase } = require("./utils/firebaseInit");
const eventsRouter = require("./routes/events");
const usersRouter = require("./routes/users");
const verifyToken = require("./middleware/auth");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin
const admin = initFirebase();

// Endpoint de prueba
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "API Funcionando en Vercel 👌" });
});

// Rutas reales
app.use("/events", eventsRouter(admin, verifyToken));
app.use("/users", usersRouter(admin, verifyToken));

module.exports = serverless(app);
