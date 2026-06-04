import client from './client.js'

export const authApi = {
  register(data) { return client.post('/auth/register', data) },
  login(data) { return client.post('/auth/login', data) },
  refresh(refreshToken) { return client.post('/auth/refresh', { refreshToken }) },
  getMe() { return client.get('/auth/me') },
  updateProfile(data) { return client.put('/auth/me', data) },
  changePassword(data) { return client.put('/auth/password', data) }
}
