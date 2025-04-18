import { createStore } from 'vuex'
import axios from 'axios'
import { auth } from '../firebase'
import prompts from './modules/prompts'
import authModule from './modules/auth'
import preferences from './modules/preferences'
import wellness from './modules/wellness'

const API_URL = 'http://localhost:3000/api'

// Create axios instance with base config
export const api = axios.create({
  baseURL: API_URL
})

// Add request interceptor to include auth token
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  console.log('Current user:', user)
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const persistedState = localStorage.getItem('journalAppState')
    return persistedState ? JSON.parse(persistedState) : {}
  } catch (error) {
    console.error('Error loading persisted state:', error)
    return {}
  }
}

// Save state to localStorage
const saveState = (state) => {
  try {
    localStorage.setItem('journalAppState', JSON.stringify(state))
  } catch (error) {
    console.error('Error saving state:', error)
  }
}

export default createStore({
  modules: {
    auth: authModule,
    prompts,
    preferences,
    wellness
  },
  state: {
    journalEntries: [],
    currentUser: null,
    authInitialized: false,
    ...loadPersistedState()
  },
  mutations: {
    SET_JOURNAL_ENTRIES(state, entries) {
      state.journalEntries = entries
      // Save to localStorage whenever entries are updated
      saveState({ journalEntries: entries })
    },
    SET_CURRENT_USER(state, user) {
      state.currentUser = user
      state.authInitialized = true
    },
    ADD_JOURNAL_ENTRY(state, entry) {
      state.journalEntries = [entry, ...state.journalEntries]
      // Save to localStorage whenever entries are updated
      saveState({ journalEntries: state.journalEntries })
    }
  },
  actions: {
    async submitJournalEntry({ commit, state }, { entry, conversation, model, userId }) {
      userId = userId || (state.currentUser && state.currentUser.uid);

      if (!userId) {
        throw new Error('User ID is required to save journal entry')
      }

      try {
        const response = await api.post('/journal/entries', {
          entry,
          conversation,
          model,
          userId
        })
        return response.data.aiResponse
      } catch (error) {
        console.error('Error submitting journal entry:', error)
        throw error
      }
    },

    async saveConversation({ commit }, { conversation, userId }) {
      try {
        await api.post('/journal/conversation', {
          conversation,
          userId
        })
      } catch (error) {
        console.error('Error saving conversation:', error)
        throw error
      }
    },

    async loadJournalHistory({ commit, state }, userId) {
      if (!userId) {
        throw new Error('User ID is required to fetch journal history')
      }

      try {
        const response = await api.get('/journal/history', {
          params: { userId }
        })
        const entries = response.data || []
        commit('SET_JOURNAL_ENTRIES', entries)
        return entries
      } catch (error) {
        console.error('Error loading journal history:', error)
        commit('SET_JOURNAL_ENTRIES', [])
        return []
      }
    },

    async loadJournalEntriesByDate({ state }, { userId, date }) {
      if (!userId || !date) {
        throw new Error('User ID and date are required to fetch journal entries')
      }

      try {
        const response = await api.get('/journal/entries', {
          params: { userId, date }
        })
        return response.data || []
      } catch (error) {
        console.error('Error loading journal entries by date:', error)
        return []
      }
    },

    setCurrentUser({ commit, dispatch }, user) {
      console.log('Setting current user:', user);
      commit('SET_CURRENT_USER', user);
      
      if (user) {
        // Load journal history when user is set
        dispatch('loadJournalHistory', user.uid);
        // Load prompts when user is set
        dispatch('prompts/loadCustomPrompts');
        dispatch('prompts/loadSelectedPrompts');
      }
    }
  },
  getters: {
    getJournalEntries: state => state.journalEntries,
    getCurrentUser: state => state.currentUser
  }
}) 