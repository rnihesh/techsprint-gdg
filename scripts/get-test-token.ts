/**
 * Get Firebase ID Token for Testing
 * This script uses the Admin SDK to create a custom token,
 * then exchanges it for an ID token for API testing.
 * 
 * Usage: cd scripts && pnpm tsx get-test-token.ts <user-uid>
 */

import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

// Initialize Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  'c:\\Users\\mahi\\Documents\\techsprint-gdg\\apps\\api\\serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'civiclemma',
  });
}

// Firebase client config
const firebaseConfig = {
  apiKey: "AIzaSyBiH9phHC2j-vJNcalIucu5MwxaanfCZNI",
  authDomain: "civiclemma.firebaseapp.com",
  projectId: "civiclemma",
};

async function getTokenForUser(uid: string) {
  console.log(`Getting token for user: ${uid}`);

  try {
    // Get user info from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log('User not found in Firestore');
      return null;
    }

    const userData = userDoc.data();
    console.log('User data:', {
      email: userData?.email,
      role: userData?.role,
      displayName: userData?.displayName,
    });

    // Create custom token
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('Created custom token');

    // Exchange for ID token using client SDK
    const app = initializeApp(firebaseConfig, 'test-app');
    const auth = getAuth(app);
    
    const userCredential = await signInWithCustomToken(auth, customToken);
    const idToken = await userCredential.user.getIdToken();
    
    console.log('\n=== ID TOKEN ===');
    console.log(idToken);
    console.log('\n=== Use this in API calls ===');
    console.log(`Authorization: Bearer ${idToken.substring(0, 50)}...`);
    
    return idToken;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

async function listUsers() {
  console.log('Listing all users from Firestore...\n');
  
  const db = admin.firestore();
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log('No users found');
    return;
  }

  console.log('Users in database:');
  console.log('─'.repeat(60));
  
  usersSnapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`${index + 1}. ${data.email || 'No email'}`);
    console.log(`   UID: ${doc.id}`);
    console.log(`   Role: ${data.role || 'citizen'}`);
    console.log(`   Name: ${data.displayName || 'N/A'}`);
    console.log('');
  });
}

// Main
const args = process.argv.slice(2);

if (args[0] === 'list') {
  listUsers().then(() => process.exit(0)).catch(console.error);
} else if (args[0]) {
  getTokenForUser(args[0]).then(() => process.exit(0)).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  pnpm tsx get-test-token.ts list          - List all users');
  console.log('  pnpm tsx get-test-token.ts <user-uid>    - Get token for user');
  process.exit(1);
}
