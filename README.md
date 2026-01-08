# CivicLemma - Civic Issue Reporting & Municipal Accountability Platform

A comprehensive web-based platform for Indian citizens to report civic issues anonymously and hold municipalities accountable through transparent tracking, AI-powered image classification, and public leaderboards.

## 🏗️ Architecture

```
techsprint-gdg/
├── apps/
│   ├── web/          # Next.js 15 frontend with React 19 & App Router
│   └── api/          # Express.js REST API backend with TypeScript
├── packages/
│   ├── types/        # Shared TypeScript type definitions
│   ├── validation/   # Zod validation schemas
│   ├── utils/        # Utility functions & scoring engine
│   └── firebase/     # Firebase client & admin SDK configurations
├── ml/               # Python ML service with TensorFlow/Keras
│   ├── api_server.py         # Flask API for image classification
│   ├── train_classifier.py  # Model training script
│   └── models/              # Trained MobileNetV2 model
├── scripts/          # Admin & utility scripts
│   ├── create-admin.ts
│   ├── seed-municipalities.ts
│   ├── create-municipality-account.ts
│   └── test-api.ts
└── deploy/           # Production deployment configs (systemd & nginx)
```

## 🚀 Features

### For Citizens

- **Anonymous Issue Reporting** - Report civic issues without revealing identity
- **AI-Powered Image Classification** - Automatic issue type detection using MobileNetV2 model
- **Geo-tagged Complaints** - Auto-detect location using Google Maps or enter manually
- **Multi-Photo Upload** - Upload multiple photos with Cloudinary integration
- **Real-time Tracking** - Monitor issue status and municipality responses
- **Interactive Map** - View all issues in your area with clustering
- **Public Leaderboard** - See how municipalities perform based on transparent metrics

### For Municipalities

- **Dashboard** - Manage all citizen complaints with filtering and search
- **Response System** - Acknowledge and respond to issues with photos & notes
- **Performance Metrics** - Track resolution rate, response time, and score
- **Before/After Photos** - Upload resolution photos for verification
- **Pending Issues View** - Quick access to issues requiring attention

### For Platform Admins

- **Admin Dashboard** - Complete oversight of all municipalities, issues, and users
- **Municipality Management** - Create, edit, and delete municipalities
- **Registration Approval** - Review and approve municipality registration requests
- **User Management** - View and manage all platform users
- **Global Statistics** - Monitor platform-wide metrics and performance

### Platform Features

- **ML Image Classification** - TensorFlow/Keras MobileNetV2 model with 9 issue categories
- **AI Description Generation** - Gemini AI generates descriptive text from issue photos
- **Automated Scoring** - Algorithm-based municipality rankings with time-decay penalties
- **Transparency Reports** - Public accountability metrics for all municipalities
- **Role-Based Access Control** - USER, MUNICIPALITY_USER, PLATFORM_MAINTAINER roles
- **Cloudinary Integration** - Optimized image storage and delivery
- **Firebase Backend** - Real-time database with Firestore, Auth, and Storage

## 📦 Tech Stack

### Frontend

- **Next.js 15** - React 19 with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library
- **Google Maps API** - Interactive maps and location services
- **Cloudinary** - Image upload, optimization, and delivery

### Backend

- **Node.js & Express.js** - RESTful API server
- **TypeScript** - Type-safe backend code
- **Firebase Admin SDK** - Server-side Firebase integration
- **Zod** - Runtime schema validation

### ML/AI Services

- **TensorFlow/Keras** - MobileNetV2 image classification model
- **Python Flask** - ML inference API server
- **Google Gemini AI** - AI-powered description generation
- **9 Issue Categories** - Potholes, Garbage, Illegal Parking, Damaged Signs, Fallen Trees, Vandalism, Dead Animals, Damaged Concrete, Damaged Electrical

### Database & Storage

- **Firebase Firestore** - NoSQL real-time database
- **Firebase Authentication** - User authentication (Email/Password, Google OAuth)
- **Firebase Storage** - File storage
- **Cloudinary** - Image CDN and optimization

### DevOps & Deployment

- **pnpm Workspaces** - Monorepo management
- **systemd** - Production service management
- **nginx** - Reverse proxy and load balancing
- **PM2** - Node.js process management (alternative to systemd)

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

   **For the web app** (`apps/web/.env.local`):

   ```env
   # Firebase (Client SDK)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # API URLs
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_ML_API_URL=http://localhost:3002

   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Cloudinary
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

   **For the API** (`apps/api/.env`):

   ```env
   # Server
   PORT=3001
   CORS_ORIGIN=http://localhost:3000

   # Firebase Admin SDK
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   # OR use environment variables:
   # FIREBASE_PROJECT_ID=your_project_id
   # FIREBASE_CLIENT_EMAIL=your_client_email
   # FIREBASE_PRIVATE_KEY=your_private_key

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Google Maps Geocoding API
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Google Gemini AI (for issue classification)
   GEMINI_API_KEY=your_gemini_api_key
   ```

   **For the ML service** (`ml/.env`):

   ```env
   # ML API Server
   ML_API_PORT=3002

   # Google Gemini AI (for description generation)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Add Firebase service account**

   Download your Firebase service account JSON from Firebase Console → Project Settings → Service Accounts and save it as `apps/api/serviceAccountKey.json`

5. **Set up ML environment (Optional - for image classification)**

   ```bash
   # Create Python virtual environment
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate

   # Install ML dependencies
   pip install -r ml/requirements.txt
   ```

6. **Seed initial data (Optional)**

   ```bash
   # Create an admin user (requires user to register first)
   cd scripts
   pnpm tsx create-admin.ts <firebase-uid>

   # Seed municipalities data
   pnpm tsx seed-municipalities.ts

   # Create municipality accounts
   pnpm tsx create-all-municipality-accounts.ts
   ```

### Development

Run all services concurrently:

```bash
pnpm dev
```

Or run individually:

```bash
# Frontend (Next.js) - http://localhost:3000
pnpm dev:web

# Backend API (Express) - http://localhost:3001
pnpm dev:api

# ML Service (Flask) - http://localhost:3002
pnpm dev:ml
```

**Note**: The ML service requires a trained model at `ml/models/best_model.keras`. See [ML README](ml/README.md) for training instructions.

### Build

```bash
# Build all packages and apps
pnpm build

# Build specific apps
pnpm build:web  # Next.js production build
pnpm build:api  # TypeScript compilation

# Type checking
pnpm typecheck
```

## 📱 Pages & Routes

### Public Routes

| Route                   | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `/`                     | Home page with platform overview and stats         |
| `/map`                  | Interactive map view of all issues with clustering |
| `/leaderboard`          | Municipality performance rankings                  |
| `/about`                | Platform information and mission                   |
| `/contact`              | Contact form                                       |
| `/terms`                | Terms of service                                   |
| `/privacy`              | Privacy policy                                     |
| `/auth/login`           | User login (Email/Password & Google)               |
| `/auth/register`        | New user registration                              |
| `/auth/forgot-password` | Password reset                                     |

### Authenticated Routes (Citizens)

| Route      | Description                                   |
| ---------- | --------------------------------------------- |
| `/report`  | Submit new civic issue with photos & location |
| `/profile` | User profile and settings                     |

### Municipality Routes (MUNICIPALITY_USER)

| Route                     | Description                                   |
| ------------------------- | --------------------------------------------- |
| `/municipality/issues`    | Manage issues (pending & resolved tabs)       |
| `/municipality/dashboard` | Redirects to issues page                      |
| `/municipality/pending`   | Pending approval page (for new registrations) |

### Admin Routes (PLATFORM_MAINTAINER)

| Route              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `/admin/dashboard` | Complete admin panel with tabs:                  |
| - Overview         | Dashboard with stats and pending actions         |
| - Municipalities   | Manage all municipalities (create, edit, delete) |
| - Registrations    | Approve/reject municipality requests             |
| - Users            | View and manage all platform users               |
| - Issues           | View all issues across all municipalities        |
| `/municipalities`  | Public directory of all municipalities           |

## 🔌 API Endpoints

### Health & Info

- `GET /api/health` - Health check

### Issues (Public)

- `GET /api/issues` - List issues with filters (status, type, municipalityId, pagination)
- `GET /api/issues/stats` - Global statistics (total, resolved, municipalities, avg response time)
- `GET /api/issues/:id` - Get issue details
- `POST /api/issues` - Create new issue (anonymous, no auth required)

### Issues (Municipality - Auth Required)

- `POST /api/issues/:id/respond` - Municipality response with resolution photos
- `PATCH /api/issues/:id/status` - Update issue status (OPEN/CLOSED)

### Municipalities (Public)

- `GET /api/municipalities` - List municipalities with pagination
- `GET /api/municipalities/leaderboard` - Get rankings sorted by score
- `GET /api/municipalities/:id` - Get municipality details
- `GET /api/municipalities/:id/stats` - Get performance statistics

### Municipalities (Auth Required)

- `POST /api/municipalities/register` - Submit registration request
- `GET /api/municipalities/registration-status` - Check registration status

### Authentication

- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/verify` - Verify Firebase token
- `POST /api/auth/login` - Update last login timestamp

### Admin (PLATFORM_MAINTAINER only)

- `GET /api/admin/stats` - Platform-wide statistics
- `GET /api/admin/municipalities` - List all municipalities (with filters)
- `POST /api/admin/municipalities` - Create municipality
- `PATCH /api/admin/municipalities/:id` - Update municipality
- `DELETE /api/admin/municipalities/:id` - Delete municipality
- `GET /api/admin/registrations` - List registration requests (filter by status)
- `POST /api/admin/registrations/:id/approve` - Approve registration
- `POST /api/admin/registrations/:id/reject` - Reject registration
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:uid` - Delete user

### Image Upload

- `POST /api/upload/signature` - Generate Cloudinary upload signature
- `POST /api/upload/optimize-url` - Get optimized image URL

### ML Classification

- `POST /api/classify` - Classify issue image (returns issue type & confidence)
- `GET /api/classify/issue-types` - List valid issue types

### ML Service (Python Flask - Port 3002)

- `POST /classify` - Classify image using TensorFlow model
- `POST /generate-description` - Generate issue description with Gemini AI
- `GET /issue-types` - List valid issue categories
- `GET /health` - ML service health check

## 🏆 Scoring Algorithm

Municipalities are ranked based on a transparent scoring system:

### Base Score

- Starting score: **10,000 points**

### Penalties (Time-based)

Open issues accumulate penalties over time:

- **Days 1-30**: No penalty
- **Days 31-60**: -200 points per issue
- **Days 61-90**: -300 points per issue
- **Days 90+**: -500 points per issue per month

### Bonuses

- **Verification Bonus**: +10 points per verified resolution (>75% verification score)

### Score Calculation

```
Final Score = Base Score - Total Penalties + Verification Bonuses
```

### Performance Metrics Displayed

- **Overall Score**: Calculated using the algorithm above
- **Resolution Rate**: Percentage of closed issues
- **Average Response Time**: Mean time to first response (hours)
- **Total Issues**: Count of all issues in municipality
- **Pending Issues**: Count of open issues

**Note**: The leaderboard updates in real-time as issues are reported and resolved.

## 🤖 ML Image Classification

The platform uses a custom-trained **MobileNetV2** model for automatic issue type detection:

### Supported Issue Categories (9 types)

1. **Potholes and Road Damage** → `POTHOLE`
2. **Littering** → `GARBAGE`
3. **Illegal Parking Issues** → `ILLEGAL_PARKING`
4. **Broken Road Sign Issues** → `DAMAGED_SIGN`
5. **Fallen trees** → `FALLEN_TREE`
6. **Vandalism Issues** → `VANDALISM`
7. **Dead Animal Pollution** → `DEAD_ANIMAL`
8. **Damaged concrete structures** → `DAMAGED_CONCRETE`
9. **Damaged Electric wires and poles** → `DAMAGED_ELECTRICAL`

### Confidence Thresholds

| Confidence | Action                                        |
| ---------- | --------------------------------------------- |
| < 70%      | **Reject** - User must manually select type   |
| 70-85%     | **Accept with warning** - User should confirm |
| > 85%      | **Accept** - High confidence classification   |

### Features

- **Image Quality Checks**: Validates brightness, contrast, edge density
- **Entropy Analysis**: Detects unrelated images (selfies, random objects)
- **Multi-prediction**: Shows top 5 predictions with probabilities
- **Gemini AI Integration**: Generates descriptive text from images

### Model Details

- **Architecture**: MobileNetV2 (ImageNet pre-trained)
- **Input Size**: 224x224 RGB
- **Training**: Custom dataset with data augmentation
- **Framework**: TensorFlow/Keras
- **API**: Flask server on port 3002

See [ml/README.md](ml/README.md) for training instructions and API documentation.

## 🔒 Security

- **Anonymous Reporting**: Citizens can report issues without authentication
- **No Personal Data Collection**: Location is geo-coordinates only, no user tracking
- **Firebase Authentication**: Secure auth for municipality and admin users
- **Role-Based Access Control (RBAC)**: Three user roles with specific permissions
  - `USER`: Report issues, view public data
  - `MUNICIPALITY_USER`: Manage issues for their municipality
  - `PLATFORM_MAINTAINER`: Full admin access
- **JWT Token Validation**: All protected routes verify Firebase ID tokens
- **Environment Variables**: Sensitive keys stored securely
- **CORS Configuration**: Restricts API access to allowed origins
- **Input Validation**: Zod schemas validate all API inputs
- **Rate Limiting**: Planned for production (TODO)

## �️ Admin Scripts

Located in `scripts/` directory:

### Setup & Management

```bash
cd scripts

# Create first admin user (requires Firebase UID)
pnpm tsx create-admin.ts <firebase-uid>

# Seed municipalities data from JSON
pnpm tsx seed-municipalities.ts

# Create individual municipality account
pnpm tsx create-municipality-account.ts <municipality-id> <email> <password>

# Bulk create all municipality accounts from CSV
pnpm tsx create-all-municipality-accounts.ts

# List all municipalities
pnpm tsx list-municipalities.ts
```

### Testing & Debugging

```bash
# Test all API endpoints
pnpm tsx test-api.ts

# Test endpoints with different roles (citizen, municipality, admin)
pnpm tsx test-all-roles.ts

# Check user details
pnpm tsx check-user.ts

# Check registration requests
pnpm tsx check-registrations.ts

# Get Firebase ID token for testing
pnpm tsx get-test-token.ts <user-uid>
```

### Utilities

```bash
# Fix municipality geographic boundaries
pnpm tsx fix-municipality-bounds.ts
```

## 🚀 Production Deployment

The platform can be deployed using systemd services and nginx. Sample configuration files are provided in `deploy/`:

### systemd Services

- `lemma-web.service` - Next.js frontend
- `lemma-api.service` - Express.js API
- `lemma-ml.service` - Python ML service

### nginx Configuration

- `lemma-nginx.conf` - Reverse proxy configuration

### Deployment Steps

1. Build the applications:

   ```bash
   pnpm build
   ```

2. Copy systemd service files to `/etc/systemd/system/`

3. Configure nginx with the provided conf file

4. Enable and start services:

   ```bash
   sudo systemctl enable lemma-web lemma-api lemma-ml
   sudo systemctl start lemma-web lemma-api lemma-ml
   ```

5. Configure environment variables in service files or use `.env` files

**Alternative**: Use PM2 for Node.js process management instead of systemd.

## 🗺️ Roadmap

### Completed ✅

- [x] ML-based image classification with TensorFlow
- [x] AI description generation with Gemini
- [x] Admin dashboard with full management
- [x] Municipality registration workflow
- [x] Interactive map with issue clustering
- [x] Anonymous issue reporting
- [x] Multi-photo upload with Cloudinary
- [x] Real-time leaderboard and scoring
- [x] Role-based access control

### In Progress 🚧

- [ ] Real-time notifications (Firebase Cloud Messaging)
- [ ] Enhanced verification system with citizen feedback
- [ ] Rate limiting on API endpoints

### Planned 📋

- [ ] Mobile app (React Native or Flutter)
- [ ] SMS/WhatsApp reporting integration
- [ ] Integration with government APIs (NDSAP, MyGov)
- [ ] Multi-language support (Hindi, Tamil, Telugu, Bengali, etc.)
- [ ] Advanced analytics dashboard
- [ ] Citizen engagement features (voting, comments)
- [ ] Municipality performance reports (PDF export)
- [ ] Public API for third-party integrations

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear commit messages
4. **Run tests**: `pnpm typecheck && pnpm lint`
5. **Push to your branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use existing component patterns (shadcn/ui)
- Add validation schemas for new API endpoints
- Update README for new features
- Test on both desktop and mobile viewports

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for **GDG TechSprint hackathon** with the goal of improving civic governance in India
- Inspired by platforms like SeeClickFix and FixMyStreet
- Thanks to the open-source community for the amazing tools and libraries

## 👥 Team

**Project Name**: CivicLemma (formerly Nagarik Seva)  
**Repository**: [rnihesh/techsprint-gdg](https://github.com/rnihesh/techsprint-gdg)  
**Status**: Active Development

---

**Made with ❤️ for a better India**
