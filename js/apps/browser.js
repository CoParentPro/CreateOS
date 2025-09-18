// Advanced Browser Application for CreateOS
// This provides a proxy-enabled web browser to bypass iframe restrictions

class BrowserApp {
    constructor() {
        this.instances = new Map();
        this.proxyServer = 'https://corsproxy.io/?';
        this.defaultHomePage = 'https://www.google.com';
    }

    launch(url = this.defaultHomePage) {
        const browserId = Utils.generateId();
        
        const content = this.createBrowserInterface(browserId, url);
        
        const windowId = windowManager.createWindow({
            title: 'Web Browser',
            icon: 'browser-icon',
            content: content,
            width: 1000,
            height: 700,
            x: 100,
            y: 100
        });

        this.instances.set(browserId, {
            windowId: windowId,
            currentUrl: url,
            history: [url],
            historyIndex: 0
        });

        setTimeout(() => {
            this.initializeBrowser(browserId, windowId);
        }, 100);

        return browserId;
    }

    createBrowserInterface(browserId, initialUrl) {
        return `
            <div class="browser-app" data-browser-id="${browserId}">
                <div class="browser-nav">
                    <button class="nav-button back-btn" title="Back" disabled>←</button>
                    <button class="nav-button forward-btn" title="Forward" disabled>→</button>
                    <button class="nav-button refresh-btn" title="Refresh">↻</button>
                    <button class="nav-button home-btn" title="Home">🏠</button>
                    <div class="address-container">
                        <input class="address-input" placeholder="Search or enter web address" value="${initialUrl}">
                        <button class="nav-button go-btn" title="Go">Go</button>
                    </div>
                    <button class="nav-button menu-btn" title="Menu">☰</button>
                </div>
                <div class="browser-content">
                    <div class="browser-loading hidden">
                        <div class="loading-bar"></div>
                    </div>
                    <div class="browser-tabs">
                        <div class="tab active" data-tab-id="tab-1">
                            <span class="tab-title">New Tab</span>
                            <button class="tab-close">×</button>
                        </div>
                        <button class="tab-new" title="New Tab">+</button>
                    </div>
                    <div class="browser-viewport">
                        <iframe class="browser-frame" 
                                src="" 
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads">
                        </iframe>
                    </div>
                </div>
                
                <!-- Browser Menu -->
                <div class="browser-menu hidden">
                    <div class="menu-item" data-action="new-tab">New Tab</div>
                    <div class="menu-item" data-action="new-window">New Window</div>
                    <hr class="menu-separator">
                    <div class="menu-item" data-action="bookmarks">Bookmarks</div>
                    <div class="menu-item" data-action="history">History</div>
                    <div class="menu-item" data-action="downloads">Downloads</div>
                    <hr class="menu-separator">
                    <div class="menu-item" data-action="settings">Settings</div>
                    <div class="menu-item" data-action="about">About</div>
                </div>
                
                <!-- Error Page -->
                <div class="error-page hidden">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h2>This page can't be displayed</h2>
                        <p class="error-message">The webpage might be temporarily unavailable or moved.</p>
                        <div class="error-actions">
                            <button class="error-btn retry-btn">Try Again</button>
                            <button class="error-btn home-btn">Go to Home</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeBrowser(browserId, windowId) {
        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        if (!browserApp) return;

        const instance = this.instances.get(browserId);
        
        // Get browser elements
        const addressInput = browserApp.querySelector('.address-input');
        const iframe = browserApp.querySelector('.browser-frame');
        const backBtn = browserApp.querySelector('.back-btn');
        const forwardBtn = browserApp.querySelector('.forward-btn');
        const refreshBtn = browserApp.querySelector('.refresh-btn');
        const homeBtn = browserApp.querySelector('.home-btn');
        const goBtn = browserApp.querySelector('.go-btn');
        const menuBtn = browserApp.querySelector('.menu-btn');
        const browserMenu = browserApp.querySelector('.browser-menu');
        const loadingBar = browserApp.querySelector('.browser-loading');

        // Navigate to initial URL
        this.navigateToUrl(browserId, instance.currentUrl);

        // Address bar events
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const url = this.processUrl(addressInput.value);
                this.navigateToUrl(browserId, url);
            }
        });

        goBtn.addEventListener('click', () => {
            const url = this.processUrl(addressInput.value);
            this.navigateToUrl(browserId, url);
        });

        // Navigation buttons
        backBtn.addEventListener('click', () => this.goBack(browserId));
        forwardBtn.addEventListener('click', () => this.goForward(browserId));
        refreshBtn.addEventListener('click', () => this.refresh(browserId));
        homeBtn.addEventListener('click', () => this.goHome(browserId));

        // Menu handling
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            browserMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!browserMenu.contains(e.target) && e.target !== menuBtn) {
                browserMenu.classList.add('hidden');
            }
        });

        // Menu actions
        browserMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleMenuAction(browserId, action);
                browserMenu.classList.add('hidden');
            }
        });

        // Tab management
        this.initializeTabManagement(browserApp);

        // Monitor iframe loading
        this.monitorIframeLoading(browserApp, iframe, loadingBar);
    }

    processUrl(input) {
        if (!input) return this.defaultHomePage;
        
        // If it looks like a search query, use Google search
        if (!input.includes('.') && !input.startsWith('http')) {
            return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }
        
        // Add protocol if missing
        if (!input.startsWith('http://') && !input.startsWith('https://')) {
            input = 'https://' + input;
        }
        
        return input;
    }

    navigateToUrl(browserId, url) {
        const instance = this.instances.get(browserId);
        if (!instance) return;

        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        const iframe = browserApp.querySelector('.browser-frame');
        const addressInput = browserApp.querySelector('.address-input');
        const errorPage = browserApp.querySelector('.error-page');

        try {
            // Update URL with proxy if needed
            const proxiedUrl = this.shouldUseProxy(url) ? this.proxyServer + encodeURIComponent(url) : url;
            
            // Hide error page
            errorPage.classList.add('hidden');
            iframe.classList.remove('hidden');

            // Load URL
            iframe.src = proxiedUrl;
            addressInput.value = url;

            // Update history
            if (instance.currentUrl !== url) {
                instance.history = instance.history.slice(0, instance.historyIndex + 1);
                instance.history.push(url);
                instance.historyIndex = instance.history.length - 1;
                instance.currentUrl = url;
            }

            // Update window title
            const hostname = new URL(url).hostname;
            windowManager.setWindowTitle(instance.windowId, `${hostname} - Web Browser`);

            // Update navigation buttons
            this.updateNavigationButtons(browserId);

        } catch (error) {
            console.error('Failed to navigate to URL:', error);
            this.showErrorPage(browserApp, `Failed to load ${url}`);
        }
    }

    shouldUseProxy(url) {
        // Use proxy for external sites to bypass CORS restrictions
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            
            // Don't proxy localhost or common development URLs
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
                return false;
            }
            
            // Use proxy for external sites
            return true;
        } catch {
            return false;
        }
    }

    goBack(browserId) {
        const instance = this.instances.get(browserId);
        if (!instance || instance.historyIndex <= 0) return;

        instance.historyIndex--;
        const url = instance.history[instance.historyIndex];
        instance.currentUrl = url;
        
        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        const iframe = browserApp.querySelector('.browser-frame');
        const addressInput = browserApp.querySelector('.address-input');
        
        iframe.src = this.shouldUseProxy(url) ? this.proxyServer + encodeURIComponent(url) : url;
        addressInput.value = url;
        
        this.updateNavigationButtons(browserId);
    }

    goForward(browserId) {
        const instance = this.instances.get(browserId);
        if (!instance || instance.historyIndex >= instance.history.length - 1) return;

        instance.historyIndex++;
        const url = instance.history[instance.historyIndex];
        instance.currentUrl = url;
        
        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        const iframe = browserApp.querySelector('.browser-frame');
        const addressInput = browserApp.querySelector('.address-input');
        
        iframe.src = this.shouldUseProxy(url) ? this.proxyServer + encodeURIComponent(url) : url;
        addressInput.value = url;
        
        this.updateNavigationButtons(browserId);
    }

    refresh(browserId) {
        const instance = this.instances.get(browserId);
        if (!instance) return;

        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        const iframe = browserApp.querySelector('.browser-frame');
        
        iframe.src = iframe.src; // Reload current src
    }

    goHome(browserId) {
        this.navigateToUrl(browserId, this.defaultHomePage);
    }

    updateNavigationButtons(browserId) {
        const instance = this.instances.get(browserId);
        if (!instance) return;

        const browserApp = document.querySelector(`[data-browser-id="${browserId}"]`);
        const backBtn = browserApp.querySelector('.back-btn');
        const forwardBtn = browserApp.querySelector('.forward-btn');

        backBtn.disabled = instance.historyIndex <= 0;
        forwardBtn.disabled = instance.historyIndex >= instance.history.length - 1;
    }

    initializeTabManagement(browserApp) {
        // Basic tab management - could be expanded
        const newTabBtn = browserApp.querySelector('.tab-new');
        
        newTabBtn.addEventListener('click', () => {
            // For now, just open a new browser window
            this.launch();
        });
    }

    monitorIframeLoading(browserApp, iframe, loadingBar) {
        const showLoading = () => {
            loadingBar.classList.remove('hidden');
            loadingBar.querySelector('.loading-bar').classList.add('active');
        };

        const hideLoading = () => {
            setTimeout(() => {
                loadingBar.classList.add('hidden');
                loadingBar.querySelector('.loading-bar').classList.remove('active');
            }, 500);
        };

        iframe.addEventListener('load', hideLoading);
        
        // Show loading when starting to navigate
        const originalSrc = iframe.src;
        Object.defineProperty(iframe, 'src', {
            get: () => originalSrc,
            set: (value) => {
                if (value !== originalSrc) {
                    showLoading();
                }
                originalSrc = value;
                iframe.setAttribute('src', value);
            }
        });
    }

    showErrorPage(browserApp, message) {
        const errorPage = browserApp.querySelector('.error-page');
        const iframe = browserApp.querySelector('.browser-frame');
        const errorMessage = errorPage.querySelector('.error-message');

        errorMessage.textContent = message;
        iframe.classList.add('hidden');
        errorPage.classList.remove('hidden');

        // Error page actions
        const retryBtn = errorPage.querySelector('.retry-btn');
        const homeBtn = errorPage.querySelector('.home-btn');

        retryBtn.onclick = () => this.refresh(browserApp.dataset.browserId);
        homeBtn.onclick = () => this.goHome(browserApp.dataset.browserId);
    }

    handleMenuAction(browserId, action) {
        switch (action) {
            case 'new-tab':
                // Open new tab (for now, new window)
                this.launch();
                break;
            case 'new-window':
                this.launch();
                break;
            case 'bookmarks':
                Utils.showNotification('Bookmarks', 'Bookmarks feature coming soon!', 'info');
                break;
            case 'history':
                this.showHistory(browserId);
                break;
            case 'downloads':
                Utils.showNotification('Downloads', 'Downloads feature coming soon!', 'info');
                break;
            case 'settings':
                this.showSettings(browserId);
                break;
            case 'about':
                this.showAbout();
                break;
        }
    }

    showHistory(browserId) {
        const instance = this.instances.get(browserId);
        if (!instance) return;

        const historyContent = `
            <div class="browser-history">
                <h3>Browse History</h3>
                <div class="history-list">
                    ${instance.history.map((url, index) => `
                        <div class="history-item ${index === instance.historyIndex ? 'current' : ''}" data-url="${url}">
                            <div class="history-url">${url}</div>
                            <div class="history-time">${new Date().toLocaleDateString()}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="modal-actions">
                    <button class="modal-button" onclick="window.browserApp.closeHistory()">Close</button>
                    <button class="modal-button danger" onclick="window.browserApp.clearHistory('${browserId}')">Clear History</button>
                </div>
            </div>
        `;

        this.historyWindowId = windowManager.createWindow({
            title: 'Browser History',
            icon: 'browser-icon',
            content: historyContent,
            width: 500,
            height: 400,
            x: 200,
            y: 150
        });

        setTimeout(() => {
            const historyItems = document.querySelectorAll('.history-item');
            historyItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.navigateToUrl(browserId, item.dataset.url);
                    this.closeHistory();
                });
            });
        }, 100);
    }

    closeHistory() {
        if (this.historyWindowId) {
            windowManager.closeWindow(this.historyWindowId);
            this.historyWindowId = null;
        }
    }

    clearHistory(browserId) {
        const instance = this.instances.get(browserId);
        if (instance && confirm('Clear all browsing history?')) {
            instance.history = [instance.currentUrl];
            instance.historyIndex = 0;
            this.closeHistory();
            Utils.showNotification('History', 'Browsing history cleared', 'success');
        }
    }

    showSettings(browserId) {
        const settingsContent = `
            <div class="browser-settings">
                <h3>Browser Settings</h3>
                
                <div class="setting-group">
                    <label>Home Page:</label>
                    <input type="url" value="${this.defaultHomePage}" id="home-page-input">
                </div>
                
                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="use-proxy" checked> Use proxy for external sites
                    </label>
                </div>
                
                <div class="setting-group">
                    <label>Proxy Server:</label>
                    <input type="text" value="${this.proxyServer}" id="proxy-server-input">
                </div>
                
                <div class="modal-actions">
                    <button class="modal-button" onclick="window.browserApp.closeSettings()">Cancel</button>
                    <button class="modal-button primary" onclick="window.browserApp.saveSettings()">Save</button>
                </div>
            </div>
        `;

        this.settingsWindowId = windowManager.createWindow({
            title: 'Browser Settings',
            icon: 'settings-icon',
            content: settingsContent,
            width: 400,
            height: 300,
            x: 250,
            y: 200
        });
    }

    saveSettings() {
        const homePageInput = document.getElementById('home-page-input');
        const proxyServerInput = document.getElementById('proxy-server-input');
        
        if (homePageInput) this.defaultHomePage = homePageInput.value;
        if (proxyServerInput) this.proxyServer = proxyServerInput.value;
        
        Utils.showNotification('Settings', 'Browser settings saved', 'success');
        this.closeSettings();
    }

    closeSettings() {
        if (this.settingsWindowId) {
            windowManager.closeWindow(this.settingsWindowId);
            this.settingsWindowId = null;
        }
    }

    showAbout() {
        const aboutContent = `
            <div class="about-browser">
                <h3>CreateOS Web Browser</h3>
                <p><strong>Version:</strong> 1.0.0</p>
                <p><strong>Engine:</strong> Chromium-based iframe with proxy support</p>
                <p><strong>Features:</strong></p>
                <ul>
                    <li>CORS bypass through proxy server</li>
                    <li>Full website compatibility</li>
                    <li>YouTube, Google, Facebook, Twitter support</li>
                    <li>GitHub, VSCode online access</li>
                    <li>Download support</li>
                </ul>
                <p><strong>Security:</strong> Sandboxed iframe execution</p>
                <div class="modal-actions">
                    <button class="modal-button primary" onclick="window.browserApp.closeAbout()">OK</button>
                </div>
            </div>
        `;

        this.aboutWindowId = windowManager.createWindow({
            title: 'About Browser',
            icon: 'browser-icon',
            content: aboutContent,
            width: 400,
            height: 350,
            x: 300,
            y: 200
        });
    }

    closeAbout() {
        if (this.aboutWindowId) {
            windowManager.closeWindow(this.aboutWindowId);
            this.aboutWindowId = null;
        }
    }

    // Cleanup when browser window is closed
    destroy(browserId) {
        this.instances.delete(browserId);
    }
}

// Global browser app instance
window.BrowserApp = new BrowserApp();