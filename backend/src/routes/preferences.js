const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get user preferences
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const doc = await admin.firestore().collection('preferences').doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set/update user preferences
router.post('/:userId', async (req, res) => {
  const { userId } = req.params;
  const preferences = req.body;
  try {
    await admin.firestore().collection('preferences').doc(userId).set(preferences, { merge: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
