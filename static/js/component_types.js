/**
 * Component Types Definition
 * Defines all available component types with their properties and configurations
 */

const COMPONENT_TYPES = {
    client: {
        name: 'Client',
        icon: '🖥️',
        color: '#58a6ff',
        defaultConfig: {
            qps: 100,
            timeout: 5000,
            connections: 10
        },
        description: 'End user or external service making requests'
    },
    loadbalancer: {
        name: 'Load Balancer',
        icon: '⚖️',
        color: '#3fb950',
        defaultConfig: {
            qps: 10000,
            latency: 2,
            algorithm: 'round_robin',
            healthCheck: true
        },
        description: 'Distributes traffic across multiple servers'
    },
    server: {
        name: 'Server',
        icon: '🖧',
        color: '#d29922',
        defaultConfig: {
            qps: 1000,
            latency: 10,
            failureRate: 0.01,
            connections: 100
        },
        description: 'Application server processing requests'
    },
    database: {
        name: 'Database',
        icon: '🗄️',
        color: '#f85149',
        defaultConfig: {
            qps: 5000,
            latency: 5,
            connections: 50,
            type: 'sql'
        },
        description: 'Data storage system'
    },
    cache: {
        name: 'Cache',
        icon: '⚡',
        color: '#a371f7',
        defaultConfig: {
            qps: 50000,
            latency: 1,
            hitRate: 0.9,
            size: 1024
        },
        description: 'Fast data caching layer'
    },
    apigateway: {
        name: 'API Gateway',
        icon: '🚪',
        color: '#1f6feb',
        defaultConfig: {
            qps: 8000,
            latency: 3,
            rateLimit: 1000,
            auth: true
        },
        description: 'Entry point for API requests'
    },
    queue: {
        name: 'Message Queue',
        icon: '📬',
        color: '#238636',
        defaultConfig: {
            qps: 2000,
            latency: 5,
            maxSize: 10000,
            type: 'fifo'
        },
        description: 'Asynchronous message processing'
    },
    cdn: {
        name: 'CDN',
        icon: '🌐',
        color: '#8957e5',
        defaultConfig: {
            qps: 100000,
            latency: 1,
            hitRate: 0.95,
            locations: 10
        },
        description: 'Content delivery network'
    }
};

/**
 * Get component type definition
 * @param {string} type - Component type
 * @returns {Object} Component definition
 */
function getComponentType(type) {
    return COMPONENT_TYPES[type] || null;
}

/**
 * Generate unique ID for components
 * @returns {string} Unique ID
 */
function generateId() {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Create a new component instance
 * @param {string} type - Component type
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Object} Component instance
 */
function createComponent(type, x, y) {
    const compType = getComponentType(type);
    if (!compType) {
        console.error('Unknown component type:', type);
        return null;
    }

    return {
        id: generateId(),
        type: type,
        name: `${compType.name} ${Math.floor(Math.random() * 100)}`,
        x: x,
        y: y,
        config: { ...compType.defaultConfig },
        metrics: {
            qps: 0,
            latency: 0,
            throughput: 0,
            errorRate: 0,
            health: 'healthy'
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { COMPONENT_TYPES, getComponentType, generateId, createComponent };
}
