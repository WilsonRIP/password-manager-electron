export interface Password {
  id: string
  title: string
  username: string
  password: string
  url: string
  iv?: string // For encrypted passwords
}
