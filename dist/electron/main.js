"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
let mainWindow;
const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000;
// Simple encryption/decryption functions
// In a real app, you'd want to use more secure key management
const encryptionKey = crypto.scryptSync('your-secure-password', 'salt', 32);
const iv = crypto.randomBytes(16);
const encrypt = (text) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { encrypted, iv: iv.toString('hex') };
};
const decrypt = (encryptedText, ivHex) => {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
// Path to store passwords
const userDataPath = electron_1.app.getPath('userData');
const passwordsFilePath = path.join(userDataPath, 'passwords.json');
// Initialize passwords file if it doesn't exist
const initPasswordsFile = () => {
    if (!fs.existsSync(passwordsFilePath)) {
        fs.writeFileSync(passwordsFilePath, JSON.stringify([]), 'utf8');
    }
};
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    const startUrl = isDev
        ? `http://localhost:${port}`
        : url.format({
            pathname: path.join(__dirname, '../.next/index.html'),
            protocol: 'file:',
            slashes: true,
        });
    mainWindow.loadURL(startUrl);
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    initPasswordsFile();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// Handle IPC messages for password management
electron_1.ipcMain.handle('save-password', async (_, passwordData) => {
    try {
        const passwords = JSON.parse(fs.readFileSync(passwordsFilePath, 'utf8'));
        // Encrypt the password
        const { encrypted, iv: ivHex } = encrypt(passwordData.password);
        passwordData.password = encrypted;
        passwordData.iv = ivHex;
        // Check if this is an update or new password
        const existingIndex = passwords.findIndex((p) => p.id === passwordData.id);
        if (existingIndex >= 0) {
            passwords[existingIndex] = passwordData;
        }
        else {
            passwords.push(passwordData);
        }
        fs.writeFileSync(passwordsFilePath, JSON.stringify(passwords), 'utf8');
        return { success: true };
    }
    catch (error) {
        console.error('Error saving password:', error);
        return { success: false, error: 'Failed to save password' };
    }
});
electron_1.ipcMain.handle('get-passwords', async () => {
    try {
        const passwords = JSON.parse(fs.readFileSync(passwordsFilePath, 'utf8'));
        // We don't decrypt passwords here for security reasons
        // Only decrypt when specifically requested
        return { success: true, data: passwords };
    }
    catch (error) {
        console.error('Error getting passwords:', error);
        return { success: false, error: 'Failed to get passwords' };
    }
});
electron_1.ipcMain.handle('decrypt-data', async (_, { encrypted, iv }) => {
    try {
        const decrypted = decrypt(encrypted, iv);
        return { success: true, data: decrypted };
    }
    catch (error) {
        console.error('Error decrypting data:', error);
        return { success: false, error: 'Failed to decrypt data' };
    }
});
electron_1.ipcMain.handle('delete-password', async (_, id) => {
    try {
        const passwords = JSON.parse(fs.readFileSync(passwordsFilePath, 'utf8'));
        const newPasswords = passwords.filter((p) => p.id !== id);
        fs.writeFileSync(passwordsFilePath, JSON.stringify(newPasswords), 'utf8');
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting password:', error);
        return { success: false, error: 'Failed to delete password' };
    }
});
