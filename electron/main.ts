import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as url from 'url'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { Password } from './types'

let mainWindow: BrowserWindow | null

const isDev = process.env.NODE_ENV === 'development'
const port = process.env.PORT || 3000

// Simple encryption/decryption functions
// In a real app, you'd want to use more secure key management
const encryptionKey = crypto.scryptSync('your-secure-password', 'salt', 32)
const iv = crypto.randomBytes(16)

const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return { encrypted, iv: iv.toString('hex') }
}

const decrypt = (encryptedText: string, ivHex: string) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    encryptionKey,
    Buffer.from(ivHex, 'hex')
  )
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Path to store passwords
const userDataPath = app.getPath('userData')
const passwordsFilePath = path.join(userDataPath, 'passwords.json')

// Initialize passwords file if it doesn't exist
const initPasswordsFile = () => {
  if (!fs.existsSync(passwordsFilePath)) {
    fs.writeFileSync(passwordsFilePath, JSON.stringify([]), 'utf8')
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  const startUrl = isDev
    ? `http://localhost:${port}`
    : url.format({
        pathname: path.join(__dirname, '../out/index.html'),
        protocol: 'file:',
        slashes: true,
      })

  mainWindow.loadURL(startUrl)

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initPasswordsFile()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// Handle IPC messages for password management
ipcMain.handle('save-password', async (_, passwordData: Password) => {
  try {
    const passwords = JSON.parse(
      fs.readFileSync(passwordsFilePath, 'utf8')
    ) as Password[]

    // Encrypt the password
    const { encrypted, iv: ivHex } = encrypt(passwordData.password)
    passwordData.password = encrypted
    passwordData.iv = ivHex

    // Check if this is an update or new password
    const existingIndex = passwords.findIndex((p) => p.id === passwordData.id)

    if (existingIndex >= 0) {
      passwords[existingIndex] = passwordData
    } else {
      passwords.push(passwordData)
    }

    fs.writeFileSync(passwordsFilePath, JSON.stringify(passwords), 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error saving password:', error)
    return { success: false, error: 'Failed to save password' }
  }
})

ipcMain.handle('get-passwords', async () => {
  try {
    const passwords = JSON.parse(fs.readFileSync(passwordsFilePath, 'utf8'))
    // We don't decrypt passwords here for security reasons
    // Only decrypt when specifically requested
    return { success: true, data: passwords }
  } catch (error) {
    console.error('Error getting passwords:', error)
    return { success: false, error: 'Failed to get passwords' }
  }
})

ipcMain.handle('decrypt-data', async (_, { encrypted, iv }) => {
  try {
    const decrypted = decrypt(encrypted, iv)
    return { success: true, data: decrypted }
  } catch (error) {
    console.error('Error decrypting data:', error)
    return { success: false, error: 'Failed to decrypt data' }
  }
})

ipcMain.handle('delete-password', async (_, id: string) => {
  try {
    const passwords = JSON.parse(
      fs.readFileSync(passwordsFilePath, 'utf8')
    ) as Password[]
    const newPasswords = passwords.filter((p) => p.id !== id)
    fs.writeFileSync(passwordsFilePath, JSON.stringify(newPasswords), 'utf8')
    return { success: true }
  } catch (error) {
    console.error('Error deleting password:', error)
    return { success: false, error: 'Failed to delete password' }
  }
})
