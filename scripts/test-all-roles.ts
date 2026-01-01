/**
 * Full API Test with All Roles
 * Tests routes for citizen, municipality, and admin users
 */

import * as admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const API_URL = 'http://localhost:3001/api';
const serviceAccountPath = 'c:\\Users\\mahi\\Documents\\techsprint-gdg\\apps\\api\\serviceAccountKey.json';

const firebaseConfig = {
  apiKey: "AIzaSyBiH9phHC2j-vJNcalIucu5MwxaanfCZNI",
  authDomain: "civiclemma.firebaseapp.com",
  projectId: "civiclemma",
};

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'civiclemma',
  });
}

async function getToken(uid: string): Promise<string> {
  const customToken = await admin.auth().createCustomToken(uid);
  const app = initializeApp(firebaseConfig, `app-${uid}`);
  const auth = getAuth(app);
  const userCredential = await signInWithCustomToken(auth, customToken);
  return userCredential.user.getIdToken();
}

async function testRoute(route: string, method: string, token?: string, body?: object) {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_URL}${route}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    return { status: response.status, success: data.success, error: data.error, data: data.data };
  } catch (error) {
    return { status: 0, success: false, error: String(error) };
  }
}

function log(icon: string, msg: string, color: string = '0') {
  console.log(`\x1b[${color}m${icon} ${msg}\x1b[0m`);
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('    COMPREHENSIVE API TEST - ALL ROLES');
  console.log('='.repeat(50));

  // Get all users
  const db = admin.firestore();
  const usersSnap = await db.collection('users').get();
  const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));

  console.log('\n📋 USERS IN DATABASE:');
  users.forEach((u: any) => console.log(`   - ${u.email} (${u.role})`));

  // Find users by role
  const adminUser = users.find((u: any) => u.role === 'admin');
  const municipalityUser = users.find((u: any) => u.role === 'municipality');
  const citizenUser = users.find((u: any) => u.role === 'citizen');

  // ==========================================
  // PUBLIC ROUTES
  // ==========================================
  console.log('\n' + '─'.repeat(50));
  console.log('📌 PUBLIC ROUTES (No Auth Required)');
  console.log('─'.repeat(50));

  const publicTests = [
    ['/health', 'GET'],
    ['/issues', 'GET'],
    ['/issues/stats', 'GET'],
    ['/municipalities', 'GET'],
    ['/municipalities/leaderboard', 'GET'],
  ];

  for (const [route, method] of publicTests) {
    const r = await testRoute(route, method);
    log(r.success ? '✓' : '✗', `${method} ${route} [${r.status}]`, r.success ? '32' : '31');
  }

  // ==========================================
  // CITIZEN TESTS
  // ==========================================
  if (citizenUser) {
    console.log('\n' + '─'.repeat(50));
    console.log(`📌 CITIZEN ROUTES (${(citizenUser as any).email})`);
    console.log('─'.repeat(50));

    const citizenToken = await getToken(citizenUser.uid);
    
    // Auth routes
    let r = await testRoute('/auth/me', 'GET', citizenToken);
    log(r.success ? '✓' : '✗', `GET /auth/me [${r.status}] role=${r.data?.role}`, r.success ? '32' : '31');

    r = await testRoute('/auth/verify', 'POST', citizenToken);
    log(r.success ? '✓' : '✗', `POST /auth/verify [${r.status}]`, r.success ? '32' : '31');

    // Citizen should NOT access admin routes
    r = await testRoute('/admin/stats', 'GET', citizenToken);
    const expectedFail = r.status === 403;
    log(expectedFail ? '✓' : '✗', `GET /admin/stats [${r.status}] (403 expected)`, expectedFail ? '32' : '31');

    // Test municipality registration
    r = await testRoute('/municipalities/register', 'POST', citizenToken, {
      name: 'Test Citizen',
      email: (citizenUser as any).email,
      phone: '9876543210',
      municipalityName: 'Test Municipal Corp',
      municipalityType: 'MUNICIPALITY',
      state: 'Karnataka',
      district: 'Bangalore',
      address: '123 Test Street, Bangalore 560001',
      registrationNumber: 'REG123456',
    });
    // Could be success (new reg) or error (already pending)
    log(r.status === 201 || r.status === 400 ? '✓' : '✗', 
      `POST /municipalities/register [${r.status}] ${r.error || 'OK'}`, 
      r.status === 201 || r.status === 400 ? '32' : '31');
  }

  // ==========================================
  // ADMIN TESTS
  // ==========================================
  if (adminUser) {
    console.log('\n' + '─'.repeat(50));
    console.log(`📌 ADMIN ROUTES (${(adminUser as any).email})`);
    console.log('─'.repeat(50));

    const adminToken = await getToken(adminUser.uid);

    // Auth routes
    let r = await testRoute('/auth/me', 'GET', adminToken);
    log(r.success ? '✓' : '✗', `GET /auth/me [${r.status}] role=${r.data?.role}`, r.success ? '32' : '31');

    // Admin-only routes
    r = await testRoute('/admin/stats', 'GET', adminToken);
    log(r.success ? '✓' : '✗', `GET /admin/stats [${r.status}]`, r.success ? '32' : '31');

    r = await testRoute('/admin/municipalities', 'GET', adminToken);
    log(r.success ? '✓' : '✗', `GET /admin/municipalities [${r.status}] count=${r.data?.total}`, r.success ? '32' : '31');

    r = await testRoute('/admin/users', 'GET', adminToken);
    log(r.success ? '✓' : '✗', `GET /admin/users [${r.status}] count=${r.data?.total}`, r.success ? '32' : '31');

    r = await testRoute('/admin/registrations?status=PENDING', 'GET', adminToken);
    log(r.success ? '✓' : '✗', `GET /admin/registrations [${r.status}] ${r.error || `count=${r.data?.total}`}`, r.success ? '32' : '31');
  } else {
    console.log('\n⚠️  No admin user found. Create one with create-admin.ts');
  }

  // ==========================================
  // MUNICIPALITY TESTS
  // ==========================================
  if (municipalityUser) {
    console.log('\n' + '─'.repeat(50));
    console.log(`📌 MUNICIPALITY ROUTES (${(municipalityUser as any).email})`);
    console.log('─'.repeat(50));

    const muniToken = await getToken(municipalityUser.uid);

    let r = await testRoute('/auth/me', 'GET', muniToken);
    log(r.success ? '✓' : '✗', `GET /auth/me [${r.status}] role=${r.data?.role}`, r.success ? '32' : '31');

    // Municipality can access their dashboard data
    // But should NOT access admin routes
    r = await testRoute('/admin/stats', 'GET', muniToken);
    const expectedFail = r.status === 403;
    log(expectedFail ? '✓' : '✗', `GET /admin/stats [${r.status}] (403 expected)`, expectedFail ? '32' : '31');
  } else {
    console.log('\n⚠️  No municipality user found');
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(50));
  console.log('    TEST COMPLETE');
  console.log('='.repeat(50) + '\n');

  process.exit(0);
}

runTests().catch(console.error);
