import api from '../../lib/axios'
import { ApiResponse } from '../../types'
import { LoginInput, AuthResponse } from './types'
import { User } from '../../types'

export const authApi = {
  login: (data: LoginInput) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: () =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me'),
}
