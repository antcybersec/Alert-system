# 🏙️ Nagar Alert Hub (SYNC)

**Nagar Alert Hub** is a Next-Gen Civic Issue Reporting Platform designed to bridge the gap between citizens and municipal authorities. It leverages **Artificial Intelligence** to verify reports and provides a seamless experience via **WhatsApp** and a **Web Dashboard**.

---

## 🚀 Key Features

*   **🤖 AI Forensic Analysis**: automatically analyzes uploaded images using **Google Vertex AI (Gemini 1.5 Flash)** to detect:
    *   Deepfakes or AI-generated images.
    *   Screenshots or non-civic content.
    *   Severity of the issue (High/Medium/Low).
*   **💬 WhatsApp Bot Integration**: Citizens can simply send a photo to the official number to report a pothole, garbage dump, or broken streetlight. The bot handles location collection and status updates.
*   **📊 Admin Command Center**: A real-time dashboard for authorities to view incoming tickets, visualize them on a **Live Map**, and dispatch teams.
*   **📍 Geo-Tagging**: Precise location tracking for every report.
*   **🎮 Gamification**: Citizens earn "Karma Points" for every verified report, encouraging active participation.
*   **🔔 Instant Feedback**: Automated WhatsApp/SMS notifications when a report is Accepted, Rejected, or Resolved.

---

## 🛠️ Tech Stack

### **Frontend**
*   **Framework**: React.js (Vite)
*   **Styling**: CSS Modules / Tailwind (if applicable)
*   **Maps**: Leaflet / Google Maps API
*   **Auth**: Firebase Authentication (Phone/Email)

### **Backend**
*   **Runtime**: Node.js & Express.js
*   **AI Engine**: Google Cloud Vertex AI (Gemini 1.5 Flash)
*   **Database**: Firebase Realtime Database
*   **WhatsApp API**: Whapi.cloud (Gateway)
*   **Notifications**: Twilio (SMS), Nodemailer (Email)

---

## ⚙️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Firebase Project (Realtime DB enabled)
*   Google Cloud Project (Vertex AI API enabled)
*   Whapi.cloud Account (for WhatsApp)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/SYNC_Nagar_Alert_Hub.git
cd SYNC_Nagar_Alert_Hub
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `backend/` directory:
```ini
PORT=5000
FIREBASE_DB_URL=https://your-project.firebaseio.com
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
WHAPI_TOKEN=your_whapi_token
WHAPI_INSTANCE_URL=https://gate.whapi.cloud
ADMIN_NUMBER=919999999999
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```
*Note: Place your Google Cloud Service Account JSON file inside the `backend/` folder.*

**Start the Server:**
```bash
node server.js
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `frontend/` directory:
```ini
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DB_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

**Run the App:**
```bash
npm run dev
```

---

## 📱 WhatsApp Bot Usage
1.  Save the Bot's number (connected via Whapi).
2.  Send **"Start"** or just **send an image** of a civic issue.
3.  The **AI** will analyze the image instantly.
    *   ❌ **Fake/Screen**: Rejected immediately.
    *   ✅ **Real**: You will be asked to share the location.
4.  Once location is shared, a **Ticket** is created and visible on the Admin Dashboard.

---

## 📂 Project Structure
```
SYNC_Nagar_Alert_Hub/
├── backend/            # Express Server & API Routes
│   ├── controllers/    # Logic for WhatsApp, Reports, Auth
│   ├── services/       # AI Service (Gemini), Firebase Service
│   └── routes/         # API Endpoints
├── frontend/           # React Client
│   ├── src/
│   │   ├── pages/      # Civic & Admin Pages
│   │   ├── components/ # Reusable UI Components
│   │   └── context/    # Auth & State Management
└── README.md           # Documentation
```

---

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes.
4.  Push to the branch and open a Pull Request.

---

Developed for **Nagar Alert Hub** 🚀
