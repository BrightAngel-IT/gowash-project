import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging as getAdminMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the service account key
const serviceAccountPath = path.join(__dirname, 'fcm-key.json');

let firebaseApp = null;
export let firebaseError = null;

try {
    if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        firebaseApp = initializeApp({
            credential: cert(serviceAccount)
        });
        console.log('🔥 Firebase Admin initialized successfully.');
    } else {
        firebaseError = 'Firebase service account key not found at: ' + serviceAccountPath;
        console.warn('⚠️ ' + firebaseError);
    }
} catch (error) {
    firebaseError = error.message || error.toString();
    console.error('❌ Error initializing Firebase Admin:', error);
}

export const getMessaging = () => {
    if (!firebaseApp) return null;
    return getAdminMessaging(firebaseApp);
};

