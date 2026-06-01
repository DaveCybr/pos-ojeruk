import { User } from '../../types'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  access_token: string
}
