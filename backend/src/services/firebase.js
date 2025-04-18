const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
try {
  // Path to your service account JSON file
  const serviceAccountPath = path.join(__dirname, '../../service-account.json');
  
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account file not found at:', serviceAccountPath);
    process.exit(1);
  }

  // Read the service account file
  const serviceAccount = require(serviceAccountPath);

  // Initialize the app with the service account
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();

const saveJournalEntry = async (userId, entry, conversation) => {
  try {
    if (!userId || !conversation) {
      throw new Error('Missing required parameters: userId or conversation')
    }

    // Ensure conversation is an array
    if (!Array.isArray(conversation)) {
      console.warn('Conversation is not an array:', conversation)
      conversation = []
    }

    // Analyze mood from the conversation
    const mood = await analyzeMood(conversation)
    
    const journalEntry = {
      userId,
      conversation,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      formattedDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      mood,
      moodColor: getMoodColor(mood),
      moodEmoji: getMoodEmoji(mood)
    }

    const docRef = await db.collection('journalEntries').add(journalEntry)
    return { id: docRef.id, ...journalEntry }
  } catch (error) {
    console.error('Error saving journal entry:', error)
    throw error
  }
}

const analyzeMood = async (conversation) => {
  try {
    if (!conversation || !Array.isArray(conversation)) {
      console.warn('Invalid conversation data:', conversation)
      return 'neutral'
    }

    // Extract user messages from conversation
    const userMessages = conversation
      .filter(msg => msg && msg.type === 'user' && msg.content)
      .map(msg => msg.content)
      .join(' ')

    if (!userMessages) {
      console.warn('No user messages found in conversation')
      return 'neutral'
    }

    // Use a simple sentiment analysis approach
    const positiveWords = ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'love', 'good', 'positive', 'thankful', 'grateful']
    const negativeWords = ['sad', 'angry', 'frustrated', 'bad', 'terrible', 'awful', 'hate', 'upset', 'worried', 'anxious', 'stressed']
    
    const text = userMessages.toLowerCase()
    let positiveCount = 0
    let negativeCount = 0
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++
    })
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++
    })

    // Determine mood based on word counts
    if (positiveCount > negativeCount) {
      return 'happy'
    } else if (negativeCount > positiveCount) {
      return 'moody'
    } else {
      return 'neutral'
    }
  } catch (error) {
    console.error('Error analyzing mood:', error)
    return 'neutral'
  }
}

const getMoodColor = (mood) => {
  switch (mood) {
    case 'happy':
      return '#4CAF50' // Green
    case 'moody':
      return '#F44336' // Red
    default:
      return '#9E9E9E' // Grey
  }
}

const getMoodEmoji = (mood) => {
  switch (mood) {
    case 'happy':
      return '😊'
    case 'moody':
      return '😔'
    default:
      return '😐'
  }
}

const saveConversation = async (conversation, userId) => {
  try {
    const conversationRef = db.collection('conversations').doc();
    const conversationData = {
      messages: conversation,
      userId,
      id: conversationRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await conversationRef.set(conversationData);
    return conversationData;
  } catch (error) {
    console.error('Error saving conversation:', error);
    throw error;
  }
};

async function getJournalHistory(userId) {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch journal history');
    }

    try {
      console.log('Attempting to fetch journal history for user:', userId);
      
      // First try with createdAt
      const snapshot = await db.collection('journalEntries')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      console.log('Query with createdAt returned', snapshot.size, 'documents');

      if (snapshot.empty) {
        console.log('No documents found with createdAt, trying timestamp...');
        // If no results, try with timestamp
        const oldSnapshot = await db.collection('journalEntries')
          .where('userId', '==', userId)
          .orderBy('timestamp', 'desc')
          .limit(10)
          .get();

        console.log('Query with timestamp returned', oldSnapshot.size, 'documents');

        return oldSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Raw document data:', data);
          const timestamp = data.timestamp;
          console.log('Raw timestamp:', timestamp);
          let date;
          
          if (timestamp instanceof admin.firestore.Timestamp) {
            date = timestamp.toDate();
            console.log('Converted Firestore Timestamp to Date:', date);
          } else if (timestamp instanceof Date) {
            date = timestamp;
            console.log('Using existing Date object:', date);
          } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
            console.log('Created Date from string:', date);
          } else {
            console.warn('Unexpected timestamp format:', timestamp);
            date = new Date();
          }
          
          if (isNaN(date.getTime())) {
            console.warn('Invalid timestamp found:', timestamp);
            date = new Date();
          }
          
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          // console.log('Final formatted date:', formattedDate);
          
          return {
            id: doc.id,
            ...data,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            formattedDate
          };
        });
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        // console.log('Raw document data:', data);
        let createdAt, updatedAt;
        
        // Handle createdAt
        if (data.createdAt instanceof admin.firestore.Timestamp) {
          createdAt = data.createdAt.toDate();
          // console.log('Converted Firestore Timestamp to Date:', createdAt);
        } else if (data.createdAt instanceof Date) {
          createdAt = data.createdAt;
          // console.log('Using existing Date object:', createdAt);
        } else if (typeof data.createdAt === 'string') {
          createdAt = new Date(data.createdAt);
          // console.log('Created Date from string:', createdAt);
        } else {
          // console.warn('Unexpected createdAt format:', data.createdAt);
          createdAt = new Date();
        }
        
        if (isNaN(createdAt.getTime())) {
          console.warn('Invalid createdAt found:', data.createdAt);
          createdAt = new Date();
        }
        
        // Handle updatedAt
        if (data.updatedAt instanceof admin.firestore.Timestamp) {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt instanceof Date) {
          updatedAt = data.updatedAt;
        } else if (typeof data.updatedAt === 'string') {
          updatedAt = new Date(data.updatedAt);
        } else {
          console.warn('Unexpected updatedAt format:', data.updatedAt);
          updatedAt = new Date();
        }
        
        if (isNaN(updatedAt.getTime())) {
          console.warn('Invalid updatedAt found:', data.updatedAt);
          updatedAt = new Date();
        }
        
        const formattedDate = createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // console.log('Final formatted date:', formattedDate);
        
        return {
          id: doc.id,
          ...data,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
          formattedDate
        };
      });
    } catch (error) {
      console.error('Firestore query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      });

      if (error.code === 9) { // FAILED_PRECONDITION
        console.error('Firestore index required. Please create a composite index for journalEntries collection with:');
        console.error('1. userId (ascending)');
        console.error('2. createdAt (descending)');
        console.error('You can create this index in the Firebase Console under Firestore > Indexes');
        throw new Error('Database index required. Please try again in a few minutes after the index is created.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching journal history:', {
      message: error.message,
      stack: error.stack,
      userId: userId
    });
    throw new Error(`Failed to fetch journal history: ${error.message}`);
  }
}

module.exports = {
  saveJournalEntry,
  getJournalHistory,
  saveConversation
}; 