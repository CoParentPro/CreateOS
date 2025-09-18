// Desktop Manager for CreateOS - Handles desktop interactions and icon management

class DesktopManager {
    constructor() {
        this.desktop = document.getElementById('desktop');
        this.desktopIcons = document.querySelector('.desktop-icons');
        this.contextMenu = document.getElementById('context-menu');
        this.selectedIcons = new Set();
        this.selectionRectangle = null;
        this.isSelecting = false;
        this.wallpapers = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        ];
        this.currentWallpaper = 0;

        this.initializeEventListeners();
        this.loadDesktopSettings();
    }

    initializeEventListeners() {
        // Desktop icon clicks
        this.desktopIcons.addEventListener('click', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.handleIconClick(icon, e);
            }
        });

        // Desktop icon double-clicks
        this.desktopIcons.addEventListener('dblclick', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.openApplication(icon.dataset.app);
            }
        });

        // Desktop background interactions
        this.desktop.addEventListener('mousedown', (e) => {
            if (e.target === this.desktop || e.target.classList.contains('desktop-background')) {
                this.handleDesktopMouseDown(e);
            }
        });

        // Context menu
        this.desktop.addEventListener('contextmenu', (e) => {
            if (e.target === this.desktop || e.target.classList.contains('desktop-background')) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        // Click outside to hide context menu
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });

        // Context menu actions
        this.contextMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-item');
            if (item) {
                this.handleContextMenuAction(item.dataset.action);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a' && document.activeElement === document.body) {
                e.preventDefault();
                this.selectAllIcons();
            }
            if (e.key === 'Delete' && this.selectedIcons.size > 0) {
                this.deleteSelectedIcons();
            }
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshDesktop();
            }
            if (e.key === 'Escape') {
                this.clearSelection();
                this.hideContextMenu();
            }
        });

        // Drag and drop for desktop icons
        this.initializeDragAndDrop();
    }

    handleIconClick(icon, event) {
        if (event.ctrlKey) {
            // Toggle selection with Ctrl+click
            this.toggleIconSelection(icon);
        } else if (event.shiftKey && this.selectedIcons.size > 0) {
            // Range selection with Shift+click
            this.selectIconRange(icon);
        } else {
            // Single selection
            this.clearSelection();
            this.selectIcon(icon);
        }
    }

    selectIcon(icon) {
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }

    toggleIconSelection(icon) {
        if (this.selectedIcons.has(icon)) {
            icon.classList.remove('selected');
            this.selectedIcons.delete(icon);
        } else {
            this.selectIcon(icon);
        }
    }

    clearSelection() {
        this.selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
        this.selectedIcons.clear();
    }

    selectAllIcons() {
        this.clearSelection();
        const icons = this.desktopIcons.querySelectorAll('.desktop-icon');
        icons.forEach(icon => this.selectIcon(icon));
    }

    selectIconRange(targetIcon) {
        const icons = Array.from(this.desktopIcons.querySelectorAll('.desktop-icon'));
        const lastSelected = Array.from(this.selectedIcons)[this.selectedIcons.size - 1];
        
        if (!lastSelected) {
            this.selectIcon(targetIcon);
            return;
        }

        const startIndex = icons.indexOf(lastSelected);
        const endIndex = icons.indexOf(targetIcon);
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);

        for (let i = start; i <= end; i++) {
            this.selectIcon(icons[i]);
        }
    }

    handleDesktopMouseDown(e) {
        if (e.button !== 0) return; // Only left mouse button

        this.clearSelection();
        this.startSelectionRectangle(e);
    }

    startSelectionRectangle(e) {
        this.isSelecting = true;
        const startX = e.clientX;
        const startY = e.clientY;

        this.selectionRectangle = Utils.createElement('div', {
            className: 'selection-rectangle'
        });

        this.desktop.appendChild(this.selectionRectangle);

        const onMouseMove = (e) => {
            if (!this.isSelecting) return;

            const currentX = e.clientX;
            const currentY = e.clientY;
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            this.selectionRectangle.style.left = left + 'px';
            this.selectionRectangle.style.top = top + 'px';
            this.selectionRectangle.style.width = width + 'px';
            this.selectionRectangle.style.height = height + 'px';

            this.updateSelectionFromRectangle(left, top, width, height);
        };

        const onMouseUp = () => {
            this.isSelecting = false;
            if (this.selectionRectangle) {
                this.selectionRectangle.remove();
                this.selectionRectangle = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    updateSelectionFromRectangle(left, top, width, height) {
        const icons = this.desktopIcons.querySelectorAll('.desktop-icon');
        
        this.clearSelection();
        
        icons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            
            // Check if icon intersects with selection rectangle
            if (rect.left < left + width &&
                rect.right > left &&
                rect.top < top + height &&
                rect.bottom > top) {
                this.selectIcon(icon);
            }
        });
    }

    showContextMenu(x, y) {
        // Position context menu
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.style.display = 'block';

        // Adjust position if menu goes off-screen
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = (y - rect.height) + 'px';
        }
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
    }

    handleContextMenuAction(action) {
        this.hideContextMenu();

        switch (action) {
            case 'refresh':
                this.refreshDesktop();
                break;
            case 'personalize':
                this.openPersonalization();
                break;
            case 'new-folder':
                this.createNewFolder();
                break;
            case 'properties':
                this.showDesktopProperties();
                break;
        }
    }

    refreshDesktop() {
        // Refresh desktop icons and layout
        Utils.showNotification('Desktop', 'Desktop refreshed', 'success', 2000);
        
        // Animate refresh
        this.desktopIcons.style.opacity = '0.5';
        setTimeout(() => {
            this.desktopIcons.style.opacity = '1';
        }, 200);
    }

    openPersonalization() {
        const personalizationContent = `
            <div class="personalization-panel">
                <h3>Personalization</h3>
                
                <div class="setting-group">
                    <label>Wallpaper</label>
                    <div class="wallpaper-grid">
                        ${this.wallpapers.map((bg, index) => `
                            <div class="wallpaper-option ${index === this.currentWallpaper ? 'active' : ''}" 
                                 data-index="${index}" 
                                 style="background: ${bg}; width: 60px; height: 40px; border-radius: 4px; cursor: pointer; border: 2px solid ${index === this.currentWallpaper ? '#0078d4' : '#ccc'};">
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="setting-group">
                    <label>Desktop Icons</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Show desktop icons
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" checked> Auto-arrange icons
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <label>Theme</label>
                    <select class="theme-select">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-button" onclick="window.desktopManager.closePersonalization()">Cancel</button>
                    <button class="modal-button primary" onclick="window.desktopManager.applyPersonalization()">Apply</button>
                </div>
            </div>
        `;

        const windowId = windowManager.createWindow({
            title: 'Personalization',
            icon: 'settings-icon',
            content: personalizationContent,
            width: 400,
            height: 500,
            x: (window.innerWidth - 400) / 2,
            y: (window.innerHeight - 500) / 2
        });

        // Add event listeners for wallpaper selection
        setTimeout(() => {
            const wallpaperOptions = document.querySelectorAll('.wallpaper-option');
            wallpaperOptions.forEach(option => {
                option.addEventListener('click', () => {
                    wallpaperOptions.forEach(o => {
                        o.classList.remove('active');
                        o.style.borderColor = '#ccc';
                    });
                    option.classList.add('active');
                    option.style.borderColor = '#0078d4';
                });
            });
        }, 100);
    }

    applyPersonalization() {
        const activeWallpaper = document.querySelector('.wallpaper-option.active');
        if (activeWallpaper) {
            const index = parseInt(activeWallpaper.dataset.index);
            this.changeWallpaper(index);
        }

        const showIcons = document.querySelector('input[type="checkbox"]').checked;
        this.desktopIcons.style.display = showIcons ? 'grid' : 'none';

        this.saveDesktopSettings();
        this.closePersonalization();
        Utils.showNotification('Personalization', 'Settings applied successfully', 'success');
    }

    closePersonalization() {
        // Close the personalization window
        const windows = windowManager.getAllWindows();
        const personalizationWindow = windows.find(w => w.config.title === 'Personalization');
        if (personalizationWindow) {
            windowManager.closeWindow(personalizationWindow.id);
        }
    }

    changeWallpaper(index) {
        if (index >= 0 && index < this.wallpapers.length) {
            this.currentWallpaper = index;
            const background = document.querySelector('.desktop-background');
            background.style.background = this.wallpapers[index];
            
            // Smooth transition
            background.style.transition = 'background 0.5s ease';
            setTimeout(() => {
                background.style.transition = '';
            }, 500);
        }
    }

    createNewFolder() {
        const folderName = prompt('Enter folder name:', 'New Folder');
        if (folderName) {
            this.addDesktopIcon({
                name: folderName,
                icon: 'file-explorer-icon',
                type: 'folder',
                app: 'file-explorer'
            });
        }
    }

    addDesktopIcon(iconData) {
        const icon = Utils.createElement('div', {
            className: 'desktop-icon',
            'data-app': iconData.app,
            'data-type': iconData.type || 'app',
            innerHTML: `
                <div class="icon-image ${iconData.icon}"></div>
                <div class="icon-label">${Utils.escapeHtml(iconData.name)}</div>
            `
        });

        this.desktopIcons.appendChild(icon);
        
        // Animate in
        icon.style.opacity = '0';
        icon.style.transform = 'scale(0.8)';
        setTimeout(() => {
            icon.style.transition = 'all 0.3s ease';
            icon.style.opacity = '1';
            icon.style.transform = 'scale(1)';
        }, 50);
    }

    deleteSelectedIcons() {
        if (this.selectedIcons.size === 0) return;

        const confirmed = confirm(`Delete ${this.selectedIcons.size} item(s)?`);
        if (confirmed) {
            this.selectedIcons.forEach(icon => {
                // Animate out
                icon.style.transition = 'all 0.3s ease';
                icon.style.opacity = '0';
                icon.style.transform = 'scale(0.8)';
                
                setTimeout(() => {
                    if (icon.parentNode) {
                        icon.parentNode.removeChild(icon);
                    }
                }, 300);
            });
            
            this.selectedIcons.clear();
        }
    }

    showDesktopProperties() {
        const propertiesContent = `
            <div class="properties-panel">
                <h3>Desktop Properties</h3>
                
                <div class="property-group">
                    <label>Resolution:</label>
                    <span>${window.screen.width} x ${window.screen.height}</span>
                </div>
                
                <div class="property-group">
                    <label>Color Depth:</label>
                    <span>${window.screen.colorDepth} bit</span>
                </div>
                
                <div class="property-group">
                    <label>Desktop Icons:</label>
                    <span>${this.desktopIcons.children.length}</span>
                </div>
                
                <div class="property-group">
                    <label>Available Space:</label>
                    <span>Calculating...</span>
                </div>
                
                <div class="modal-actions">
                    <button class="modal-button primary" onclick="window.desktopManager.closeProperties()">OK</button>
                </div>
            </div>
        `;

        windowManager.createWindow({
            title: 'Desktop Properties',
            icon: 'settings-icon',
            content: propertiesContent,
            width: 350,
            height: 300,
            x: (window.innerWidth - 350) / 2,
            y: (window.innerHeight - 300) / 2
        });
    }

    closeProperties() {
        const windows = windowManager.getAllWindows();
        const propertiesWindow = windows.find(w => w.config.title === 'Desktop Properties');
        if (propertiesWindow) {
            windowManager.closeWindow(propertiesWindow.id);
        }
    }

    initializeDragAndDrop() {
        let draggedIcon = null;
        let dragOffset = { x: 0, y: 0 };

        this.desktopIcons.addEventListener('mousedown', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (!icon || e.button !== 0) return;

            draggedIcon = icon;
            const rect = icon.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            icon.style.zIndex = '1000';
            icon.style.pointerEvents = 'none';

            const onMouseMove = (e) => {
                if (!draggedIcon) return;

                const newX = e.clientX - dragOffset.x;
                const newY = e.clientY - dragOffset.y;

                // Constrain to desktop area
                const maxX = this.desktop.clientWidth - icon.clientWidth;
                const maxY = this.desktop.clientHeight - 40 - icon.clientHeight; // Account for taskbar

                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));

                draggedIcon.style.position = 'absolute';
                draggedIcon.style.left = constrainedX + 'px';
                draggedIcon.style.top = constrainedY + 'px';
            };

            const onMouseUp = () => {
                if (draggedIcon) {
                    draggedIcon.style.zIndex = '';
                    draggedIcon.style.pointerEvents = '';
                    draggedIcon = null;
                }
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    openApplication(appName) {
        eventBus.emit('openApp', { app: appName });
    }

    saveDesktopSettings() {
        const settings = {
            wallpaper: this.currentWallpaper,
            iconPositions: this.getIconPositions(),
            showIcons: this.desktopIcons.style.display !== 'none'
        };
        Utils.saveToStorage('desktop-settings', settings);
    }

    loadDesktopSettings() {
        const settings = Utils.loadFromStorage('desktop-settings');
        if (settings) {
            if (settings.wallpaper !== undefined) {
                this.changeWallpaper(settings.wallpaper);
            }
            if (settings.showIcons === false) {
                this.desktopIcons.style.display = 'none';
            }
            if (settings.iconPositions) {
                this.restoreIconPositions(settings.iconPositions);
            }
        }
    }

    getIconPositions() {
        const positions = {};
        const icons = this.desktopIcons.querySelectorAll('.desktop-icon');
        icons.forEach((icon, index) => {
            if (icon.style.position === 'absolute') {
                positions[icon.dataset.app || index] = {
                    left: icon.style.left,
                    top: icon.style.top
                };
            }
        });
        return positions;
    }

    restoreIconPositions(positions) {
        const icons = this.desktopIcons.querySelectorAll('.desktop-icon');
        icons.forEach((icon, index) => {
            const key = icon.dataset.app || index;
            if (positions[key]) {
                icon.style.position = 'absolute';
                icon.style.left = positions[key].left;
                icon.style.top = positions[key].top;
            }
        });
    }

    // Auto-arrange icons in a grid
    arrangeIcons() {
        const icons = Array.from(this.desktopIcons.querySelectorAll('.desktop-icon'));
        const iconWidth = 100;
        const iconHeight = 100;
        const padding = 20;
        const startX = padding;
        const startY = padding;
        const maxColumns = Math.floor((this.desktop.clientWidth - padding) / iconWidth);

        icons.forEach((icon, index) => {
            const row = Math.floor(index / maxColumns);
            const col = index % maxColumns;
            
            icon.style.position = 'absolute';
            icon.style.left = (startX + col * iconWidth) + 'px';
            icon.style.top = (startY + row * iconHeight) + 'px';
            icon.style.transition = 'all 0.3s ease';
        });

        setTimeout(() => {
            icons.forEach(icon => {
                icon.style.transition = '';
            });
        }, 300);
    }

    // Get desktop statistics
    getDesktopStats() {
        return {
            iconCount: this.desktopIcons.children.length,
            selectedCount: this.selectedIcons.size,
            wallpaper: this.currentWallpaper,
            resolution: `${window.screen.width}x${window.screen.height}`
        };
    }
}

// Global desktop manager instance
window.desktopManager = new DesktopManager();