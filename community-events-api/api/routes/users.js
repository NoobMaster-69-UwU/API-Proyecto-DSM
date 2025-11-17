const express = require("express");
const {
  getUserMe,
  setAdmin
} = require("../controllers/usersController");

module.exports = (admin, verifyToken) => {
  const router = express.Router();

  router.get("/me", verifyToken(admin), getUserMe(admin));
  router.post("/:uid/setAdmin", verifyToken(admin), setAdmin(admin));

  return router;
};
