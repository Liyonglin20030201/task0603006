import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const accessToken = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')

  const isAuthenticated = computed(() => !!accessToken.value)

  function setTokens(access, refresh) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function setUser(u) {
    user.value = u
    localStorage.setItem('user', JSON.stringify(u))
  }

  async function login(email, password) {
    const { data } = await authApi.login({ email, password })
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    return data
  }

  async function register(form) {
    const { data } = await authApi.register(form)
    setTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    return data
  }

  function logout() {
    user.value = null
    accessToken.value = ''
    refreshToken.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  return { user, accessToken, refreshToken, isAuthenticated, login, register, logout, setTokens, setUser }
})
