/**
 * List all municipalities with their IDs
 *
 * Usage:
 *   npx tsx scripts/list-municipalities.ts [--state "State Name"]
 *
 * Examples:
 *   npx tsx scripts/list-municipalities.ts
 *   npx tsx scripts/list-municipalities.ts --state "Karnataka"
 */

import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

async function listMunicipalities(stateFilter?: string) {
  console.log("\n🏛️  Municipalities List");
  console.log("======================\n");

  try {
    // Simple query without composite index requirement
    let query: FirebaseFirestore.Query = db.collection("municipalities");

    if (stateFilter) {
      query = query.where("state", "==", stateFilter);
      console.log(`Filtering by state: ${stateFilter}\n`);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("No municipalities found.");
      return;
    }

    // Sort in memory instead of using Firestore orderBy (avoids index requirement)
    const municipalities = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => {
        // Sort by state first, then by name
        const stateCompare = (a.state || "").localeCompare(b.state || "");
        if (stateCompare !== 0) return stateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });

    // Check which municipalities already have accounts
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "MUNICIPALITY_USER")
      .get();

    const municipalitiesWithAccounts = new Set(
      usersSnapshot.docs.map((doc) => doc.data().municipalityId)
    );

    let currentState = "";
    let count = 0;

    console.log(
      "ID".padEnd(25),
      "Name".padEnd(45),
      "District".padEnd(25),
      "Account"
    );
    console.log("-".repeat(110));

    for (const muni of municipalities) {
      // Print state header
      if (muni.state !== currentState) {
        currentState = muni.state;
        console.log(`\n📍 ${currentState}`);
        console.log("-".repeat(110));
      }

      const hasAccount = municipalitiesWithAccounts.has(muni.id);
      const accountStatus = hasAccount ? "✅ Yes" : "❌ No";

      console.log(
        muni.id.padEnd(25),
        (muni.name || "Unknown").substring(0, 43).padEnd(45),
        (muni.district || "-").substring(0, 23).padEnd(25),
        accountStatus
      );
      count++;
    }

    console.log("\n" + "-".repeat(110));
    console.log(`Total: ${count} municipalities`);
    console.log(`With accounts: ${municipalitiesWithAccounts.size}`);
    console.log(`Without accounts: ${count - municipalitiesWithAccounts.size}`);
    console.log("");
    console.log("To create an account for a municipality:");
    console.log(
      "  npx tsx scripts/create-municipality-account.ts <ID> <email> <password>"
    );
    console.log("");
  } catch (error) {
    console.error("❌ Error listing municipalities:", error);
    process.exit(1);
  }
}

// Parse --state argument
const stateIndex = process.argv.indexOf("--state");
const stateFilter =
  stateIndex !== -1 ? process.argv[stateIndex + 1] : undefined;

listMunicipalities(stateFilter).then(() => process.exit(0));
