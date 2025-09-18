// Main initialization file for CreateOS

class CreateOS {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.bootTime = Date.now();
        this.systemSettings = Utils.loadFromStorage('system-settings', {
            theme: 'light',
            animations: true,
            sounds: true,
            autoSave: true,
            debugMode: false
        });

        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            console.log('🚀 Starting CreateOS...');
            
            // Show boot screen
            this.showBootScreen();
            
            // Initialize system components
            await this.initializeComponents();
            
            // Load user preferences
            this.loadUserPreferences();
            
            // Setup global event handlers
            this.setupGlobalEventHandlers();
            
            // Initialize applications
            this.initializeApplications();
            
            // Hide boot screen and show desktop
            this.hideBootScreen();
            
            // System ready
            this.onSystemReady();
            
            console.log('✅ CreateOS initialized successfully');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Failed to initialize CreateOS:', error);
            this.showCriticalError(error);
        }
    }

    showBootScreen() {
        const bootScreen = Utils.createElement('div', {
            id: 'boot-screen',
            className: 'boot-screen',
            innerHTML: `
                <div class="boot-content">
                    <div class="boot-logo">
                        <div class="windows-logo large"></div>
                        <h1>CreateOS</h1>
                    </div>
                    <div class="boot-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <div class="boot-status">Starting system...</div>
                    </div>
                    <div class="boot-version">Version ${this.version}</div>
                </div>
            `
        });

        document.body.appendChild(bootScreen);

        // Animate progress bar
        const progressFill = bootScreen.querySelector('.progress-fill');
        const statusText = bootScreen.querySelector('.boot-status');
        const stages = [
            { progress: 20, text: 'Loading system components...' },
            { progress: 40, text: 'Initializing window manager...' },
            { progress: 60, text: 'Loading applications...' },
            { progress: 80, text: 'Preparing desktop...' },
            { progress: 100, text: 'Ready!' }
        ];

        let currentStage = 0;
        const updateProgress = () => {
            if (currentStage < stages.length) {
                const stage = stages[currentStage];
                progressFill.style.width = stage.progress + '%';
                statusText.textContent = stage.text;
                currentStage++;
                setTimeout(updateProgress, 800);
            }
        };

        setTimeout(updateProgress, 500);
    }

    hideBootScreen() {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            bootScreen.style.opacity = '0';
            setTimeout(() => {
                if (bootScreen.parentNode) {
                    bootScreen.parentNode.removeChild(bootScreen);
                }
            }, 1000);
        }
    }

    async initializeComponents() {
        // Components are already initialized via their constructors
        // This method can be used for any additional async initialization
        
        // Verify all components are ready
        if (!window.windowManager) {
            throw new Error('Window Manager failed to initialize');
        }
        
        if (!window.desktopManager) {
            throw new Error('Desktop Manager failed to initialize');
        }
        
        if (!window.taskbarManager) {
            throw new Error('Taskbar Manager failed to initialize');
        }
        
        if (!window.startMenuManager) {
            throw new Error('Start Menu Manager failed to initialize');
        }

        // Simulate component initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    loadUserPreferences() {
        // Apply theme
        this.applyTheme(this.systemSettings.theme);
        
        // Apply animation settings
        if (!this.systemSettings.animations) {
            document.documentElement.style.setProperty('--transition', 'none');
        }
        
        // Load custom wallpaper
        const customWallpaper = Utils.loadFromStorage('custom-wallpaper');
        if (customWallpaper) {
            const background = document.querySelector('.desktop-background');
            if (background) {
                background.style.backgroundImage = `url(${customWallpaper})`;
            }
        }
        
        // Restore window positions
        const windowPositions = Utils.loadFromStorage('window-positions', {});
        eventBus.emit('restoreWindowPositions', windowPositions);
    }

    applyTheme(theme) {
        document.body.className = theme + '-theme';
        
        if (theme === 'dark') {
            document.documentElement.style.setProperty('--white', '#1e1e1e');
            document.documentElement.style.setProperty('--gray-100', '#2d2d2d');
            document.documentElement.style.setProperty('--gray-200', '#3a3a3a');
            document.documentElement.style.setProperty('--gray-800', '#ffffff');
        } else {
            // Reset to light theme defaults
            document.documentElement.style.removeProperty('--white');
            document.documentElement.style.removeProperty('--gray-100');
            document.documentElement.style.removeProperty('--gray-200');
            document.documentElement.style.removeProperty('--gray-800');
        }
    }

    setupGlobalEventHandlers() {
        // Prevent default browser behaviors
        document.addEventListener('contextmenu', (e) => {
            // Allow context menu only on specific elements
            if (!e.target.closest('.allow-context-menu')) {
                e.preventDefault();
            }
        });

        // Prevent drag and drop on the page
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+I to toggle debug mode
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                this.toggleDebugMode();
            }
            
            // Ctrl+Shift+R to reload system
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.reloadSystem();
            }
            
            // Alt+F4 to close active window (handled by window manager)
            // Ctrl+Alt+T to open task manager
            if (e.ctrlKey && e.altKey && e.key === 't') {
                e.preventDefault();
                this.openTaskManager();
            }
        });

        // Handle uncaught errors
        window.addEventListener('error', (e) => {
            console.error('Uncaught error:', e.error);
            if (this.systemSettings.debugMode) {
                this.showErrorDialog(e.error);
            }
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            if (this.systemSettings.debugMode) {
                this.showErrorDialog(e.reason);
            }
        });

        // Auto-save system state periodically
        if (this.systemSettings.autoSave) {
            setInterval(() => {
                this.saveSystemState();
            }, 30000); // Save every 30 seconds
        }

        // Handle window focus/blur for power management
        window.addEventListener('focus', () => {
            eventBus.emit('systemResumed');
        });

        window.addEventListener('blur', () => {
            eventBus.emit('systemSuspended');
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                eventBus.emit('systemMinimized');
            } else {
                eventBus.emit('systemRestored');
            }
        });
    }

    initializeApplications() {
        // Load application scripts if they exist
        const appScripts = [
            'js/apps/file-explorer.js',
            'js/apps/office.js',
            'js/apps/browser.js',
            'js/apps/games.js'
        ];

        appScripts.forEach(script => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script;
            scriptElement.onerror = () => {
                console.warn(`Optional app script not found: ${script}`);
            };
            document.head.appendChild(scriptElement);
        });
    }

    onSystemReady() {
        // Start system services
        this.startSystemServices();
        
        // Show welcome notification
        setTimeout(() => {
            Utils.showNotification(
                'Welcome to CreateOS',
                'Your web-based operating system is ready to use!',
                'success',
                5000
            );
        }, 2000);

        // Emit system ready event
        eventBus.emit('systemReady', {
            version: this.version,
            bootTime: Date.now() - this.bootTime
        });

        // Update boot time display in about dialog
        const bootTimeMs = Date.now() - this.bootTime;
        console.log(`🏁 CreateOS boot completed in ${bootTimeMs}ms`);
    }

    startSystemServices() {
        // Start battery simulation
        if (taskbarManager && typeof taskbarManager.simulateBatteryDrain === 'function') {
            taskbarManager.simulateBatteryDrain();
        }

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Start automatic maintenance
        this.startMaintenanceTasks();
    }

    startPerformanceMonitoring() {
        // Monitor memory usage and performance
        setInterval(() => {
            if (performance.memory) {
                const memoryInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                
                eventBus.emit('memoryUpdate', memoryInfo);
                
                // Warn if memory usage is high
                const usagePercent = (memoryInfo.used / memoryInfo.total) * 100;
                if (usagePercent > 90) {
                    console.warn('High memory usage detected:', usagePercent.toFixed(1) + '%');
                }
            }
        }, 10000); // Check every 10 seconds
    }

    startMaintenanceTasks() {
        // Clean up old storage data periodically
        setInterval(() => {
            this.cleanupStorage();
        }, 300000); // Every 5 minutes

        // Garbage collection hint (if supported)
        if (window.gc) {
            setInterval(() => {
                window.gc();
            }, 60000); // Every minute
        }
    }

    cleanupStorage() {
        // Clean up old temporary data
        const keysToClean = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('temp-')) {
                keysToClean.push(key);
            }
        }
        
        keysToClean.forEach(key => {
            localStorage.removeItem(key);
        });

        if (keysToClean.length > 0) {
            console.log(`Cleaned up ${keysToClean.length} temporary storage items`);
        }
    }

    saveSystemState() {
        const state = {
            windows: windowManager.getAllWindows().map(w => ({
                id: w.id,
                config: w.config,
                state: w.state
            })),
            desktop: desktopManager.getDesktopStats(),
            taskbar: taskbarManager.getSystemInfo(),
            timestamp: Date.now()
        };

        Utils.saveToStorage('system-state', state);
    }

    restoreSystemState() {
        const state = Utils.loadFromStorage('system-state');
        if (state && Date.now() - state.timestamp < 24 * 60 * 60 * 1000) { // Within 24 hours
            // Restore windows
            state.windows.forEach(windowData => {
                // Restore window logic would go here
            });
        }
    }

    toggleDebugMode() {
        this.systemSettings.debugMode = !this.systemSettings.debugMode;
        Utils.saveToStorage('system-settings', this.systemSettings);
        
        const status = this.systemSettings.debugMode ? 'enabled' : 'disabled';
        Utils.showNotification('Debug Mode', `Debug mode ${status}`, 'info');
        
        if (this.systemSettings.debugMode) {
            this.showDebugPanel();
        } else {
            this.hideDebugPanel();
        }
    }

    showDebugPanel() {
        const debugPanel = Utils.createElement('div', {
            id: 'debug-panel',
            className: 'debug-panel',
            innerHTML: `
                <div class="debug-header">
                    <h4>Debug Panel</h4>
                    <button class="debug-close" onclick="createOS.hideDebugPanel()">×</button>
                </div>
                <div class="debug-content">
                    <div class="debug-section">
                        <h5>System Info</h5>
                        <div id="debug-system-info"></div>
                    </div>
                    <div class="debug-section">
                        <h5>Performance</h5>
                        <div id="debug-performance"></div>
                    </div>
                    <div class="debug-section">
                        <h5>Event Log</h5>
                        <div id="debug-events"></div>
                    </div>
                </div>
            `
        });

        document.body.appendChild(debugPanel);
        this.updateDebugInfo();
        
        // Update debug info periodically
        this.debugUpdateInterval = setInterval(() => {
            this.updateDebugInfo();
        }, 1000);
    }

    hideDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
        
        if (this.debugUpdateInterval) {
            clearInterval(this.debugUpdateInterval);
        }
    }

    updateDebugInfo() {
        const systemInfo = document.getElementById('debug-system-info');
        const performance = document.getElementById('debug-performance');
        
        if (systemInfo) {
            systemInfo.innerHTML = `
                <div>Version: ${this.version}</div>
                <div>Windows: ${windowManager.getAllWindows().length}</div>
                <div>Uptime: ${Math.floor((Date.now() - this.bootTime) / 1000)}s</div>
                <div>Theme: ${this.systemSettings.theme}</div>
            `;
        }
        
        if (performance && window.performance.memory) {
            const memory = window.performance.memory;
            performance.innerHTML = `
                <div>Memory Used: ${Utils.formatFileSize(memory.usedJSHeapSize)}</div>
                <div>Memory Total: ${Utils.formatFileSize(memory.totalJSHeapSize)}</div>
                <div>Memory Limit: ${Utils.formatFileSize(memory.jsHeapSizeLimit)}</div>
            `;
        }
    }

    reloadSystem() {
        if (confirm('Are you sure you want to reload CreateOS? Unsaved work will be lost.')) {
            this.saveSystemState();
            location.reload();
        }
    }

    openTaskManager() {
        const taskManagerContent = `
            <div class="task-manager">
                <div class="task-manager-tabs">
                    <button class="task-tab active" data-tab="processes">Processes</button>
                    <button class="task-tab" data-tab="performance">Performance</button>
                    <button class="task-tab" data-tab="services">Services</button>
                </div>
                <div class="task-content">
                    <div class="task-panel active" id="processes-panel">
                        <table class="process-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>PID</th>
                                    <th>Memory</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="process-list">
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-button" onclick="createOS.refreshTaskManager()">Refresh</button>
                    <button class="task-button danger" onclick="createOS.endSelectedProcess()">End Task</button>
                </div>
            </div>
        `;

        const windowId = windowManager.createWindow({
            title: 'Task Manager',
            icon: 'settings-icon',
            content: taskManagerContent,
            width: 600,
            height: 400,
            x: 200,
            y: 150
        });

        setTimeout(() => {
            this.populateTaskManager(windowId);
        }, 100);
    }

    populateTaskManager(windowId) {
        const windowContent = windowManager.getWindowContent(windowId);
        const processList = windowContent.querySelector('#process-list');
        
        if (processList) {
            const processes = [
                { name: 'CreateOS System', pid: 1, memory: '15.2 MB', status: 'Running' },
                { name: 'Window Manager', pid: 2, memory: '8.5 MB', status: 'Running' },
                { name: 'Desktop Manager', pid: 3, memory: '4.1 MB', status: 'Running' },
                { name: 'Taskbar', pid: 4, memory: '2.8 MB', status: 'Running' },
                ...windowManager.getAllWindows().map((w, i) => ({
                    name: w.config.title,
                    pid: 100 + i,
                    memory: `${(Math.random() * 20 + 5).toFixed(1)} MB`,
                    status: w.state.isMinimized ? 'Minimized' : 'Running'
                }))
            ];

            processList.innerHTML = processes.map(proc => `
                <tr>
                    <td>${proc.name}</td>
                    <td>${proc.pid}</td>
                    <td>${proc.memory}</td>
                    <td>${proc.status}</td>
                </tr>
            `).join('');
        }
    }

    refreshTaskManager() {
        const taskManagerWindow = windowManager.getAllWindows().find(w => w.config.title === 'Task Manager');
        if (taskManagerWindow) {
            this.populateTaskManager(taskManagerWindow.id);
        }
    }

    endSelectedProcess() {
        Utils.showNotification('Task Manager', 'Feature not implemented yet', 'info');
    }

    showCriticalError(error) {
        document.body.innerHTML = `
            <div class="critical-error">
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <h1>Critical System Error</h1>
                    <p>CreateOS has encountered a critical error and needs to restart.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.stack || error.message || error}</pre>
                    </details>
                    <button onclick="location.reload()" class="error-button">Restart CreateOS</button>
                </div>
            </div>
        `;
    }

    showErrorDialog(error) {
        const errorDialog = Utils.createElement('div', {
            className: 'error-dialog modal-backdrop',
            innerHTML: `
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h3>System Error</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>An error occurred:</strong></p>
                        <pre class="error-details">${error.stack || error.message || error}</pre>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-button primary">OK</button>
                    </div>
                </div>
            `
        });

        document.body.appendChild(errorDialog);

        // Close handlers
        const closeDialog = () => errorDialog.remove();
        errorDialog.querySelector('.modal-close').addEventListener('click', closeDialog);
        errorDialog.querySelector('.modal-button').addEventListener('click', closeDialog);
        errorDialog.addEventListener('click', (e) => {
            if (e.target === errorDialog) closeDialog();
        });
    }

    // Public API
    getSystemInfo() {
        return {
            version: this.version,
            bootTime: this.bootTime,
            uptime: Date.now() - this.bootTime,
            settings: this.systemSettings,
            isInitialized: this.isInitialized
        };
    }

    updateSettings(newSettings) {
        this.systemSettings = { ...this.systemSettings, ...newSettings };
        Utils.saveToStorage('system-settings', this.systemSettings);
        
        // Apply theme change if needed
        if (newSettings.theme) {
            this.applyTheme(newSettings.theme);
        }
    }

    shutdown() {
        console.log('🔌 Shutting down CreateOS...');
        this.saveSystemState();
        eventBus.emit('systemShutdown');
        
        // Cleanup
        if (this.debugUpdateInterval) {
            clearInterval(this.debugUpdateInterval);
        }
        
        if (taskbarManager && taskbarManager.destroy) {
            taskbarManager.destroy();
        }
    }
}

// Initialize CreateOS when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.createOS = new CreateOS();
});

// Handle page unload
window.addEventListener('beforeunload', (e) => {
    if (window.createOS) {
        createOS.shutdown();
    }
});