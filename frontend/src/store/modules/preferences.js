// preferences.js
import { api } from '../index'

const defaultPreferences = {
  moodTracking: true,
  sleepTracking: true,
  dailySummary: true,
  customPrompts: true,
  moduleOrder: ['moodTracking', 'sleepHours', 'sleepQuality', 'waterIntake', 'weather', 'conversation']
}

export { defaultPreferences };

export default {
  namespaced: true,
  state: {
    preferences: { ...defaultPreferences },
    loaded: false
  },
  mutations: {
    SET_PREFERENCES(state, prefs) {
      state.preferences = { ...defaultPreferences, ...prefs }
      state.loaded = true
    },
    SET_PREFERENCE(state, { feature, enabled }) {
      state.preferences = {
        ...state.preferences,
        [feature]: enabled
      }
    },
    // Update module ordering
    SET_MODULE_ORDER(state, moduleOrder) {
      state.preferences.moduleOrder = moduleOrder
    }
  },
  actions: {
    async fetchPreferences({ commit, rootState }) {
      const userId = rootState.currentUser && rootState.currentUser.uid
      if (!userId) return
      try {
        const res = await api.get(`/preferences/${userId}`)
        commit('SET_PREFERENCES', res.data)
      } catch (err) {
        // If not found, fallback to default
        commit('SET_PREFERENCES', {})
      }
    },
    async toggleFeature({ commit, rootState }, { feature, enabled }) {
      const userId = rootState.currentUser && rootState.currentUser.uid
      if (!userId) return
      commit('SET_PREFERENCE', { feature, enabled })
      await api.post(`/preferences/${userId}`, {
        [feature]: enabled
      })
    },
    // Save reordered modules
    async updateModuleOrder({ commit, rootState }, moduleOrder) {
      const userId = rootState.currentUser && rootState.currentUser.uid
      if (!userId) return
      commit('SET_MODULE_ORDER', moduleOrder)
      await api.post(`/preferences/${userId}`, { moduleOrder })
    },
    async saveAllPreferences({ state, rootState }) {
      const userId = rootState.currentUser && rootState.currentUser.uid
      if (!userId) return
      await api.post(`/preferences/${userId}`, state.preferences)
    }
  },
  getters: {
    getPreferences: state => state.preferences,
    isFeatureEnabled: state => feature => state.preferences[feature],
    hasRealPreferences: (state) => {
      // True if preferences came from backend and differ from defaults
      if (!state.loaded) return false;
      // If any value differs from default, consider them real
      return Object.keys(defaultPreferences).some(key => state.preferences[key] !== defaultPreferences[key]);
    }
  }
}
