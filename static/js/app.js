// Main Application - Handles UI, drag-drop, canvas, and user interactions

class SystemDesignApp {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        this.connectionsSvg = document.getElementById('connectionsSvg');
        this.propertiesPanel = document.getElementById('propertiesPanel');
        this.propertiesContent = document.getElementById('propertiesContent');
        this.metricsContent = document.getElementById('metricsContent');
        
        this.components = [];
        this.connections = [];
        this.selectedComponent = null;
        this.isConnecting = false;
        this.connectionStart = null;
        this.simulationId = null;
        this.simulationEngine = new SimulationEngine();
        
        // Canvas pan/zoom
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.startPanX = 0;
        this.startPanY = 0;
        
        // Drag state
        this.draggedComponent = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupDragDrop();
        this.setupCanvasControls();
        this.loadTemplates();
        this.updateCanvasSize();
        
        // Auto-resize canvas on window resize
        window.addEventListener('resize', () => this.updateCanvasSize());
    }
    
    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('newBtn')?.addEventListener('click', () => this.newSimulation());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.saveSimulation());
        document.getElementById('loadBtn')?.addEventListener('click', () => this.loadSimulationDialog());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportSimulation());
        document.getElementById('startBtn')?.addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stopSimulation());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearCanvas());
        
        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoom(0.1));
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoom(-0.1));
        document.getElementById('zoomReset')?.addEventListener('click', () => this.resetZoom());
        
        // Connection mode cancel
        document.getElementById('cancelConnection')?.addEventListener('click', () => this.cancelConnectionMode());
    }
    
    setupDragDrop() {
        // Palette items drag
        document.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('type', item.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
        
        // Canvas drop
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('type');
            if (type) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.scale;
                const y = (e.clientY - rect.top) / this.scale;
                this.addComponent(type, x, y);
            }
        });
    }
    
    setupCanvasControls() {
        // Pan with middle mouse button or space+drag
        this.canvasWrapper.addEventListener('mousedown', (e) => {
            if (e.button === 1 || (e.button === 0 && e.target === this.connectionsSvg)) {
                this.isPanning = true;
                this.startPanX = e.clientX - this.panX;
                this.startPanY = e.clientY - this.panY;
                e.preventDefault();
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.panX = e.clientX - this.startPanX;
                this.panY = e.clientY - this.startPanY;
                this.applyTransform();
            } else if (this.draggedComponent) {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.scale - this.dragOffsetX;
                const y = (e.clientY - rect.top) / this.scale - this.dragOffsetY;
                this.moveComponent(this.draggedComponent, x, y);
            }
        });
        
        window.addEventListener('mouseup', () => {
            this.isPanning = false;
            this.draggedComponent = null;
        });
        
        // Mouse wheel zoom
        this.canvasWrapper.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            this.zoom(delta);
        });
    }
    
    applyTransform() {
        this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
        this.connectionsSvg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }
    
    zoom(delta) {
        this.scale = Math.max(0.5, Math.min(2, this.scale + delta));
        this.applyTransform();
    }
    
    resetZoom() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
    }
    
    updateCanvasSize() {
        const container = document.querySelector('.canvas-container');
        if (container) {
            const width = Math.max(container.clientWidth, 3000);
            const height = Math.max(container.clientHeight, 2000);
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            this.connectionsSvg.style.width = `${width}px`;
            this.connectionsSvg.style.height = `${height}px`;
        }
    }
    
    addComponent(type, x, y) {
        const id = generateId();
        const config = getComponentDefaultConfig(type);
        
        const component = {
            id,
            type,
            x,
            y,
            config
        };
        
        this.components.push(component);
        this.renderComponent(component);
        this.selectComponent(id);
    }
    
    renderComponent(component) {
        const el = document.createElement('div');
        el.className = 'component';
        el.dataset.componentId = component.id;
        el.dataset.type = component.type;
        el.style.left = `${component.x}px`;
        el.style.top = `${component.y}px`;
        
        const icon = getComponentIcon(component.type);
        const name = getComponentDisplayName(component.type);
        const color = COMPONENT_TYPES[component.type]?.color || '#888';
        
        el.innerHTML = `
            <div class="component-header" style="background-color: ${color}">
                <span class="component-icon">${icon}</span>
                <span class="component-name">${name}</span>
            </div>
            <div class="component-body">
                <div class="component-id">${component.id.substring(0, 8)}</div>
            </div>
            <div class="component-metrics"></div>
        `;
        
        // Component click
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.isConnecting) {
                this.handleConnectionClick(component.id);
            } else {
                this.selectComponent(component.id);
            }
        });
        
        // Right-click for context menu
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, component.id);
        });
        
        // Drag to move
        el.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !this.isConnecting) {
                this.draggedComponent = component.id;
                const rect = el.getBoundingClientRect();
                const canvasRect = this.canvas.getBoundingClientRect();
                this.dragOffsetX = (e.clientX - rect.left) / this.scale;
                this.dragOffsetY = (e.clientY - rect.top) / this.scale;
            }
        });
        
        this.canvas.appendChild(el);
    }
    
    moveComponent(id, x, y) {
        const component = this.components.find(c => c.id === id);
        if (component) {
            component.x = x;
            component.y = y;
            const el = document.querySelector(`[data-component-id="${id}"]`);
            if (el) {
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                this.drawConnections();
            }
        }
    }
    
    selectComponent(id) {
        // Deselect previous
        document.querySelectorAll('.component.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        this.selectedComponent = id;
        const el = document.querySelector(`[data-component-id="${id}"]`);
        if (el) {
            el.classList.add('selected');
        }
        
        this.showProperties(id);
    }
    
    showProperties(id) {
        const component = this.components.find(c => c.id === id);
        if (!component) return;
        
        const config = component.config || {};
        let fields = '';
        
        for (const [key, value] of Object.entries(config)) {
            const inputType = typeof value === 'number' ? 'number' : 'text';
            const step = typeof value === 'number' && value % 1 !== 0 ? '0.01' : '1';
            fields += `
                <div class="property-field">
                    <label>${key.replace(/_/g, ' ')}:</label>
                    <input type="${inputType}" step="${step}" data-key="${key}" value="${value}">
                </div>
            `;
        }
        
        this.propertiesContent.innerHTML = `
            <h4>${getComponentDisplayName(component.type)}</h4>
            <p class="component-info">ID: ${component.id}</p>
            <div class="properties-form">
                ${fields}
            </div>
            <button class="btn btn-danger btn-small" onclick="app.deleteComponent('${id}')">Delete</button>
        `;
        
        // Add event listeners to inputs
        this.propertiesContent.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', (e) => {
                const key = e.target.dataset.key;
                let value = e.target.value;
                if (e.target.type === 'number') {
                    value = parseFloat(value);
                }
                if (component.config) {
                    component.config[key] = value;
                }
            });
        });
    }
    
    deleteComponent(id) {
        // Remove from array
        this.components = this.components.filter(c => c.id !== id);
        
        // Remove connections
        this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
        
        // Remove from DOM
        const el = document.querySelector(`[data-component-id="${id}"]`);
        if (el) {
            el.remove();
        }
        
        this.drawConnections();
        this.propertiesContent.innerHTML = '<p class="no-selection">Select a component to edit properties</p>';
    }
    
    showContextMenu(e, id) {
        // For future implementation
        console.log('Context menu for', id);
    }
    
    // Connection handling
    startConnectionMode() {
        this.isConnecting = true;
        this.connectionStart = null;
        document.getElementById('connectionMode')?.classList.remove('hidden');
    }
    
    handleConnectionClick(id) {
        if (!this.connectionStart) {
            this.connectionStart = id;
            const el = document.querySelector(`[data-component-id="${id}"]`);
            if (el) {
                el.classList.add('connecting');
            }
        } else {
            if (this.connectionStart !== id) {
                // Check if connection already exists
                const exists = this.connections.some(
                    c => (c.from === this.connectionStart && c.to === id) ||
                         (c.from === id && c.to === this.connectionStart)
                );
                
                if (!exists) {
                    this.connections.push({
                        from: this.connectionStart,
                        to: id
                    });
                    this.drawConnections();
                }
            }
            
            // Reset connection mode
            document.querySelectorAll('.component.connecting').forEach(el => {
                el.classList.remove('connecting');
            });
            this.cancelConnectionMode();
        }
    }
    
    cancelConnectionMode() {
        this.isConnecting = false;
        this.connectionStart = null;
        document.querySelectorAll('.component.connecting').forEach(el => {
            el.classList.remove('connecting');
        });
        document.getElementById('connectionMode')?.classList.add('hidden');
    }
    
    drawConnections() {
        this.simulationEngine.drawConnections(this.connections);
    }
    
    // Simulation control
    async startSimulation() {
        if (this.components.length === 0) {
            alert('Please add components first');
            return;
        }
        
        try {
            // Create or update simulation
            if (!this.simulationId) {
                const response = await fetch('/api/simulations', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        name: 'My Simulation',
                        components: this.components,
                        connections: this.connections
                    })
                });
                const data = await response.json();
                this.simulationId = data.id;
            } else {
                await fetch(`/api/simulations/${this.simulationId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        components: this.components,
                        connections: this.connections
                    })
                });
            }
            
            // Start simulation
            await fetch(`/api/simulations/${this.simulationId}/start`, {
                method: 'POST'
            });
            
            // Start engine
            await this.simulationEngine.start(this.simulationId, this.components, this.connections);
            
            this.updateMetricsPanel();
        } catch (error) {
            console.error('Error starting simulation:', error);
            alert('Error starting simulation');
        }
    }
    
    async stopSimulation() {
        if (this.simulationId) {
            await fetch(`/api/simulations/${this.simulationId}/stop`, {
                method: 'POST'
            });
        }
        
        this.simulationEngine.stop();
        this.metricsContent.innerHTML = '<p class="no-metrics">Simulation stopped</p>';
    }
    
    updateMetricsPanel() {
        // Metrics are updated by the simulation engine
    }
    
    // Template loading
    loadTemplates() {
        if (window.loadTemplates) {
            window.loadTemplates();
        }
    }
    
    loadTemplate(template) {
        this.clearCanvas();
        
        // Add components
        template.components.forEach(comp => {
            this.components.push({
                id: comp.id,
                type: comp.type,
                x: comp.x,
                y: comp.y,
                config: comp.config || getComponentDefaultConfig(comp.type)
            });
            this.renderComponent(this.components[this.components.length - 1]);
        });
        
        // Add connections
        this.connections = template.connections || [];
        this.drawConnections();
    }
    
    clearCanvas() {
        this.stopSimulation();
        this.components = [];
        this.connections = [];
        this.canvas.innerHTML = '';
        this.connectionsSvg.innerHTML = '';
        this.propertiesContent.innerHTML = '<p class="no-selection">Select a component to edit properties</p>';
        this.metricsContent.innerHTML = '<p class="no-metrics">Start simulation to see metrics</p>';
        this.simulationId = null;
    }
    
    // Save/Load/Export
    newSimulation() {
        if (confirm('Clear current simulation?')) {
            this.clearCanvas();
        }
    }
    
    saveSimulation() {
        const data = {
            components: this.components,
            connections: this.connections
        };
        localStorage.setItem('systemDesignSim', JSON.stringify(data));
        alert('Simulation saved locally');
    }
    
    loadSimulationDialog() {
        const saved = localStorage.getItem('systemDesignSim');
        if (saved) {
            const data = JSON.parse(saved);
            this.clearCanvas();
            this.components = data.components || [];
            this.connections = data.connections || [];
            
            this.components.forEach(comp => this.renderComponent(comp));
            this.drawConnections();
        } else {
            alert('No saved simulation found');
        }
    }
    
    exportSimulation() {
        const data = {
            components: this.components,
            connections: this.connections,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-design-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SystemDesignApp();
    window.app = app;
});
