import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'
import router from '../router/index.js'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000
})

client.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const authStore = useAuthStore()
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry && authStore.refreshToken) {
      originalRequest._retry = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: authStore.refreshToken
        })
        authStore.setTokens(data.accessToken, data.refreshToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return client(originalRequest)
      } catch {
        authStore.logout()
        router.push({ name: 'Login' })
      }
    }

    return Promise.reject(error)
  }
)

export default client
