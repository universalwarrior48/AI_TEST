// Component Types Definition
const COMPONENT_TYPES = {
    client: {
        name: 'Client',
        icon: '🖥️',
        color: '#4a9eff',
        defaultConfig: {
            requests_per_sec: 100,
            timeout_ms: 5000
        }
    },
    load_balancer: {
        name: 'Load Balancer',
        icon: '⚖️',
        color: '#a78bfa',
        defaultConfig: {
            algorithm: 'round_robin',
            qps_capacity: 2000,
            latency_ms: 5,
            max_connections: 1000
        }
    },
    server: {
        name: 'Server',
        icon: '🖧',
        color: '#4ade80',
        defaultConfig: {
            qps_capacity: 1000,
            latency_ms: 10,
            max_connections: 500,
            failure_rate: 0.01
        }
    },
    database: {
        name: 'Database',
        icon: '🗄️',
        color: '#fbbf24',
        defaultConfig: {
            type: 'postgresql',
            connections: 100,
            latency_ms: 20,
            storage_gb: 100
        }
    },
    cache: {
        name: 'Cache',
        icon: '⚡',
        color: '#f87171',
        defaultConfig: {
            capacity_mb: 512,
            eviction_policy: 'lru',
            hit_rate: 0.8,
            latency_ms: 1
        }
    },
    api_gateway: {
        name: 'API Gateway',
        icon: '🚪',
        color: '#06b6d4',
        defaultConfig: {
            rate_limit: 10000,
            latency_ms: 3,
            max_connections: 5000
        }
    },
    message_queue: {
        name: 'Message Queue',
        icon: '📨',
        color: '#ec4899',
        defaultConfig: {
            type: 'kafka',
            throughput_mbps: 100,
            retention_hours: 24
        }
    },
    cdn: {
        name: 'CDN',
        icon: '🌐',
        color: '#8b5cf6',
        defaultConfig: {
            edge_locations: 50,
            cache_hit_rate: 0.9,
            bandwidth_gbps: 10
        }
    }
};

// Generate unique ID
function generateId() {
    return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get component display name
function getComponentDisplayName(type) {
    return COMPONENT_TYPES[type] ? COMPONENT_TYPES[type].name : type;
}

// Get component icon
function getComponentIcon(type) {
    return COMPONENT_TYPES[type] ? COMPONENT_TYPES[type].icon : '❓';
}

// Get component default config
function getComponentDefaultConfig(type) {
    return COMPONENT_TYPES[type] ? {...COMPONENT_TYPES[type].defaultConfig} : {};
}
