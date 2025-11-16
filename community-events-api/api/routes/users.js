const express = require('express');

module.exports = function(admin, authMiddleware) {
  const router = express.Router();
  const db = admin.firestore();

  router.use(authMiddleware(admin));

  // GET /api/users/me
  router.get('/me', async (req, res) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'auth_required' });
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (!userDoc.exists) {
        const basic = { displayName: user.name || null, email: user.email || null, role: 'user', createdAt: Date.now() };
        await db.collection('users').doc(user.uid).set(basic, { merge: true });
        return res.json({ uid: user.uid, ...basic });
      }
      return res.json({ uid: user.uid, ...userDoc.data() });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  // POST /api/users/:uid/setAdmin  (admin-only)
  router.post('/:uid/setAdmin', async (req, res) => {
    try {
      const requester = req.user;
      if (!requester) return res.status(401).json({ error: 'auth_required' });
      if (!(requester.role === 'admin' || requester.admin === true)) return res.status(403).json({ error: 'forbidden' });
      const { uid } = req.params;
      await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
      await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true });
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'server_error' });
    }
  });

  return router;
};
