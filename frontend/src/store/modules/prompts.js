import { db } from '../firebase'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

const state = {
  customPrompts: [],
  selectedPrompts: [],
  frequency: 'daily'
}

const mutations = {
  SET_CUSTOM_PROMPTS(state, prompts) {
    state.customPrompts = prompts
  },
  SET_SELECTED_PROMPTS(state, prompts) {
    state.selectedPrompts = prompts
  },
  SET_FREQUENCY(state, frequency) {
    state.frequency = frequency
  },
  ADD_CUSTOM_PROMPT(state, prompt) {
    state.customPrompts.push(prompt)
  },
  REMOVE_CUSTOM_PROMPT(state, promptId) {
    state.customPrompts = state.customPrompts.filter(p => p.id !== promptId)
  },
  ADD_SELECTED_PROMPT(state, promptId) {
    if (!state.selectedPrompts.includes(promptId)) {
      state.selectedPrompts.push(promptId)
    }
  },
  REMOVE_SELECTED_PROMPT(state, promptId) {
    state.selectedPrompts = state.selectedPrompts.filter(id => id !== promptId)
  }
}

const actions = {
  async loadCustomPrompts({ commit, rootState }) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, waiting...');
        return [];
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, returning empty prompts');
        return [];
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        commit('SET_CUSTOM_PROMPTS', data.customPrompts || []);
        return data.customPrompts || [];
      }
      return [];
    } catch (error) {
      console.error('Error loading custom prompts:', error);
      return [];
    }
  },

  async loadSelectedPrompts({ commit, rootState }) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, returning empty prompts');
        return [];
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, returning empty prompts');
        return [];
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const prompts = data.selectedPrompts || [];
        commit('SET_SELECTED_PROMPTS', prompts);
        return prompts;
      }
      return [];
    } catch (error) {
      console.error('Error loading selected prompts:', error);
      return [];
    }
  },

  async loadFrequency({ commit, rootState }) {
    try {
      const userId = rootState.auth.currentUser?.uid
      if (!userId) throw new Error('No authenticated user')
      
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        const data = docSnap.data()
        commit('SET_FREQUENCY', data.frequency || 'daily')
        return data.frequency || 'daily'
      }
      return 'daily'
    } catch (error) {
      console.error('Error loading frequency:', error)
      throw error
    }
  },

  async saveFrequency({ commit, rootState }, frequency) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot save frequency');
        return;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot save frequency');
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          frequency
        });
        commit('SET_FREQUENCY', frequency);
      } else {
        // If document doesn't exist, create it
        await setDoc(docRef, {
          frequency,
          customPrompts: [],
          selectedPrompts: []
        });
        commit('SET_FREQUENCY', frequency);
      }
    } catch (error) {
      console.error('Error saving frequency:', error);
      // Don't throw the error, just log it
    }
  },

  async addCustomPrompt({ commit, state, rootState }, prompt) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot add custom prompt');
        return null;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot add custom prompt');
        return null;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      const newPrompt = {
        id: Date.now().toString(),
        ...prompt
      };
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          customPrompts: arrayUnion(newPrompt)
        });
        
        const updatedPrompts = [...state.customPrompts, newPrompt];
        commit('SET_CUSTOM_PROMPTS', updatedPrompts);
        return newPrompt;
      } else {
        // If document doesn't exist, create it
        await setDoc(docRef, {
          customPrompts: [newPrompt],
          selectedPrompts: [],
          frequency: 'daily'
        });
        
        commit('SET_CUSTOM_PROMPTS', [newPrompt]);
        return newPrompt;
      }
    } catch (error) {
      console.error('Error adding custom prompt:', error);
      // Don't throw the error, just log it
      return null;
    }
  },

  async deletePrompt({ commit, state, rootState }, promptId) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot delete prompt');
        return;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot delete prompt');
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const promptToDelete = state.customPrompts.find(p => p.id === promptId);
      
      if (promptToDelete) {
        await updateDoc(docRef, {
          customPrompts: arrayRemove(promptToDelete)
        });
        
        const updatedPrompts = state.customPrompts.filter(p => p.id !== promptId);
        commit('SET_CUSTOM_PROMPTS', updatedPrompts);
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      // Don't throw the error, just log it
    }
  },

  async addSelectedPrompt({ commit, state, rootState }, promptId) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot add selected prompt');
        return;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot add selected prompt');
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          selectedPrompts: arrayUnion(promptId)
        });
        
        const updatedPrompts = [...state.selectedPrompts, promptId];
        commit('SET_SELECTED_PROMPTS', updatedPrompts);
      } else {
        // If document doesn't exist, create it
        await setDoc(docRef, {
          selectedPrompts: [promptId],
          customPrompts: [],
          frequency: 'daily'
        });
        commit('SET_SELECTED_PROMPTS', [promptId]);
      }
    } catch (error) {
      console.error('Error adding selected prompt:', error);
      // Don't throw the error, just log it
    }
  },

  async removeSelectedPrompt({ commit, state, rootState }, promptId) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot remove selected prompt');
        return;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot remove selected prompt');
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        selectedPrompts: arrayRemove(promptId)
      });
      
      const updatedPrompts = state.selectedPrompts.filter(id => id !== promptId);
      commit('SET_SELECTED_PROMPTS', updatedPrompts);
    } catch (error) {
      console.error('Error removing selected prompt:', error);
      // Don't throw the error, just log it
    }
  },

  async saveSelectedPrompts({ commit, rootState }, prompts) {
    try {
      if (!rootState.authInitialized) {
        console.log('Auth not initialized yet, cannot save selected prompts');
        return;
      }
      
      const userId = rootState.currentUser?.uid;
      if (!userId) {
        console.log('No authenticated user, cannot save selected prompts');
        return;
      }
      
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          selectedPrompts: prompts
        });
        commit('SET_SELECTED_PROMPTS', prompts);
      } else {
        // If document doesn't exist, create it
        await setDoc(docRef, {
          selectedPrompts: prompts,
          customPrompts: [],
          frequency: 'daily'
        });
        commit('SET_SELECTED_PROMPTS', prompts);
      }
    } catch (error) {
      console.error('Error saving selected prompts:', error);
      // Don't throw the error, just log it
    }
  }
}

const getters = {
  getCustomPrompts: state => state.customPrompts,
  getSelectedPrompts: state => state.selectedPrompts,
  getFrequency: state => state.frequency
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 