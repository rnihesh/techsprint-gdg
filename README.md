# CivicLemma

Civic Issue Reporting and Municipal Accountability Platform for India

## Project Structure

```
civiclemma/
├── client/                 # Next.js Frontend (Deploy to Vercel)
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities and configurations
│   ├── public/            # Static assets
│   ├── .env               # Frontend environment variables
│   └── package.json
│
├── server/                 # Express.js Backend (Deploy to Render)
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── shared/        # Shared types, utils, validation
│   ├── .env               # Backend environment variables
│   └── package.json
│
├── ml/                     # FastAPI ML Service (Deploy to Render)
│   ├── main.py            # FastAPI application
│   ├── models/            # ML model files
│   ├── requirements.txt
│   ├── .env               # ML environment variables
│   └── .venv/             # Python virtual environment
│
└── package.json            # Root package.json with dev scripts
```

## Environment Variables

### Client (`client/.env`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
NEXT_PUBLIC_APP_NAME=CivicLemma
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Server (`server/.env`)
```env
PORT=3001
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
CORS_ORIGIN=http://localhost:3000
GOOGLE_MAPS_API_KEY=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### ML Service (`ml/.env`)
```env
GEMINI_API_KEY=xxx
```

## Local Development

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.9
- Firebase Project with Firestore and Authentication
- Google Maps API Key
- Cloudinary Account

### Setup

```bash
# 1. Install Node.js dependencies
npm run install:all

# 2. Setup Python virtual environment for ML
npm run install:ml

# 3. Download Firebase service account key
# Go to Firebase Console > Project Settings > Service Accounts
# Generate new private key and save as server/serviceAccountKey.json

# 4. Create .env files (copy from .env.example and fill values)

# 5. Run all services
npm run dev
```

Services will run on:
- **Client**: http://localhost:3000
- **Server**: http://localhost:3001
- **ML**: http://localhost:8000

## Deployment

### Client → Vercel
1. Connect repository to Vercel
2. **Root Directory**: `client`
3. **Framework**: Next.js (auto-detected)
4. **Environment Variables**: Add all `NEXT_PUBLIC_*` vars
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL
   - Set `NEXT_PUBLIC_ML_API_URL` to your Render ML service URL

### Server → Render (Web Service)
1. Create new **Web Service**
2. **Root Directory**: `server`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**: Add all server vars
   - `FIREBASE_SERVICE_ACCOUNT_KEY` = paste entire JSON content
   - `CORS_ORIGIN` = your Vercel frontend URL

### ML → Render (Web Service)
1. Create new **Web Service**
2. **Root Directory**: `ml`
3. **Environment**: Python 3
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**: `GEMINI_API_KEY`

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/issues` - List issues
- `POST /api/issues` - Create issue
- `GET /api/municipalities` - List municipalities
- `GET /api/municipalities/leaderboard` - Leaderboard

### Protected (Auth Required)
- `POST /api/issues/:id/respond` - Municipality response
- `POST /api/upload/signature` - Get Cloudinary signature
- `GET /api/admin/*` - Admin endpoints

### ML Service
- `GET /health` - Health check
- `POST /classify` - Classify image
- `POST /generate-description` - AI description

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS 4, Radix UI
- **Backend**: Express.js, TypeScript, Firebase Admin SDK
- **ML**: FastAPI, TensorFlow/Keras, Google Gemini
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth
- **Storage**: Cloudinary
- **Maps**: Google Maps API
