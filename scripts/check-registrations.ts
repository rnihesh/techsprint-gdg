import * as admin from 'firebase-admin';

const serviceAccountPath = 'c:\\Users\\mahi\\Documents\\techsprint-gdg\\apps\\api\\serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'civiclemma',
  });
}

async function checkRegistrations() {
  const db = admin.firestore();
  
  console.log('Checking municipality_registrations collection...\n');
  
  // Simple query without ordering (should work without index)
  const snap = await db.collection('municipality_registrations').get();
  
  console.log(`Found ${snap.size} registration(s):\n`);
  
  snap.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`${i + 1}. ID: ${doc.id}`);
    console.log(`   Municipality: ${data.municipalityName}`);
    console.log(`   User: ${data.email} (${data.userId})`);
    console.log(`   Status: ${data.status}`);
    console.log(`   State: ${data.state}`);
    console.log('');
  });

  process.exit(0);
}

checkRegistrations().catch(console.error);
