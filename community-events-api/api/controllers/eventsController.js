exports.getAllEvents = (admin) => async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("events").get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(events);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getEventById = (admin) => async (req, res) => {
  try {
    const doc = await admin.firestore().collection("events").doc(req.params.id).get();

    if (!doc.exists)
      return res.status(404).json({ error: "EVENT_NOT_FOUND" });

    res.json({ id: doc.id, ...doc.data() });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createEvent = (admin) => async (req, res) => {
  try {
    const data = req.body;
    let imageUrl = null;

    if (req.file) {
      const bucket = admin.storage().bucket();
      const filename = `events/${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(filename);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const signedUrl = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2500"
      });

      imageUrl = signedUrl[0];
    }

    const event = {
      ...data,
      imageUrl,
      createdAt: Date.now()
    };

    const docRef = await admin.firestore().collection("events").add(event);

    res.json({ id: docRef.id, ...event });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.rsvpEvent = (admin) => async (req, res) => {
  try {
    const uid = req.user.uid;

    await admin.firestore()
      .collection("events")
      .doc(req.params.id)
      .collection("rsvp")
      .doc(uid)
      .set({ attending: true });

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.commentEvent = (admin) => async (req, res) => {
  try {
    const uid = req.user.uid;
    const { comment } = req.body;

    await admin.firestore()
      .collection("events")
      .doc(req.params.id)
      .collection("comments")
      .add({
        uid,
        comment,
        createdAt: Date.now()
      });

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.rateEvent = (admin) => async (req, res) => {
  try {
    const uid = req.user.uid;
    const { rating } = req.body;

    await admin.firestore()
      .collection("events")
      .doc(req.params.id)
      .collection("ratings")
      .doc(uid)
      .set({ rating });

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
