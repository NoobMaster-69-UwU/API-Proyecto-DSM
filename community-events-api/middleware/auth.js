module.exports = function(admin) {
  return async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) {
      // allow public reads; protected endpoints check req.user !== null
      req.user = null;
      return next();
    }
    const idToken = match[1];
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      req.user = decoded; // includes uid and custom claims
      return next();
    } catch (err) {
      console.error('verifyIdToken error', err);
      return res.status(401).json({ error: 'invalid_token' });
    }
  };
};
