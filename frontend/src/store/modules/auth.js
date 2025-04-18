import { authService } from '@/services/auth'

const state = {
  currentUser: null,
  isAuthenticated: false
}

const mutations = {
  SET_CURRENT_USER(state, user) {
    state.currentUser = user
    state.isAuthenticated = !!user
  }
}

const actions = {
  async signIn({ commit }, { email, password }) {
    try {
      const user = await authService.signIn(email, password)
      commit('SET_CURRENT_USER', user)
      return user
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  },

  async signUp({ commit }, { email, password }) {
    try {
      const user = await authService.signUp(email, password)
      commit('SET_CURRENT_USER', user)
      return user
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  },

  async signOut({ commit }) {
    try {
      await authService.signOut()
      commit('SET_CURRENT_USER', null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  },

  initializeAuth({ commit }) {
    authService.onAuthStateChanged(user => {
      commit('SET_CURRENT_USER', user)
    })
  }
}

const getters = {
  currentUser: state => state.currentUser,
  isAuthenticated: state => state.isAuthenticated
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
} 