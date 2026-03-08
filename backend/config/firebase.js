const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// You would typically replace this with the path to your serviceAccountKey.json file
// OR use environment variables to construct the credential object.
// For this setup, we'll assume environment variables or a placeholder structure.

// const serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: process.env.FIREBASE_DB_URL
// });

// Mock initialization if no credentials (to prevent crash during dev setup)
let db = null;
let auth = null;

if (!admin.apps.length && process.env.FIREBASE_DB_URL) {
    try {
        const path = require('path');
        const fs = require('fs');
        const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
        let config = {
            databaseURL: process.env.FIREBASE_DB_URL,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
        };

        // 1. Check for Render Environment Variable (The "Hack")
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            try {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                config.credential = admin.credential.cert(serviceAccount);
                console.log("Firebase Admin Initialized using ENV Variable (FIREBASE_SERVICE_ACCOUNT)");
            } catch (jsonErr) {
                console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", jsonErr);
            }
        }
        // 2. Check for Local File
        else if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = require(serviceAccountPath);
            config.credential = admin.credential.cert(serviceAccount);
            console.log("Firebase Admin Initialized using serviceAccountKey.json");
        } else {
            // 3. Fallback
            config.credential = admin.credential.applicationDefault();
            console.log("Firebase Admin Initialized using Application Default Credentials");
        }

        admin.initializeApp(config);
        db = admin.database();
        auth = admin.auth();
        console.log("Firebase Admin Successfully Initialized");
    } catch (error) {
        console.error("FIREBASE INITIALIZATION CRITICAL ERROR:", error);
    }
} else if (!process.env.FIREBASE_DB_URL) {
    console.warn("⚠️ FIREBASE_DB_URL not set — backend will start but DB/auth APIs will fail. Add a .env with Firebase config to enable full features.");
}

module.exports = { admin, db, auth };