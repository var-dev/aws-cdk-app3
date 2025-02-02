import { defineConfig } from 'vite';
import stackOutputs  from './plugins/stackOutputsPlugin';
import cloudfrontKeys  from './plugins/cloudfrontKeysPlugin';
import { resolve } from 'path';
 
export default defineConfig({
  plugins: [
    stackOutputs(),
    cloudfrontKeys()
  ],
  build: {
    rollupOptions:{
      input:{
        'index': resolve(__dirname, 'index.html'),
        'error-403': resolve(__dirname, 'error-403.html'),
        'error-404': resolve(__dirname, 'error-404.html'),
      }
    },
    assetsInlineLimit: 8192,
  }
});