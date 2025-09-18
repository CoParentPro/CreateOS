// Start Menu Manager for CreateOS - Handles start menu functionality and app launching

class StartMenuManager {
    constructor() {
        this.startButton = document.querySelector('.start-button');
        this.startMenu = document.getElementById('start-menu');
        this.startApps = document.querySelectorAll('.start-app');
        this.isMenuOpen = false;
        this.searchInput = null;
        this.recentApps = Utils.loadFromStorage('recent-apps', []);
        this.pinnedApps = Utils.loadFromStorage('pinned-apps', [
            'word', 'excel', 'powerpoint', 'browser', 'file-explorer'
        ]);

        this.initializeEventListeners();
        this.updateRecentApps();
    }

    initializeEventListeners() {
        // Start button click
        this.startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });

        // Start app clicks
        this.startApps.forEach(app => {
            app.addEventListener('click', () => {
                const appName = app.dataset.app;
                this.launchApp(appName);
                this.hideMenu();
            });
        });

        // Click outside to hide menu
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.startMenu.contains(e.target) && e.target !== this.startButton) {
                this.hideMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Windows key or Ctrl+Esc to toggle start menu
            if (e.key === 'Meta' || (e.ctrlKey && e.key === 'Escape')) {
                e.preventDefault();
                this.toggleMenu();
            }
            
            // Escape to close start menu
            if (e.key === 'Escape' && this.isMenuOpen) {
                this.hideMenu();
            }
            
            // Type to search when menu is open
            if (this.isMenuOpen && e.key.length === 1 && !e.ctrlKey && !e.altKey) {
                this.focusSearch();
            }
        });

        // Power button
        const powerBtn = document.querySelector('.power-btn');
        if (powerBtn) {
            powerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPowerMenu();
            });
        }

        // App launch events
        eventBus.on('openApp', (data) => {
            this.launchApp(data.app);
            this.addToRecentApps(data.app);
        });
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.hideMenu();
        } else {
            this.showMenu();
        }
    }

    showMenu() {
        this.startMenu.classList.add('show');
        this.startButton.classList.add('active');
        this.isMenuOpen = true;
        
        // Focus search if it exists
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }, 100);

        eventBus.emit('startMenuOpened');
    }

    hideMenu() {
        this.startMenu.classList.remove('show');
        this.startButton.classList.remove('active');
        this.isMenuOpen = false;
        
        // Clear search
        if (this.searchInput) {
            this.searchInput.value = '';
            this.clearSearchResults();
        }

        eventBus.emit('startMenuClosed');
    }

    launchApp(appName) {
        console.log('Launching app:', appName);
        
        // Add to recent apps
        this.addToRecentApps(appName);
        
        // Emit app launch event
        eventBus.emit('appLaunched', { app: appName });
        
        // Launch the specific application
        switch (appName) {
            case 'file-explorer':
                this.launchFileExplorer();
                break;
            case 'word':
                this.launchWord();
                break;
            case 'excel':
                this.launchExcel();
                break;
            case 'powerpoint':
                this.launchPowerPoint();
                break;
            case 'browser':
                this.launchBrowser();
                break;
            case 'minesweeper':
                this.launchMinesweeper();
                break;
            case 'solitaire':
                this.launchSolitaire();
                break;
            case 'settings':
                this.launchSettings();
                break;
            default:
                Utils.showNotification('Error', `Unknown application: ${appName}`, 'error');
                break;
        }
    }

    launchFileExplorer() {
        if (window.FileExplorerApp) {
            window.FileExplorerApp.launch();
        } else {
            // Fallback basic file explorer
            const content = `
                <div class="file-explorer">
                    <div class="file-explorer-sidebar">
                        <div class="sidebar-section">
                            <div class="sidebar-header">Quick Access</div>
                            <div class="sidebar-item active">
                                <span class="sidebar-icon">🏠</span>
                                Desktop
                            </div>
                            <div class="sidebar-item">
                                <span class="sidebar-icon">📄</span>
                                Documents
                            </div>
                            <div class="sidebar-item">
                                <span class="sidebar-icon">📷</span>
                                Pictures
                            </div>
                            <div class="sidebar-item">
                                <span class="sidebar-icon">🎵</span>
                                Music
                            </div>
                            <div class="sidebar-item">
                                <span class="sidebar-icon">🎬</span>
                                Videos
                            </div>
                        </div>
                    </div>
                    <div class="file-explorer-main">
                        <div class="file-explorer-toolbar">
                            <button class="toolbar-button">← Back</button>
                            <button class="toolbar-button">→ Forward</button>
                            <button class="toolbar-button">↑ Up</button>
                            <input class="address-bar" value="Desktop" readonly>
                            <button class="toolbar-button">🔍 Search</button>
                        </div>
                        <div class="file-grid">
                            <div class="file-item">
                                <div class="file-icon">📁</div>
                                <div class="file-name">Documents</div>
                            </div>
                            <div class="file-item">
                                <div class="file-icon">📁</div>
                                <div class="file-name">Pictures</div>
                            </div>
                            <div class="file-item">
                                <div class="file-icon">📄</div>
                                <div class="file-name">ReadMe.txt</div>
                            </div>
                            <div class="file-item">
                                <div class="file-icon">📄</div>
                                <div class="file-name">Sample.docx</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            windowManager.createWindow({
                title: 'File Explorer',
                icon: 'file-explorer-icon',
                content: content,
                width: 800,
                height: 600,
                x: 100,
                y: 100
            });
        }
    }

    launchWord() {
        if (window.OfficeApps && window.OfficeApps.Word) {
            window.OfficeApps.Word.launch();
        } else {
            const content = `
                <div class="office-app word-app">
                    <div class="office-ribbon">
                        <div class="ribbon-tabs">
                            <button class="ribbon-tab active">Home</button>
                            <button class="ribbon-tab">Insert</button>
                            <button class="ribbon-tab">Layout</button>
                            <button class="ribbon-tab">References</button>
                            <button class="ribbon-tab">Review</button>
                        </div>
                        <div class="ribbon-content">
                            <div class="ribbon-group">
                                <div class="ribbon-buttons">
                                    <button class="ribbon-button" title="Bold">B</button>
                                    <button class="ribbon-button" title="Italic">I</button>
                                    <button class="ribbon-button" title="Underline">U</button>
                                </div>
                                <div class="ribbon-label">Font</div>
                            </div>
                            <div class="ribbon-group">
                                <div class="ribbon-buttons">
                                    <button class="ribbon-button" title="Align Left">⬅</button>
                                    <button class="ribbon-button" title="Center">⬌</button>
                                    <button class="ribbon-button" title="Align Right">➡</button>
                                </div>
                                <div class="ribbon-label">Paragraph</div>
                            </div>
                        </div>
                    </div>
                    <div class="office-editor">
                        <div class="document-area">
                            <div class="document-page">
                                <textarea class="document-content" placeholder="Start typing your document..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            windowManager.createWindow({
                title: 'Microsoft Word',
                icon: 'word-icon',
                content: content,
                width: 900,
                height: 700,
                x: 50,
                y: 50
            });
        }
    }

    launchExcel() {
        if (window.OfficeApps && window.OfficeApps.Excel) {
            window.OfficeApps.Excel.launch();
        } else {
            const content = `
                <div class="office-app excel-app">
                    <div class="office-ribbon">
                        <div class="ribbon-tabs">
                            <button class="ribbon-tab active">Home</button>
                            <button class="ribbon-tab">Insert</button>
                            <button class="ribbon-tab">Formulas</button>
                            <button class="ribbon-tab">Data</button>
                        </div>
                        <div class="ribbon-content">
                            <div class="ribbon-group">
                                <div class="ribbon-buttons">
                                    <button class="ribbon-button">∑</button>
                                    <button class="ribbon-button">📊</button>
                                    <button class="ribbon-button">🔍</button>
                                </div>
                                <div class="ribbon-label">Functions</div>
                            </div>
                        </div>
                    </div>
                    <div class="spreadsheet-container">
                        <div class="spreadsheet-headers">
                            <div class="row-header"></div>
                            <div class="col-header">A</div>
                            <div class="col-header">B</div>
                            <div class="col-header">C</div>
                            <div class="col-header">D</div>
                            <div class="col-header">E</div>
                        </div>
                        <div class="spreadsheet-grid">
                            <table class="spreadsheet-table">
                                ${Array.from({length: 20}, (_, i) => `
                                    <tr>
                                        <td class="row-header">${i + 1}</td>
                                        <td class="spreadsheet-cell"><input type="text"></td>
                                        <td class="spreadsheet-cell"><input type="text"></td>
                                        <td class="spreadsheet-cell"><input type="text"></td>
                                        <td class="spreadsheet-cell"><input type="text"></td>
                                        <td class="spreadsheet-cell"><input type="text"></td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                    </div>
                </div>
            `;

            windowManager.createWindow({
                title: 'Microsoft Excel',
                icon: 'excel-icon',
                content: content,
                width: 900,
                height: 700,
                x: 75,
                y: 75
            });
        }
    }

    launchPowerPoint() {
        if (window.OfficeApps && window.OfficeApps.PowerPoint) {
            window.OfficeApps.PowerPoint.launch();
        } else {
            const content = `
                <div class="office-app powerpoint-app">
                    <div class="office-ribbon">
                        <div class="ribbon-tabs">
                            <button class="ribbon-tab active">Home</button>
                            <button class="ribbon-tab">Insert</button>
                            <button class="ribbon-tab">Design</button>
                            <button class="ribbon-tab">Animations</button>
                            <button class="ribbon-tab">Slide Show</button>
                        </div>
                        <div class="ribbon-content">
                            <div class="ribbon-group">
                                <div class="ribbon-buttons">
                                    <button class="ribbon-button">📄</button>
                                    <button class="ribbon-button">📷</button>
                                    <button class="ribbon-button">📊</button>
                                </div>
                                <div class="ribbon-label">Insert</div>
                            </div>
                        </div>
                    </div>
                    <div class="presentation-workspace">
                        <div class="slide-panel">
                            <div class="slide-thumbnail active">
                                <div class="slide-number">1</div>
                                <div class="slide-preview"></div>
                            </div>
                            <div class="slide-thumbnail">
                                <div class="slide-number">2</div>
                                <div class="slide-preview"></div>
                            </div>
                        </div>
                        <div class="slide-editor">
                            <div class="slide-canvas">
                                <div class="slide-content">
                                    <h1 contenteditable="true">Click to add title</h1>
                                    <p contenteditable="true">Click to add subtitle</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            windowManager.createWindow({
                title: 'Microsoft PowerPoint',
                icon: 'powerpoint-icon',
                content: content,
                width: 1000,
                height: 700,
                x: 100,
                y: 50
            });
        }
    }

    launchBrowser() {
        if (window.BrowserApp) {
            window.BrowserApp.launch();
        } else {
            const content = `
                <div class="browser-app">
                    <div class="browser-nav">
                        <button class="nav-button" title="Back">←</button>
                        <button class="nav-button" title="Forward">→</button>
                        <button class="nav-button" title="Refresh">↻</button>
                        <input class="address-input" placeholder="Search or enter web address" value="https://www.google.com">
                        <button class="nav-button" title="Go">Go</button>
                    </div>
                    <div class="browser-content">
                        <div class="browser-loading">
                            <div class="loading-bar"></div>
                        </div>
                        <iframe class="browser-frame" src="https://www.google.com" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"></iframe>
                    </div>
                </div>
            `;

            const windowId = windowManager.createWindow({
                title: 'Web Browser',
                icon: 'browser-icon',
                content: content,
                width: 1000,
                height: 700,
                x: 75,
                y: 75
            });

            // Add browser functionality
            setTimeout(() => {
                this.initializeBrowserWindow(windowId);
            }, 100);
        }
    }

    initializeBrowserWindow(windowId) {
        const windowContent = windowManager.getWindowContent(windowId);
        if (!windowContent) return;

        const addressInput = windowContent.querySelector('.address-input');
        const iframe = windowContent.querySelector('.browser-frame');
        const backBtn = windowContent.querySelector('.nav-button[title="Back"]');
        const forwardBtn = windowContent.querySelector('.nav-button[title="Forward"]');
        const refreshBtn = windowContent.querySelector('.nav-button[title="Refresh"]');
        const goBtn = windowContent.querySelector('.nav-button[title="Go"]');

        // Navigate to URL
        const navigate = (url) => {
            if (!url) return;
            
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            iframe.src = url;
            addressInput.value = url;
            windowManager.setWindowTitle(windowId, `Web Browser - ${new URL(url).hostname}`);
        };

        // Address bar events
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                navigate(addressInput.value);
            }
        });

        goBtn.addEventListener('click', () => {
            navigate(addressInput.value);
        });

        // Navigation buttons
        backBtn.addEventListener('click', () => {
            iframe.contentWindow.history.back();
        });

        forwardBtn.addEventListener('click', () => {
            iframe.contentWindow.history.forward();
        });

        refreshBtn.addEventListener('click', () => {
            iframe.src = iframe.src;
        });
    }

    launchMinesweeper() {
        if (window.GamesApp && window.GamesApp.Minesweeper) {
            window.GamesApp.Minesweeper.launch();
        } else {
            const content = `
                <div class="game-container minesweeper-container">
                    <div class="game-header">
                        <div class="game-info">
                            <span>💣 Mines: <span id="mine-count">10</span></span>
                            <span>⏱️ Time: <span id="game-time">000</span></span>
                        </div>
                        <button class="game-button" onclick="window.startMenuManager.resetMinesweeper()">New Game</button>
                    </div>
                    <div class="game-board">
                        <div class="minesweeper-grid" id="minesweeper-grid" style="grid-template-columns: repeat(9, 1fr);">
                            ${Array.from({length: 81}, (_, i) => `
                                <div class="mine-cell" data-index="${i}"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            const windowId = windowManager.createWindow({
                title: 'Minesweeper',
                icon: 'minesweeper-icon',
                content: content,
                width: 400,
                height: 500,
                x: 200,
                y: 100
            });

            setTimeout(() => {
                this.initializeMinesweeper(windowId);
            }, 100);
        }
    }

    initializeMinesweeper(windowId) {
        // Basic minesweeper game logic would go here
        const windowContent = windowManager.getWindowContent(windowId);
        const cells = windowContent.querySelectorAll('.mine-cell');
        
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                if (!cell.classList.contains('revealed')) {
                    cell.classList.add('revealed');
                    cell.textContent = Math.floor(Math.random() * 9) || '';
                }
            });
            
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                cell.classList.toggle('flagged');
                cell.textContent = cell.classList.contains('flagged') ? '🚩' : '';
            });
        });
    }

    resetMinesweeper() {
        const cells = document.querySelectorAll('.mine-cell');
        cells.forEach(cell => {
            cell.classList.remove('revealed', 'flagged');
            cell.textContent = '';
        });
    }

    launchSolitaire() {
        const content = `
            <div class="game-container solitaire-container">
                <div class="game-header">
                    <div class="game-info">
                        <span>♠️ Score: <span id="solitaire-score">0</span></span>
                        <span>⏱️ Time: <span id="solitaire-time">000</span></span>
                    </div>
                    <button class="game-button" onclick="window.startMenuManager.resetSolitaire()">New Game</button>
                </div>
                <div class="game-board">
                    <div class="solitaire-board">
                        ${Array.from({length: 7}, (_, i) => `
                            <div class="card-pile" data-pile="${i}">
                                <div class="playing-card face-down"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        windowManager.createWindow({
            title: 'Solitaire',
            icon: 'solitaire-icon',
            content: content,
            width: 700,
            height: 500,
            x: 150,
            y: 150
        });
    }

    resetSolitaire() {
        // Reset solitaire game
        Utils.showNotification('Solitaire', 'New game started!', 'info', 2000);
    }

    launchSettings() {
        const content = `
            <div class="settings-app">
                <div class="settings-sidebar">
                    <div class="settings-category active" data-category="system">
                        <span class="settings-icon">⚙️</span>
                        System
                    </div>
                    <div class="settings-category" data-category="display">
                        <span class="settings-icon">🖥️</span>
                        Display
                    </div>
                    <div class="settings-category" data-category="sound">
                        <span class="settings-icon">🔊</span>
                        Sound
                    </div>
                    <div class="settings-category" data-category="network">
                        <span class="settings-icon">🌐</span>
                        Network
                    </div>
                    <div class="settings-category" data-category="privacy">
                        <span class="settings-icon">🔒</span>
                        Privacy
                    </div>
                </div>
                <div class="settings-content">
                    <div class="settings-panel" id="system-settings">
                        <h3>System Settings</h3>
                        <div class="setting-item">
                            <label>Device name:</label>
                            <input type="text" value="CreateOS-PC" readonly>
                        </div>
                        <div class="setting-item">
                            <label>Version:</label>
                            <span>CreateOS 1.0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        windowManager.createWindow({
            title: 'Settings',
            icon: 'settings-icon',
            content: content,
            width: 800,
            height: 600,
            x: 100,
            y: 100
        });
    }

    showPowerMenu() {
        const powerMenu = Utils.createElement('div', {
            className: 'power-menu',
            innerHTML: `
                <div class="power-option" data-action="sleep">
                    <span class="power-icon">😴</span>
                    <span class="power-text">Sleep</span>
                </div>
                <div class="power-option" data-action="restart">
                    <span class="power-icon">🔄</span>
                    <span class="power-text">Restart</span>
                </div>
                <div class="power-option" data-action="shutdown">
                    <span class="power-icon">⚡</span>
                    <span class="power-text">Shut down</span>
                </div>
                <div class="power-option" data-action="signout">
                    <span class="power-icon">👤</span>
                    <span class="power-text">Sign out</span>
                </div>
            `
        });

        // Position menu
        const powerBtn = document.querySelector('.power-btn');
        const rect = powerBtn.getBoundingClientRect();
        powerMenu.style.position = 'fixed';
        powerMenu.style.right = '20px';
        powerMenu.style.bottom = '90px';

        document.body.appendChild(powerMenu);

        // Add event listeners
        powerMenu.addEventListener('click', (e) => {
            const option = e.target.closest('.power-option');
            if (option) {
                this.handlePowerAction(option.dataset.action);
                powerMenu.remove();
            }
        });

        // Hide when clicking outside
        setTimeout(() => {
            const hideMenu = (e) => {
                if (!powerMenu.contains(e.target) && e.target !== powerBtn) {
                    powerMenu.remove();
                    document.removeEventListener('click', hideMenu);
                }
            };
            document.addEventListener('click', hideMenu);
        }, 100);

        // Show animation
        setTimeout(() => powerMenu.classList.add('show'), 10);
    }

    handlePowerAction(action) {
        this.hideMenu();
        
        switch (action) {
            case 'sleep':
                this.simulateSleep();
                break;
            case 'restart':
                this.simulateRestart();
                break;
            case 'shutdown':
                this.simulateShutdown();
                break;
            case 'signout':
                this.simulateSignOut();
                break;
        }
    }

    simulateSleep() {
        Utils.showNotification('System', 'Entering sleep mode...', 'info', 2000);
        setTimeout(() => {
            document.body.style.opacity = '0.1';
            setTimeout(() => {
                document.body.style.opacity = '1';
                Utils.showNotification('System', 'Resuming from sleep', 'success', 2000);
            }, 3000);
        }, 1000);
    }

    simulateRestart() {
        if (confirm('Are you sure you want to restart CreateOS?')) {
            Utils.showNotification('System', 'Restarting...', 'info', 2000);
            setTimeout(() => {
                location.reload();
            }, 2000);
        }
    }

    simulateShutdown() {
        if (confirm('Are you sure you want to shut down CreateOS?')) {
            Utils.showNotification('System', 'Shutting down...', 'info', 2000);
            setTimeout(() => {
                document.body.innerHTML = `
                    <div style="background: #000; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: monospace;">
                        <div>
                            <h1>CreateOS</h1>
                            <p>It's now safe to close this tab.</p>
                        </div>
                    </div>
                `;
            }, 2000);
        }
    }

    simulateSignOut() {
        if (confirm('Are you sure you want to sign out?')) {
            Utils.showNotification('System', 'Signing out...', 'info', 2000);
            setTimeout(() => {
                // Close all windows
                windowManager.getAllWindows().forEach(w => {
                    windowManager.closeWindow(w.id);
                });
                // Clear recent apps
                this.recentApps = [];
                this.saveRecentApps();
                // Show sign in screen
                this.showSignInScreen();
            }, 2000);
        }
    }

    showSignInScreen() {
        document.body.innerHTML = `
            <div class="signin-screen">
                <div class="signin-container">
                    <div class="user-avatar large">U</div>
                    <h2>Welcome to CreateOS</h2>
                    <p>Click to sign in</p>
                    <button class="signin-button" onclick="location.reload()">Sign In</button>
                </div>
            </div>
        `;
    }

    addToRecentApps(appName) {
        // Remove if already exists
        const index = this.recentApps.indexOf(appName);
        if (index > -1) {
            this.recentApps.splice(index, 1);
        }
        
        // Add to beginning
        this.recentApps.unshift(appName);
        
        // Limit to 10 recent apps
        if (this.recentApps.length > 10) {
            this.recentApps = this.recentApps.slice(0, 10);
        }
        
        this.saveRecentApps();
        this.updateRecentApps();
    }

    updateRecentApps() {
        const recentSection = document.querySelector('.app-category h3');
        if (recentSection && recentSection.textContent === 'Recently Added') {
            const appGrid = recentSection.nextElementSibling;
            if (appGrid) {
                // Update the recently used apps display
                // This would populate with the most recent apps
            }
        }
    }

    saveRecentApps() {
        Utils.saveToStorage('recent-apps', this.recentApps);
    }

    focusSearch() {
        if (!this.searchInput) {
            this.createSearchBox();
        }
        this.searchInput.focus();
    }

    createSearchBox() {
        const searchContainer = Utils.createElement('div', {
            className: 'start-search-container',
            innerHTML: `
                <input type="text" class="start-search-input" placeholder="Type here to search...">
                <div class="search-results"></div>
            `
        });

        const menuHeader = this.startMenu.querySelector('.start-menu-header');
        menuHeader.appendChild(searchContainer);

        this.searchInput = searchContainer.querySelector('.start-search-input');
        const searchResults = searchContainer.querySelector('.search-results');

        this.searchInput.addEventListener('input', (e) => {
            this.performSearch(e.target.value, searchResults);
        });
    }

    performSearch(query, resultsContainer) {
        if (!query.trim()) {
            this.clearSearchResults(resultsContainer);
            return;
        }

        // Simple app search
        const apps = [
            { name: 'File Explorer', app: 'file-explorer' },
            { name: 'Microsoft Word', app: 'word' },
            { name: 'Microsoft Excel', app: 'excel' },
            { name: 'Microsoft PowerPoint', app: 'powerpoint' },
            { name: 'Web Browser', app: 'browser' },
            { name: 'Minesweeper', app: 'minesweeper' },
            { name: 'Solitaire', app: 'solitaire' },
            { name: 'Settings', app: 'settings' }
        ];

        const results = apps.filter(app => 
            app.name.toLowerCase().includes(query.toLowerCase())
        );

        this.displaySearchResults(results, resultsContainer);
    }

    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }

        container.innerHTML = results.map(result => `
            <div class="search-result" data-app="${result.app}">
                <div class="search-result-icon ${result.app}-icon"></div>
                <div class="search-result-name">${result.name}</div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.search-result').forEach(result => {
            result.addEventListener('click', () => {
                this.launchApp(result.dataset.app);
                this.hideMenu();
            });
        });
    }

    clearSearchResults(container) {
        if (container) {
            container.innerHTML = '';
        }
    }

    // Public API
    getRecentApps() {
        return this.recentApps.slice();
    }

    getPinnedApps() {
        return this.pinnedApps.slice();
    }

    pinApp(appName) {
        if (!this.pinnedApps.includes(appName)) {
            this.pinnedApps.push(appName);
            Utils.saveToStorage('pinned-apps', this.pinnedApps);
        }
    }

    unpinApp(appName) {
        const index = this.pinnedApps.indexOf(appName);
        if (index > -1) {
            this.pinnedApps.splice(index, 1);
            Utils.saveToStorage('pinned-apps', this.pinnedApps);
        }
    }
}

// Global start menu manager instance
window.startMenuManager = new StartMenuManager();