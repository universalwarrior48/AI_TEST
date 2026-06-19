/**
 * Main Application Logic
 * Handles drag-drop, canvas interactions, component management, and UI updates
 */

// Application State
const state = {
    components: {},
    connections: [],
    selectedComponent: null,
    isDragging: false,
    isConnecting: false,
    connectSource: null,
    dragOffset: { x: 0, y: 0 },
    panMode: false,
    scale: 1,
    panOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 }
};

// DOM Elements
let canvasWrapper, componentsLayer, connectionsLayer, particlesLayer;
let propertiesContent, statusText, metricsSummary;
let templateSelect;

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    canvasWrapper = document.getElementById('canvas-wrapper');
    componentsLayer = document.getElementById('components-layer');
    connectionsLayer = document.getElementById('connections-layer');
    particlesLayer = document.getElementById('particles-layer');
    propertiesContent = document.getElementById('properties-content');
    statusText = document.getElementById('status-text');
    metricsSummary = document.getElementById('metrics-summary');
    templateSelect = document.getElementById('template-select');

    // Initialize event listeners
    initEventListeners();
    initPaletteDragDrop();
    populateTemplates();
    
    // Start metrics refresh loop
    setInterval(refreshMetrics, 500);
    
    updateStatus('Ready - Drag components from palette or load a template');
});

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Canvas events
    canvasWrapper.addEventListener('mousedown', handleCanvasMouseDown);
    canvasWrapper.addEventListener('mousemove', handleCanvasMouseMove);
    canvasWrapper.addEventListener('mouseup', handleCanvasMouseUp);
    canvasWrapper.addEventListener('wheel', handleWheel);
    
    // Button events
    document.getElementById('btn-start').addEventListener('click', startSimulation);
    document.getElementById('btn-stop').addEventListener('click', stopSimulation);
    document.getElementById('btn-clear').addEventListener('click', clearCanvas);
    document.getElementById('btn-export').addEventListener('click', exportConfig);
    document.getElementById('btn-connect').addEventListener('click', () => setMode('connect'));
    document.getElementById('btn-pan').addEventListener('click', () => setMode('pan'));
    
    // Template selection
    templateSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadTemplate(e.target.value);
            e.target.value = '';
        }
    });
}

/**
 * Initialize palette drag and drop
 */
function initPaletteDragDrop() {
    const paletteItems = document.querySelectorAll('.palette-item');
    
    paletteItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('component-type', item.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
        });
        
        // Reset drag state when drag ends
        item.addEventListener('dragend', () => {
            state.isDragging = false;
        });
    });
    
    componentsLayer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    componentsLayer.addEventListener('drop', handleDrop);
}

/**
 * Handle drop event on canvas
 */
function handleDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('component-type');
    
    if (!type) return;
    
    const rect = componentsLayer.getBoundingClientRect();
    const x = (e.clientX - rect.left - state.panOffset.x) / state.scale;
    const y = (e.clientY - rect.top - state.panOffset.y) / state.scale;
    
    addComponent(type, x, y);
}

/**
 * Add component to canvas
 */
function addComponent(type, x, y) {
    const component = createComponent(type, x, y);
    if (!component) return;
    
    state.components[component.id] = component;
    renderComponent(component);
    updateConnections();
    updateMetricsSummary();
    updateStatus(`Added ${getComponentType(type).name}`);
    
    // Auto-select the new component
    selectComponent(component.id);
}

/**
 * Render component on canvas
 */
function renderComponent(component) {
    const element = document.createElement('div');
    element.className = 'canvas-component';
    element.id = component.id;
    element.style.left = `${component.x}px`;
    element.style.top = `${component.y}px`;
    
    const compType = getComponentType(component.type);
    
    element.innerHTML = `
        <div class="health-indicator" id="${component.id}-health"></div>
        <div class="component-header">
            <span class="component-icon">${compType.icon}</span>
            <span>${component.name}</span>
        </div>
        <div class="component-metrics">
            <div><span class="metric-label">QPS:</span> <span class="metric-value" id="${component.id}-qps">0</span></div>
            <div><span class="metric-label">Latency:</span> <span class="metric-value" id="${component.id}-latency">0ms</span></div>
            <div><span class="metric-label">Throughput:</span> <span class="metric-value" id="${component.id}-throughput">0</span></div>
            <div><span class="metric-label">Error:</span> <span class="metric-value" id="${component.id}-error">0%</span></div>
        </div>
    `;
    
    // Component events
    element.addEventListener('mousedown', (e) => handleComponentMouseDown(e, component.id));
    element.addEventListener('dblclick', () => selectComponent(component.id));
    
    componentsLayer.appendChild(element);
}

/**
 * Handle mouse down on component
 */
function handleComponentMouseDown(e, componentId) {
    e.stopPropagation();
    
    if (state.isConnecting) {
        handleConnectClick(componentId);
        return;
    }
    
    state.isDragging = true;
    state.selectedComponent = componentId;
    
    const component = state.components[componentId];
    const rect = e.target.getBoundingClientRect();
    state.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    
    // Bring to front
    const element = document.getElementById(componentId);
    element.style.zIndex = '100';
    
    selectComponent(componentId);
}

/**
 * Handle canvas mouse down
 */
function handleCanvasMouseDown(e) {
    if (e.target !== componentsLayer && e.target !== connectionsLayer && e.target !== particlesLayer) {
        return;
    }
    
    if (state.panMode || e.button === 1) {
        state.isPanning = true;
        state.panStart = { x: e.clientX - state.panOffset.x, y: e.clientY - state.panOffset.y };
        canvasWrapper.style.cursor = 'grabbing';
    } else {
        deselectComponent();
    }
}

/**
 * Handle canvas mouse move
 */
function handleCanvasMouseMove(e) {
    if (state.isDragging && state.selectedComponent) {
        const component = state.components[state.selectedComponent];
        const rect = componentsLayer.getBoundingClientRect();
        
        component.x = (e.clientX - rect.left - state.dragOffset.x - state.panOffset.x) / state.scale;
        component.y = (e.clientY - rect.top - state.dragOffset.y - state.panOffset.y) / state.scale;
        
        const element = document.getElementById(state.selectedComponent);
        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;
        
        updateConnections();
    }
    
    if (state.isPanning) {
        state.panOffset.x = e.clientX - state.panStart.x;
        state.panOffset.y = e.clientY - state.panStart.y;
        updateTransform();
    }
}

/**
 * Handle canvas mouse up
 */
function handleCanvasMouseUp(e) {
    if (state.isDragging && state.selectedComponent) {
        const element = document.getElementById(state.selectedComponent);
        element.style.zIndex = '10';
    }
    
    state.isDragging = false;
    state.isPanning = false;
    canvasWrapper.style.cursor = 'default';
    
    saveState();
}

/**
 * Handle wheel event for zoom
 */
function handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, state.scale * delta));
    
    // Zoom towards mouse position
    const rect = canvasWrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    state.panOffset.x = mouseX - (mouseX - state.panOffset.x) * (newScale / state.scale);
    state.panOffset.y = mouseY - (mouseY - state.panOffset.y) * (newScale / state.scale);
    state.scale = newScale;
    
    updateTransform();
}

/**
 * Update canvas transform
 */
function updateTransform() {
    canvasWrapper.style.transform = `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.scale})`;
}

/**
 * Set interaction mode
 */
function setMode(mode) {
    state.panMode = mode === 'pan';
    state.isConnecting = mode === 'connect';
    
    document.getElementById('btn-pan').classList.toggle('active', state.panMode);
    document.getElementById('btn-connect').classList.toggle('active', state.isConnecting);
    
    if (state.isConnecting) {
        updateStatus('Connect Mode: Click source component, then click target component');
    } else if (state.panMode) {
        updateStatus('Pan Mode: Click and drag to pan, scroll to zoom');
    } else {
        updateStatus('Select Mode: Drag components to move, double-click to edit');
    }
}

/**
 * Handle connect mode click
 */
function handleConnectClick(componentId) {
    if (!state.connectSource) {
        state.connectSource = componentId;
        const element = document.getElementById(componentId);
        element.classList.add('connecting');
        updateStatus('Select target component to connect');
    } else {
        if (state.connectSource !== componentId) {
            addConnection(state.connectSource, componentId);
        }
        
        // Reset
        const sourceElement = document.getElementById(state.connectSource);
        if (sourceElement) {
            sourceElement.classList.remove('connecting');
        }
        state.connectSource = null;
        updateStatus('Connect Mode: Click source component to start connection');
    }
}

/**
 * Add connection between components
 */
function addConnection(fromId, toId) {
    // Check if connection already exists
    const exists = state.connections.some(
        c => c.from === fromId && c.to === toId
    );
    
    if (exists) {
        updateStatus('Connection already exists');
        return;
    }
    
    state.connections.push({ from: fromId, to: toId });
    updateConnections();
    updateMetricsSummary();
    updateStatus(`Connected ${state.components[fromId].name} → ${state.components[toId].name}`);
    saveState();
}

/**
 * Update connection lines
 */
function updateConnections() {
    connectionsLayer.innerHTML = '';
    
    for (const conn of state.connections) {
        const fromComp = state.components[conn.from];
        const toComp = state.components[conn.to];
        
        if (!fromComp || !toComp) continue;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        const startX = fromComp.x + 70;
        const startY = fromComp.y + 40;
        const endX = toComp.x + 70;
        const endY = toComp.y + 40;
        
        // Create curved path
        const controlX1 = startX + (endX - startX) / 2;
        const controlY1 = startY;
        const controlX2 = startX + (endX - startX) / 2;
        const controlY2 = endY;
        
        const d = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-line');
        
        // Click to remove connection
        path.addEventListener('click', () => {
            if (confirm('Remove this connection?')) {
                state.connections = state.connections.filter(
                    c => !(c.from === conn.from && c.to === conn.to)
                );
                updateConnections();
                updateMetricsSummary();
                saveState();
            }
        });
        
        connectionsLayer.appendChild(path);
    }
}

/**
 * Select component
 */
function selectComponent(componentId) {
    deselectComponent();
    
    state.selectedComponent = componentId;
    const element = document.getElementById(componentId);
    if (element) {
        element.classList.add('selected');
    }
    
    showProperties(componentId);
}

/**
 * Deselect component
 */
function deselectComponent() {
    if (state.selectedComponent) {
        const element = document.getElementById(state.selectedComponent);
        if (element) {
            element.classList.remove('selected');
        }
    }
    state.selectedComponent = null;
    propertiesContent.innerHTML = '<p class="empty-state">Select a component to edit properties</p>';
}

/**
 * Show properties panel for component
 */
function showProperties(componentId) {
    const component = state.components[componentId];
    if (!component) return;
    
    const compType = getComponentType(component.type);
    
    let configHtml = '';
    for (const [key, value] of Object.entries(component.config)) {
        const inputType = typeof value === 'boolean' ? 'checkbox' : 
                         typeof value === 'number' ? 'number' : 'text';
        
        configHtml += `
            <div class="property-group">
                <label>${key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <input type="${inputType}" 
                       data-key="${key}" 
                       value="${value}"
                       ${inputType === 'checkbox' && value ? 'checked' : ''}>
            </div>
        `;
    }
    
    propertiesContent.innerHTML = `
        <div class="property-group">
            <label>Name</label>
            <input type="text" id="prop-name" value="${component.name}">
        </div>
        <div class="property-group">
            <label>Type</label>
            <input type="text" value="${compType.name}" disabled>
        </div>
        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">Configuration</h4>
        ${configHtml}
        <button class="btn btn-danger" onclick="deleteComponent('${componentId}')" style="width: 100%; margin-top: 16px;">
            🗑 Delete Component
        </button>
    `;
    
    // Add event listeners to inputs
    const nameInput = document.getElementById('prop-name');
    nameInput.addEventListener('change', (e) => {
        component.name = e.target.value;
        const element = document.getElementById(componentId);
        element.querySelector('.component-header span:last-child').textContent = component.name;
        saveState();
    });
    
    const configInputs = propertiesContent.querySelectorAll('[data-key]');
    configInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.type === 'checkbox' ? e.target.checked : 
                         typeof component.config[key] === 'number' ? parseFloat(e.target.value) : e.target.value;
            
            component.config[key] = value;
            simulationEngine.update(state.components, state.connections);
            saveState();
        });
    });
}

/**
 * Delete component
 */
function deleteComponent(componentId) {
    if (!confirm('Delete this component and all its connections?')) return;
    
    // Remove component
    delete state.components[componentId];
    
    // Remove associated connections
    state.connections = state.connections.filter(
        c => c.from !== componentId && c.to !== componentId
    );
    
    // Remove from DOM
    const element = document.getElementById(componentId);
    if (element) {
        element.remove();
    }
    
    deselectComponent();
    updateConnections();
    updateMetricsSummary();
    saveState();
}

/**
 * Start simulation
 */
async function startSimulation() {
    if (Object.keys(state.components).length === 0) {
        updateStatus('Add components first');
        return;
    }
    
    // Save state to backend and start simulation
    await saveState();
    fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: true })
    });
    
    simulationEngine.start(state.components, state.connections);
    updateStatus('Simulation running');
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
}

/**
 * Stop simulation
 */
async function stopSimulation() {
    // Stop backend simulation
    await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: false })
    });
    
    simulationEngine.stop();
    updateStatus('Simulation stopped');
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    
    // Clear metrics display
    for (const compId in state.components) {
        updateComponentMetrics(compId, { qps: 0, latency: 0, throughput: 0, errorRate: 0, health: 'healthy' });
    }
    updateMetricsSummary();
}

/**
 * Refresh metrics from simulation engine
 */
async function refreshMetrics() {
    // Get metrics from backend
    try {
        const response = await fetch('/api/metrics');
        const backendMetrics = await response.json();
        
        // Use backend metrics if available, otherwise use local engine metrics
        const metrics = Object.keys(backendMetrics).length > 0 ? backendMetrics : simulationEngine.getMetrics();
        
        for (const compId in metrics) {
            updateComponentMetrics(compId, metrics[compId]);
        }
        
        // Update status bar with running state
        updateMetricsSummary();
    } catch (e) {
        console.error('Failed to refresh metrics:', e);
    }
}

/**
 * Update component metrics display
 */
function updateComponentMetrics(componentId, metrics) {
    const qpsEl = document.getElementById(`${componentId}-qps`);
    const latencyEl = document.getElementById(`${componentId}-latency`);
    const throughputEl = document.getElementById(`${componentId}-throughput`);
    const errorEl = document.getElementById(`${componentId}-error`);
    const healthEl = document.getElementById(`${componentId}-health`);
    
    if (qpsEl) qpsEl.textContent = Math.round(metrics.qps);
    if (latencyEl) latencyEl.textContent = Math.round(metrics.latency) + 'ms';
    if (throughputEl) throughputEl.textContent = Math.round(metrics.throughput);
    if (errorEl) errorEl.textContent = metrics.errorRate.toFixed(1) + '%';
    
    if (healthEl) {
        healthEl.className = 'health-indicator';
        if (metrics.health === 'degraded') {
            healthEl.classList.add('degraded');
        } else if (metrics.health === 'unhealthy') {
            healthEl.classList.add('unhealthy');
        }
    }
}

/**
 * Load template
 */
function loadTemplate(templateId) {
    const template = getTemplate(templateId);
    if (!template) return;
    
    clearCanvas();
    
    // Add components
    for (const compData of template.components) {
        const component = createComponent(compData.type, compData.x, compData.y);
        component.id = compData.id;
        component.name = compData.id;
        component.config = { ...component.config, ...compData.config };
        state.components[compData.id] = component;
        renderComponent(component);
    }
    
    // Add connections
    state.connections = [...template.connections];
    updateConnections();
    
    updateMetricsSummary();
    updateStatus(`Loaded template: ${template.name}`);
    saveState();
}

/**
 * Populate template dropdown
 */
function populateTemplates() {
    const templates = getAllTemplates();
    
    for (const template of templates) {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    }
}

/**
 * Clear canvas
 */
function clearCanvas() {
    stopSimulation();
    
    state.components = {};
    state.connections = [];
    componentsLayer.innerHTML = '';
    connectionsLayer.innerHTML = '';
    
    deselectComponent();
    updateMetricsSummary();
    updateStatus('Canvas cleared');
}

/**
 * Export configuration
 */
function exportConfig() {
    const config = {
        components: state.components,
        connections: state.connections
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-design-config.json';
    a.click();
    
    URL.revokeObjectURL(url);
    updateStatus('Configuration exported');
}

/**
 * Save state to localStorage
 */
function saveState() {
    const config = {
        components: state.components,
        connections: state.connections
    };
    localStorage.setItem('systemDesignLab', JSON.stringify(config));
}

/**
 * Load saved state
 */
function loadSavedState() {
    const saved = localStorage.getItem('systemDesignLab');
    if (!saved) return;
    
    try {
        const config = JSON.parse(saved);
        
        clearCanvas();
        
        for (const [id, compData] of Object.entries(config.components)) {
            const component = createComponent(compData.type, compData.x, compData.y);
            component.id = id;
            component.name = compData.name;
            component.config = compData.config;
            state.components[id] = component;
            renderComponent(component);
        }
        
        state.connections = config.connections || [];
        updateConnections();
        updateMetricsSummary();
        updateStatus('Loaded saved configuration');
    } catch (e) {
        console.error('Failed to load saved state:', e);
    }
}

/**
 * Update metrics summary
 */
function updateMetricsSummary() {
    const compCount = Object.keys(state.components).length;
    const connCount = state.connections.length;
    const isRunning = simulationEngine.running ? 'Running' : 'Stopped';
    metricsSummary.textContent = `Components: ${compCount} | Connections: ${connCount} | Status: ${isRunning}`;
}

/**
 * Update status bar
 */
function updateStatus(message) {
    statusText.textContent = message;
}

// Try to load saved state on startup
setTimeout(loadSavedState, 100);
