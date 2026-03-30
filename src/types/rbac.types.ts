export interface Role {
  id: string
  name: string
  label: string
}

export interface User {
  id: string
  name: string
  email: string
  roleIds: string[]
}
