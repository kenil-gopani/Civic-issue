/**
 * CivicLens - Main Application
 * Orchestrates the civic issue detection platform
 */

class CivicLensApp {
    constructor() {
        this.gemini = new GeminiAnalyzer();
        this.form = document.getElementById('complaintForm');
        this.textarea = document.getElementById('complaintText');
        this.charCount = document.getElementById('charCount');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resultsPlaceholder = document.getElementById('resultsPlaceholder');
        this.resultsContent = document.getElementById('resultsContent');

        // GPS and Cooldown
        this.COOLDOWN_MS = 60 * 60 * 1000; // 1 hour in milliseconds
        this.userLat = null;
        this.userLng = null;
        this.cooldownTimer = null;

        this.init();
    }

    init() {
        this.setupFormHandler();
        this.setupCharCounter();
        this.setupSampleChips();
        this.setupNavigation();
        this.setupMapFilters();
        this.animateStats();
        this.initMapFallback();
        this.setupGpsDetection();
        this.checkCooldown();
    }

    /**
     * Setup form submission handler
     */
    setupFormHandler() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });
    }

    /**
     * Handle complaint submission
     */
    async handleSubmit() {
        const complaint = this.textarea.value.trim();
        const location = document.getElementById('locationInput')?.value || '';

        // Check cooldown first
        if (this.isOnCooldown()) {
            this.showError('Please wait for the cooldown to finish before submitting another complaint.');
            return;
        }

        // Require GPS location
        if (!this.userLat || !this.userLng) {
            this.showError('Please click the GPS button to detect your location first.');
            return;
        }

        if (!complaint) {
            this.showError('Please enter a complaint');
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            const startTime = Date.now();
            const analysis = await this.gemini.analyzeComplaint(complaint, location);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            this.displayResults(analysis, duration);

            // Add to map at USER'S GPS location
            if (window.issueMap && window.issueMap.isInitialized) {
                window.issueMap.addMarker({
                    lat: this.userLat,
                    lng: this.userLng,
                    title: analysis.summary.substring(0, 50) + '...',
                    category: analysis.category.toLowerCase(),
                    urgency: analysis.urgency
                });
                window.issueMap.map.panTo([this.userLat, this.userLng]);
            }

            // Track in analytics dashboard
            if (window.analytics) {
                window.analytics.trackIssue(analysis, complaint);
            }

            // Save to Firestore database
            if (window.database && window.database.isConnected) {
                window.database.saveComplaint(analysis, complaint, location);
            }

            // Start cooldown
            this.startCooldown();

            // Scroll to results
            this.resultsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analysis failed. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Display analysis results
     */
    displayResults(analysis, duration) {
        this.resultsPlaceholder.style.display = 'none';
        this.resultsContent.style.display = 'block';

        document.getElementById('resultCategory').textContent = analysis.category;

        const sentimentEl = document.getElementById('resultSentiment');
        sentimentEl.textContent = analysis.sentiment;
        sentimentEl.className = `sentiment-badge ${analysis.sentiment}`;

        const urgencyBar = document.getElementById('urgencyBar');
        const urgencyText = document.getElementById('resultUrgency');
        urgencyBar.style.setProperty('--urgency', `${analysis.urgencyScore}%`);
        urgencyText.textContent = analysis.urgency;

        const urgencyColors = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
        urgencyBar.style.background = `linear-gradient(90deg, ${urgencyColors[analysis.urgency] || '#3b82f6'}, transparent)`;

        document.getElementById('resultSummary').textContent = analysis.summary;

        const recList = document.getElementById('resultRecommendations');
        recList.innerHTML = analysis.recommendations.map(rec => `<li>${rec}</li>`).join('');

        document.getElementById('analysisTime').textContent = `Analyzed in ${duration}s`;
    }

    /**
     * Setup GPS detection
     */
    setupGpsDetection() {
        const gpsBtn = document.getElementById('detectGpsBtn');
        const locationInput = document.getElementById('locationInput');

        if (!gpsBtn) return;

        gpsBtn.addEventListener('click', () => {
            if (!navigator.geolocation) {
                this.showError('Geolocation is not supported by your browser');
                return;
            }

            gpsBtn.classList.add('loading');
            locationInput.value = 'Detecting precise location...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.userLat = position.coords.latitude;
                    this.userLng = position.coords.longitude;
                    const accuracy = position.coords.accuracy; // in meters

                    document.getElementById('userLat').value = this.userLat;
                    document.getElementById('userLng').value = this.userLng;

                    // Show 6 decimal places for higher precision (~0.1m accuracy)
                    locationInput.value = `📍 ${this.userLat.toFixed(6)}, ${this.userLng.toFixed(6)} (±${Math.round(accuracy)}m)`;
                    gpsBtn.classList.remove('loading');
                    gpsBtn.classList.add('success');

                    // Pan map to user location and add a marker
                    if (window.issueMap && window.issueMap.isInitialized) {
                        window.issueMap.map.setView([this.userLat, this.userLng], 16);

                        // Add a special marker for user's location
                        const userIcon = L.divIcon({
                            className: 'user-location-marker',
                            html: `<div style="
                                width: 20px; height: 20px;
                                background: #3b82f6;
                                border: 3px solid white;
                                border-radius: 50%;
                                box-shadow: 0 0 10px rgba(59,130,246,0.5);
                                animation: pulse 2s infinite;
                            "></div>`,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });
                        L.marker([this.userLat, this.userLng], { icon: userIcon })
                            .addTo(window.issueMap.map)
                            .bindPopup('📍 Your Location');
                    }
                },
                (error) => {
                    gpsBtn.classList.remove('loading');
                    locationInput.value = '';

                    const errors = {
                        1: 'Location permission denied. Please enable location access.',
                        2: 'Location unavailable. Please try again.',
                        3: 'Location request timed out. Please try again.'
                    };
                    this.showError(errors[error.code] || 'Could not get location');
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    }

    /**
     * Check if user is on cooldown
     */
    isOnCooldown() {
        // Disable cooldown for testing if config option is set
        if (CONFIG.DISABLE_COOLDOWN) return false;

        const lastSubmit = localStorage.getItem('civicLens_lastSubmit');
        if (!lastSubmit) return false;

        const elapsed = Date.now() - parseInt(lastSubmit);
        return elapsed < this.COOLDOWN_MS;
    }

    /**
     * Start the cooldown timer
     */
    startCooldown() {
        localStorage.setItem('civicLens_lastSubmit', Date.now().toString());
        this.updateCooldownUI();
    }

    /**
     * Check cooldown on page load
     */
    checkCooldown() {
        if (this.isOnCooldown()) {
            this.updateCooldownUI();
        }
    }

    /**
     * Update cooldown UI
     */
    updateCooldownUI() {
        const warning = document.getElementById('cooldownWarning');
        const timeEl = document.getElementById('cooldownTime');

        if (!warning || !timeEl) return;

        const updateTimer = () => {
            const lastSubmit = parseInt(localStorage.getItem('civicLens_lastSubmit') || '0');
            const remaining = this.COOLDOWN_MS - (Date.now() - lastSubmit);

            if (remaining <= 0) {
                warning.style.display = 'none';
                this.analyzeBtn.disabled = false;
                if (this.cooldownTimer) clearInterval(this.cooldownTimer);
                return;
            }

            warning.style.display = 'flex';
            this.analyzeBtn.disabled = true;

            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            timeEl.textContent = `${mins}m ${secs}s`;
        };

        updateTimer();
        this.cooldownTimer = setInterval(updateTimer, 1000);
    }

    /**
     * Setup character counter
     */
    setupCharCounter() {
        this.textarea.addEventListener('input', () => {
            const count = this.textarea.value.length;
            this.charCount.textContent = count;
            if (count > 500) {
                this.textarea.value = this.textarea.value.substring(0, 500);
                this.charCount.textContent = 500;
            }
        });
    }

    /**
     * Setup sample complaint chips
     */
    setupSampleChips() {
        document.querySelectorAll('.sample-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const sampleKey = chip.dataset.sample;
                if (CONFIG.SAMPLE_COMPLAINTS[sampleKey]) {
                    this.textarea.value = CONFIG.SAMPLE_COMPLAINTS[sampleKey];
                    this.charCount.textContent = this.textarea.value.length;
                    this.textarea.focus();
                }
            });
        });
    }

    /**
     * Setup navigation
     */
    setupNavigation() {
        const toggle = document.getElementById('navToggle');
        const menu = document.querySelector('.nav-menu');

        if (toggle && menu) {
            toggle.addEventListener('click', () => {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
            });
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (menu) menu.classList.remove('active');
                if (toggle) toggle.classList.remove('active');
            });
        });

        window.addEventListener('scroll', () => {
            const navbar = document.getElementById('navbar');
            navbar.style.background = window.scrollY > 50 ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.9)';
        });
    }

    /**
     * Setup map category filters
     */
    setupMapFilters() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (window.issueMap) window.issueMap.filterByCategory(btn.dataset.filter);
            });
        });
    }

    /**
     * Animate stat counters
     */
    animateStats() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    this.animateCount(target, parseInt(target.dataset.count));
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.stat-number').forEach(stat => observer.observe(stat));
    }

    animateCount(element, target) {
        // Ensure target is a valid number, default to 0
        target = parseInt(target) || 0;

        if (target === 0) {
            element.textContent = '0';
            return;
        }

        let current = 0;
        const increment = Math.max(1, target / 50);
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 30);
    }

    /**
     * Initialize map fallback if Leaflet not loaded
     */
    initMapFallback() {
        setTimeout(() => {
            if (!window.issueMap?.isInitialized) {
                const mapEl = document.getElementById('issueMap');
                const fallback = document.getElementById('mapFallback');
                if (mapEl) mapEl.style.display = 'none';
                if (fallback) fallback.style.display = 'flex';
            }
        }, 2000);
    }

    setLoading(loading) {
        if (loading) {
            this.analyzeBtn.classList.add('loading');
            this.analyzeBtn.disabled = true;
        } else {
            this.analyzeBtn.classList.remove('loading');
            // Don't re-enable if on cooldown
            if (!this.isOnCooldown()) {
                this.analyzeBtn.disabled = false;
            }
        }
    }

    showError(message) {
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CivicLensApp();
});
