import type { Role } from '../../types'

export interface UserInput {
  name: string
  email: string
  password: string
  role: Role
  branchId?: string | null
}

export interface UserUpdateInput {
  name?: string
  email?: string
  password?: string
  role?: Role
  branchId?: string | null
}

export interface UserFilters {
  role?: Role
  branchId?: string
}
