import { api } from '../index'

export default {
  namespaced: true,
  state: {
    wellnessData: []
  },
  mutations: {
    SET_WELLNESS_DATA(state, data) {
      state.wellnessData = data
    },
    ADD_WELLNESS_DATA(state, data) {
      state.wellnessData.unshift(data)
    }
  },
  actions: {
    async saveWellnessData({ commit }, data) {
      try {
        const response = await api.post('/wellness/data', data)
        commit('ADD_WELLNESS_DATA', response.data)
        return response.data
      } catch (error) {
        console.error('Error saving wellness data:', error)
        throw error
      }
    },
    async loadWellnessData({ commit }, { userId, startDate, endDate }) {
      try {
        const response = await api.get('/wellness/data', {
          params: { userId, startDate, endDate }
        })
        commit('SET_WELLNESS_DATA', response.data)
        return response.data
      } catch (error) {
        console.error('Error loading wellness data:', error)
        throw error
      }
    }
  },
  getters: {
    getWellnessData: state => state.wellnessData,
    getWellnessByDate: state => date => {
      return state.wellnessData.find(data => 
        new Date(data.date).toDateString() === new Date(date).toDateString()
      )
    }
  }
}
