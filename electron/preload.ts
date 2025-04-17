import { contextBridge, ipcRenderer } from 'electron'
import { Password } from './types'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example functions for password management
  savePassword: (data: Password) => ipcRenderer.invoke('save-password', data),
  getPasswords: () => ipcRenderer.invoke('get-passwords'),
  deletePassword: (id: string) => ipcRenderer.invoke('delete-password', id),
  encryptData: (data: string) => ipcRenderer.invoke('encrypt-data', data),
  decryptData: (data: { encrypted: string; iv: string }) =>
    ipcRenderer.invoke('decrypt-data', data),
})
