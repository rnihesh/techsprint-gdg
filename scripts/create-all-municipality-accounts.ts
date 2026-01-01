/**
 * Batch create accounts for all municipalities
 *
 * Email format: lemma_{district}@gmail.com (lowercase, spaces replaced with underscores)
 * Password: lemma@123
 *
 * Usage:
 *   npx tsx scripts/create-all-municipality-accounts.ts
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

const PASSWORD = "lemma@123";

function generateEmail(district: string): string {
  // Convert to lowercase, replace spaces with underscores, remove special characters
  const sanitized = district
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `lemma_${sanitized}@gmail.com`;
}

async function createAllAccounts() {
  console.log("\n🏛️  Batch Creating Municipality Accounts");
  console.log("=========================================\n");

  try {
    // Get all municipalities
    const snapshot = await db.collection("municipalities").get();

    if (snapshot.empty) {
      console.log("No municipalities found.");
      return;
    }

    // Get existing municipality users to avoid duplicates
    const existingUsersSnapshot = await db
      .collection("users")
      .where("role", "==", "MUNICIPALITY_USER")
      .get();

    const existingMunicipalityIds = new Set(
      existingUsersSnapshot.docs.map((doc) => doc.data().municipalityId)
    );

    // Track used emails to avoid duplicates
    const usedEmails = new Map<string, string>(); // email -> municipalityId

    // Also get existing auth emails
    const existingEmails = new Set<string>();
    for (const doc of existingUsersSnapshot.docs) {
      existingEmails.add(doc.data().email);
    }

    const municipalities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`Total municipalities: ${municipalities.length}`);
    console.log(`Already have accounts: ${existingMunicipalityIds.size}`);
    console.log(
      `To create: ${municipalities.length - existingMunicipalityIds.size}`
    );
    console.log(`Password for all: ${PASSWORD}`);
    console.log("\n" + "-".repeat(80) + "\n");

    let created = 0;
    let skipped = 0;
    let failed = 0;
    const results: { name: string; email: string; status: string }[] = [];

    for (const muni of municipalities) {
      const municipalityId = muni.id;
      const name = muni.name || "Unknown";
      const district = muni.district || "unknown";

      // Skip if already has account
      if (existingMunicipalityIds.has(municipalityId)) {
        skipped++;
        continue;
      }

      // Generate email
      let email = generateEmail(district);

      // Handle duplicate emails by appending municipality name
      if (usedEmails.has(email)) {
        // Append part of municipality name to make unique
        const cityName = (muni.name || "")
          .replace(/Municipal Corporation/i, "")
          .replace(/City Corporation/i, "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "");
        email = `lemma_${district
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "")}_${cityName}@gmail.com`;
      }

      // If still duplicate, add number
      let counter = 2;
      const baseEmail = email;
      while (usedEmails.has(email) || existingEmails.has(email)) {
        email = baseEmail.replace("@gmail.com", `${counter}@gmail.com`);
        counter++;
      }

      usedEmails.set(email, municipalityId);

      try {
        process.stdout.write(
          `Creating: ${name.substring(0, 40).padEnd(42)} ${email.padEnd(45)} `
        );

        // Check if email exists in Firebase Auth
        try {
          await auth.getUserByEmail(email);
          console.log("⚠️  Email exists");
          results.push({ name, email, status: "Email already exists in Auth" });
          skipped++;
          continue;
        } catch (error: any) {
          if (error.code !== "auth/user-not-found") {
            throw error;
          }
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
          email,
          password: PASSWORD,
          displayName: name,
          emailVerified: true,
        });

        // Create Firestore user document
        await db.collection("users").doc(userRecord.uid).set({
          email,
          displayName: name,
          role: "MUNICIPALITY_USER",
          municipalityId,
          isActive: true,
          createdAt: FieldValue.serverTimestamp(),
          lastLoginAt: null,
        });

        // Update municipality with account email
        await db.collection("municipalities").doc(municipalityId).update({
          accountEmail: email,
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log("✅");
        results.push({ name, email, status: "Created" });
        created++;
      } catch (error: any) {
        console.log(`❌ ${error.message?.substring(0, 30) || "Error"}`);
        results.push({ name, email, status: `Error: ${error.message}` });
        failed++;
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Created: ${created}`);
    console.log(`⏭️  Skipped (already had account): ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("");
    console.log("Password for all accounts:", PASSWORD);
    console.log("");

    // Save results to file
    const outputPath = path.resolve(__dirname, "municipality-accounts.csv");
    const csvContent = [
      "Municipality Name,Email,Password,Status",
      ...results.map(
        (r) => `"${r.name}","${r.email}","${PASSWORD}","${r.status}"`
      ),
    ].join("\n");

    fs.writeFileSync(outputPath, csvContent);
    console.log(`📄 Results saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

createAllAccounts().then(() => process.exit(0));
