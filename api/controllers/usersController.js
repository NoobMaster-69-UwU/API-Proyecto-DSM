exports.getUserMe = (admin) => async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.setAdmin = (admin) => async (req, res) => {
  try {
    const uid = req.params.uid;

    await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.json({ success: true });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
