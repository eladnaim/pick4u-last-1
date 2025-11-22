import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pick4u.app',
  appName: 'Pick4U',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;