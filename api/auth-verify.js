// api/auth-verify.js - Server-side Firebase ID Token Verification using Google Public Certificates
import https from 'https';
import crypto from 'crypto';

let cachedPublicKeys = null;
let keysExpiryTime = 0;

function fetchGooglePublicKeys() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (cachedPublicKeys && now < keysExpiryTime) {
      return resolve(cachedPublicKeys);
    }

    const req = https.get(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              return reject(new Error(`Failed to fetch Google public keys, status: ${res.statusCode}`));
            }
            const keys = JSON.parse(raw);
            cachedPublicKeys = keys;

            // Parse Cache-Control max-age header if available
            const cacheControl = res.headers['cache-control'] || '';
            const match = cacheControl.match(/max-age=(\d+)/);
            const maxAgeSec = match ? parseInt(match[1], 10) : 3600;
            keysExpiryTime = now + (maxAgeSec * 1000);

            resolve(keys);
          } catch (e) {
            reject(new Error(`Failed to parse Google public keys JSON: ${e.message}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(new Error(`Network error fetching Google public keys: ${err.message}`)));
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout fetching Google public keys'));
    });
  });
}

/**
 * Validates and verifies a Firebase Auth ID Token cryptographically.
 * Ensures:
 * 1. RS256 algorithm & matching Google Certificate (kid)
 * 2. Signature integrity verified with RSA-SHA256
 * 3. Issuer matches https://securetoken.google.com/<projectId>
 * 4. Audience matches <projectId>
 * 5. Token is not expired and issued in the past
 * 6. Non-empty subject (user UID)
 */
export async function verifyFirebaseIdToken(token, expectedProjectId) {
  if (!token || typeof token !== 'string') {
    throw new Error('Authentication token is missing or malformed.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format.');
  }

  let header, payload;
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed token headers or payload.');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported token algorithm or missing kid.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('Authentication token has expired.');
  }
  if (!payload.iat || payload.iat > nowSec + 300) {
    throw new Error('Token issued in the future.');
  }

  const projectId = expectedProjectId || process.env.VITE_FIREBASE_PROJECT_ID || 'devstack-d26a7';
  if (payload.aud !== projectId) {
    throw new Error('Token audience mismatch.');
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error('Token issuer mismatch.');
  }
  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing subject identifier in token.');
  }

  const publicKeys = await fetchGooglePublicKeys();
  const cert = publicKeys[header.kid];
  if (!cert) {
    throw new Error('No matching Google public certificate found for token kid.');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  const isSignatureValid = verifier.verify(cert, Buffer.from(parts[2], 'base64url'));

  if (!isSignatureValid) {
    throw new Error('Cryptographic signature verification failed.');
  }

  return {
    uid: payload.sub,
    email: payload.email || '',
    name: payload.name || '',
  };
}
