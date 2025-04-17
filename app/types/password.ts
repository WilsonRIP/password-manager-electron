export type Password = {
  id: string
  title: string
  username: string
  password: string
  url: string
  createdAt: string
  updatedAt: string
  history: { password: string; updatedAt: string }[]
}
