"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Example functions for password management
    savePassword: (data) => electron_1.ipcRenderer.invoke('save-password', data),
    getPasswords: () => electron_1.ipcRenderer.invoke('get-passwords'),
    deletePassword: (id) => electron_1.ipcRenderer.invoke('delete-password', id),
    encryptData: (data) => electron_1.ipcRenderer.invoke('encrypt-data', data),
    decryptData: (data) => electron_1.ipcRenderer.invoke('decrypt-data', data),
});
