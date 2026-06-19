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

// Simulation running state
let simulationRunning = false;

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

    // Initialize simulation engine immediately
    window.simulationEngine = new SimulationEngine();
    
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
    document.getElementById('btn-dashboard').addEventListener('click', openDashboard);
    
    // Check if autofit button exists (might not be in all templates)
    const autofitBtn = document.getElementById('btn-autofit');
    if (autofitBtn) {
        autofitBtn.addEventListener('click', autofitComponents);
    }
    
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
        <div class="component-status" id="${component.id}-status-badge">Active</div>
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
    element.addEventListener('contextmenu', (e) => handleComponentContextMenu(e, component.id));
    
    componentsLayer.appendChild(element);
}

/**
 * Handle right-click context menu on component
 */
function handleComponentContextMenu(e, componentId) {
    e.preventDefault();
    e.stopPropagation();
    
    const component = state.components[componentId];
    if (!component) return;
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'absolute';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;
    menu.style.background = '#1a1d24';
    menu.style.border = '1px solid #2d3342';
    menu.style.borderRadius = '6px';
    menu.style.padding = '8px 0';
    menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    menu.style.zIndex = '10000';
    menu.innerHTML = `
        <div class="context-menu-item" data-action="disconnect">🔌 Disconnect Component</div>
        <div class="context-menu-item" data-action="delete">🗑 Delete Component</div>
    `;
    menu.style.color = '#e4e7eb';
    menu.style.fontSize = '13px';
    menu.style.cursor = 'pointer';
    
    document.body.appendChild(menu);
    
    // Add hover effects
    const items = menu.querySelectorAll('.context-menu-item');
    items.forEach(item => {
        item.style.padding = '8px 16px';
        item.style.transition = 'background 0.2s';
        item.addEventListener('mouseenter', () => {
            item.style.background = '#2d3342';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
    });
    
    // Handle clicks
    menu.querySelector('[data-action="disconnect"]').addEventListener('click', () => {
        disconnectComponent(componentId);
        document.body.removeChild(menu);
    });
    
    menu.querySelector('[data-action="delete"]').addEventListener('click', () => {
        deleteComponent(componentId);
        document.body.removeChild(menu);
    });
    
    // Close menu on click elsewhere
    const closeMenu = () => {
        if (document.body.contains(menu)) {
            document.body.removeChild(menu);
        }
        document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

/**
 * Handle mouse down on component
 */
function handleComponentMouseDown(e, componentId) {
    e.stopPropagation();
    
    // Only allow left-click for dragging (button 0)
    if (e.button !== 0) {
        return;
    }
    
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
    
    // Also register with simulation engine for particle flow
    if (window.simulationEngine) {
        window.simulationEngine.addConnection({ from: fromId, to: toId });
    }
    
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
        path.addEventListener('click', (e) => {
            if (confirm('Remove this connection?')) {
                state.connections = state.connections.filter(
                    c => !(c.from === conn.from && c.to === conn.to)
                );
                updateConnections();
                updateMetricsSummary();
                saveState();
            }
        });
        
        // Add context menu to delete connection
        path.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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
    
    const isActive = component.active !== false;
    propertiesContent.innerHTML = `
        <div class="property-group">
            <label>Name</label>
            <input type="text" id="prop-name" value="${component.name}">
        </div>
        <div class="property-group">
            <label>Type</label>
            <input type="text" value="${compType.name}" disabled>
        </div>
        <div class="property-group">
            <label>Status</label>
            <select id="prop-status" class="select-input">
                <option value="active" ${isActive ? 'selected' : ''}>Active</option>
                <option value="dead" ${!isActive ? 'selected' : ''}>Dead</option>
            </select>
        </div>
        <h4 style="margin: 16px 0 8px; color: var(--text-secondary);">Configuration</h4>
        ${configHtml}
        <button class="btn btn-danger" onclick="deleteComponent('${componentId}')" style="width: 100%; margin-top: 16px;">
            🗑 Delete Component
        </button>
    `;
    
    // Add status change handler
    const statusSelect = document.getElementById('prop-status');
    statusSelect.addEventListener('change', (e) => {
        component.active = e.target.value === 'active';
        updateComponentStatus(componentId, component.active);
        saveState();
    });
    
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
 * Disconnect component (remove all connections but keep component)
 */
function disconnectComponent(componentId) {
    if (!confirm('Disconnect all connections from this component?')) return;
    
    // Remove associated connections
    const beforeCount = state.connections.length;
    state.connections = state.connections.filter(
        c => c.from !== componentId && c.to !== componentId
    );
    
    if (state.connections.length < beforeCount) {
        updateConnections();
        updateMetricsSummary();
        saveState();
        updateStatus('Component disconnected');
    } else {
        updateStatus('No connections to remove');
    }
}

/**
 * Start simulation
 */
async function startSimulation() {
    if (Object.keys(state.components).length === 0) {
        updateStatus('Add components first');
        return;
    }
    
    // Mark all clients as active on start
    for (const compId in state.components) {
        const comp = state.components[compId];
        if (comp.type === 'client') {
            comp.active = true;
        }
    }
    
    // Save state to backend and start simulation
    await saveState();
    const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: true, components: state.components })
    });
    
    if (response.ok) {
        simulationRunning = true;
        
        // Sync connections with simulation engine before starting
        if (window.simulationEngine) {
            window.simulationEngine.connections = [];
            for (const conn of state.connections) {
                window.simulationEngine.addConnection(conn);
            }
        }
        
        simulationEngine.start(state.components, state.connections);
        updateStatus('Simulation running');
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-stop').disabled = false;
        
        // Update start button text
        document.getElementById('btn-start').textContent = '▶ Running...';
    }
}

/**
 * Stop simulation
 */
async function stopSimulation() {
    // Stop backend simulation
    const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ running: false })
    });
    
    if (response.ok) {
        simulationRunning = false;
        simulationEngine.stop();
        updateStatus('Simulation stopped');
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-stop').disabled = true;
        
        // Restore start button text
        document.getElementById('btn-start').textContent = '▶ Start';
        
        // Clear metrics display
        for (const compId in state.components) {
            updateComponentMetrics(compId, { qps: 0, latency: 0, throughput: 0, errorRate: 0, health: 'healthy' });
        }
        updateMetricsSummary();
    }
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
        // Fallback to local engine metrics on error
        const metrics = simulationEngine.getMetrics();
        for (const compId in metrics) {
            updateComponentMetrics(compId, metrics[compId]);
        }
        updateMetricsSummary();
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
    const statusBadgeEl = document.getElementById(`${componentId}-status-badge`);
    
    if (!qpsEl || !latencyEl || !throughputEl || !errorEl) return;
    
    if (qpsEl) qpsEl.textContent = Math.round(metrics.qps || 0);
    if (latencyEl) latencyEl.textContent = Math.round(metrics.latency || 0) + 'ms';
    if (throughputEl) throughputEl.textContent = Math.round(metrics.throughput || 0);
    if (errorEl) errorEl.textContent = (metrics.errorRate || 0).toFixed(1) + '%';
    
    if (healthEl) {
        healthEl.className = 'health-indicator';
        if (metrics.health === 'degraded') {
            healthEl.classList.add('degraded');
        } else if (metrics.health === 'unhealthy') {
            healthEl.classList.add('unhealthy');
        }
    }
    
    // Update status badge based on component active state
    if (statusBadgeEl) {
        const component = state.components[componentId];
        const isActive = component && component.active !== false;
        statusBadgeEl.textContent = isActive ? 'Active' : 'Dead';
        statusBadgeEl.className = `component-status ${isActive ? 'status-active' : 'status-dead'}`;
    }
}

/**
 * Update component status badge display
 */
function updateComponentStatus(componentId, isActive) {
    const statusBadgeEl = document.getElementById(`${componentId}-status-badge`);
    if (statusBadgeEl) {
        statusBadgeEl.textContent = isActive ? 'Active' : 'Dead';
        statusBadgeEl.className = `component-status ${isActive ? 'status-active' : 'status-dead'}`;
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
    
    // Register connections with simulation engine
    if (window.simulationEngine) {
        window.simulationEngine.connections = [];
        for (const conn of template.connections) {
            window.simulationEngine.addConnection(conn);
        }
    }
    
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
    const isRunning = simulationRunning ? 'Running' : 'Stopped';
    metricsSummary.textContent = `Components: ${compCount} | Connections: ${connCount} | Status: ${isRunning}`;
}

/**
 * Open dashboard modal
 */
function openDashboard() {
    const modal = document.getElementById('dashboard-modal');
    const content = document.getElementById('dashboard-content');
    
    // Calculate dashboard statistics
    const totalComponents = Object.keys(state.components).length;
    const activeComponents = Object.values(state.components).filter(c => c.active !== false).length;
    const deadComponents = totalComponents - activeComponents;
    const totalConnections = state.connections.length;
    
    // Get current metrics
    const metrics = simulationEngine.getMetrics();
    let totalQps = 0;
    let totalThroughput = 0;
    let avgLatency = 0;
    let totalErrors = 0;
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    
    for (const compId in metrics) {
        const m = metrics[compId];
        totalQps += m.qps || 0;
        totalThroughput += m.throughput || 0;
        avgLatency += m.latency || 0;
        totalErrors += m.errorRate || 0;
        
        if (m.health === 'healthy') healthyCount++;
        else if (m.health === 'degraded') degradedCount++;
        else unhealthyCount++;
    }
    
    if (Object.keys(metrics).length > 0) {
        avgLatency = Math.round(avgLatency / Object.keys(metrics).length);
        totalErrors = Math.round(totalErrors / Object.keys(metrics).length * 100) / 100;
    }
    
    // Component type breakdown
    const typeCounts = {};
    for (const comp of Object.values(state.components)) {
        typeCounts[comp.type] = (typeCounts[comp.type] || 0) + 1;
    }
    
    let typeBreakdownHtml = '';
    for (const [type, count] of Object.entries(typeCounts)) {
        const compType = getComponentType(type);
        typeBreakdownHtml += `<div class="dashboard-stat-item"><span>${compType.icon} ${compType.name}</span><span>${count}</span></div>`;
    }
    
    content.innerHTML = `
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h3>System Overview</h3>
                <div class="dashboard-stat-item"><span>Status:</span><span class="${simulationRunning ? 'status-running' : 'status-stopped'}">${simulationRunning ? 'Running' : 'Stopped'}</span></div>
                <div class="dashboard-stat-item"><span>Total Components:</span><span>${totalComponents}</span></div>
                <div class="dashboard-stat-item"><span>Active Components:</span><span class="status-active">${activeComponents}</span></div>
                <div class="dashboard-stat-item"><span>Dead Components:</span><span class="status-dead">${deadComponents}</span></div>
                <div class="dashboard-stat-item"><span>Connections:</span><span>${totalConnections}</span></div>
            </div>
            
            <div class="dashboard-card">
                <h3>Performance Metrics</h3>
                <div class="dashboard-stat-item"><span>Total QPS:</span><span>${Math.round(totalQps)}</span></div>
                <div class="dashboard-stat-item"><span>Total Throughput:</span><span>${Math.round(totalThroughput)}</span></div>
                <div class="dashboard-stat-item"><span>Avg Latency:</span><span>${avgLatency}ms</span></div>
                <div class="dashboard-stat-item"><span>Avg Error Rate:</span><span>${totalErrors}%</span></div>
            </div>
            
            <div class="dashboard-card">
                <h3>Health Status</h3>
                <div class="dashboard-stat-item"><span class="health-healthy">Healthy:</span><span>${healthyCount}</span></div>
                <div class="dashboard-stat-item"><span class="health-degraded">Degraded:</span><span>${degradedCount}</span></div>
                <div class="dashboard-stat-item"><span class="health-unhealthy">Unhealthy:</span><span>${unhealthyCount}</span></div>
            </div>
            
            <div class="dashboard-card">
                <h3>Component Types</h3>
                ${typeBreakdownHtml || '<div class="dashboard-stat-item"><span>No components added</span></div>'}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

/**
 * Close dashboard modal
 */
function closeDashboard() {
    document.getElementById('dashboard-modal').style.display = 'none';
}

// Close dashboard when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('dashboard-modal');
    if (e.target === modal) {
        closeDashboard();
    }
});

/**
 * Autofit all components to screen
 */
function autofitComponents() {
    const componentIds = Object.keys(state.components);
    if (componentIds.length === 0) return;
    
    // Find bounds of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    for (const compId of componentIds) {
        const comp = state.components[compId];
        minX = Math.min(minX, comp.x);
        minY = Math.min(minY, comp.y);
        maxX = Math.max(maxX, comp.x + 140);
        maxY = Math.max(maxY, comp.y + 80);
    }
    
    // Get canvas dimensions
    const canvasWidth = componentsLayer.clientWidth;
    const canvasHeight = componentsLayer.clientHeight;
    
    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calculate scale to fit with padding
    const padding = 50;
    const scaleX = (canvasWidth - padding * 2) / contentWidth;
    const scaleY = (canvasHeight - padding * 2) / contentHeight;
    const newScale = Math.min(1, Math.max(0.3, Math.min(scaleX, scaleY)));
    
    // Apply scale
    state.scale = newScale;
    
    // Center content
    state.panOffset.x = (canvasWidth - contentWidth * newScale) / 2 - minX * newScale;
    state.panOffset.y = (canvasHeight - contentHeight * newScale) / 2 - minY * newScale;
    
    updateTransform();
    updateStatus('Auto-fitted components to screen');
}

/**
 * Update status bar
 */
function updateStatus(message) {
    statusText.textContent = message;
}

// Try to load saved state on startup
setTimeout(loadSavedState, 100);
