import * as admin from 'firebase-admin';

const serviceAccountPath = 'c:\\Users\\mahi\\Documents\\techsprint-gdg\\apps\\api\\serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'civiclemma',
  });
}

async function checkUser() {
  const db = admin.firestore();
  
  // Check the specific user
  const userId = 'K1FO4NZXs0X5BPQfwuFPknGq0503';
  
  console.log(`Checking user: ${userId}\n`);
  
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    console.log('User not found in users collection!');
    
    // List all users to debug
    console.log('\nListing all users:');
    const allUsers = await db.collection('users').get();
    allUsers.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`${i + 1}. ${doc.id} - ${data.email} - role: ${data.role}`);
    });
  } else {
    const data = userDoc.data()!;
    console.log('User data:');
    console.log(JSON.stringify(data, null, 2));
  }

  process.exit(0);
}

checkUser().catch(console.error);
