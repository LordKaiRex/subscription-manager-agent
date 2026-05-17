import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const envPath = path.resolve(process.cwd(), '.env');

function isValidPrivateKey(key: string): boolean {
  const clean = key.startsWith('0x') ? key.substring(2) : key;
  return clean.length === 64 && /^[0-9a-fA-F]+$/.test(clean);
}

async function setup() {
  let ownerKey = '';
  let validatorKey = '';
  let webhookUrl = '';

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const ownerMatch = content.match(/OWNER_PRIVATE_KEY\s*=\s*(.+)/);
    const valMatch = content.match(/VALIDATOR_PRIVATE_KEY\s*=\s*(.+)/);
    const webMatch = content.match(/WEBHOOK_URL\s*=\s*(.+)/);

    ownerKey = ownerMatch ? ownerMatch[1].trim().replace(/['"]/g, '') : '';
    validatorKey = valMatch ? valMatch[1].trim().replace(/['"]/g, '') : '';
    webhookUrl = webMatch ? webMatch[1].trim().replace(/['"]/g, '') : '';
  }

  const isOwnerPlaceholder = !ownerKey || ownerKey.includes('YOUR_OWNER_PRIVATE_KEY') || !isValidPrivateKey(ownerKey);
  const isValPlaceholder = !validatorKey || validatorKey.includes('YOUR_VALIDATOR_PRIVATE_KEY') || !isValidPrivateKey(validatorKey);

  if (isOwnerPlaceholder || isValPlaceholder) {
    console.log('\n⚠️  Setup needed: Environment variables OWNER_PRIVATE_KEY or VALIDATOR_PRIVATE_KEY are missing or set to placeholders.');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

    try {
      if (isOwnerPlaceholder) {
        let enteredOwner = '';
        while (!isValidPrivateKey(enteredOwner)) {
          enteredOwner = await ask('🔑 Enter OWNER_PRIVATE_KEY (64 hex characters, optionally starting with 0x): ');
          enteredOwner = enteredOwner.trim();
          if (!isValidPrivateKey(enteredOwner)) {
            console.log('❌ Invalid private key format. Must be 64 hex characters.');
          }
        }
        ownerKey = enteredOwner.startsWith('0x') ? enteredOwner : '0x' + enteredOwner;
      }

      if (isValPlaceholder) {
        let enteredVal = '';
        while (!isValidPrivateKey(enteredVal)) {
          enteredVal = await ask('🔑 Enter VALIDATOR_PRIVATE_KEY (64 hex characters, optionally starting with 0x): ');
          enteredVal = enteredVal.trim();
          if (!isValidPrivateKey(enteredVal)) {
            console.log('❌ Invalid private key format. Must be 64 hex characters.');
          }
        }
        validatorKey = enteredVal.startsWith('0x') ? enteredVal : '0x' + enteredVal;
      }
      
      // Write/update the .env file
      const envLines = [
        `OWNER_PRIVATE_KEY=${ownerKey}`,
        `VALIDATOR_PRIVATE_KEY=${validatorKey}`,
        `WEBHOOK_URL=${webhookUrl || ''}`
      ];
      fs.writeFileSync(envPath, envLines.join('\n') + '\n', 'utf8');
      console.log('✅ .env file successfully updated with your private keys!\n');
    } finally {
      rl.close();
    }
  } else {
    console.log('✅ Environment keys verified.');
  }
}

setup().catch((err) => {
  console.error('❌ Error during setup:', err);
  process.exit(1);
});
