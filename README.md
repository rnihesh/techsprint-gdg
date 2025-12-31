# Nagarik Seva - Civic Issue Reporting & Municipal Accountability Platform

A comprehensive web-based platform for Indian citizens to report civic issues anonymously and hold municipalities accountable through transparent tracking and public leaderboards.

## 🏗️ Architecture

```
techsprint-gdg/
├── apps/
│   ├── web/          # Next.js 16 frontend with App Router
│   └── api/          # Express.js REST API backend
├── packages/
│   ├── types/        # Shared TypeScript type definitions
│   ├── validation/   # Zod validation schemas
│   ├── utils/        # Utility functions & scoring engine
│   └── firebase/     # Firebase client & admin configurations
└── services/         # ML inference service (future)
```

## 🚀 Features

### For Citizens
- **Anonymous Issue Reporting** - Report civic issues without revealing identity
- **Geo-tagged Complaints** - Auto-detect location or enter manually
- **Photo Evidence** - Upload photos to support complaints
- **Real-time Tracking** - Monitor issue status and municipality responses
- **Interactive Map** - View all issues in your area
- **Public Leaderboard** - See how municipalities perform

### For Municipalities
- **Dashboard** - Manage all citizen complaints
- **Response System** - Acknowledge and respond to issues
- **Performance Metrics** - Track resolution rate and response time
- **Photo Verification** - Upload before/after resolution photos

### Platform Features
- **ML Verification** - AI-powered authenticity verification (planned)
- **Automated Scoring** - Algorithm-based municipality rankings
- **Transparency Reports** - Public accountability metrics

## 📦 Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Validation**: Zod
- **Monorepo**: pnpm workspaces

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Firebase project with Firestore, Auth, and Storage enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/techsprint-gdg.git
   cd techsprint-gdg
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   For the web app (`apps/web/.env.local`):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

   For the API (`apps/api/.env`):
   ```env
   PORT=3001
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Add Firebase service account**
   
   Download your Firebase service account JSON from Firebase Console and save it as `apps/api/serviceAccountKey.json`

### Development

Run all apps in development mode:
```bash
pnpm dev
```

Or run individually:
```bash
# Frontend only
pnpm --filter @techsprint/web dev

# Backend only
pnpm --filter @techsprint/api dev
```

### Build

```bash
pnpm build
```

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with issue submission form |
| `/map` | Interactive map view of all issues |
| `/leaderboard` | Municipality performance rankings |
| `/auth/login` | Municipality login |
| `/auth/register` | Municipality registration |
| `/municipality/dashboard` | Municipality management dashboard |

## 🔌 API Endpoints

### Issues
- `GET /api/issues` - List issues with filters
- `POST /api/issues` - Create new issue
- `GET /api/issues/:id` - Get issue details
- `POST /api/issues/:id/respond` - Municipality response

### Municipalities
- `GET /api/municipalities/leaderboard` - Get rankings
- `GET /api/municipalities/:id` - Get municipality details
- `GET /api/municipalities/:id/stats` - Get performance stats

### Auth
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

## 🏆 Scoring Algorithm

Municipalities are ranked based on:
- **Resolution Rate (40%)** - Percentage of resolved issues
- **Response Time (35%)** - Average time to respond
- **Quality Score (25%)** - Based on verification and citizen feedback

Penalties applied for:
- Overdue issues (escalating penalty after 48h)
- Rejected issues without valid reason

## 🔒 Security

- Anonymous reporting - No personal data collected from citizens
- Firebase Authentication for municipality users
- Role-based access control (citizen, municipality_staff, admin)
- Rate limiting on API endpoints

## 🗺️ Roadmap

- [ ] ML-based image verification
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] SMS/WhatsApp reporting
- [ ] Integration with government APIs
- [ ] Multi-language support (Hindi, Tamil, etc.)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built for GDG TechSprint hackathon with the goal of improving civic governance in India.
