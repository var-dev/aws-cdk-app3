import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
    }
});

const result = JSON.stringify({ privateKey, publicKey }, null, 2)

fs.writeFileSync(path.join(__dirname, '..', '..', '..', 'cloudfrontKeys.json'), result);
