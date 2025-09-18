// Window Manager for CreateOS - Handles window creation, management, and interactions

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
        this.zIndex = 10;
        this.windowsContainer = document.getElementById('windows-container');
        this.taskbarApps = document.getElementById('taskbar-apps');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Global click handler for window focus
        document.addEventListener('click', (e) => {
            const window = e.target.closest('.window');
            if (window) {
                this.focusWindow(window.id);
            }
        });

        // Global key handlers
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                this.cycleWindows();
            }
            if (e.altKey && e.key === 'F4') {
                e.preventDefault();
                if (this.activeWindow) {
                    this.closeWindow(this.activeWindow.id);
                }
            }
        });

        // Window resize observer
        window.addEventListener('resize', () => {
            this.handleViewportResize();
        });
    }

    createWindow(config) {
        const windowId = Utils.generateId();
        const window = this.buildWindowElement(windowId, config);
        
        // Store window data
        this.windows.set(windowId, {
            id: windowId,
            element: window,
            config: config,
            state: {
                isMaximized: false,
                isMinimized: false,
                position: { x: config.x || 100, y: config.y || 100 },
                size: { width: config.width || 800, height: config.height || 600 },
                originalState: null
            }
        });

        // Add to DOM
        this.windowsContainer.appendChild(window);
        
        // Position and size
        this.setWindowPosition(windowId, config.x || 100, config.y || 100);
        this.setWindowSize(windowId, config.width || 800, config.height || 600);
        
        // Focus the new window
        this.focusWindow(windowId);
        
        // Add to taskbar
        this.addToTaskbar(windowId, config);
        
        // Initialize window interactions
        this.initializeWindowInteractions(windowId);
        
        // Show animation
        window.classList.add('opening');
        setTimeout(() => window.classList.remove('opening'), 300);

        // Emit event
        eventBus.emit('windowCreated', { windowId, config });

        return windowId;
    }

    buildWindowElement(windowId, config) {
        const window = Utils.createElement('div', {
            id: windowId,
            className: 'window',
            innerHTML: `
                <div class="window-header">
                    <div class="window-icon ${config.icon}"></div>
                    <div class="window-title">${Utils.escapeHtml(config.title)}</div>
                    <div class="window-controls">
                        <button class="window-control minimize" title="Minimize">
                            <span class="control-icon"></span>
                        </button>
                        <button class="window-control maximize" title="Maximize">
                            <span class="control-icon"></span>
                        </button>
                        <button class="window-control close" title="Close">
                            <span class="control-icon"></span>
                        </button>
                    </div>
                </div>
                <div class="window-content">
                    ${config.content || ''}
                </div>
            `
        });

        // Add resize handles
        this.addResizeHandles(window);

        return window;
    }

    addResizeHandles(window) {
        const handles = [
            'resize-n', 'resize-s', 'resize-w', 'resize-e',
            'resize-nw', 'resize-ne', 'resize-sw', 'resize-se'
        ];

        handles.forEach(handle => {
            const handleElement = Utils.createElement('div', {
                className: `resize-handle ${handle}`
            });
            window.appendChild(handleElement);
        });
    }

    initializeWindowInteractions(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const header = windowElement.querySelector('.window-header');
        const controls = windowElement.querySelectorAll('.window-control');
        const resizeHandles = windowElement.querySelectorAll('.resize-handle');

        // Window dragging
        this.initializeDragging(windowId, header);

        // Window controls
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = control.classList.contains('minimize') ? 'minimize' :
                              control.classList.contains('maximize') ? 'maximize' :
                              control.classList.contains('restore') ? 'restore' : 'close';
                this.handleWindowControl(windowId, action);
            });
        });

        // Window resizing
        resizeHandles.forEach(handle => {
            this.initializeResizing(windowId, handle);
        });

        // Double-click to maximize/restore
        header.addEventListener('dblclick', (e) => {
            if (e.target === header || e.target.classList.contains('window-title')) {
                this.toggleMaximize(windowId);
            }
        });
    }

    initializeDragging(windowId, header) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;

        const startDrag = (e) => {
            const windowData = this.windows.get(windowId);
            if (windowData.state.isMaximized) return;

            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = windowData.element.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            document.body.classList.add('dragging');
            
            this.focusWindow(windowId);
        };

        const onDrag = (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;

            this.setWindowPosition(windowId, newLeft, newTop);
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.body.classList.remove('dragging');
        };

        header.addEventListener('mousedown', startDrag);
    }

    initializeResizing(windowId, handle) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight, startLeft, startTop;

        const startResize = (e) => {
            const windowData = this.windows.get(windowId);
            if (windowData.state.isMaximized) return;

            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = windowData.element.getBoundingClientRect();
            startWidth = rect.width;
            startHeight = rect.height;
            startLeft = rect.left;
            startTop = rect.top;

            document.addEventListener('mousemove', onResize);
            document.addEventListener('mouseup', stopResize);
            document.body.classList.add('resizing');
            
            this.focusWindow(windowId);
        };

        const onResize = (e) => {
            if (!isResizing) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const direction = handle.className.split(' ')[1];

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('w')) {
                newWidth = startWidth - deltaX;
                newLeft = startLeft + deltaX;
            }
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            if (direction.includes('n')) {
                newHeight = startHeight - deltaY;
                newTop = startTop + deltaY;
            }

            // Apply constraints
            newWidth = Math.max(320, Math.min(newWidth, window.innerWidth));
            newHeight = Math.max(200, Math.min(newHeight, window.innerHeight - 40));

            this.setWindowSize(windowId, newWidth, newHeight);
            if (direction.includes('w') || direction.includes('n')) {
                this.setWindowPosition(windowId, newLeft, newTop);
            }
        };

        const stopResize = () => {
            isResizing = false;
            document.removeEventListener('mousemove', onResize);
            document.removeEventListener('mouseup', stopResize);
            document.body.classList.remove('resizing');
        };

        handle.addEventListener('mousedown', startResize);
    }

    handleWindowControl(windowId, action) {
        switch (action) {
            case 'minimize':
                this.minimizeWindow(windowId);
                break;
            case 'maximize':
                this.maximizeWindow(windowId);
                break;
            case 'restore':
                this.restoreWindow(windowId);
                break;
            case 'close':
                this.closeWindow(windowId);
                break;
        }
    }

    focusWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Remove focus from all windows
        this.windows.forEach(w => {
            w.element.classList.remove('focused');
        });

        // Focus the target window
        windowData.element.classList.add('focused');
        windowData.element.style.zIndex = ++this.zIndex;
        this.activeWindow = windowData;

        // Update taskbar
        this.updateTaskbarFocus(windowId);

        // Emit event
        eventBus.emit('windowFocused', { windowId });
    }

    minimizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.classList.add('minimized');
        windowData.state.isMinimized = true;

        // Update taskbar button
        const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarBtn) {
            taskbarBtn.classList.remove('active');
        }

        // Focus another window if this was active
        if (this.activeWindow && this.activeWindow.id === windowId) {
            this.focusNextWindow();
        }

        eventBus.emit('windowMinimized', { windowId });
    }

    maximizeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.state.isMaximized) {
            this.restoreWindow(windowId);
            return;
        }

        // Store current state for restore
        const rect = windowData.element.getBoundingClientRect();
        windowData.state.originalState = {
            position: { x: rect.left, y: rect.top },
            size: { width: rect.width, height: rect.height }
        };

        windowData.element.classList.add('maximized');
        windowData.state.isMaximized = true;

        // Update maximize button to restore
        const maximizeBtn = windowData.element.querySelector('.maximize');
        maximizeBtn.classList.remove('maximize');
        maximizeBtn.classList.add('restore');
        maximizeBtn.title = 'Restore Down';

        this.focusWindow(windowId);

        eventBus.emit('windowMaximized', { windowId });
    }

    restoreWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        windowData.element.classList.remove('maximized', 'minimized');
        windowData.state.isMaximized = false;
        windowData.state.isMinimized = false;

        // Restore original state if available
        if (windowData.state.originalState) {
            const { position, size } = windowData.state.originalState;
            this.setWindowPosition(windowId, position.x, position.y);
            this.setWindowSize(windowId, size.width, size.height);
        }

        // Update restore button back to maximize
        const restoreBtn = windowData.element.querySelector('.restore');
        if (restoreBtn) {
            restoreBtn.classList.remove('restore');
            restoreBtn.classList.add('maximize');
            restoreBtn.title = 'Maximize';
        }

        this.focusWindow(windowId);

        eventBus.emit('windowRestored', { windowId });
    }

    toggleMaximize(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        if (windowData.state.isMaximized) {
            this.restoreWindow(windowId);
        } else {
            this.maximizeWindow(windowId);
        }
    }

    closeWindow(windowId) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        // Emit close event (can be cancelled)
        const closeEvent = { windowId, cancelled: false };
        eventBus.emit('windowClosing', closeEvent);
        
        if (closeEvent.cancelled) return;

        // Closing animation
        windowData.element.classList.add('closing');
        
        setTimeout(() => {
            // Remove from DOM
            if (windowData.element.parentNode) {
                windowData.element.parentNode.removeChild(windowData.element);
            }

            // Remove from taskbar
            this.removeFromTaskbar(windowId);

            // Remove from windows collection
            this.windows.delete(windowId);

            // Focus another window if this was active
            if (this.activeWindow && this.activeWindow.id === windowId) {
                this.activeWindow = null;
                this.focusNextWindow();
            }

            // Emit closed event
            eventBus.emit('windowClosed', { windowId });
        }, 200);
    }

    setWindowPosition(windowId, x, y) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.state.isMaximized) return;

        // Constrain to viewport
        const maxX = window.innerWidth - 100; // Keep at least 100px visible
        const maxY = window.innerHeight - 100;
        
        x = Utils.clamp(x, 0, maxX);
        y = Utils.clamp(y, 0, maxY);

        windowData.element.style.left = x + 'px';
        windowData.element.style.top = y + 'px';
        windowData.state.position = { x, y };
    }

    setWindowSize(windowId, width, height) {
        const windowData = this.windows.get(windowId);
        if (!windowData || windowData.state.isMaximized) return;

        // Apply constraints
        width = Math.max(320, Math.min(width, window.innerWidth));
        height = Math.max(200, Math.min(height, window.innerHeight - 40));

        windowData.element.style.width = width + 'px';
        windowData.element.style.height = height + 'px';
        windowData.state.size = { width, height };
    }

    addToTaskbar(windowId, config) {
        const taskbarBtn = Utils.createElement('button', {
            className: 'taskbar-app',
            'data-window-id': windowId,
            innerHTML: `
                <div class="taskbar-app-icon ${config.icon}"></div>
                <div class="taskbar-app-title">${Utils.escapeHtml(config.title)}</div>
            `
        });

        taskbarBtn.addEventListener('click', () => {
            const windowData = this.windows.get(windowId);
            if (!windowData) return;

            if (windowData.state.isMinimized) {
                this.restoreWindow(windowId);
            } else if (this.activeWindow && this.activeWindow.id === windowId) {
                this.minimizeWindow(windowId);
            } else {
                this.focusWindow(windowId);
            }
        });

        this.taskbarApps.appendChild(taskbarBtn);
    }

    removeFromTaskbar(windowId) {
        const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarBtn && taskbarBtn.parentNode) {
            taskbarBtn.parentNode.removeChild(taskbarBtn);
        }
    }

    updateTaskbarFocus(windowId) {
        // Remove active class from all taskbar buttons
        document.querySelectorAll('.taskbar-app').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to current window's button
        const taskbarBtn = document.querySelector(`[data-window-id="${windowId}"]`);
        if (taskbarBtn) {
            taskbarBtn.classList.add('active');
        }
    }

    focusNextWindow() {
        const visibleWindows = Array.from(this.windows.values())
            .filter(w => !w.state.isMinimized);

        if (visibleWindows.length > 0) {
            // Focus the topmost window
            const topWindow = visibleWindows.reduce((top, current) => {
                const topZ = parseInt(top.element.style.zIndex) || 0;
                const currentZ = parseInt(current.element.style.zIndex) || 0;
                return currentZ > topZ ? current : top;
            });
            this.focusWindow(topWindow.id);
        }
    }

    cycleWindows() {
        const visibleWindows = Array.from(this.windows.values())
            .filter(w => !w.state.isMinimized)
            .sort((a, b) => {
                const aZ = parseInt(a.element.style.zIndex) || 0;
                const bZ = parseInt(b.element.style.zIndex) || 0;
                return bZ - aZ;
            });

        if (visibleWindows.length < 2) return;

        const currentIndex = this.activeWindow ? 
            visibleWindows.findIndex(w => w.id === this.activeWindow.id) : -1;
        const nextIndex = (currentIndex + 1) % visibleWindows.length;
        
        this.focusWindow(visibleWindows[nextIndex].id);
    }

    handleViewportResize() {
        this.windows.forEach(windowData => {
            const { element, state } = windowData;
            
            if (state.isMaximized) {
                // Maximized windows adjust automatically with CSS
                return;
            }

            // Ensure windows stay within viewport
            const rect = element.getBoundingClientRect();
            const maxX = window.innerWidth - 100;
            const maxY = window.innerHeight - 100;

            if (rect.left > maxX || rect.top > maxY) {
                const newX = Math.min(rect.left, maxX);
                const newY = Math.min(rect.top, maxY);
                this.setWindowPosition(windowData.id, newX, newY);
            }
        });
    }

    // Public API methods
    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    getActiveWindow() {
        return this.activeWindow;
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    getWindowContent(windowId) {
        const windowData = this.windows.get(windowId);
        return windowData ? windowData.element.querySelector('.window-content') : null;
    }

    setWindowTitle(windowId, title) {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        const titleElement = windowData.element.querySelector('.window-title');
        const taskbarTitle = document.querySelector(`[data-window-id="${windowId}"] .taskbar-app-title`);
        
        if (titleElement) titleElement.textContent = title;
        if (taskbarTitle) taskbarTitle.textContent = title;
        
        windowData.config.title = title;
    }

    cascadeWindows() {
        let offset = 0;
        this.windows.forEach(windowData => {
            if (!windowData.state.isMaximized && !windowData.state.isMinimized) {
                this.setWindowPosition(windowData.id, 100 + offset, 100 + offset);
                offset += 30;
            }
        });
    }

    minimizeAllWindows() {
        this.windows.forEach(windowData => {
            if (!windowData.state.isMinimized) {
                this.minimizeWindow(windowData.id);
            }
        });
    }
}

// Global window manager instance
window.windowManager = new WindowManager();