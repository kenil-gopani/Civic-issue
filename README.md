# 🔍 CivicLens

## AI-Powered Civic Issue Detection Platform

> Transform scattered civic complaints into actionable insights using Google AI

![CivicLens](https://img.shields.io/badge/Hackathon-Google%20AI-blue)
![Status](https://img.shields.io/badge/Status-MVP%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Problem Statement

Local civic and campus complaints are **scattered, unstructured, and difficult to analyze**. Authorities and administrators react late because they lack:
- Real-time insights
- Trend detection
- Issue prioritization
- Geographic visualization

## 💡 Solution

**CivicLens** is a web platform that uses **Google AI** to:
- ✅ Analyze civic complaints instantly
- ✅ Classify issues by category
- ✅ Detect sentiment and urgency
- ✅ Visualize hotspots on an interactive map
- ✅ Generate actionable recommendations

---

## 🛠️ Google Technologies Used

| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | AI-powered text analysis, categorization, sentiment detection |
| **Google Maps JavaScript API** | Issue location visualization and geocoding |
| **Firebase Hosting** | Production deployment with global CDN |
| **Firestore** | Optional complaint data persistence |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for local development)
- Google Cloud account (for API keys)
- Firebase CLI (for deployment)

### 1. Clone & Setup

```bash
cd d:\EDU\civic
```

### 2. Configure API Keys

Edit `public/js/config.js`:

```javascript
const CONFIG = {
    GEMINI_API_KEY: 'your-gemini-api-key',      // Get from: https://makersuite.google.com/app/apikey
    MAPS_API_KEY: 'your-google-maps-api-key',   // Get from: https://console.cloud.google.com/
    DEMO_MODE: false,  // Set to true for demo without APIs
};
```

Update the Maps API key in `public/index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&callback=initMap"></script>
```

### 3. Run Locally

```bash
npx serve public -l 3000
```

Open: http://localhost:3000

### 4. Deploy to Firebase

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Update .firebaserc with your project ID
# Then deploy
firebase deploy
```

---

## 📁 Project Structure

```
civic/
├── public/
│   ├── index.html          # Main HTML page
│   ├── css/
│   │   └── styles.css      # Modern dark theme styles
│   ├── js/
│   │   ├── config.js       # API configuration
│   │   ├── gemini.js       # Gemini API integration
│   │   ├── maps.js         # Google Maps integration
│   │   └── app.js          # Main application logic
│   └── assets/
│       └── logo.svg        # Brand logo
├── firebase.json           # Firebase Hosting config
├── .firebaserc             # Firebase project config
├── firestore.rules         # Firestore security rules
├── package.json            # Project metadata
└── README.md               # This file
```

---

## 🎯 Demo Flow

1. **Open Website** → Beautiful landing page explains the problem
2. **Enter Complaint** → Type or use sample complaints
3. **Click "Analyze"** → AI processes in real-time
4. **View Results** → Category, sentiment, urgency, summary
5. **See on Map** → Issue location appears on interactive map
6. **Read Insights** → Actionable recommendations provided

---

## 🔑 Getting API Keys

### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy and add to `config.js`

### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create credentials → API Key
5. Copy and add to `config.js` and `index.html`

---

## ⚡ Features

### AI Analysis (Gemini)
- **Category Detection**: Infrastructure, Safety, Sanitation, Utilities, etc.
- **Sentiment Analysis**: Positive, Neutral, Negative
- **Urgency Assessment**: Low, Medium, High, Critical
- **Smart Summary**: Concise issue description
- **Recommendations**: Actionable next steps

### Map Visualization (Google Maps)
- Dark theme matching UI
- Color-coded urgency markers
- Category filtering
- Interactive info windows
- Graceful fallback mode

### Demo Mode
Set `DEMO_MODE: true` in config to:
- Run without API keys
- Use smart mock responses
- Perfect for presentations

---

## 📱 Responsive Design

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (< 768px)

---

## 🏆 Hackathon Submission

This project was built for the **Google AI Hackathon** demonstrating practical use of:
- Google Gemini for intelligent text analysis
- Google Maps for geographic visualization
- Firebase for production hosting
- Modern web development best practices

---

## 📄 License

MIT License - Feel free to use and modify for your own projects.

---

## 🙏 Acknowledgments

- Google AI for Gemini API
- Google Cloud for Maps API
- Firebase for hosting infrastructure

---

**Built with ❤️ for smarter cities**
