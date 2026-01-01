/**
 * Seed Indian Municipal Corporations from Wikipedia data
 *
 * This script:
 * 1. Deletes all existing municipalities
 * 2. Parses municipal corporations data
 * 3. Uses Google Maps Geocoding API to get bounds for each
 * 4. Seeds them into Firestore
 *
 * Run: npx tsx scripts/seed-municipalities.ts
 */

import * as dotenv from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

// Load .env from API folder which has the Google Maps API key
dotenv.config({ path: path.resolve(__dirname, "../apps/api/.env") });

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

// Using OpenStreetMap Nominatim - free geocoding, no API key needed
// Rate limited to 1 request per second as per Nominatim usage policy

interface MunicipalCorporation {
  name: string;
  city: string;
  state: string;
  district: string;
}

// All municipal corporations from Wikipedia organized by state
const MUNICIPAL_CORPORATIONS: MunicipalCorporation[] = [
  // Andhra Pradesh (17)
  {
    name: "Anantapur Municipal Corporation",
    city: "Anantapur",
    state: "Andhra Pradesh",
    district: "Anantapur",
  },
  {
    name: "Chittoor Municipal Corporation",
    city: "Chittoor",
    state: "Andhra Pradesh",
    district: "Chittoor",
  },
  {
    name: "Eluru Municipal Corporation",
    city: "Eluru",
    state: "Andhra Pradesh",
    district: "Eluru",
  },
  {
    name: "Greater Visakhapatnam Municipal Corporation",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    district: "Visakhapatnam",
  },
  {
    name: "Guntur Municipal Corporation",
    city: "Guntur",
    state: "Andhra Pradesh",
    district: "Guntur",
  },
  {
    name: "Kadapa Municipal Corporation",
    city: "Kadapa",
    state: "Andhra Pradesh",
    district: "YSR Kadapa",
  },
  {
    name: "Kakinada Municipal Corporation",
    city: "Kakinada",
    state: "Andhra Pradesh",
    district: "Kakinada",
  },
  {
    name: "Kurnool Municipal Corporation",
    city: "Kurnool",
    state: "Andhra Pradesh",
    district: "Kurnool",
  },
  {
    name: "Machilipatnam Municipal Corporation",
    city: "Machilipatnam",
    state: "Andhra Pradesh",
    district: "Krishna",
  },
  {
    name: "Mangalagiri Tadepalli Municipal Corporation",
    city: "Mangalagiri",
    state: "Andhra Pradesh",
    district: "Guntur",
  },
  {
    name: "Nellore Municipal Corporation",
    city: "Nellore",
    state: "Andhra Pradesh",
    district: "SPS Nellore",
  },
  {
    name: "Ongole Municipal Corporation",
    city: "Ongole",
    state: "Andhra Pradesh",
    district: "Prakasam",
  },
  {
    name: "Rajamahendravaram Municipal Corporation",
    city: "Rajamahendravaram",
    state: "Andhra Pradesh",
    district: "East Godavari",
  },
  {
    name: "Srikakulam Municipal Corporation",
    city: "Srikakulam",
    state: "Andhra Pradesh",
    district: "Srikakulam",
  },
  {
    name: "Tirupati Municipal Corporation",
    city: "Tirupati",
    state: "Andhra Pradesh",
    district: "Tirupati",
  },
  {
    name: "Vijayawada Municipal Corporation",
    city: "Vijayawada",
    state: "Andhra Pradesh",
    district: "NTR",
  },
  {
    name: "Vizianagaram Municipal Corporation",
    city: "Vizianagaram",
    state: "Andhra Pradesh",
    district: "Vizianagaram",
  },

  // Arunachal Pradesh (1)
  {
    name: "Itanagar Municipal Corporation",
    city: "Itanagar",
    state: "Arunachal Pradesh",
    district: "Papum Pare",
  },

  // Assam (3)
  {
    name: "Guwahati Municipal Corporation",
    city: "Guwahati",
    state: "Assam",
    district: "Kamrup Metropolitan",
  },
  {
    name: "Dibrugarh Municipal Corporation",
    city: "Dibrugarh",
    state: "Assam",
    district: "Dibrugarh",
  },
  {
    name: "Silchar Municipal Corporation",
    city: "Silchar",
    state: "Assam",
    district: "Cachar",
  },

  // Bihar (19)
  {
    name: "Arrah Municipal Corporation",
    city: "Arrah",
    state: "Bihar",
    district: "Bhojpur",
  },
  {
    name: "Begusarai Municipal Corporation",
    city: "Begusarai",
    state: "Bihar",
    district: "Begusarai",
  },
  {
    name: "Bettiah Municipal Corporation",
    city: "Bettiah",
    state: "Bihar",
    district: "West Champaran",
  },
  {
    name: "Bhagalpur Municipal Corporation",
    city: "Bhagalpur",
    state: "Bihar",
    district: "Bhagalpur",
  },
  {
    name: "Bihar Sharif Municipal Corporation",
    city: "Bihar Sharif",
    state: "Bihar",
    district: "Nalanda",
  },
  {
    name: "Chhapra Municipal Corporation",
    city: "Chhapra",
    state: "Bihar",
    district: "Saran",
  },
  {
    name: "Darbhanga Municipal Corporation",
    city: "Darbhanga",
    state: "Bihar",
    district: "Darbhanga",
  },
  {
    name: "Gaya Municipal Corporation",
    city: "Gaya",
    state: "Bihar",
    district: "Gaya",
  },
  {
    name: "Katihar Municipal Corporation",
    city: "Katihar",
    state: "Bihar",
    district: "Katihar",
  },
  {
    name: "Madhubani Municipal Corporation",
    city: "Madhubani",
    state: "Bihar",
    district: "Madhubani",
  },
  {
    name: "Motihari Municipal Corporation",
    city: "Motihari",
    state: "Bihar",
    district: "East Champaran",
  },
  {
    name: "Munger Municipal Corporation",
    city: "Munger",
    state: "Bihar",
    district: "Munger",
  },
  {
    name: "Muzaffarpur Municipal Corporation",
    city: "Muzaffarpur",
    state: "Bihar",
    district: "Muzaffarpur",
  },
  {
    name: "Patna Municipal Corporation",
    city: "Patna",
    state: "Bihar",
    district: "Patna",
  },
  {
    name: "Purnia Municipal Corporation",
    city: "Purnia",
    state: "Bihar",
    district: "Purnia",
  },
  {
    name: "Saharsa Municipal Corporation",
    city: "Saharsa",
    state: "Bihar",
    district: "Saharsa",
  },
  {
    name: "Samastipur Municipal Corporation",
    city: "Samastipur",
    state: "Bihar",
    district: "Samastipur",
  },
  {
    name: "Sasaram Municipal Corporation",
    city: "Sasaram",
    state: "Bihar",
    district: "Rohtas",
  },
  {
    name: "Sitamarhi Municipal Corporation",
    city: "Sitamarhi",
    state: "Bihar",
    district: "Sitamarhi",
  },

  // Chhattisgarh (14)
  {
    name: "Ambikapur Municipal Corporation",
    city: "Ambikapur",
    state: "Chhattisgarh",
    district: "Surguja",
  },
  {
    name: "Bhilai Charoda Municipal Corporation",
    city: "Bhilai Charoda",
    state: "Chhattisgarh",
    district: "Durg",
  },
  {
    name: "Bhilai Municipal Corporation",
    city: "Bhilai",
    state: "Chhattisgarh",
    district: "Durg",
  },
  {
    name: "Bilaspur Municipal Corporation",
    city: "Bilaspur",
    state: "Chhattisgarh",
    district: "Bilaspur",
  },
  {
    name: "Birgaon Municipal Corporation",
    city: "Birgaon",
    state: "Chhattisgarh",
    district: "Raipur",
  },
  {
    name: "Chirmiri Municipal Corporation",
    city: "Chirmiri",
    state: "Chhattisgarh",
    district: "Koriya",
  },
  {
    name: "Dhamtari Municipal Corporation",
    city: "Dhamtari",
    state: "Chhattisgarh",
    district: "Dhamtari",
  },
  {
    name: "Durg Municipal Corporation",
    city: "Durg",
    state: "Chhattisgarh",
    district: "Durg",
  },
  {
    name: "Jagdalpur Municipal Corporation",
    city: "Jagdalpur",
    state: "Chhattisgarh",
    district: "Bastar",
  },
  {
    name: "Korba Municipal Corporation",
    city: "Korba",
    state: "Chhattisgarh",
    district: "Korba",
  },
  {
    name: "Raigarh Municipal Corporation",
    city: "Raigarh",
    state: "Chhattisgarh",
    district: "Raigarh",
  },
  {
    name: "Raipur Municipal Corporation",
    city: "Raipur",
    state: "Chhattisgarh",
    district: "Raipur",
  },
  {
    name: "Rajnandgaon Municipal Corporation",
    city: "Rajnandgaon",
    state: "Chhattisgarh",
    district: "Rajnandgaon",
  },
  {
    name: "Risali Municipal Corporation",
    city: "Risali",
    state: "Chhattisgarh",
    district: "Durg",
  },

  // Goa (1)
  {
    name: "Panaji City Corporation",
    city: "Panaji",
    state: "Goa",
    district: "North Goa",
  },

  // Gujarat (17)
  {
    name: "Ahmedabad Municipal Corporation",
    city: "Ahmedabad",
    state: "Gujarat",
    district: "Ahmedabad",
  },
  {
    name: "Surat Municipal Corporation",
    city: "Surat",
    state: "Gujarat",
    district: "Surat",
  },
  {
    name: "Gandhinagar Municipal Corporation",
    city: "Gandhinagar",
    state: "Gujarat",
    district: "Gandhinagar",
  },
  {
    name: "Vadodara Municipal Corporation",
    city: "Vadodara",
    state: "Gujarat",
    district: "Vadodara",
  },
  {
    name: "Rajkot Municipal Corporation",
    city: "Rajkot",
    state: "Gujarat",
    district: "Rajkot",
  },
  {
    name: "Bhavnagar Municipal Corporation",
    city: "Bhavnagar",
    state: "Gujarat",
    district: "Bhavnagar",
  },
  {
    name: "Jamnagar Municipal Corporation",
    city: "Jamnagar",
    state: "Gujarat",
    district: "Jamnagar",
  },
  {
    name: "Junagadh Municipal Corporation",
    city: "Junagadh",
    state: "Gujarat",
    district: "Junagadh",
  },
  {
    name: "Karamsad Anand Municipal Corporation",
    city: "Anand",
    state: "Gujarat",
    district: "Anand",
  },
  {
    name: "Nadiad Municipal Corporation",
    city: "Nadiad",
    state: "Gujarat",
    district: "Kheda",
  },
  {
    name: "Mehsana Municipal Corporation",
    city: "Mehsana",
    state: "Gujarat",
    district: "Mehsana",
  },
  {
    name: "Navsari Municipal Corporation",
    city: "Navsari",
    state: "Gujarat",
    district: "Navsari",
  },
  {
    name: "Surendranagar Municipal Corporation",
    city: "Surendranagar",
    state: "Gujarat",
    district: "Surendranagar",
  },
  {
    name: "Morbi Municipal Corporation",
    city: "Morbi",
    state: "Gujarat",
    district: "Morbi",
  },
  {
    name: "Gandhidham Municipal Corporation",
    city: "Gandhidham",
    state: "Gujarat",
    district: "Kutch",
  },
  {
    name: "Porbandar Municipal Corporation",
    city: "Porbandar",
    state: "Gujarat",
    district: "Porbandar",
  },
  {
    name: "Vapi Municipal Corporation",
    city: "Vapi",
    state: "Gujarat",
    district: "Valsad",
  },

  // Haryana (11)
  {
    name: "Gurugram Municipal Corporation",
    city: "Gurugram",
    state: "Haryana",
    district: "Gurugram",
  },
  {
    name: "Faridabad Municipal Corporation",
    city: "Faridabad",
    state: "Haryana",
    district: "Faridabad",
  },
  {
    name: "Sonipat Municipal Corporation",
    city: "Sonipat",
    state: "Haryana",
    district: "Sonipat",
  },
  {
    name: "Panchkula Municipal Corporation",
    city: "Panchkula",
    state: "Haryana",
    district: "Panchkula",
  },
  {
    name: "Yamunanagar Municipal Corporation",
    city: "Yamunanagar",
    state: "Haryana",
    district: "Yamunanagar",
  },
  {
    name: "Rohtak Municipal Corporation",
    city: "Rohtak",
    state: "Haryana",
    district: "Rohtak",
  },
  {
    name: "Karnal Municipal Corporation",
    city: "Karnal",
    state: "Haryana",
    district: "Karnal",
  },
  {
    name: "Hisar Municipal Corporation",
    city: "Hisar",
    state: "Haryana",
    district: "Hisar",
  },
  {
    name: "Panipat Municipal Corporation",
    city: "Panipat",
    state: "Haryana",
    district: "Panipat",
  },
  {
    name: "Ambala Municipal Corporation",
    city: "Ambala",
    state: "Haryana",
    district: "Ambala",
  },
  {
    name: "Manesar Municipal Corporation",
    city: "Manesar",
    state: "Haryana",
    district: "Gurgaon",
  },

  // Himachal Pradesh (5)
  {
    name: "Dharamshala Municipal Corporation",
    city: "Dharamshala",
    state: "Himachal Pradesh",
    district: "Kangra",
  },
  {
    name: "Mandi Municipal Corporation",
    city: "Mandi",
    state: "Himachal Pradesh",
    district: "Mandi",
  },
  {
    name: "Palampur Municipal Corporation",
    city: "Palampur",
    state: "Himachal Pradesh",
    district: "Kangra",
  },
  {
    name: "Shimla Municipal Corporation",
    city: "Shimla",
    state: "Himachal Pradesh",
    district: "Shimla",
  },
  {
    name: "Nahan Municipal Corporation",
    city: "Nahan",
    state: "Himachal Pradesh",
    district: "Sirmour",
  },

  // Jharkhand (9)
  {
    name: "Adityapur Municipal Corporation",
    city: "Adityapur",
    state: "Jharkhand",
    district: "Seraikela Kharsawan",
  },
  {
    name: "Chas Municipal Corporation",
    city: "Chas",
    state: "Jharkhand",
    district: "Bokaro",
  },
  {
    name: "Deoghar Municipal Corporation",
    city: "Deoghar",
    state: "Jharkhand",
    district: "Deoghar",
  },
  {
    name: "Dhanbad Municipal Corporation",
    city: "Dhanbad",
    state: "Jharkhand",
    district: "Dhanbad",
  },
  {
    name: "Giridih Municipal Corporation",
    city: "Giridih",
    state: "Jharkhand",
    district: "Giridih",
  },
  {
    name: "Hazaribagh Municipal Corporation",
    city: "Hazaribagh",
    state: "Jharkhand",
    district: "Hazaribagh",
  },
  {
    name: "Mango Municipal Corporation",
    city: "Mango",
    state: "Jharkhand",
    district: "East Singhbhum",
  },
  {
    name: "Medininagar Municipal Corporation",
    city: "Medininagar",
    state: "Jharkhand",
    district: "Palamu",
  },
  {
    name: "Ranchi Municipal Corporation",
    city: "Ranchi",
    state: "Jharkhand",
    district: "Ranchi",
  },

  // Karnataka (19)
  {
    name: "Ballari City Corporation",
    city: "Ballari",
    state: "Karnataka",
    district: "Ballari",
  },
  {
    name: "Belagavi City Corporation",
    city: "Belagavi",
    state: "Karnataka",
    district: "Belagavi",
  },
  {
    name: "Bengaluru Central City Corporation",
    city: "Bengaluru",
    state: "Karnataka",
    district: "Bangalore Urban",
  },
  {
    name: "Bengaluru East City Corporation",
    city: "Bengaluru East",
    state: "Karnataka",
    district: "Bangalore Urban",
  },
  {
    name: "Bengaluru North City Corporation",
    city: "Bengaluru North",
    state: "Karnataka",
    district: "Bangalore Urban",
  },
  {
    name: "Bengaluru South City Corporation",
    city: "Bengaluru South",
    state: "Karnataka",
    district: "Bangalore Urban",
  },
  {
    name: "Bengaluru West City Corporation",
    city: "Bengaluru West",
    state: "Karnataka",
    district: "Bangalore Urban",
  },
  {
    name: "Bidar City Corporation",
    city: "Bidar",
    state: "Karnataka",
    district: "Bidar",
  },
  {
    name: "Davanagere City Corporation",
    city: "Davanagere",
    state: "Karnataka",
    district: "Davanagere",
  },
  {
    name: "Dharwad City Corporation",
    city: "Dharwad",
    state: "Karnataka",
    district: "Dharwad",
  },
  {
    name: "Hassan City Corporation",
    city: "Hassan",
    state: "Karnataka",
    district: "Hassan",
  },
  {
    name: "Hubballi City Corporation",
    city: "Hubli",
    state: "Karnataka",
    district: "Dharwad",
  },
  {
    name: "Kalaburagi City Corporation",
    city: "Kalaburagi",
    state: "Karnataka",
    district: "Kalaburagi",
  },
  {
    name: "Mangaluru City Corporation",
    city: "Mangaluru",
    state: "Karnataka",
    district: "Dakshina Kannada",
  },
  {
    name: "Mysuru City Corporation",
    city: "Mysuru",
    state: "Karnataka",
    district: "Mysuru",
  },
  {
    name: "Raichur City Corporation",
    city: "Raichur",
    state: "Karnataka",
    district: "Raichur",
  },
  {
    name: "Shivamogga City Corporation",
    city: "Shivamogga",
    state: "Karnataka",
    district: "Shivamogga",
  },
  {
    name: "Tumakuru City Corporation",
    city: "Tumkur",
    state: "Karnataka",
    district: "Tumakuru",
  },
  {
    name: "Vijayapura City Corporation",
    city: "Vijayapura",
    state: "Karnataka",
    district: "Vijayapura",
  },

  // Kerala (6)
  {
    name: "Thiruvananthapuram Municipal Corporation",
    city: "Thiruvananthapuram",
    state: "Kerala",
    district: "Thiruvananthapuram",
  },
  {
    name: "Kozhikode Municipal Corporation",
    city: "Kozhikode",
    state: "Kerala",
    district: "Kozhikode",
  },
  {
    name: "Kochi Municipal Corporation",
    city: "Kochi",
    state: "Kerala",
    district: "Ernakulam",
  },
  {
    name: "Kollam Municipal Corporation",
    city: "Kollam",
    state: "Kerala",
    district: "Kollam",
  },
  {
    name: "Thrissur Municipal Corporation",
    city: "Thrissur",
    state: "Kerala",
    district: "Thrissur",
  },
  {
    name: "Kannur Municipal Corporation",
    city: "Kannur",
    state: "Kerala",
    district: "Kannur",
  },

  // Madhya Pradesh (16)
  {
    name: "Bhopal Municipal Corporation",
    city: "Bhopal",
    state: "Madhya Pradesh",
    district: "Bhopal",
  },
  {
    name: "Burhanpur Municipal Corporation",
    city: "Burhanpur",
    state: "Madhya Pradesh",
    district: "Burhanpur",
  },
  {
    name: "Chhindwara Municipal Corporation",
    city: "Chhindwara",
    state: "Madhya Pradesh",
    district: "Chhindwara",
  },
  {
    name: "Dewas Municipal Corporation",
    city: "Dewas",
    state: "Madhya Pradesh",
    district: "Dewas",
  },
  {
    name: "Gwalior Municipal Corporation",
    city: "Gwalior",
    state: "Madhya Pradesh",
    district: "Gwalior",
  },
  {
    name: "Indore Municipal Corporation",
    city: "Indore",
    state: "Madhya Pradesh",
    district: "Indore",
  },
  {
    name: "Jabalpur Municipal Corporation",
    city: "Jabalpur",
    state: "Madhya Pradesh",
    district: "Jabalpur",
  },
  {
    name: "Katni Municipal Corporation",
    city: "Katni",
    state: "Madhya Pradesh",
    district: "Katni",
  },
  {
    name: "Khandwa Municipal Corporation",
    city: "Khandwa",
    state: "Madhya Pradesh",
    district: "Khandwa",
  },
  {
    name: "Morena Municipal Corporation",
    city: "Morena",
    state: "Madhya Pradesh",
    district: "Morena",
  },
  {
    name: "Ratlam Municipal Corporation",
    city: "Ratlam",
    state: "Madhya Pradesh",
    district: "Ratlam",
  },
  {
    name: "Rewa Municipal Corporation",
    city: "Rewa",
    state: "Madhya Pradesh",
    district: "Rewa",
  },
  {
    name: "Sagar Municipal Corporation",
    city: "Sagar",
    state: "Madhya Pradesh",
    district: "Sagar",
  },
  {
    name: "Satna Municipal Corporation",
    city: "Satna",
    state: "Madhya Pradesh",
    district: "Satna",
  },
  {
    name: "Singrauli Municipal Corporation",
    city: "Singrauli",
    state: "Madhya Pradesh",
    district: "Singrauli",
  },
  {
    name: "Ujjain Municipal Corporation",
    city: "Ujjain",
    state: "Madhya Pradesh",
    district: "Ujjain",
  },

  // Maharashtra (29)
  {
    name: "Brihanmumbai Municipal Corporation",
    city: "Mumbai",
    state: "Maharashtra",
    district: "Mumbai",
  },
  {
    name: "Pune Municipal Corporation",
    city: "Pune",
    state: "Maharashtra",
    district: "Pune",
  },
  {
    name: "Nagpur Municipal Corporation",
    city: "Nagpur",
    state: "Maharashtra",
    district: "Nagpur",
  },
  {
    name: "Nashik Municipal Corporation",
    city: "Nashik",
    state: "Maharashtra",
    district: "Nashik",
  },
  {
    name: "Thane Municipal Corporation",
    city: "Thane",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Pimpri Chinchwad Municipal Corporation",
    city: "Pimpri-Chinchwad",
    state: "Maharashtra",
    district: "Pune",
  },
  {
    name: "Kalyan-Dombivli Municipal Corporation",
    city: "Kalyan",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Vasai-Virar City Municipal Corporation",
    city: "Vasai-Virar",
    state: "Maharashtra",
    district: "Palghar",
  },
  {
    name: "Chhatrapati Sambhajinagar Municipal Corporation",
    city: "Aurangabad",
    state: "Maharashtra",
    district: "Aurangabad",
  },
  {
    name: "Navi Mumbai Municipal Corporation",
    city: "Navi Mumbai",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Solapur Municipal Corporation",
    city: "Solapur",
    state: "Maharashtra",
    district: "Solapur",
  },
  {
    name: "Mira-Bhayandar Municipal Corporation",
    city: "Mira-Bhayandar",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Bhiwandi-Nizampur Municipal Corporation",
    city: "Bhiwandi",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Amravati Municipal Corporation",
    city: "Amravati",
    state: "Maharashtra",
    district: "Amravati",
  },
  {
    name: "Nanded-Waghala Municipal Corporation",
    city: "Nanded",
    state: "Maharashtra",
    district: "Nanded",
  },
  {
    name: "Kolhapur Municipal Corporation",
    city: "Kolhapur",
    state: "Maharashtra",
    district: "Kolhapur",
  },
  {
    name: "Akola Municipal Corporation",
    city: "Akola",
    state: "Maharashtra",
    district: "Akola",
  },
  {
    name: "Panvel Municipal Corporation",
    city: "Panvel",
    state: "Maharashtra",
    district: "Raigad",
  },
  {
    name: "Ulhasnagar Municipal Corporation",
    city: "Ulhasnagar",
    state: "Maharashtra",
    district: "Thane",
  },
  {
    name: "Sangli-Miraj-Kupwad Municipal Corporation",
    city: "Sangli",
    state: "Maharashtra",
    district: "Sangli",
  },
  {
    name: "Malegaon Municipal Corporation",
    city: "Malegaon",
    state: "Maharashtra",
    district: "Nashik",
  },
  {
    name: "Jalgaon Municipal Corporation",
    city: "Jalgaon",
    state: "Maharashtra",
    district: "Jalgaon",
  },
  {
    name: "Latur Municipal Corporation",
    city: "Latur",
    state: "Maharashtra",
    district: "Latur",
  },
  {
    name: "Dhule Municipal Corporation",
    city: "Dhule",
    state: "Maharashtra",
    district: "Dhule",
  },
  {
    name: "Ahmednagar Municipal Corporation",
    city: "Ahmednagar",
    state: "Maharashtra",
    district: "Ahmednagar",
  },
  {
    name: "Chandrapur Municipal Corporation",
    city: "Chandrapur",
    state: "Maharashtra",
    district: "Chandrapur",
  },
  {
    name: "Parbhani Municipal Corporation",
    city: "Parbhani",
    state: "Maharashtra",
    district: "Parbhani",
  },
  {
    name: "Ichalkaranji Municipal Corporation",
    city: "Ichalkaranji",
    state: "Maharashtra",
    district: "Kolhapur",
  },
  {
    name: "Jalna Municipal Corporation",
    city: "Jalna",
    state: "Maharashtra",
    district: "Jalna",
  },

  // Manipur (1)
  {
    name: "Imphal Municipal Corporation",
    city: "Imphal",
    state: "Manipur",
    district: "Imphal West",
  },

  // Mizoram (1)
  {
    name: "Aizawl Municipal Corporation",
    city: "Aizawl",
    state: "Mizoram",
    district: "Aizawl",
  },

  // Odisha (6)
  {
    name: "Berhampur Municipal Corporation",
    city: "Berhampur",
    state: "Odisha",
    district: "Ganjam",
  },
  {
    name: "Bhubaneswar Municipal Corporation",
    city: "Bhubaneswar",
    state: "Odisha",
    district: "Khordha",
  },
  {
    name: "Cuttack Municipal Corporation",
    city: "Cuttack",
    state: "Odisha",
    district: "Cuttack",
  },
  {
    name: "Rourkela Municipal Corporation",
    city: "Rourkela",
    state: "Odisha",
    district: "Sundergarh",
  },
  {
    name: "Sambalpur Municipal Corporation",
    city: "Sambalpur",
    state: "Odisha",
    district: "Sambalpur",
  },
  {
    name: "Puri Municipal Corporation",
    city: "Puri",
    state: "Odisha",
    district: "Puri",
  },

  // Punjab (14)
  {
    name: "Ludhiana Municipal Corporation",
    city: "Ludhiana",
    state: "Punjab",
    district: "Ludhiana",
  },
  {
    name: "Amritsar Municipal Corporation",
    city: "Amritsar",
    state: "Punjab",
    district: "Amritsar",
  },
  {
    name: "Jalandhar Municipal Corporation",
    city: "Jalandhar",
    state: "Punjab",
    district: "Jalandhar",
  },
  {
    name: "Patiala Municipal Corporation",
    city: "Patiala",
    state: "Punjab",
    district: "Patiala",
  },
  {
    name: "Phagwara Municipal Corporation",
    city: "Phagwara",
    state: "Punjab",
    district: "Kapurthala",
  },
  {
    name: "Bathinda Municipal Corporation",
    city: "Bathinda",
    state: "Punjab",
    district: "Bathinda",
  },
  {
    name: "Batala Municipal Corporation",
    city: "Batala",
    state: "Punjab",
    district: "Gurdaspur",
  },
  {
    name: "Mohali Municipal Corporation",
    city: "Mohali",
    state: "Punjab",
    district: "Mohali",
  },
  {
    name: "Hoshiarpur Municipal Corporation",
    city: "Hoshiarpur",
    state: "Punjab",
    district: "Hoshiarpur",
  },
  {
    name: "Moga Municipal Corporation",
    city: "Moga",
    state: "Punjab",
    district: "Moga",
  },
  {
    name: "Pathankot Municipal Corporation",
    city: "Pathankot",
    state: "Punjab",
    district: "Pathankot",
  },
  {
    name: "Abohar Municipal Corporation",
    city: "Abohar",
    state: "Punjab",
    district: "Fazilka",
  },
  {
    name: "Kapurthala Municipal Corporation",
    city: "Kapurthala",
    state: "Punjab",
    district: "Kapurthala",
  },
  {
    name: "Barnala Municipal Corporation",
    city: "Barnala",
    state: "Punjab",
    district: "Barnala",
  },

  // Rajasthan (9)
  {
    name: "Ajmer Municipal Corporation",
    city: "Ajmer",
    state: "Rajasthan",
    district: "Ajmer",
  },
  {
    name: "Alwar Municipal Corporation",
    city: "Alwar",
    state: "Rajasthan",
    district: "Alwar",
  },
  {
    name: "Bharatpur Municipal Corporation",
    city: "Bharatpur",
    state: "Rajasthan",
    district: "Bharatpur",
  },
  {
    name: "Bikaner Municipal Corporation",
    city: "Bikaner",
    state: "Rajasthan",
    district: "Bikaner",
  },
  {
    name: "Bhilwara Municipal Corporation",
    city: "Bhilwara",
    state: "Rajasthan",
    district: "Bhilwara",
  },
  {
    name: "Jaipur Municipal Corporation",
    city: "Jaipur",
    state: "Rajasthan",
    district: "Jaipur",
  },
  {
    name: "Jodhpur Municipal Corporation",
    city: "Jodhpur",
    state: "Rajasthan",
    district: "Jodhpur",
  },
  {
    name: "Kota Municipal Corporation",
    city: "Kota",
    state: "Rajasthan",
    district: "Kota",
  },
  {
    name: "Udaipur Municipal Corporation",
    city: "Udaipur",
    state: "Rajasthan",
    district: "Udaipur",
  },

  // Sikkim (1)
  {
    name: "Gangtok Municipal Corporation",
    city: "Gangtok",
    state: "Sikkim",
    district: "East Sikkim",
  },

  // Tamil Nadu (25)
  {
    name: "Greater Chennai Corporation",
    city: "Chennai",
    state: "Tamil Nadu",
    district: "Chennai",
  },
  {
    name: "Madurai Municipal Corporation",
    city: "Madurai",
    state: "Tamil Nadu",
    district: "Madurai",
  },
  {
    name: "Coimbatore Municipal Corporation",
    city: "Coimbatore",
    state: "Tamil Nadu",
    district: "Coimbatore",
  },
  {
    name: "Tiruchirappalli City Municipal Corporation",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    district: "Tiruchirappalli",
  },
  {
    name: "Salem City Municipal Corporation",
    city: "Salem",
    state: "Tamil Nadu",
    district: "Salem",
  },
  {
    name: "Tirunelveli Municipal Corporation",
    city: "Tirunelveli",
    state: "Tamil Nadu",
    district: "Tirunelveli",
  },
  {
    name: "Tiruppur City Municipal Corporation",
    city: "Tiruppur",
    state: "Tamil Nadu",
    district: "Tiruppur",
  },
  {
    name: "Erode City Municipal Corporation",
    city: "Erode",
    state: "Tamil Nadu",
    district: "Erode",
  },
  {
    name: "Vellore Municipal Corporation",
    city: "Vellore",
    state: "Tamil Nadu",
    district: "Vellore",
  },
  {
    name: "Thoothukkudi City Municipal Corporation",
    city: "Thoothukudi",
    state: "Tamil Nadu",
    district: "Thoothukudi",
  },
  {
    name: "Dindigul Municipal Corporation",
    city: "Dindigul",
    state: "Tamil Nadu",
    district: "Dindigul",
  },
  {
    name: "Thanjavur Municipal Corporation",
    city: "Thanjavur",
    state: "Tamil Nadu",
    district: "Thanjavur",
  },
  {
    name: "Nagercoil Municipal Corporation",
    city: "Nagercoil",
    state: "Tamil Nadu",
    district: "Kanyakumari",
  },
  {
    name: "Hosur Municipal Corporation",
    city: "Hosur",
    state: "Tamil Nadu",
    district: "Krishnagiri",
  },
  {
    name: "Kumbakonam Municipal Corporation",
    city: "Kumbakonam",
    state: "Tamil Nadu",
    district: "Thanjavur",
  },
  {
    name: "Avadi Municipal Corporation",
    city: "Avadi",
    state: "Tamil Nadu",
    district: "Thiruvallur",
  },
  {
    name: "Tambaram Corporation",
    city: "Tambaram",
    state: "Tamil Nadu",
    district: "Chengalpattu",
  },
  {
    name: "Kancheepuram Municipal Corporation",
    city: "Kancheepuram",
    state: "Tamil Nadu",
    district: "Kanchipuram",
  },
  {
    name: "Karur Municipal Corporation",
    city: "Karur",
    state: "Tamil Nadu",
    district: "Karur",
  },
  {
    name: "Cuddalore Municipal Corporation",
    city: "Cuddalore",
    state: "Tamil Nadu",
    district: "Cuddalore",
  },
  {
    name: "Sivakasi Municipal Corporation",
    city: "Sivakasi",
    state: "Tamil Nadu",
    district: "Virudhunagar",
  },
  {
    name: "Karaikudi Municipal Corporation",
    city: "Karaikudi",
    state: "Tamil Nadu",
    district: "Sivaganga",
  },
  {
    name: "Namakkal Municipal Corporation",
    city: "Namakkal",
    state: "Tamil Nadu",
    district: "Namakkal",
  },
  {
    name: "Pudukottai Municipal Corporation",
    city: "Pudukkottai",
    state: "Tamil Nadu",
    district: "Pudukkottai",
  },
  {
    name: "Tiruvannamalai Municipal Corporation",
    city: "Tiruvannamalai",
    state: "Tamil Nadu",
    district: "Tiruvannamalai",
  },

  // Telangana (9)
  {
    name: "Greater Hyderabad Municipal Corporation",
    city: "Hyderabad",
    state: "Telangana",
    district: "Hyderabad",
  },
  {
    name: "Greater Warangal Municipal Corporation",
    city: "Warangal",
    state: "Telangana",
    district: "Warangal",
  },
  {
    name: "Karimnagar Municipal Corporation",
    city: "Karimnagar",
    state: "Telangana",
    district: "Karimnagar",
  },
  {
    name: "Nizamabad Municipal Corporation",
    city: "Nizamabad",
    state: "Telangana",
    district: "Nizamabad",
  },
  {
    name: "Ramagundam Municipal Corporation",
    city: "Ramagundam",
    state: "Telangana",
    district: "Peddapalli",
  },
  {
    name: "Khammam Municipal Corporation",
    city: "Khammam",
    state: "Telangana",
    district: "Khammam",
  },
  {
    name: "Mancherial Municipal Corporation",
    city: "Mancherial",
    state: "Telangana",
    district: "Mancherial",
  },
  {
    name: "Mahabubnagar Municipal Corporation",
    city: "Mahabubnagar",
    state: "Telangana",
    district: "Mahabubnagar",
  },
  {
    name: "Kothagudem Municipal Corporation",
    city: "Kothagudem",
    state: "Telangana",
    district: "Bhadradri Kothagudem",
  },

  // Tripura (1)
  {
    name: "Agartala Municipal Corporation",
    city: "Agartala",
    state: "Tripura",
    district: "West Tripura",
  },

  // Uttar Pradesh (17)
  {
    name: "Lucknow Municipal Corporation",
    city: "Lucknow",
    state: "Uttar Pradesh",
    district: "Lucknow",
  },
  {
    name: "Kanpur Municipal Corporation",
    city: "Kanpur",
    state: "Uttar Pradesh",
    district: "Kanpur Nagar",
  },
  {
    name: "Agra Municipal Corporation",
    city: "Agra",
    state: "Uttar Pradesh",
    district: "Agra",
  },
  {
    name: "Ghaziabad Municipal Corporation",
    city: "Ghaziabad",
    state: "Uttar Pradesh",
    district: "Ghaziabad",
  },
  {
    name: "Varanasi Municipal Corporation",
    city: "Varanasi",
    state: "Uttar Pradesh",
    district: "Varanasi",
  },
  {
    name: "Meerut Municipal Corporation",
    city: "Meerut",
    state: "Uttar Pradesh",
    district: "Meerut",
  },
  {
    name: "Prayagraj Municipal Corporation",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    district: "Prayagraj",
  },
  {
    name: "Aligarh Municipal Corporation",
    city: "Aligarh",
    state: "Uttar Pradesh",
    district: "Aligarh",
  },
  {
    name: "Bareilly Municipal Corporation",
    city: "Bareilly",
    state: "Uttar Pradesh",
    district: "Bareilly",
  },
  {
    name: "Ayodhya Municipal Corporation",
    city: "Ayodhya",
    state: "Uttar Pradesh",
    district: "Ayodhya",
  },
  {
    name: "Moradabad Municipal Corporation",
    city: "Moradabad",
    state: "Uttar Pradesh",
    district: "Moradabad",
  },
  {
    name: "Saharanpur Municipal Corporation",
    city: "Saharanpur",
    state: "Uttar Pradesh",
    district: "Saharanpur",
  },
  {
    name: "Gorakhpur Municipal Corporation",
    city: "Gorakhpur",
    state: "Uttar Pradesh",
    district: "Gorakhpur",
  },
  {
    name: "Firozabad Municipal Corporation",
    city: "Firozabad",
    state: "Uttar Pradesh",
    district: "Firozabad",
  },
  {
    name: "Mathura-Vrindavan Municipal Corporation",
    city: "Mathura",
    state: "Uttar Pradesh",
    district: "Mathura",
  },
  {
    name: "Jhansi Municipal Corporation",
    city: "Jhansi",
    state: "Uttar Pradesh",
    district: "Jhansi",
  },
  {
    name: "Shahjahanpur Municipal Corporation",
    city: "Shahjahanpur",
    state: "Uttar Pradesh",
    district: "Shahjahanpur",
  },

  // Uttarakhand (11)
  {
    name: "Almora Municipal Corporation",
    city: "Almora",
    state: "Uttarakhand",
    district: "Almora",
  },
  {
    name: "Dehradun Municipal Corporation",
    city: "Dehradun",
    state: "Uttarakhand",
    district: "Dehradun",
  },
  {
    name: "Haldwani Municipal Corporation",
    city: "Haldwani",
    state: "Uttarakhand",
    district: "Nainital",
  },
  {
    name: "Haridwar Municipal Corporation",
    city: "Haridwar",
    state: "Uttarakhand",
    district: "Haridwar",
  },
  {
    name: "Kashipur Municipal Corporation",
    city: "Kashipur",
    state: "Uttarakhand",
    district: "Udham Singh Nagar",
  },
  {
    name: "Kotdwar Municipal Corporation",
    city: "Kotdwar",
    state: "Uttarakhand",
    district: "Pauri Garhwal",
  },
  {
    name: "Pithoragarh Municipal Corporation",
    city: "Pithoragarh",
    state: "Uttarakhand",
    district: "Pithoragarh",
  },
  {
    name: "Rishikesh Municipal Corporation",
    city: "Rishikesh",
    state: "Uttarakhand",
    district: "Dehradun",
  },
  {
    name: "Roorkee Municipal Corporation",
    city: "Roorkee",
    state: "Uttarakhand",
    district: "Haridwar",
  },
  {
    name: "Rudrapur Municipal Corporation",
    city: "Rudrapur",
    state: "Uttarakhand",
    district: "Udham Singh Nagar",
  },
  {
    name: "Srinagar Municipal Corporation",
    city: "Srinagar Garhwal",
    state: "Uttarakhand",
    district: "Pauri Garhwal",
  },

  // West Bengal (7)
  {
    name: "Asansol Municipal Corporation",
    city: "Asansol",
    state: "West Bengal",
    district: "Paschim Bardhaman",
  },
  {
    name: "Bidhannagar Municipal Corporation",
    city: "Bidhannagar",
    state: "West Bengal",
    district: "North 24 Parganas",
  },
  {
    name: "Chandernagore Municipal Corporation",
    city: "Chandannagar",
    state: "West Bengal",
    district: "Hooghly",
  },
  {
    name: "Durgapur Municipal Corporation",
    city: "Durgapur",
    state: "West Bengal",
    district: "Paschim Bardhaman",
  },
  {
    name: "Howrah Municipal Corporation",
    city: "Howrah",
    state: "West Bengal",
    district: "Howrah",
  },
  {
    name: "Kolkata Municipal Corporation",
    city: "Kolkata",
    state: "West Bengal",
    district: "Kolkata",
  },
  {
    name: "Siliguri Municipal Corporation",
    city: "Siliguri",
    state: "West Bengal",
    district: "Darjeeling",
  },

  // Union Territories
  // Chandigarh (1)
  {
    name: "Chandigarh Municipal Corporation",
    city: "Chandigarh",
    state: "Chandigarh",
    district: "Chandigarh",
  },

  // Delhi (1)
  {
    name: "Municipal Corporation of Delhi",
    city: "Delhi",
    state: "Delhi",
    district: "Delhi",
  },

  // Jammu & Kashmir (2)
  {
    name: "Jammu Municipal Corporation",
    city: "Jammu",
    state: "Jammu and Kashmir",
    district: "Jammu",
  },
  {
    name: "Srinagar Municipal Corporation",
    city: "Srinagar",
    state: "Jammu and Kashmir",
    district: "Srinagar",
  },
];

interface GeocodeResult {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}

// Rate limiting helper - Nominatim requires 1 req/sec
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeCity(
  city: string,
  state: string,
  district: string
): Promise<GeocodeResult> {
  // Use OpenStreetMap Nominatim for geocoding (free, no API key)
  const searchQueries = [
    `${city}, ${state}, India`,
    `${city}, ${district}, India`,
    `${city}, India`,
  ];

  for (const query of searchQueries) {
    try {
      // Nominatim API with proper user-agent
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=1&countrycodes=in`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "CivicLemma-Municipality-Seeder/1.0 (civic-issue-tracking)",
          Accept: "application/json",
        },
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];

        // Nominatim returns boundingbox as [south, north, west, east]
        if (result.boundingbox) {
          return {
            bounds: {
              south: parseFloat(result.boundingbox[0]),
              north: parseFloat(result.boundingbox[1]),
              west: parseFloat(result.boundingbox[2]),
              east: parseFloat(result.boundingbox[3]),
            },
          };
        }

        // If no bounds, create approximate bounds from lat/lon (10km radius)
        if (result.lat && result.lon) {
          const lat = parseFloat(result.lat);
          const lon = parseFloat(result.lon);
          const delta = 0.1; // roughly 10km
          return {
            bounds: {
              north: lat + delta,
              south: lat - delta,
              east: lon + delta,
              west: lon - delta,
            },
          };
        }
      }
    } catch (error) {
      console.error(`Error geocoding "${query}":`, error);
    }
  }

  return { bounds: null };
}

async function deleteAllMunicipalities(): Promise<number> {
  console.log("\n🗑️  Deleting existing municipalities...");

  const snapshot = await db.collection("municipalities").get();
  const count = snapshot.size;

  if (count === 0) {
    console.log("No existing municipalities to delete.");
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ Deleted ${count} existing municipalities.`);
  return count;
}

async function seedMunicipalities() {
  console.log("🏛️  Seeding Indian Municipal Corporations");
  console.log(`Total to process: ${MUNICIPAL_CORPORATIONS.length}`);
  console.log("⏳ Using Nominatim API (1 request/second rate limit)\n");

  let successCount = 0;
  let failCount = 0;
  const failed: string[] = [];

  // Process sequentially due to Nominatim rate limiting (1 req/sec)
  for (let i = 0; i < MUNICIPAL_CORPORATIONS.length; i++) {
    const corp = MUNICIPAL_CORPORATIONS[i];

    try {
      process.stdout.write(
        `[${i + 1}/${MUNICIPAL_CORPORATIONS.length}] 📍 ${corp.city}, ${
          corp.state
        }... `
      );

      const { bounds } = await geocodeCity(
        corp.city,
        corp.state,
        corp.district
      );

      if (!bounds) {
        console.log("❌ No bounds");
        failed.push(corp.name);
        failCount++;
      } else {
        // Create municipality document
        const municipalityData = {
          name: corp.name,
          type: "MUNICIPAL_CORPORATION",
          state: corp.state,
          district: corp.district,
          score: 0,
          totalIssues: 0,
          resolvedIssues: 0,
          avgResolutionTime: null,
          bounds,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        await db.collection("municipalities").add(municipalityData);
        console.log("✅");
        successCount++;
      }

      // Rate limiting: wait 1.1 seconds between requests
      if (i < MUNICIPAL_CORPORATIONS.length - 1) {
        await sleep(1100);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      failed.push(corp.name);
      failCount++;
    }
  }

  console.log("\n========================================");
  console.log("📊 SEEDING SUMMARY");
  console.log("========================================");
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failed.length > 0) {
    console.log("\nFailed municipalities:");
    failed.forEach((name) => console.log(`  - ${name}`));
  }

  console.log("\n✨ Seeding complete!");
}

async function main() {
  try {
    // Step 1: Delete existing municipalities
    // await deleteAllMunicipalities();

    // Step 2: Seed new municipalities
    await seedMunicipalities();

    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
