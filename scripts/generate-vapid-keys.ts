/**
 * Generates a VAPID keypair for web push.
 *
 *   npm run push:keys
 *
 * Add the printed values to .env.local and to Vercel project env vars.
 * The private key is a credential — never commit it.
 */

import webpush from "web-push";

const { publicKey, privateKey } = webpush.generateVAPIDKeys();

console.log("Add these to .env.local and your Vercel environment variables:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log("VAPID_SUBJECT=mailto:hello@bitesync.io");
console.log("\nAlso set CRON_SECRET to a long random string, e.g.:");
console.log(`CRON_SECRET=${webpush.generateVAPIDKeys().privateKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40)}`);
console.log("\nVAPID_SUBJECT must be a mailto: or https: URL you control.");
