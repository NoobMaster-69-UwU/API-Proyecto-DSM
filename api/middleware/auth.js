module.exports = function verifyToken(admin) {
  return async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header)
      return res.status(401).json({ error: "NO_TOKEN" });

    const token = header.split(" ")[1];

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
  };
};
