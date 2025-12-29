/**
 * CivicLens - Firebase Database Integration
 * Stores and retrieves complaints from Firestore
 */

class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.init();
    }

    /**
     * Initialize Firebase
     */
    init() {
        // Check if Firebase config exists in CONFIG
        if (!CONFIG.FIREBASE_CONFIG || !CONFIG.FIREBASE_CONFIG.projectId || CONFIG.FIREBASE_CONFIG.projectId === 'your-firebase-project-id') {
            console.log('Firebase not configured. Using local storage only.');
            return;
        }

        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(CONFIG.FIREBASE_CONFIG);
            }

            this.db = firebase.firestore();
            this.isConnected = true;
            console.log('✅ Firebase connected successfully');

            // Load existing complaints
            this.loadComplaints();
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.isConnected = false;
        }
    }

    /**
     * Save a complaint to Firestore
     */
    async saveComplaint(analysis, complaint, location) {
        if (!this.isConnected) {
            console.log('Saving to local storage only (Firebase not connected)');
            return null;
        }

        try {
            const docRef = await this.db.collection('complaints').add({
                complaint: complaint,
                category: analysis.category,
                sentiment: analysis.sentiment,
                urgency: analysis.urgency,
                urgencyScore: analysis.urgencyScore,
                summary: analysis.summary,
                recommendations: analysis.recommendations,
                location: location || null,
                lat: window.app?.userLat || null,
                lng: window.app?.userLng || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: new Date().toISOString()
            });

            console.log('✅ Complaint saved to database:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Error saving complaint:', error);
            return null;
        }
    }

    /**
     * Load complaints from Firestore
     */
    async loadComplaints() {
        if (!this.isConnected) return [];

        try {
            const snapshot = await this.db.collection('complaints')
                .orderBy('timestamp', 'desc')
                .limit(50)
                .get();

            const complaints = [];
            snapshot.forEach(doc => {
                complaints.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`📊 Loaded ${complaints.length} complaints from database`);

            // Update analytics with database data
            this.syncAnalytics(complaints);

            // Update hero stats with real data
            this.updateHeroStats(complaints);

            return complaints;
        } catch (error) {
            console.error('Error loading complaints:', error);
            return [];
        }
    }

    /**
     * Update hero section stats with real data
     */
    updateHeroStats(complaints) {
        // Update total issues count with animation
        const issueCountEl = document.getElementById('heroIssueCount');
        if (issueCountEl) {
            const count = complaints.length;
            issueCountEl.dataset.count = count;
            this.animateNumber(issueCountEl, count);
        }

        // Count unique cities (based on unique lat/lng combinations rounded to 2 decimals)
        const uniqueCities = new Set();
        complaints.forEach(c => {
            if (c.lat && c.lng) {
                const cityKey = `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`;
                uniqueCities.add(cityKey);
            }
        });

        const cityCountEl = document.getElementById('heroCityCount');
        if (cityCountEl) {
            const cityCount = Math.max(1, uniqueCities.size);
            cityCountEl.dataset.count = cityCount;
            this.animateNumber(cityCountEl, cityCount);
        }
    }

    /**
     * Animate number from 0 to target
     */
    animateNumber(element, target) {
        // Ensure target is a valid number
        target = parseInt(target) || 0;

        if (target === 0) {
            element.textContent = '0';
            return;
        }

        let current = 0;
        const increment = Math.max(1, target / 30);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 30);
    }

    /**
     * Sync analytics with database data
     */
    syncAnalytics(complaints) {
        if (!window.analytics) return;

        // Reset analytics
        window.analytics.data = {
            issues: [],
            categories: {
                infrastructure: 0,
                safety: 0,
                sanitation: 0,
                utilities: 0,
                noise: 0,
                other: 0
            },
            urgencyCount: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        };

        // Rebuild from database
        complaints.forEach(c => {
            const categoryKey = window.analytics.normalizeCategory(c.category || 'other');
            const urgencyKey = (c.urgency || 'medium').toLowerCase();

            if (window.analytics.data.categories[categoryKey] !== undefined) {
                window.analytics.data.categories[categoryKey]++;
            } else {
                window.analytics.data.categories.other++;
            }

            if (window.analytics.data.urgencyCount[urgencyKey] !== undefined) {
                window.analytics.data.urgencyCount[urgencyKey]++;
            }

            window.analytics.data.issues.push({
                id: c.id,
                category: c.category,
                urgency: c.urgency,
                summary: c.summary?.substring(0, 100) || 'No summary',
                timestamp: c.createdAt || new Date().toISOString()
            });
        });

        // Limit issues list
        window.analytics.data.issues = window.analytics.data.issues.slice(0, 20);

        // Save to localStorage and update UI
        window.analytics.saveData();
        window.analytics.updateDashboard();

        // Add markers to map from database
        this.loadMarkersToMap(complaints);
    }

    /**
     * Load markers to map from database
     */
    loadMarkersToMap(complaints) {
        // Wait for map to be ready
        const checkMap = setInterval(() => {
            if (window.issueMap && window.issueMap.isInitialized) {
                clearInterval(checkMap);

                // Clear existing markers first (except sample ones)
                if (window.issueMap.markers) {
                    window.issueMap.markers = [];
                    if (window.issueMap.markerLayer) {
                        window.issueMap.markerLayer.clearLayers();
                    }
                }

                // Add markers from database
                complaints.forEach(c => {
                    if (c.lat && c.lng) {
                        window.issueMap.addMarker({
                            lat: c.lat,
                            lng: c.lng,
                            title: c.summary?.substring(0, 50) + '...' || 'Issue',
                            category: (c.category || 'other').toLowerCase(),
                            urgency: (c.urgency || 'medium').toLowerCase()
                        });
                    }
                });

                console.log(`🗺️ Loaded ${complaints.filter(c => c.lat && c.lng).length} markers to map`);
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkMap), 10000);
    }

    /**
     * Listen for real-time updates
     */
    listenForUpdates() {
        if (!this.isConnected) return;

        this.db.collection('complaints')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const complaints = [];
                snapshot.forEach(doc => {
                    complaints.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.syncAnalytics(complaints);
            });
    }

    /**
     * Delete all complaints (admin only)
     */
    async clearAll() {
        if (!this.isConnected) return;

        const batch = this.db.batch();
        const snapshot = await this.db.collection('complaints').get();

        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log('🗑️ All complaints deleted');

        // Reload
        this.loadComplaints();
    }
}

// Global instance
window.database = new Database();
