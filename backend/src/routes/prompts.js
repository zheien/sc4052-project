const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Middleware to check if user is authenticated
const checkAuth = (req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  next();
};

// Get custom prompts for a user
router.get('/custom', checkAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db.collection('customPrompts')
      .where('userId', '==', userId)
      .get();

    const prompts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(prompts);
  } catch (error) {
    console.error('Error fetching custom prompts:', error);
    res.status(500).json({ error: 'Failed to fetch custom prompts' });
  }
});

// Add a custom prompt
router.post('/custom', checkAuth, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.uid;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const promptData = {
      title,
      description,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('customPrompts').add(promptData);
    res.json({ id: docRef.id, ...promptData });
  } catch (error) {
    console.error('Error adding custom prompt:', error);
    res.status(500).json({ error: 'Failed to add custom prompt' });
  }
});

// Delete a custom prompt
router.delete('/custom/:promptId', checkAuth, async (req, res) => {
  try {
    const { promptId } = req.params;
    const userId = req.user.uid;

    const promptRef = db.collection('customPrompts').doc(promptId);
    const promptDoc = await promptRef.get();

    if (!promptDoc.exists) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    if (promptDoc.data().userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this prompt' });
    }

    await promptRef.delete();
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom prompt:', error);
    res.status(500).json({ error: 'Failed to delete custom prompt' });
  }
});

// Get selected prompts for a user
router.get('/selected', checkAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.json([]);
    }

    const selectedPrompts = userDoc.data().selectedPrompts || [];
    res.json(selectedPrompts);
  } catch (error) {
    console.error('Error fetching selected prompts:', error);
    res.status(500).json({ error: 'Failed to fetch selected prompts' });
  }
});

// Add a selected prompt
router.post('/selected', checkAuth, async (req, res) => {
  try {
    const { promptId } = req.body;
    const userId = req.user.uid;

    if (!promptId) {
      return res.status(400).json({ error: 'Prompt ID is required' });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    let selectedPrompts = [];
    if (userDoc.exists) {
      selectedPrompts = userDoc.data().selectedPrompts || [];
    }

    if (!selectedPrompts.includes(promptId)) {
      selectedPrompts.push(promptId);
      await userRef.set({ selectedPrompts }, { merge: true });
    }

    res.json(selectedPrompts);
  } catch (error) {
    console.error('Error adding selected prompt:', error);
    res.status(500).json({ error: 'Failed to add selected prompt' });
  }
});

// Remove a selected prompt
router.delete('/selected/:promptId', checkAuth, async (req, res) => {
  try {
    const { promptId } = req.params;
    const userId = req.user.uid;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    let selectedPrompts = userDoc.data().selectedPrompts || [];
    selectedPrompts = selectedPrompts.filter(id => id !== promptId);

    await userRef.set({ selectedPrompts }, { merge: true });
    res.json(selectedPrompts);
  } catch (error) {
    console.error('Error removing selected prompt:', error);
    res.status(500).json({ error: 'Failed to remove selected prompt' });
  }
});

// Save all selected prompts
router.post('/selected/save', checkAuth, async (req, res) => {
  try {
    const { prompts } = req.body;
    const userId = req.user.uid;

    if (!Array.isArray(prompts)) {
      return res.status(400).json({ error: 'Prompts must be an array' });
    }

    const userRef = db.collection('users').doc(userId);
    await userRef.set({ selectedPrompts: prompts }, { merge: true });
    
    res.json(prompts);
  } catch (error) {
    console.error('Error saving selected prompts:', error);
    res.status(500).json({ error: 'Failed to save selected prompts' });
  }
});

module.exports = router;