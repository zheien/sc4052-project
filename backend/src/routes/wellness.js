const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');

// Save wellness data
router.post('/data', async (req, res) => {
  try {
    const { userId, date, mood, sleep } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const docRef = await db.collection('wellness').add({
      userId,
      date,
      mood,
      sleep,
      createdAt: new Date()
    });

    const doc = await docRef.get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error saving wellness data:', error);
    res.status(500).json({ error: 'Failed to save wellness data' });
  }
});

// Get wellness data for a user within a date range
router.get('/data', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let query = db.collection('wellness')
      .where('userId', '==', userId)
      .orderBy('date', 'desc');

    if (startDate) {
      query = query.where('date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('date', '<=', endDate);
    }

    const snapshot = await query.get();
    const data = [];
    snapshot.forEach(doc => {
      data.push({ id: doc.id, ...doc.data() });
    });

    res.json(data);
  } catch (error) {
    console.error('Error getting wellness data:', error);
    res.status(500).json({ error: 'Failed to get wellness data' });
  }
});

module.exports = router;
