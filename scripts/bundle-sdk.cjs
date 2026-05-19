const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Use esbuild to bundle the ESM SDK into a single browser-compatible file
execSync('npx esbuild node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/index.js --bundle --format=iife --global-name=CircleW3s --outfile=public/circle-sdk.js --platform=browser --external:crypto --external:stream --external:util --external:buffer --external:string_decoder --external:firebase', { stdio: 'inherit' });
console.log('Circle SDK bundled to public/circle-sdk.js');
