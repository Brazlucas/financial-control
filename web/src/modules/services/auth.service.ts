import api from '@/services/http.service'

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', {
      email,
      password,
    })
    return response.data
  }
}
