/**
 * CivicLens - Analytics Dashboard
 * Tracks issue submissions and displays trends
 */

class Analytics {
    constructor() {
        this.STORAGE_KEY = 'civicLens_analytics';
        this.data = this.loadData();
        this.init();
    }

    init() {
        this.updateDashboard();
        this.setupClearButton();
    }

    /**
     * Load analytics data from localStorage
     */
    loadData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
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
    }

    /**
     * Save analytics data to localStorage
     */
    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    /**
     * Track a new issue submission
     */
    trackIssue(analysis, complaint) {
        const categoryKey = this.normalizeCategory(analysis.category);
        const urgencyKey = analysis.urgency.toLowerCase();

        // Update category count
        if (this.data.categories[categoryKey] !== undefined) {
            this.data.categories[categoryKey]++;
        } else {
            this.data.categories.other++;
        }

        // Update urgency count
        if (this.data.urgencyCount[urgencyKey] !== undefined) {
            this.data.urgencyCount[urgencyKey]++;
        }

        // Add to issues list (keep last 20)
        this.data.issues.unshift({
            id: Date.now(),
            category: analysis.category,
            urgency: analysis.urgency,
            summary: analysis.summary.substring(0, 100),
            timestamp: new Date().toISOString()
        });

        if (this.data.issues.length > 20) {
            this.data.issues = this.data.issues.slice(0, 20);
        }

        this.saveData();
        this.updateDashboard();
    }

    /**
     * Normalize category name to match keys
     */
    normalizeCategory(category) {
        const normalized = category.toLowerCase().trim();
        const mappings = {
            'infrastructure': 'infrastructure',
            'road': 'infrastructure',
            'pothole': 'infrastructure',
            'sidewalk': 'infrastructure',
            'safety': 'safety',
            'crime': 'safety',
            'sanitation': 'sanitation',
            'garbage': 'sanitation',
            'trash': 'sanitation',
            'waste': 'sanitation',
            'utilities': 'utilities',
            'electricity': 'utilities',
            'water': 'utilities',
            'streetlight': 'utilities',
            'noise': 'noise'
        };

        for (const [key, value] of Object.entries(mappings)) {
            if (normalized.includes(key)) {
                return value;
            }
        }
        return 'other';
    }

    /**
     * Get the total number of issues
     */
    getTotalIssues() {
        return Object.values(this.data.categories).reduce((a, b) => a + b, 0);
    }

    /**
     * Get the most common category
     */
    getTopCategory() {
        const entries = Object.entries(this.data.categories);
        const sorted = entries.sort((a, b) => b[1] - a[1]);
        return sorted[0][1] > 0 ? { name: sorted[0][0], count: sorted[0][1] } : null;
    }

    /**
     * Update the dashboard UI
     */
    updateDashboard() {
        const total = this.getTotalIssues();
        const topCategory = this.getTopCategory();
        const criticalCount = this.data.urgencyCount.critical + this.data.urgencyCount.high;

        // Update stat cards
        const totalEl = document.getElementById('totalIssues');
        if (totalEl) {
            totalEl.textContent = total;
            // Force update again after a small delay to handle any race conditions
            setTimeout(() => {
                if (totalEl) totalEl.textContent = total;
            }, 100);
        }

        const trendEl = document.getElementById('totalTrend');
        if (trendEl) trendEl.textContent = total > 0 ? `${total} issues tracked locally` : 'Submit to start tracking';

        const topEl = document.getElementById('topCategory');
        if (topEl) {
            topEl.textContent = topCategory ? this.formatCategoryName(topCategory.name) : '--';
        }

        const topCountEl = document.getElementById('topCategoryCount');
        if (topCountEl) {
            topCountEl.textContent = topCategory ? `${topCategory.count} reports` : 'No data yet';
        }

        const criticalEl = document.getElementById('criticalCount');
        if (criticalEl) criticalEl.textContent = criticalCount;

        // SYNC HERO STATS with same data
        const heroIssueEl = document.getElementById('heroIssueCount');
        if (heroIssueEl) {
            heroIssueEl.textContent = total;
            heroIssueEl.dataset.count = total;
        }

        // Update category bars
        this.updateCategoryBars();

        // Update recent issues feed
        this.updateIssuesFeed();
    }

    /**
     * Format category name for display
     */
    formatCategoryName(name) {
        const icons = {
            infrastructure: '🛣️',
            safety: '🚨',
            sanitation: '🗑️',
            utilities: '💡',
            noise: '🔊',
            other: '📦'
        };
        return (icons[name] || '') + ' ' + name.charAt(0).toUpperCase() + name.slice(1);
    }

    /**
     * Update category distribution bars
     */
    updateCategoryBars() {
        const total = this.getTotalIssues();
        const categories = ['infrastructure', 'safety', 'sanitation', 'utilities', 'noise', 'other'];

        categories.forEach(cat => {
            const count = this.data.categories[cat];
            const bar = document.getElementById(`bar-${cat}`);
            const countEl = document.getElementById(`count-${cat}`);

            if (bar) {
                const percentage = total > 0 ? (count / total) * 100 : 0;
                bar.style.width = `${percentage}%`;
            }

            if (countEl) {
                countEl.textContent = count;
            }
        });
    }

    /**
     * Update recent issues feed
     */
    updateIssuesFeed() {
        const feed = document.getElementById('issuesFeed');
        if (!feed) return;

        if (this.data.issues.length === 0) {
            feed.innerHTML = '<p class="feed-empty">No issues reported yet. Submit your first complaint above!</p>';
            return;
        }

        const icons = {
            'Infrastructure': '🛣️',
            'Safety': '🚨',
            'Sanitation': '🗑️',
            'Utilities': '💡',
            'Noise': '🔊'
        };

        feed.innerHTML = this.data.issues.slice(0, 10).map(issue => {
            const icon = icons[issue.category] || '📋';
            const time = this.formatTime(issue.timestamp);
            return `
                <div class="issue-item">
                    <span class="issue-item-icon">${icon}</span>
                    <div class="issue-item-content">
                        <div class="issue-item-title">${issue.summary}...</div>
                        <div class="issue-item-meta">
                            <span class="urgency-badge ${issue.urgency}">${issue.urgency}</span>
                            <span>${time}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Format timestamp
     */
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    /**
     * Setup clear data button
     */
    setupClearButton() {
        const clearBtn = document.getElementById('clearAnalytics');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear all analytics data?')) {
                    this.clearData();
                }
            });
        }
    }

    /**
     * Clear all analytics data
     */
    clearData() {
        this.data = {
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
        this.saveData();
        this.updateDashboard();
    }
}

// Global instance
window.analytics = new Analytics();
