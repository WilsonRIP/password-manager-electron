export interface Password {
  id: string
  title: string
  username: string
  password: string
  url: string
  iv?: string
}

interface ElectronAPI {
  savePassword: (
    data: Password
  ) => Promise<{ success: boolean; error?: string }>
  getPasswords: () => Promise<{
    success: boolean
    data?: Password[]
    error?: string
  }>
  deletePassword: (id: string) => Promise<{ success: boolean; error?: string }>
  encryptData: (
    data: string
  ) => Promise<{ success: boolean; data?: string; error?: string }>
  decryptData: (data: {
    encrypted: string
    iv: string
  }) => Promise<{ success: boolean; data?: string; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
