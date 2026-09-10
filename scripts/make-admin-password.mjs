// Generate the two secrets the admin API needs.
//
//   node scripts/make-admin-password.mjs "your-chosen-password"
//
// Prints ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET to paste into server/.env.
// The password itself is never stored anywhere — only its scrypt hash, so the
// .env file cannot be read to recover it.

import crypto from 'node:crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/make-admin-password.mjs "your-chosen-password"');
  process.exit(1);
}
if (password.length < 12) {
  console.error(`That password is ${password.length} characters. Use at least 12.`);
  console.error('This is the only credential protecting every page on the site.');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64);

console.log('\nAdd these two lines to server/.env:\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt$${salt.toString('hex')}$${key.toString('hex')}`);
console.log(`ADMIN_SESSION_SECRET=${crypto.randomBytes(48).toString('base64url')}`);
console.log('\nThen restart the server. The password itself is not stored — keep it somewhere safe.\n');
