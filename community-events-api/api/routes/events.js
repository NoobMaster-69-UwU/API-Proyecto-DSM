const express = require("express");
const upload = require("../middleware/multerUpload");

const {
  getAllEvents,
  getEventById,
  createEvent,
  rsvpEvent,
  commentEvent,
  rateEvent
} = require("../controllers/eventsController");

module.exports = (admin, verifyToken) => {
  const router = express.Router();

  router.get("/", getAllEvents(admin));
  router.get("/:id", getEventById(admin));

  router.post("/", verifyToken(admin), upload.single("image"), createEvent(admin));
  router.post("/:id/rsvp", verifyToken(admin), rsvpEvent(admin));
  router.post("/:id/comments", verifyToken(admin), commentEvent(admin));
  router.post("/:id/ratings", verifyToken(admin), rateEvent(admin));

  return router;
};
