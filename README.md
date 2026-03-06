# 🚨 Nagar Alert System (Team SYNC)
> **Revolutionizing Civic Issue Reporting with AI-Powered WhatsApp Bot & Real-Time Dashboard**

![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Firebase%20%2B%20AI-blue)

##  Problem Statement
City infrastructures suffer because reporting issues (potholes, garbage, waterlogging) is tedious. Citizens don't want to install another app. **Nagar Alert** solves this by letting anyone report issues via **WhatsApp**, powered by AI for verification and classification.

---

##  Key Features (Why We Win)

###  1. WhatsApp-Based Reporting (No App Needed!)
*   **Text/Photo/Video/Audio:** Citizens just send a message.
*   **AI Auto-Verification:** Gemini 2.0 Flash instantly verifies if the image is real or fake.
*   **Location extraction:** AI extracts location from text or reads GPS tags.
*   **Bot Persona:** "Rahul" - A friendly, Hinglish-speaking civic volunteer bot.

###  2. Event Detection & Classification
*   **Multi-Modal AI:** Analyzes text, images, and audio to categorize issues (e.g., "Pothole", "Garbage", "Safety").
*   **Complexity Assessment:** AI assigns priority (High/Medium/Low) automatically.

###  3. Real-Time Admin Dashboard
*   **Live Incident Map:** See reports pop up instantly on an interactive map.
*   **Department Filtering:** Sanitation, Roads, Electricity, etc.
*   **Analytics:** Line graphs and charts showing weekly activity and reporting hotspots.

###  4. Smart Broadcasting
*   **Multi-Channel Alerts:** Automatically sends warnings via **WhatsApp & Email** to citizens in affected areas.
*   **Targeted Reach:** Only alerts people in the specific radius of the incident.

---

##  Tech Stack

| Component | Technology | Used For |
|-----------|------------|----------|
| **Frontend** | React, Vite, Tailwind CSS | Responsive User/Admin Dashboards |
| **Backend** | Node.js, Express.js | API, Webhooks, Business Logic |
| **Database** | Firebase Realtime DB | Instant data syncing across apps |
| **AI Engine** | Google Gemini 2.0 Flash | Image analysis, text summarization, chat |
| **Messaging** | Whapi.cloud / Meta API | WhatsApp Bot & Broadcasting |
| **Deployment** | Vercel (FE) + Render (BE) | Live Production Hosting |


##  How to Run Locally

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:5001
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 3. Environment Variables (.env)
Create a `.env` file in both `frontend` and `backend` using the provided `.env.sample`.

---

##  Bonus Features Implemented (6/6)
- [x] WhatsApp-Based Data Intake
- [x] Event Detection & Classification
- [x] Geo-Tagging & Location Mapping
- [x] Duplicate & Noise Filtering (Basic)
- [x] AI Alert Summarization
- [x] WhatsApp Alert Broadcasting

---





