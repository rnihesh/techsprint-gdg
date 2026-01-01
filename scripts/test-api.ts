/**
 * Comprehensive API Test Script
 * Tests all routes with proper authentication
 * 
 * Usage: cd scripts && pnpm tsx test-api.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const API_URL = 'http://localhost:3001/api';

// Firebase config (from your .env)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBiH9phHC2j-vJNcalIucu5MwxaanfCZNI",
  authDomain: "civiclemma.firebaseapp.com",
  projectId: "civiclemma",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface TestResult {
  route: string;
  method: string;
  status: number;
  success: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function testRoute(
  route: string, 
  method: string = 'GET', 
  token?: string,
  body?: object
): Promise<TestResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${route}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    return {
      route,
      method,
      status: response.status,
      success: data.success ?? response.ok,
      error: data.error,
    };
  } catch (error) {
    return {
      route,
      method,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function printResult(result: TestResult) {
  const icon = result.success ? '✓' : '✗';
  const color = result.success ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}${icon}${reset} ${result.method} ${result.route} [${result.status}]${result.error ? ` - ${result.error}` : ''}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log('       CIVICLEMMA API TEST SUITE       ');
  console.log('========================================\n');

  // ==========================================
  // 1. PUBLIC ROUTES (No Auth Required)
  // ==========================================
  console.log('📌 PUBLIC ROUTES (No Auth)');
  console.log('─'.repeat(40));

  const publicRoutes = [
    { route: '/health', method: 'GET' },
    { route: '/issues', method: 'GET' },
    { route: '/issues/stats', method: 'GET' },
    { route: '/municipalities', method: 'GET' },
    { route: '/municipalities/leaderboard', method: 'GET' },
  ];

  for (const r of publicRoutes) {
    const result = await testRoute(r.route, r.method);
    results.push(result);
    printResult(result);
  }

  // ==========================================
  // 2. PROTECTED ROUTES (Should Fail Without Auth)
  // ==========================================
  console.log('\n📌 PROTECTED ROUTES (Without Auth - Should Return 401)');
  console.log('─'.repeat(40));

  const protectedRoutes = [
    { route: '/auth/me', method: 'GET' },
    { route: '/auth/verify', method: 'POST' },
    { route: '/municipalities/register', method: 'POST' },
    { route: '/admin/stats', method: 'GET' },
    { route: '/admin/municipalities', method: 'GET' },
    { route: '/admin/registrations', method: 'GET' },
    { route: '/admin/users', method: 'GET' },
  ];

  for (const r of protectedRoutes) {
    const result = await testRoute(r.route, r.method);
    // For protected routes without auth, 401 is expected (success)
    const expectedFail = result.status === 401;
    results.push({ ...result, success: expectedFail });
    console.log(`${expectedFail ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m'} ${r.method} ${r.route} [${result.status}] ${expectedFail ? '(401 expected)' : '(SHOULD BE 401!)'}`);
  }

  // ==========================================
  // 3. TRY TO LOGIN AND TEST WITH AUTH
  // ==========================================
  console.log('\n📌 AUTHENTICATED ROUTES');
  console.log('─'.repeat(40));

  // Try to get a token - you need a test user
  let token: string | null = null;
  
  // Check if we have test credentials in env
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (testEmail && testPassword) {
    try {
      console.log(`Logging in as ${testEmail}...`);
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      token = await userCredential.user.getIdToken();
      console.log('\x1b[32m✓ Login successful\x1b[0m');

      // Test authenticated routes
      const authRoutes = [
        { route: '/auth/me', method: 'GET' },
        { route: '/auth/verify', method: 'POST' },
      ];

      for (const r of authRoutes) {
        const result = await testRoute(r.route, r.method, token);
        results.push(result);
        printResult(result);
      }

      // Check user role
      const meResult = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const meData = await meResult.json();
      const userRole = meData.data?.role;
      console.log(`\nUser role: ${userRole}`);

      // Test role-specific routes based on user role
      if (userRole === 'admin') {
        console.log('\n📌 ADMIN ROUTES');
        console.log('─'.repeat(40));

        const adminRoutes = [
          { route: '/admin/stats', method: 'GET' },
          { route: '/admin/municipalities', method: 'GET' },
          { route: '/admin/registrations?status=PENDING', method: 'GET' },
          { route: '/admin/users', method: 'GET' },
        ];

        for (const r of adminRoutes) {
          const result = await testRoute(r.route, r.method, token);
          results.push(result);
          printResult(result);
        }
      } else if (userRole === 'municipality') {
        console.log('\n📌 MUNICIPALITY ROUTES');
        console.log('─'.repeat(40));
        console.log('(Municipality-specific routes would be tested here)');
      } else {
        console.log('\n📌 CITIZEN ROUTES');
        console.log('─'.repeat(40));
        
        // Test municipality registration
        const result = await testRoute('/municipalities/register', 'POST', token, {
          name: 'Test User',
          email: testEmail,
          phone: '1234567890',
          municipalityName: 'Test Municipality',
          municipalityType: 'MUNICIPALITY',
          state: 'Karnataka',
          district: 'Bangalore',
          address: '123 Test Street, Bangalore, Karnataka 560001',
          registrationNumber: 'TEST123456',
        });
        results.push(result);
        printResult(result);
      }
    } catch (error) {
      console.log(`\x1b[31m✗ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`);
    }
  } else {
    console.log('\x1b[33m⚠ No test credentials provided. Set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.\x1b[0m');
    console.log('  Skipping authenticated route tests.\n');
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n========================================');
  console.log('              TEST SUMMARY              ');
  console.log('========================================');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\n  Total:  ${results.length}`);
  console.log(`  \x1b[32mPassed: ${passed}\x1b[0m`);
  console.log(`  \x1b[31mFailed: ${failed}\x1b[0m`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.method} ${r.route}: ${r.error || `Status ${r.status}`}`);
    });
  }

  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
