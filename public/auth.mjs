import { W3SSdk } from '../node_modules/@circle-fin/w3s-pw-web-sdk/dist/src/index.js';
window.W3SSdk = W3SSdk;
console.log('Circle SDK ready:', typeof W3SSdk);
