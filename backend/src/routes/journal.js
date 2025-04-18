const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../services/ollama');
const { saveJournalEntry, getJournalHistory, saveConversation } = require('../services/firebase');

// Submit a new journal entry
router.post('/entries', async (req, res) => {
  try {
    const { entry, conversation, model } = req.body;
    const userId = req.user.uid;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to save journal entry' });
    }

    if (!entry || !model) {
      return res.status(400).json({ error: 'Missing required fields: entry or model' });
    }

    try {
      // Get AI response from Ollama, including conversation context
      const aiResponse = await getAIResponse(model, conversation, entry);

      // Prepare the entry object
      const entryData = {
        entry,
        aiResponse,
        model,
        timestamp: new Date(),
        conversation: conversation || []
      };

      // Save to Firebase
      const savedEntry = await saveJournalEntry(userId, entry, conversation);

      res.json({ aiResponse, entry: savedEntry });
    } catch (error) {
      console.error('Error in journal entry submission:', error);
      if (error.message.includes('Failed to get AI response')) {
        return res.status(503).json({ error: 'AI service is currently unavailable' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error submitting journal entry:', error);
    res.status(500).json({ 
      error: 'Failed to submit journal entry',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Save conversation
router.post('/conversation', async (req, res) => {
  try {
    const { conversation } = req.body;
    const userId = req.user.uid;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: 'Conversation must be an array' });
    }

    try {
      const savedConversation = await saveConversation(conversation, userId);
      res.json({ message: 'Conversation saved successfully', conversation: savedConversation });
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in conversation route:', error);
    res.status(500).json({ 
      error: 'Failed to save conversation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get journal history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.uid;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      const history = await getJournalHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching journal history:', error);
      if (error.message.includes('Database index required')) {
        return res.status(503).json({ 
          error: 'Database index is being created',
          details: 'Please try again in a few minutes'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in journal history route:', error);
    res.status(500).json({ 
      error: 'Failed to fetch journal history',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 