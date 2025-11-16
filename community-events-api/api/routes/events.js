const express = require('express');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

module.exports = function(admin, authMiddleware) {
  const router = express.Router();
  const db = admin.firestore();
  const bucket = admin.storage ? admin.storage().bucket() : null;

  // GET list (public)
  router.get('/', async (req, res) => {
    try {
      const upcoming = req.query.upcoming === 'true';
      let q = db.collection('events').where('visible', '==', true);
      if (upcoming) q = q.where('endAt', '>=', Date.now());
      q = q.orderBy('startAt', 'asc').limit(parseInt(req.query.limit || '50'));
      const snap = await q.get();
      const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      res.json({ events });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // GET event
  router.get('/:id', async (req, res) => {
    try {
      const doc = await db.collection('events').doc(req.params.id).get();
      if (!doc.exists) return res.status(404).json({ error: 'not_found' });
      res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Protected routes: attach auth middleware (this middleware sets req.user or null)
  router.use(authMiddleware(admin));

  // Create event (multipart optional image)
  router.post('/', upload.single('image'), async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const data = req.body;
      if (!data.title || !data.startAt) return res.status(400).json({ error: 'missing_fields' });
      data.organizerUid = user.uid;
      data.createdAt = Date.now();
      data.updatedAt = Date.now();
      data.visible = data.visible === 'false' ? false : true;

      if (req.file && bucket) {
        const filename = `events/${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(filename);
        await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        data.imageUrl = publicUrl;
      }

      const ref = await db.collection('events').add(data);
      res.status(201).json({ id: ref.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Update event
  router.put('/:id', upload.single('image'), async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const docRef = db.collection('events').doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: 'not_found' });
      const event = doc.data();
      if (event.organizerUid !== user.uid && user.role !== 'admin' && !(user.admin === true)) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const update = req.body;
      update.updatedAt = Date.now();

      if (req.file && bucket) {
        const filename = `events/${Date.now()}_${req.file.originalname}`;
        const file = bucket.file(filename);
        await file.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        update.imageUrl = publicUrl;
      }

      await docRef.update(update);

      // Try to notify topic subscribers
      try {
        await admin.messaging().send({
          topic: `event_${req.params.id}`,
          notification: { title: 'Evento actualizado', body: `El evento ${event.title} fue actualizado` },
          data: { eventId: req.params.id }
        });
      } catch (e) {
        console.warn('FCM send failed', e.message || e);
      }

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Delete event
  router.delete('/:id', async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const docRef = db.collection('events').doc(req.params.id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: 'not_found' });
      const event = doc.data();
      if (event.organizerUid !== user.uid && user.role !== 'admin' && !(user.admin === true)) {
        return res.status(403).json({ error: 'forbidden' });
      }
      await docRef.delete();
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // RSVP
  router.post('/:id/rsvp', async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const status = req.body.status || 'going';
      const rsvpRef = db.collection('events').doc(req.params.id).collection('rsvps').doc(user.uid);
      await rsvpRef.set({ userUid: user.uid, status, createdAt: Date.now() }, { merge: true });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Comments
  router.post('/:id/comments', async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const text = req.body.text;
      if (!text) return res.status(400).json({ error: 'empty_comment' });
      const comment = { userUid: user.uid, text, createdAt: Date.now() };
      const ref = await db.collection('events').doc(req.params.id).collection('comments').add(comment);
      res.status(201).json({ id: ref.id, ...comment });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // Ratings
  router.post('/:id/ratings', async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const rating = parseInt(req.body.rating);
      if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'invalid_rating' });
      const ratingRef = db.collection('events').doc(req.params.id).collection('ratings').doc(user.uid);
      await ratingRef.set({ userUid: user.uid, rating, createdAt: Date.now() }, { merge: true });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  return router;
};
