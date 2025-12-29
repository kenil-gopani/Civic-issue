/**
 * CivicLens Configuration
 * Replace placeholder values with your actual API keys
 */

const CONFIG = {
    // Google Gemini API Configuration
    GEMINI_API_KEY: 'AIzaSyB77ebAnrPtpbcgew5ah0xG8Jd9-29GXPE',
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',

    // Google Maps API Configuration  
    MAPS_API_KEY: 'YOUR_GOOGLE_MAPS_API_KEY', // Get from: https://console.cloud.google.com/

    // Demo Mode - Set to true to use mock data instead of real APIs
    DEMO_MODE: true,

    // Disable cooldown for testing (set to true to disable 1-hour wait)
    DISABLE_COOLDOWN: true,

    // Default map center (India view)
    DEFAULT_LOCATION: {
        lat: 20.5937,  // Center of India
        lng: 78.9629
    },

    // Default zoom level (5 = entire India view)
    DEFAULT_ZOOM: 5,

    // Sample complaints for demo
    SAMPLE_COMPLAINTS: {
        pothole: "There's a massive pothole on MG Road near the central market that has been causing accidents. Multiple vehicles have been damaged and it's getting worse with the rain.",
        streetlight: "The streetlight outside Block C of the university campus has been out for two weeks now. The area is completely dark at night and students feel unsafe walking there.",
        garbage: "Garbage has been piling up at the corner of Park Street and 5th Avenue for over a week. The smell is unbearable and it's attracting stray animals.",
        noise: "Construction work at the new building site continues well past 10 PM every night, violating noise regulations and disturbing residents in the area."
    },

    // Firebase Configuration
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyDVKhzZ23XuxVjYE6UKv9KvbcHtY3XZUI4",
        authDomain: "civic-cf6bf.firebaseapp.com",
        projectId: "civic-cf6bf",
        storageBucket: "civic-cf6bf.firebasestorage.app",
        messagingSenderId: "951822119584",
        appId: "1:951822119584:web:840f96b5f87a4f7bef4fc5",
        measurementId: "G-NSJTHQ6Q96"
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.DEFAULT_LOCATION);
Object.freeze(CONFIG.SAMPLE_COMPLAINTS);
