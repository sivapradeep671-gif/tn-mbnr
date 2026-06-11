# 💎 TN-MBNR: TrustReg TN
### Enterprise-Grade Business Intelligence & Fraud Prevention

[![CI/CD Pipeline](https://github.com/sivapradeep671-gif/tn-mbnr/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/sivapradeep671-gif/tn-mbnr/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![AI-Powered](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)

**TN-MBNR (TrustReg TN)** is a high-fidelity, blockchain-enabled civic platform designed for the **Tamil Nadu Government**. It leverages Artificial Intelligence and Cryptographic Ledgers to prevent business fraud, protect small entrepreneurs, and provide citizens with a "Single Source of Truth" for commercial verification.

> [!NOTE]
> **PROJECT POSITIONING**: The system is a working innovation prototype with active frontend-backend integration, health checks, QR verification flows, dashboards, and role-based modules. Further government integration layers, operational rollout, and department onboarding can be executed in the next phase.

---

### 📚 Table of Contents
1. [🌟 Strategic Features](#-strategic-features)
2. [🎯 Project Readiness & Demo](#-project-readiness--demo)
3. [🏗️ System Architecture](#️-system-architecture)
4. [🚀 Quick Start](#-quick-start)
5. [📖 User Guides](#-user-guides)
6. [🔌 API Documentation](#-api-documentation)
7. [📊 Fraud Detection](#-fraud-detection-features)
8. [🔐 Security & Compliance](#-security-features)
9. [🗺️ Project Roadmap](#️-roadmap)

---

## 🌟 Strategic Features

### 🏢 Municipal Logic
- **Advanced Registration**: GPS-verified business onboarding with Gemini AI-powered risk scoring.
- **Verification Grid**: Multi-layered authenticity checks (GPS, Signature, Timestamp).

### 🚀 Enterprise Framework (Phase 3-5 Completed)
1.  **Phase 3: AI Intelligence**: Integrated Gemini 2.0 Flash for automated fraud triage and legal compliance.
2.  **Phase 4: Communication & GIS**: SMS/Email Node Hub (Twilio/SendGrid) and real-time GIS spatial tracking.
3.  **Phase 5: Cognitive Compliance**: Voice-activated nodal audits and AI Strategic Command Hub.
4.  **Blockchain Integration**: SHA-256 HMAC-signed ledger with geofence-enforcement (200m).
5.  **SaaS Multi-Tenancy**: Built-in support for multiple municipal nodes (GCC, Madurai, Coimbatore) with a unified Marketplace for governance modules.

## 📡 Communications Grid (New)
The platform now features a dedicated **Communications Node Hub** within the Dashboard.
- **SMS Node**: Integrated with Twilio for real-time merchant alerts.
- **Email Node**: Integrated with SendGrid for monthly integrity reports.
- **Mock Mode**: Automatically enabled if `MOCK_SID` or `MOCK_KEY` are detected in `.env`.
- **Dynamic QR Network**: Signed HMAC tokens with 30-second sliding windows and 200m geofencing.

### ⛓️ Governance & AI
- **Immutable Ledger**: Proof-of-Work blockchain trail recording every commercial entry.
- **AI Triage**: Automated severity classification of citizen fraud reports using **Gemini 2.0 Flash**.

### 🎙️ Multimodal Orchestration
-   **Voice-First Audits**: Hands-free municipal inspections via speech recognition (English/Tamil).
-   **Auditory Feedback**: Regional text-to-speech system for audit confirmations.
-   **AI Strategic Advisor**: Predictive analytical dashboard for nodal growth and risk prevention.

### 🎨 Premium Architectural Design
-   **Glassmorphism Pro**: High-fidelity professional aesthetic using global design tokens.
-   **Kinetic UI**: Micro-animations and staggered entry effects for a world-class e-governance experience.

---

## 🎯 Project Readiness & Demo

### Live Demo Path (Reviewer Guide)
To verify the end-to-end frontend-backend integration, follow this live demonstration path:
1. **Register Business**: Fill out the registration form. The backend securely stores the data and issues a unique Shop ID.
2. **Dashboard Access**: Login as the merchant to view the issued **Static QR Code** and explicit server-side **License Status**.
3. **Scan QR (Citizen Flow)**: Scan the QR code using the built-in scanner.
4. **Verification Result**: View the real-time API call fetching the dynamic license state (Active/Grace/Expired) directly from the backend, along with exact validation timestamps.
5. **Dashboard Updates**: View the Admin Analytics or Dashboard to see the scan events synchronized in real-time.

**Fully Working (Production Validated Modules):**
- **V1 SQLite Production Engine**: Full deterministic state machine strictly running on the backend with automated boundaries (ACTIVE, GRACE, PENDING_PAYMENT, EXPIRED).
- Frontend-Backend Integration & API routing (`/api/v1/license`)
- Dynamic Role-Based Authentication & Workflows (Admin, Inspector, Merchant)
- QR Verification Logic (Static QR scanning dynamically fetching backend state)
- **Municipal Payments Pipeline:** Integrated with the Merchant Dashboard, allowing instant payment simulation that clears the `PENDING_PAYMENT` state on the backend.
- **Verification Logs & Inspector Dashboard:** Real-time API feeding geo-fenced logs to inspectors to identify counterfeits.

**Partially Integrated (Next-Phase Department Rollouts):**
- **State-wide Geographic Scaling:** The architecture is scalable, but production DB clusters will require government infrastructure provisioning.
- **On-chain Immutable Ledger:** The proof-of-work blockchain trail currently runs on a simulated node rather than a distributed municipal network.

> **Proof Preparation:** Screenshots and recorded videos of backend-connected flows (auth, health checks, verification state changes, and the new payments pipeline) are prepared and available for official audits.

---

## 📸 Screenshots

> **Note:** See [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md) for instructions on capturing these screenshots.

### Home Page
![Home Page](screenshots/01-home-page.png)

### Business Registration
![Business Registration](screenshots/02-business-registration.png)

### QR Code Display
![QR Code Display](screenshots/03-qr-code-display.png)

### QR Scanner (Citizen View)
![QR Scanner](screenshots/04-qr-scanner.png)

### Verified Scan Result
![Verified Scan](screenshots/05-verified-scan.png)

### Admin Dashboard
![Admin Dashboard](screenshots/06-admin-dashboard.png)

### Fraud Detection Map
![Fraud Map](screenshots/07-fraud-map.png)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Modern web browser with geolocation support

### Installation

```bash
# Clone the repository
git clone https://github.com/sivapradeep671-gif/TN-MBNR.git
cd tn-mbnr

# Install dependencies
npm install

# Install map dependencies
npm install leaflet react-leaflet @types/leaflet
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Gemini API Key for AI verification
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# QR Token Secret (use a strong random string)
QR_SECRET_KEY=your_secret_key_here

# Server Port
PORT=3001
```

### Running the Application

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Server runs on http://localhost:3001

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
Frontend runs on http://localhost:5173

---

## 📖 User Guides

### For Business Owners

1. **Register Your Business**
   - Navigate to "Register Business"
   - Fill in business details
   - Allow GPS location access
   - Submit and receive Shop ID

2. **Generate QR Code**
   - Login to Dashboard
   - Click "Generate QR"
   - Download or display QR at your shop
   - QR expires every 30 seconds (auto-refreshes)

3. **View Verification Status**
   - Check scan statistics
   - View verification history
   - Download trust certificate

### For Citizens

1. **Verify a Business**
   - Navigate to "Scan QR"
   - Allow camera and location access
   - Point camera at business QR code
   - View verification result:
     - ✅ **VERIFIED** - Legitimate business
     - 🚨 **COUNTERFEIT** - Fraudulent QR
     - ⏳ **EXPIRED** - Outdated QR
     - 📍 **LOCATION MISMATCH** - Wrong location

2. **Report Fraud**
   - Click "Report" on suspicious results
   - Provide details
   - Submit to municipal authorities

### For Municipal Officials (Admin)

1. **Login as Admin**
   - Use admin credentials
   - Access admin dashboard

2. **Review Pending Registrations**
   - View business details
   - Verify documents
   - Approve or reject applications

3. **Monitor Fraud Activity**
   - **Fraud Detection Map**
     - Green markers = Registered businesses
     - Red markers = Suspicious scans
     - Filter by type (All/Shops/Suspicious)
   
   - **Suspicious Scan Activity**
     - View recent fraud attempts
     - See distance from registered location
     - Investigate suspicious patterns
   
   - **Top Risky Shops**
     - Identify businesses with high fraud rates
     - View risk scores and failed scan counts

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Leaflet (maps)
- html5-qrcode (QR scanning)

**Backend:**
- Node.js + Express
- SQLite (database)
- Google Gemini AI (verification)
- Crypto-JS (token signing)

### 🗺️ System Architecture

```mermaid
graph TD
    Citizen[Citizen / Consumer] -->|Scan QR| App[TrustReg PWA]
    App -->|Verify HMAC| API[Node.js API Gateway]
    API -->|Risk Cache| DB[(SQLite / Spatial DB)]
    API -->|Audit Trail| BC[Blockchain Ledger]
    API -->|Risk Analysis| AI[Gemini 2.0 AI]
    
    Merchant[Business Owner] -->|Register| API
    Officer[Municipal Officer] -->|Review/Approve| API
    API -->|Issue License| Merchant
```

**Blockchain:**
- Custom blockchain implementation
- SHA-256 hashing
- Proof-of-work consensus
- **Simulation Note:** The ledger is persisted in SQLite for academic demonstration of immutable audit trails.

### Database Schema

#### `businesses` Table
```sql
CREATE TABLE businesses (
    id TEXT PRIMARY KEY,
    legalName TEXT,
    tradeName TEXT,
    type TEXT,
    category TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT,
    gstNumber TEXT,
    registrationDate TEXT
);
```

#### `scans` Table (Fraud Detection)
```sql
CREATE TABLE scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id TEXT,
    token TEXT,
    scan_lat REAL,
    scan_lng REAL,
    result TEXT,  -- VALID, COUNTERFEIT, EXPIRED, LOCATION_MISMATCH
    distance REAL,
    scanned_at TEXT,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```

#### `ledger` Table (Blockchain)
```sql
CREATE TABLE ledger (
    index_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    data TEXT,
    previousHash TEXT,
    hash TEXT,
    nonce INTEGER
);
```

---

## 🔌 API Documentation

### Business Registration
```http
POST /api/businesses
Content-Type: application/json

{
  "legalName": "KPN Travels India Pvt Ltd",
  "tradeName": "KPN Travels",
  "type": "Private Limited",
  "category": "Transportation",
  "address": "12, Omni Bus Stand, Koyambedu, Chennai",
  "latitude": 13.0694,
  "longitude": 80.1914,
  "gstNumber": "33AABCK1234F1Z5"
}
```

### QR Token Generation
```http
GET /api/qr-token/:businessId
```

**Response:**
```json
{
  "token": "eyJwYXlsb2FkIjp7ImlkIjoiS1BO...",
  "expiresAt": 1707598845000
}
```

### QR Verification
```http
POST /api/verify-scan
Content-Type: application/json

{
  "token": "eyJwYXlsb2FkIjp7ImlkIjoiS1BO...",
  "scannerLocation": {
    "lat": 13.0694,
    "lng": 80.1914
  }
}
```

### Admin APIs

#### Get All Shops with Statistics
```http
GET /api/admin/shops
```

**Response:**
```json
{
  "message": "success",
  "total": 10,
  "shops": [
    {
      "id": "KPN-TVL-001",
      "name": "KPN Travels",
      "total_scans": 156,
      "verified_scans": 150,
      "failed_scans": 6,
      "lat": 13.0694,
      "lng": 80.1914
    }
  ]
}
```

#### Get Suspicious Scans
```http
GET /api/admin/suspicious
```

**Response:**
```json
{
  "message": "success",
  "total_suspicious": 23,
  "scans": [...],
  "top_risky_shops": [
    {
      "shop_name": "KPN Travels",
      "failed_scans": 15,
      "risk_score": 85.5
    }
  ]
}
```

---

## 🧪 Testing

### Manual Testing

See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for comprehensive testing instructions.

**Quick Test:**
1. Open http://localhost:3001/api/admin/shops (verify backend)
2. Open http://localhost:5173 (verify frontend)
3. Login as admin and check fraud detection map

### 90-Second Demo Flow

| Time | Action | Expected Result |
|------|--------|----------------|
| 0:00-0:15 | Register business | Shop ID received |
| 0:15-0:30 | Generate QR | Dynamic QR displayed |
| 0:30-0:50 | Scan at shop | ✅ VERIFIED |
| 0:50-1:10 | Scan 2km away | 🚨 LOCATION_MISMATCH |
| 1:10-1:30 | Admin dashboard | Red pin on map, fraud alert |

---

## 📊 Fraud Detection Features

### Interactive Map
- **Green Markers:** Registered businesses with scan statistics
- **Red Markers:** Suspicious scan locations
- **Filters:** Toggle between All/Shops/Suspicious views
- **Popups:** Click markers for detailed information

### Suspicious Scan Tracking
- Real-time fraud alerts
- Color-coded by severity:
  - 🔴 COUNTERFEIT (invalid signature)
  - 🟠 LOCATION_MISMATCH (>200m away)
  - 🟡 EXPIRED (past expiration time)
- Distance calculations
- Timestamp tracking

### Risk Analytics
- Top 10 risky shops ranking
- Risk score calculation: `(failed_scans / total_scans) * 100`
- Failed scan breakdown (location mismatches, counterfeit attempts)

---

## 🔐 Security Features

### QR Token Security
```javascript
// Token structure
{
  payload: {
    id: "SHOP-ID",
    lat: 13.0694,
    lng: 80.1914,
    exp: 1707598845000  // 30-second expiry
  },
  signature: "HMAC-SHA256-SIGNATURE"
}
```

### Geofencing
- 200m radius verification
- Haversine distance calculation
- GPS coordinate validation

### Blockchain Audit Trail
- Immutable verification records
- SHA-256 block hashing
- Proof-of-work consensus

---

## 📁 Project Structure

```
TN-MBNR/
├── server/
│   ├── index.cjs           # Express server
│   ├── database.cjs        # SQLite setup
│   ├── blockchain.cjs      # Blockchain logic
│   └── schema.sql          # Database schema
├── src/
│   ├── components/
│   │   ├── AdminMap.tsx    # Fraud detection map
│   │   ├── Dashboard.tsx   # Admin/Citizen/Business dashboards
│   │   ├── QRScanner.tsx   # QR verification
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── LanguageContext.tsx
│   └── types/
│       └── types.ts
├── public/
├── .env                    # Environment variables
├── package.json
└── README.md
```

---

## 🎨 Screenshots

### Admin Dashboard
![Admin Dashboard](./screenshots/admin-dashboard.png)

### Fraud Detection Map
![Fraud Map](./screenshots/fraud-map.png)

### QR Verification
![QR Scan](./screenshots/qr-verification.png)

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅ (Completed)
- [x] Business registration with GPS
- [x] Dynamic QR generation
- [x] Citizen verification
- [x] Admin dashboard
- [x] Fraud detection map
- [x] Blockchain audit trail
- [x] **CI/CD Pipeline** (GitHub Actions)
- [x] **Test Coverage** (39 tests, 680% increase)
- [x] **Logout Functionality**

### Phase 2: Enhancements ✅ (Completed)
- [x] SMS/Email alerts (Twilio/SendGrid)
- [x] Tamil language support (தமிழ் மொழி)
- [x] Enhanced analytics dashboard

### Phase 3: AI Intelligence ✅ (Completed)
- [x] Gemini 2.0 Flash integration
- [x] Automated fraud triage & classification
- [x] Advanced logo & brand verification

### Phase 4: Monitoring & GIS ✅ (Completed)
- [x] Real-time GIS Spatial Intelligence
- [x] Dynamic "Grid Watch" telemetry pulses
- [x] PWA offline-first synchronization

### Phase 5: Cognitive Compliance ✅ (Completed)
- [x] Voice-activated nodal audits
- [x] AI Strategic Advisor & Tactical Hub
- [x] Regional Auditory System (TTS)

### Phase 6: Production Scale ✅ (Completed)
- [x] Render Cloud Deployment
- [x] SaaS Multi-Tenant Architecture
- [x] Governance Service Marketplace
- [x] Tiered Pricing & Compliance Hub

### Phase 7: Regional Growth (Current)
- [ ] PostgreSQL migration for high-load nodes
- [ ] Redis caching for regional grid clusters
- [ ] Integrated Citizen Reward Tokenomics

---

## 📚 Documentation

- **[SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)** - How to capture app screenshots
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - GitHub deployment instructions
- **[PHASE2_IMPLEMENTATION_PLAN.md](PHASE2_IMPLEMENTATION_PLAN.md)** - Detailed Phase 2 roadmap
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures and coverage
- **[WORKFLOW_TESTING.md](WORKFLOW_TESTING.md)** - Manual testing guide
- **[CICD_AND_TESTING_SUMMARY.md](CICD_AND_TESTING_SUMMARY.md)** - CI/CD setup summary

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Developed for:** Tamil Nadu Government  
**Purpose:** Municipal business verification and fraud prevention  
**Contact:** admin@tn-mbnr@gmail.com

---

## 🙏 Acknowledgments

- Tamil Nadu E-Governance Agency (TNeGA)
- Municipal Corporations of Tamil Nadu
- Google Gemini AI for verification support
- OpenStreetMap for mapping tiles

---

## 📞 Support

For issues and questions:
- **Email:** support@tn-mbnr@gmail.com
- **GitHub Issues:** [Create an issue](https://github.com/sivapradeep671-gif/tn-mbnr/issues)
- **Documentation:** See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)

---

**Built with ❤️ for Tamil Nadu**
