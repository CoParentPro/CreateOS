// Taskbar Manager for CreateOS - Handles taskbar and system tray functionality

class TaskbarManager {
    constructor() {
        this.taskbar = document.querySelector('.taskbar');
        this.systemTime = document.getElementById('system-time');
        this.systemIcons = document.querySelectorAll('.system-icon');
        this.timeUpdateInterval = null;
        this.batteryLevel = 85;
        this.wifiStrength = 4;
        this.volumeLevel = 75;

        this.initializeEventListeners();
        this.startTimeUpdates();
        this.updateSystemIcons();
    }

    initializeEventListeners() {
        // System time click - show calendar/clock
        this.systemTime.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCalendar();
        });

        // System icon interactions
        this.systemIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleSystemIconClick(icon);
            });
        });

        // Hide calendar when clicking elsewhere
        document.addEventListener('click', (e) => {
            const calendar = document.querySelector('.calendar-popup');
            if (calendar && !calendar.contains(e.target) && e.target !== this.systemTime) {
                this.hideCalendar();
            }
        });

        // Taskbar auto-hide (optional)
        if (Utils.loadFromStorage('taskbar-autohide', false)) {
            this.enableAutoHide();
        }

        // Window events
        eventBus.on('windowCreated', (data) => {
            this.updateTaskbarApp(data.windowId, 'created');
        });

        eventBus.on('windowClosed', (data) => {
            this.updateTaskbarApp(data.windowId, 'closed');
        });

        eventBus.on('windowFocused', (data) => {
            this.updateTaskbarApp(data.windowId, 'focused');
        });

        eventBus.on('windowMinimized', (data) => {
            this.updateTaskbarApp(data.windowId, 'minimized');
        });
    }

    startTimeUpdates() {
        this.updateTime();
        this.timeUpdateInterval = setInterval(() => {
            this.updateTime();
        }, 1000);
    }

    updateTime() {
        const now = new Date();
        const timeString = Utils.formatTime();
        const dateString = Utils.formatDate();
        
        this.systemTime.textContent = timeString;
        this.systemTime.title = dateString;
    }

    toggleCalendar() {
        const existingCalendar = document.querySelector('.calendar-popup');
        if (existingCalendar) {
            this.hideCalendar();
            return;
        }

        const calendar = this.createCalendarPopup();
        document.body.appendChild(calendar);
        
        // Position calendar above taskbar
        const timeRect = this.systemTime.getBoundingClientRect();
        calendar.style.right = '20px';
        calendar.style.bottom = '50px';
        
        // Show animation
        setTimeout(() => {
            calendar.classList.add('show');
        }, 10);
    }

    createCalendarPopup() {
        const now = new Date();
        const calendar = Utils.createElement('div', {
            className: 'calendar-popup',
            innerHTML: `
                <div class="calendar-header">
                    <div class="current-date">
                        <div class="month-year">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="current-time">${Utils.formatTime()}</div>
                    </div>
                </div>
                <div class="calendar-grid">
                    ${this.generateCalendarGrid(now)}
                </div>
                <div class="calendar-footer">
                    <button class="calendar-button" onclick="window.taskbarManager.openTimeSettings()">
                        Time & Date Settings
                    </button>
                </div>
            `
        });

        return calendar;
    }

    generateCalendarGrid(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = date.getDate();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();

        let html = '<div class="calendar-weekdays">';
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div><div class="calendar-days">';

        // Empty cells for days before month starts
        for (let i = 0; i < firstDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today;
            html += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
        }

        html += '</div>';
        return html;
    }

    hideCalendar() {
        const calendar = document.querySelector('.calendar-popup');
        if (calendar) {
            calendar.classList.remove('show');
            setTimeout(() => {
                if (calendar.parentNode) {
                    calendar.parentNode.removeChild(calendar);
                }
            }, 200);
        }
    }

    handleSystemIconClick(icon) {
        if (icon.classList.contains('wifi-icon')) {
            this.showWifiPanel();
        } else if (icon.classList.contains('battery-icon')) {
            this.showBatteryPanel();
        } else if (icon.classList.contains('speaker-icon')) {
            this.showVolumePanel();
        }
    }

    showWifiPanel() {
        const panel = Utils.createElement('div', {
            className: 'system-panel wifi-panel',
            innerHTML: `
                <div class="panel-header">
                    <h4>Wi-Fi</h4>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="wifi-networks">
                    <div class="wifi-network connected">
                        <div class="network-info">
                            <div class="network-name">Home Network</div>
                            <div class="network-status">Connected</div>
                        </div>
                        <div class="signal-strength">
                            <div class="signal-bars">
                                <span class="bar active"></span>
                                <span class="bar active"></span>
                                <span class="bar active"></span>
                                <span class="bar active"></span>
                            </div>
                        </div>
                    </div>
                    <div class="wifi-network">
                        <div class="network-info">
                            <div class="network-name">Guest Network</div>
                            <div class="network-status">Available</div>
                        </div>
                        <div class="signal-strength">
                            <div class="signal-bars">
                                <span class="bar active"></span>
                                <span class="bar active"></span>
                                <span class="bar"></span>
                                <span class="bar"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel-footer">
                    <button class="panel-button">Network Settings</button>
                </div>
            `
        });

        this.showSystemPanel(panel, icon);
    }

    showBatteryPanel() {
        const panel = Utils.createElement('div', {
            className: 'system-panel battery-panel',
            innerHTML: `
                <div class="panel-header">
                    <h4>Battery</h4>
                </div>
                <div class="battery-info">
                    <div class="battery-percentage">${this.batteryLevel}%</div>
                    <div class="battery-visual">
                        <div class="battery-outline">
                            <div class="battery-fill" style="width: ${this.batteryLevel}%"></div>
                        </div>
                    </div>
                    <div class="battery-status">
                        ${this.batteryLevel > 20 ? 'Good' : 'Low'} battery
                    </div>
                </div>
                <div class="power-options">
                    <div class="power-mode">
                        <label>Power Mode:</label>
                        <select>
                            <option value="balanced" selected>Balanced</option>
                            <option value="power-saver">Power Saver</option>
                            <option value="high-performance">High Performance</option>
                        </select>
                    </div>
                </div>
                <div class="panel-footer">
                    <button class="panel-button">Battery Settings</button>
                </div>
            `
        });

        this.showSystemPanel(panel, icon);
    }

    showVolumePanel() {
        const panel = Utils.createElement('div', {
            className: 'system-panel volume-panel',
            innerHTML: `
                <div class="panel-header">
                    <h4>Volume</h4>
                </div>
                <div class="volume-controls">
                    <div class="volume-slider-container">
                        <div class="volume-icon">🔊</div>
                        <input type="range" class="volume-slider" min="0" max="100" value="${this.volumeLevel}">
                        <div class="volume-value">${this.volumeLevel}</div>
                    </div>
                    <div class="audio-devices">
                        <label>Output Device:</label>
                        <select>
                            <option selected>Speakers (Built-in)</option>
                            <option>Headphones</option>
                            <option>Bluetooth Device</option>
                        </select>
                    </div>
                </div>
                <div class="panel-footer">
                    <button class="panel-button">Sound Settings</button>
                </div>
            `
        });

        // Add volume slider functionality
        const slider = panel.querySelector('.volume-slider');
        const valueDisplay = panel.querySelector('.volume-value');
        
        slider.addEventListener('input', (e) => {
            this.volumeLevel = parseInt(e.target.value);
            valueDisplay.textContent = this.volumeLevel;
            this.updateVolumeIcon();
        });

        this.showSystemPanel(panel, icon);
    }

    showSystemPanel(panel, triggerIcon) {
        // Remove existing panels
        document.querySelectorAll('.system-panel').forEach(p => p.remove());

        document.body.appendChild(panel);

        // Position panel above taskbar
        const iconRect = triggerIcon.getBoundingClientRect();
        panel.style.right = '20px';
        panel.style.bottom = '50px';

        // Show animation
        setTimeout(() => {
            panel.classList.add('show');
        }, 10);

        // Hide when clicking outside
        const hidePanel = (e) => {
            if (!panel.contains(e.target) && !triggerIcon.contains(e.target)) {
                panel.classList.remove('show');
                setTimeout(() => {
                    if (panel.parentNode) {
                        panel.parentNode.removeChild(panel);
                    }
                }, 200);
                document.removeEventListener('click', hidePanel);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', hidePanel);
        }, 100);
    }

    updateSystemIcons() {
        this.updateWifiIcon();
        this.updateBatteryIcon();
        this.updateVolumeIcon();
    }

    updateWifiIcon() {
        const wifiIcon = document.querySelector('.wifi-icon');
        if (wifiIcon) {
            wifiIcon.title = `Wi-Fi: Connected (${this.wifiStrength}/4 bars)`;
        }
    }

    updateBatteryIcon() {
        const batteryIcon = document.querySelector('.battery-icon');
        if (batteryIcon) {
            batteryIcon.title = `Battery: ${this.batteryLevel}%`;
            
            // Change icon based on battery level
            if (this.batteryLevel <= 20) {
                batteryIcon.style.color = '#dc3545';
            } else if (this.batteryLevel <= 50) {
                batteryIcon.style.color = '#ffc107';
            } else {
                batteryIcon.style.color = '';
            }
        }
    }

    updateVolumeIcon() {
        const speakerIcon = document.querySelector('.speaker-icon');
        if (speakerIcon) {
            speakerIcon.title = `Volume: ${this.volumeLevel}%`;
            
            // Change icon based on volume level
            if (this.volumeLevel === 0) {
                speakerIcon.innerHTML = '🔇';
            } else if (this.volumeLevel <= 33) {
                speakerIcon.innerHTML = '🔈';
            } else if (this.volumeLevel <= 66) {
                speakerIcon.innerHTML = '🔉';
            } else {
                speakerIcon.innerHTML = '🔊';
            }
        }
    }

    updateTaskbarApp(windowId, action) {
        const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
        
        switch (action) {
            case 'created':
                // Button is created by WindowManager
                break;
            case 'focused':
                document.querySelectorAll('.taskbar-app').forEach(btn => {
                    btn.classList.remove('active');
                });
                if (taskbarBtn) {
                    taskbarBtn.classList.add('active');
                }
                break;
            case 'minimized':
                if (taskbarBtn) {
                    taskbarBtn.classList.remove('active');
                }
                break;
            case 'closed':
                // Button is removed by WindowManager
                break;
        }
    }

    enableAutoHide() {
        let hideTimeout;
        let isVisible = true;

        const showTaskbar = () => {
            this.taskbar.style.transform = 'translateY(0)';
            isVisible = true;
            clearTimeout(hideTimeout);
        };

        const hideTaskbar = () => {
            if (document.querySelector('.start-menu.show')) return;
            this.taskbar.style.transform = 'translateY(100%)';
            isVisible = false;
        };

        // Show on hover
        this.taskbar.addEventListener('mouseenter', showTaskbar);
        
        // Hide after delay
        this.taskbar.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(hideTaskbar, 2000);
        });

        // Show when mouse is at bottom of screen
        document.addEventListener('mousemove', (e) => {
            if (e.clientY >= window.innerHeight - 5 && !isVisible) {
                showTaskbar();
            }
        });

        // Initial hide after delay
        hideTimeout = setTimeout(hideTaskbar, 3000);
    }

    disableAutoHide() {
        this.taskbar.style.transform = 'translateY(0)';
        this.taskbar.style.transition = '';
    }

    openTimeSettings() {
        this.hideCalendar();
        
        const settingsContent = `
            <div class="time-settings">
                <h3>Date & Time Settings</h3>
                
                <div class="setting-group">
                    <label class="checkbox-label">
                        <input type="checkbox" checked> Set time automatically
                    </label>
                </div>
                
                <div class="setting-group">
                    <label>Time Zone:</label>
                    <select>
                        <option selected>Pacific Standard Time (UTC-8)</option>
                        <option>Mountain Standard Time (UTC-7)</option>
                        <option>Central Standard Time (UTC-6)</option>
                        <option>Eastern Standard Time (UTC-5)</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label>Date Format:</label>
                    <select>
                        <option selected>MM/dd/yyyy</option>
                        <option>dd/MM/yyyy</option>
                        <option>yyyy-MM-dd</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label>Time Format:</label>
                    <select>
                        <option selected>12-hour (AM/PM)</option>
                        <option>24-hour</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-button" onclick="window.taskbarManager.closeTimeSettings()">Cancel</button>
                    <button class="modal-button primary" onclick="window.taskbarManager.applyTimeSettings()">Apply</button>
                </div>
            </div>
        `;

        windowManager.createWindow({
            title: 'Date & Time Settings',
            icon: 'settings-icon',
            content: settingsContent,
            width: 400,
            height: 350,
            x: (window.innerWidth - 400) / 2,
            y: (window.innerHeight - 350) / 2
        });
    }

    applyTimeSettings() {
        Utils.showNotification('Settings', 'Date & time settings applied', 'success');
        this.closeTimeSettings();
    }

    closeTimeSettings() {
        const windows = windowManager.getAllWindows();
        const settingsWindow = windows.find(w => w.config.title === 'Date & Time Settings');
        if (settingsWindow) {
            windowManager.closeWindow(settingsWindow.id);
        }
    }

    // Simulate system changes
    simulateBatteryDrain() {
        setInterval(() => {
            if (this.batteryLevel > 0) {
                this.batteryLevel = Math.max(0, this.batteryLevel - 1);
                this.updateBatteryIcon();
            }
        }, 60000); // Drain 1% per minute
    }

    simulateWifiChanges() {
        setInterval(() => {
            // Randomly change wifi strength
            this.wifiStrength = Math.floor(Math.random() * 4) + 1;
            this.updateWifiIcon();
        }, 30000); // Change every 30 seconds
    }

    // Public API
    getSystemInfo() {
        return {
            battery: this.batteryLevel,
            wifi: this.wifiStrength,
            volume: this.volumeLevel,
            time: Utils.formatTime(),
            date: Utils.formatDate()
        };
    }

    setBatteryLevel(level) {
        this.batteryLevel = Math.max(0, Math.min(100, level));
        this.updateBatteryIcon();
    }

    setVolumeLevel(level) {
        this.volumeLevel = Math.max(0, Math.min(100, level));
        this.updateVolumeIcon();
    }

    setWifiStrength(strength) {
        this.wifiStrength = Math.max(0, Math.min(4, strength));
        this.updateWifiIcon();
    }

    // Cleanup
    destroy() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
        }
    }
}

// Global taskbar manager instance
window.taskbarManager = new TaskbarManager();