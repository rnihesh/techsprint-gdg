/**
 * Bootstrap script to create the first admin user
 * 
 * Run this once to set up your first admin:
 * npx tsx scripts/create-admin.ts <firebase-uid>
 * 
 * Get the Firebase UID by:
 * 1. Register as a regular user on the website
 * 2. Open browser dev tools → Application → IndexedDB → firebaseLocalStorage
 * 3. Find the user object and copy the uid
 * OR
 * 1. Go to Firebase Console → Authentication → Users
 * 2. Copy the UID of the user you want to make admin
 */

import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(__dirname, '../apps/api/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account key not found at:', serviceAccountPath);
  console.error('Please download it from Firebase Console and save it there.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function createAdmin(uid: string) {
  if (!uid) {
    console.error('❌ Usage: npx tsx scripts/create-admin.ts <firebase-uid>');
    console.error('');
    console.error('To get a Firebase UID:');
    console.error('1. Register as a user on http://localhost:3000/auth/register');
    console.error('2. Go to Firebase Console → Authentication → Users');
    console.error('3. Copy the UID of the user');
    process.exit(1);
  }

  try {
    // Check if user exists
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('❌ User with UID', uid, 'not found in Firestore.');
      console.error('Make sure the user has logged in at least once.');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log('Found user:', userData?.email || userData?.displayName || uid);

    // Update role to admin
    await userRef.update({
      role: 'admin',
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ Successfully set user as admin!');
    console.log('');
    console.log('The user can now:');
    console.log('1. Log in at http://localhost:3000/auth/login');
    console.log('2. Access Admin Dashboard at http://localhost:3000/admin/dashboard');
    console.log('3. Approve municipality registrations');
    console.log('4. Manage users and municipalities');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

const uid = process.argv[2];
createAdmin(uid).then(() => process.exit(0));
