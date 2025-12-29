/**
 * CivicLens - Leaflet Maps Integration (FREE - No API Key Required)
 * Uses OpenStreetMap tiles
 */

class IssueMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.markerLayer = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the Leaflet Map
     */
    init() {
        const mapElement = document.getElementById('issueMap');
        const fallbackElement = document.getElementById('mapFallback');

        if (!mapElement) return;

        try {
            // Initialize Leaflet map
            this.map = L.map('issueMap', {
                center: [CONFIG.DEFAULT_LOCATION.lat, CONFIG.DEFAULT_LOCATION.lng],
                zoom: CONFIG.DEFAULT_ZOOM || 5,
                zoomControl: true
            });

            // Add dark theme OpenStreetMap tiles
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);

            // Create marker layer group
            this.markerLayer = L.layerGroup().addTo(this.map);

            this.isInitialized = true;

            // Markers will be loaded from database - no sample markers needed

            if (fallbackElement) fallbackElement.style.display = 'none';
            if (mapElement) mapElement.style.display = 'block';

            // Fix map sizing issue
            setTimeout(() => this.map.invalidateSize(), 100);

        } catch (error) {
            console.error('Map initialization error:', error);
            if (mapElement) mapElement.style.display = 'none';
            if (fallbackElement) fallbackElement.style.display = 'flex';
        }
    }

    /**
     * Add sample markers for demonstration
     */
    addSampleMarkers() {
        const sampleIssues = [
            { lat: 28.6229, lng: 77.2080, title: 'Pothole on MG Road', category: 'infrastructure', urgency: 'critical' },
            { lat: 28.6100, lng: 77.2300, title: 'Streetlight Out', category: 'utilities', urgency: 'medium' },
            { lat: 28.6050, lng: 77.1950, title: 'Garbage Accumulation', category: 'sanitation', urgency: 'high' },
            { lat: 28.6180, lng: 77.2150, title: 'Broken Sidewalk', category: 'infrastructure', urgency: 'medium' },
            { lat: 28.6280, lng: 77.2000, title: 'Noise Complaint', category: 'noise', urgency: 'low' }
        ];

        sampleIssues.forEach(issue => {
            this.addMarker(issue);
        });
    }

    /**
     * Get marker color based on urgency
     */
    getMarkerColor(urgency) {
        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            medium: '#3b82f6',
            low: '#22c55e'
        };
        return colors[urgency] || '#3b82f6';
    }

    /**
     * Create custom circle marker icon
     */
    createMarkerIcon(urgency) {
        const color = this.getMarkerColor(urgency);
        return L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                width: 24px;
                height: 24px;
                background: ${color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    /**
     * Add a marker to the map
     */
    addMarker(issue) {
        if (!this.isInitialized) return;

        const marker = L.marker([issue.lat, issue.lng], {
            icon: this.createMarkerIcon(issue.urgency)
        });

        marker.category = issue.category;
        marker.urgency = issue.urgency;

        // Add popup
        marker.bindPopup(`
            <div style="min-width: 150px;">
                <strong>${issue.title}</strong><br>
                <span style="text-transform: capitalize;">Category: ${issue.category}</span><br>
                <span style="text-transform: capitalize;">Urgency: ${issue.urgency}</span>
            </div>
        `);

        marker.addTo(this.markerLayer);
        this.markers.push(marker);
    }

    /**
     * Add marker for analyzed complaint
     */
    addAnalyzedIssue(analysis, location) {
        if (!this.isInitialized) return;

        // Use default location with slight offset if no specific location
        const lat = CONFIG.DEFAULT_LOCATION.lat + (Math.random() - 0.5) * 0.02;
        const lng = CONFIG.DEFAULT_LOCATION.lng + (Math.random() - 0.5) * 0.02;

        const urgencyMap = { low: 'low', medium: 'medium', high: 'high', critical: 'critical' };

        this.addMarker({
            lat,
            lng,
            title: analysis.summary.substring(0, 50) + '...',
            category: analysis.category.toLowerCase(),
            urgency: urgencyMap[analysis.urgency] || 'medium'
        });

        // Center map on new marker
        this.map.panTo([lat, lng]);
    }

    /**
     * Filter markers by category
     */
    filterByCategory(category) {
        this.markers.forEach(marker => {
            if (category === 'all' || marker.category === category) {
                marker.addTo(this.markerLayer);
            } else {
                this.markerLayer.removeLayer(marker);
            }
        });
    }

    /**
     * Clear all markers
     */
    clearMarkers() {
        this.markerLayer.clearLayers();
        this.markers = [];
    }
}

// Global instance
window.issueMap = new IssueMap();

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure CSS is loaded
    setTimeout(() => {
        window.issueMap.init();
    }, 100);
});
