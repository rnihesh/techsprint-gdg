import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import {
  Municipality,
  MunicipalityUser,
  PlatformMaintainer,
  Issue,
} from "../models/index.js";

const sampleMunicipalities = [
  {
    name: "Bengaluru Bruhat Mahanagara Palike",
    type: "corporation",
    state: "Karnataka",
    district: "Bengaluru Urban",
    center: { type: "Point", coordinates: [77.5946, 12.9716] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [77.4, 12.8],
          [77.8, 12.8],
          [77.8, 13.1],
          [77.4, 13.1],
          [77.4, 12.8],
        ],
      ],
    },
    contactEmail: "bbmp@karnataka.gov.in",
    contactPhone: "080-22975803",
  },
  {
    name: "Chennai Corporation",
    type: "corporation",
    state: "Tamil Nadu",
    district: "Chennai",
    center: { type: "Point", coordinates: [80.2707, 13.0827] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.1, 12.9],
          [80.4, 12.9],
          [80.4, 13.2],
          [80.1, 13.2],
          [80.1, 12.9],
        ],
      ],
    },
    contactEmail: "chennai@tn.gov.in",
    contactPhone: "044-25619300",
  },
  {
    name: "Mumbai Municipal Corporation",
    type: "corporation",
    state: "Maharashtra",
    district: "Mumbai",
    center: { type: "Point", coordinates: [72.8777, 19.076] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [72.7, 18.9],
          [73.0, 18.9],
          [73.0, 19.3],
          [72.7, 19.3],
          [72.7, 18.9],
        ],
      ],
    },
    contactEmail: "mcgm@maharashtra.gov.in",
    contactPhone: "022-22620251",
  },
  {
    name: "New Delhi Municipal Council",
    type: "corporation",
    state: "Delhi",
    district: "New Delhi",
    center: { type: "Point", coordinates: [77.209, 28.6139] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [77.0, 28.5],
          [77.4, 28.5],
          [77.4, 28.8],
          [77.0, 28.8],
          [77.0, 28.5],
        ],
      ],
    },
    contactEmail: "ndmc@delhi.gov.in",
    contactPhone: "011-23022020",
  },
  {
    name: "Kolkata Municipal Corporation",
    type: "corporation",
    state: "West Bengal",
    district: "Kolkata",
    center: { type: "Point", coordinates: [88.3639, 22.5726] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [88.2, 22.4],
          [88.5, 22.4],
          [88.5, 22.7],
          [88.2, 22.7],
          [88.2, 22.4],
        ],
      ],
    },
    contactEmail: "kmc@wb.gov.in",
    contactPhone: "033-22861000",
  },
  {
    name: "Hyderabad Municipal Corporation",
    type: "corporation",
    state: "Telangana",
    district: "Hyderabad",
    center: { type: "Point", coordinates: [78.4867, 17.385] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [78.3, 17.2],
          [78.6, 17.2],
          [78.6, 17.5],
          [78.3, 17.5],
          [78.3, 17.2],
        ],
      ],
    },
    contactEmail: "ghmc@telangana.gov.in",
    contactPhone: "040-23262651",
  },
  {
    name: "Ahmedabad Municipal Corporation",
    type: "corporation",
    state: "Gujarat",
    district: "Ahmedabad",
    center: { type: "Point", coordinates: [72.5714, 23.0225] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [72.4, 22.9],
          [72.7, 22.9],
          [72.7, 23.2],
          [72.4, 23.2],
          [72.4, 22.9],
        ],
      ],
    },
    contactEmail: "amc@gujarat.gov.in",
    contactPhone: "079-25391811",
  },
  {
    name: "Pune Municipal Corporation",
    type: "corporation",
    state: "Maharashtra",
    district: "Pune",
    center: { type: "Point", coordinates: [73.8567, 18.5204] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [73.7, 18.4],
          [74.0, 18.4],
          [74.0, 18.7],
          [73.7, 18.7],
          [73.7, 18.4],
        ],
      ],
    },
    contactEmail: "pmc@maharashtra.gov.in",
    contactPhone: "020-25501000",
  },
  {
    name: "Jaipur Municipal Corporation",
    type: "corporation",
    state: "Rajasthan",
    district: "Jaipur",
    center: { type: "Point", coordinates: [75.7873, 26.9124] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [75.6, 26.8],
          [75.9, 26.8],
          [75.9, 27.0],
          [75.6, 27.0],
          [75.6, 26.8],
        ],
      ],
    },
    contactEmail: "jmc@rajasthan.gov.in",
    contactPhone: "0141-2619500",
  },
  {
    name: "Lucknow Municipal Corporation",
    type: "corporation",
    state: "Uttar Pradesh",
    district: "Lucknow",
    center: { type: "Point", coordinates: [80.9462, 26.8467] },
    boundary: {
      type: "Polygon",
      coordinates: [
        [
          [80.8, 26.7],
          [81.1, 26.7],
          [81.1, 27.0],
          [80.8, 27.0],
          [80.8, 26.7],
        ],
      ],
    },
    contactEmail: "lmc@up.gov.in",
    contactPhone: "0522-2239106",
  },
];

const sampleIssueDescriptions = [
  {
    type: "pothole",
    desc: "Large pothole on main road causing accidents. Very dangerous for two-wheelers.",
  },
  {
    type: "garbage",
    desc: "Garbage not collected for 5 days. Entire area smelling badly.",
  },
  {
    type: "drainage",
    desc: "Drainage blocked causing water logging on street. Mosquito breeding.",
  },
  {
    type: "streetlight",
    desc: "Street light not working for past 2 weeks. Area very dark at night.",
  },
  {
    type: "road_damage",
    desc: "Road surface completely damaged after recent construction work.",
  },
  {
    type: "water_supply",
    desc: "Water pipe leaking for past 3 days. Water wastage happening.",
  },
  {
    type: "sewage",
    desc: "Sewage overflowing on road. Very unhygienic situation.",
  },
  {
    type: "broken_footpath",
    desc: "Footpath tiles broken. Difficult to walk, especially for elderly.",
  },
];

async function seedDatabase() {
  try {
    // Connect to database
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB");

    // Clear existing data
    console.log("Clearing existing data...");
    await Promise.all([
      Municipality.deleteMany({}),
      MunicipalityUser.deleteMany({}),
      PlatformMaintainer.deleteMany({}),
      Issue.deleteMany({}),
    ]);

    // Create municipalities
    console.log("Creating municipalities...");
    const municipalities = await Municipality.insertMany(sampleMunicipalities);
    console.log(`Created ${municipalities.length} municipalities`);

    // Create municipality users
    console.log("Creating municipality users...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const municipalityUsers = municipalities.map((m, index) => ({
      municipalityId: m._id,
      email: `officer${index + 1}@civicsense.in`,
      passwordHash,
      name: `Officer ${m.name.split(" ")[0]}`,
      designation: "Municipal Officer",
      role: "officer",
      isActive: true,
      isVerified: true,
    }));

    await MunicipalityUser.insertMany(municipalityUsers);
    console.log(`Created ${municipalityUsers.length} municipality users`);

    // Create platform maintainer
    console.log("Creating platform maintainer...");
    await PlatformMaintainer.create({
      email: "maintainer@civicsense.in",
      passwordHash,
      name: "Platform Maintainer",
      isActive: true,
    });
    console.log("Created platform maintainer");

    // Create sample issues
    console.log("Creating sample issues...");
    const issues = [];

    for (const municipality of municipalities) {
      // Create 5-15 random issues per municipality
      const numIssues = 5 + Math.floor(Math.random() * 10);

      for (let i = 0; i < numIssues; i++) {
        const issueTemplate =
          sampleIssueDescriptions[
            Math.floor(Math.random() * sampleIssueDescriptions.length)
          ];
        const center = municipality.center.coordinates;

        // Random offset within municipality bounds
        const latOffset = (Math.random() - 0.5) * 0.2;
        const lngOffset = (Math.random() - 0.5) * 0.2;

        // Random date in last 90 days
        const daysAgo = Math.floor(Math.random() * 90);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // Random status
        const statuses = ["OPEN", "OPEN", "OPEN", "RESPONDED", "VERIFIED"];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        issues.push({
          location: {
            type: "Point",
            coordinates: [center[0] + lngOffset, center[1] + latOffset],
          },
          address: {
            formatted: `Sample Address, ${municipality.district}, ${municipality.state}`,
            district: municipality.district,
            state: municipality.state,
            pincode: "500001",
          },
          municipalityId: municipality._id,
          issueType: issueTemplate.type,
          issueTypeConfidence: 0.8 + Math.random() * 0.2,
          description: issueTemplate.desc,
          imageUrl: `https://picsum.photos/seed/${municipality._id}${i}/800/600`,
          imagePublicId: `sample_${municipality._id}_${i}`,
          status,
          mlClassification: {
            predictedType: issueTemplate.type,
            confidence: 0.8 + Math.random() * 0.2,
            allPredictions: [{ type: issueTemplate.type, confidence: 0.9 }],
            modelVersion: "seed-v1.0",
            classifiedAt: createdAt,
          },
          createdAt,
          updatedAt: createdAt,
        });
      }
    }

    await Issue.insertMany(issues);
    console.log(`Created ${issues.length} sample issues`);

    // Update municipality stats
    console.log("Updating municipality stats...");
    for (const municipality of municipalities) {
      const totalReceived = await Issue.countDocuments({
        municipalityId: municipality._id,
      });
      const totalResolved = await Issue.countDocuments({
        municipalityId: municipality._id,
        status: "VERIFIED",
      });

      await Municipality.findByIdAndUpdate(municipality._id, {
        totalIssuesReceived: totalReceived,
        totalIssuesResolved: totalResolved,
        score:
          10000 + totalResolved * 10 - (totalReceived - totalResolved) * 100,
      });
    }

    console.log("\n✅ Database seeded successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Municipality Users:");
    console.log(
      "  Email: officer1@civicsense.in (through officer10@civicsense.in)"
    );
    console.log("  Password: password123");
    console.log("\nPlatform Maintainer:");
    console.log("  Email: maintainer@civicsense.in");
    console.log("  Password: password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedDatabase();
