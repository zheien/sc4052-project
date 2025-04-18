require('dotenv').config();
const express = require('express');
const cors = require('cors');
const journalRoutes = require('./routes/journal');
const promptRoutes = require('./routes/prompts');
const wellnessRoutes = require('./routes/wellness');
const preferencesRoutes = require('./routes/preferences');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
app.use('/api/journal', authenticateToken, journalRoutes);
app.use('/api/prompts', authenticateToken, promptRoutes);
app.use('/api/wellness', authenticateToken, wellnessRoutes);
app.use('/api/preferences', authenticateToken, preferencesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Firebase Admin status:', admin.apps.length > 0 ? 'Initialized' : 'Not initialized');
  // console.log('Available routes:');
  // console.log('- POST /api/journal/entries');
  // console.log('- GET /api/journal/history');
  // console.log('- GET /api/prompts/custom');
  // console.log('- POST /api/prompts/custom');
  // console.log('- DELETE /api/prompts/custom/:promptId');
  // console.log('- GET /api/prompts/selected');
  // console.log('- POST /api/prompts/selected');
  // console.log('- DELETE /api/prompts/selected/:promptId');
}); 