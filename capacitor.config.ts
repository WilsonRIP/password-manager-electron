import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.keyedpasswordmanager',
  appName: 'Keyed Password Manager',
  webDir: 'out',
  server: {
    // Use hostname: 'YOUR_IP_ADDRESS' if testing on a physical device
    // Use hostname: 'localhost' if testing primarily on an emulator
    // hostname: '192.168.1.100', // Example - replace if needed
    androidScheme: 'http',
  },
}

export default config
