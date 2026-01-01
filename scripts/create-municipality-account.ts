/**
 * Create a municipality account
 *
 * This script creates a single shared account for a municipality.
 * All workers in that municipality will use this same account.
 *
 * Usage:
 *   npx tsx scripts/create-municipality-account.ts <municipality-id> <email> <password>
 *
 * Example:
 *   npx tsx scripts/create-municipality-account.ts abc123 bbmp@civiclemma.com SecurePassword123
 *
 * To find municipality IDs:
 *   1. Go to Firebase Console → Firestore → municipalities collection
 *   2. Or run: npx tsx scripts/list-municipalities.ts
 */

import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "fs";
import * as path from "path";

const serviceAccountPath = path.resolve(
  __dirname,
  "../apps/api/serviceAccountKey.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account key not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

async function createMunicipalityAccount(
  municipalityId: string,
  email: string,
  password: string
) {
  console.log("\n🏛️  Creating Municipality Account");
  console.log("================================\n");

  // Validate inputs
  if (!municipalityId || !email || !password) {
    console.error(
      "❌ Usage: npx tsx scripts/create-municipality-account.ts <municipality-id> <email> <password>"
    );
    console.error("");
    console.error("Example:");
    console.error(
      "  npx tsx scripts/create-municipality-account.ts abc123 bbmp@civiclemma.com SecurePass123"
    );
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("❌ Password must be at least 6 characters");
    process.exit(1);
  }

  try {
    // 1. Check if municipality exists
    const municipalityDoc = await db
      .collection("municipalities")
      .doc(municipalityId)
      .get();

    if (!municipalityDoc.exists) {
      console.error("❌ Municipality not found with ID:", municipalityId);
      console.error("");
      console.error("To list all municipalities, run:");
      console.error("  npx tsx scripts/list-municipalities.ts");
      process.exit(1);
    }

    const municipality = municipalityDoc.data();
    console.log("📍 Municipality:", municipality?.name);
    console.log("   State:", municipality?.state);
    console.log("   District:", municipality?.district);

    // 2. Check if account already exists for this municipality
    const existingUsers = await db
      .collection("users")
      .where("municipalityId", "==", municipalityId)
      .where("role", "==", "MUNICIPALITY_USER")
      .get();

    if (!existingUsers.empty) {
      const existingUser = existingUsers.docs[0].data();
      console.error("");
      console.error("⚠️  An account already exists for this municipality:");
      console.error("   Email:", existingUser.email);
      console.error("");
      console.error(
        "To reset password, use Firebase Console → Authentication → Users"
      );
      process.exit(1);
    }

    // 3. Check if email is already in use
    try {
      await auth.getUserByEmail(email);
      console.error("❌ Email already in use:", email);
      process.exit(1);
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
      // Email not in use, continue
    }

    // 4. Create Firebase Auth user
    console.log("\n📧 Creating auth account:", email);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: municipality?.name || "Municipality User",
      emailVerified: true, // Pre-verify since we're creating it
    });

    console.log("   UID:", userRecord.uid);

    // 5. Create Firestore user document
    console.log("📝 Creating user profile...");
    await db
      .collection("users")
      .doc(userRecord.uid)
      .set({
        email,
        displayName: municipality?.name || "Municipality User",
        role: "MUNICIPALITY_USER",
        municipalityId,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
      });

    // 6. Update municipality with reference to account (optional)
    await db.collection("municipalities").doc(municipalityId).update({
      accountEmail: email,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("");
    console.log("✅ Municipality account created successfully!");
    console.log("");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("LOGIN CREDENTIALS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Email:    ", email);
    console.log("Password: ", password);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log(
      "Share these credentials with all workers in",
      municipality?.name
    );
    console.log("They can login at: http://localhost:3000/auth/login");
    console.log("");
  } catch (error) {
    console.error("❌ Error creating account:", error);
    process.exit(1);
  }
}

const [municipalityId, email, password] = process.argv.slice(2);
createMunicipalityAccount(municipalityId, email, password).then(() =>
  process.exit(0)
);
