const axios = require('axios');

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';

async function getAIResponse(model, prompt, entry) {
  try {
    const response = await axios.post(OLLAMA_API_URL, {
      model,
      prompt: `You are a warm, empathetic journaling assistant. A user has just entered their journal for today.
              Here is his/her Journal Entry reply: "${entry} to the prompt : ${prompt}
              \n\nYour job is to reflect briefly on what the user shared, ask a meaningful follow-up question, or acknowledge their thoughts in a thoughtful way. Keep it brief, friendly, and natural. Ask one question at the end to continue the conversation.
              Dont send back or remind the user of the prompt or entry, just help with the journal.
              Tone: conversational, emotionally intelligent.`,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw new Error('Failed to get AI response');
  }
}

module.exports = {
  getAIResponse
}; 