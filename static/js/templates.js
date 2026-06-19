// Templates Data - 10 example templates from simple to complex

const TEMPLATES = [
    {
        id: 'client_server',
        name: 'Client-Server',
        description: 'Basic client-server architecture',
        complexity: 1,
        components: [
            {id: 'client1', type: 'client', x: 100, y: 200, config: {requests_per_sec: 100}},
            {id: 'server1', type: 'server', x: 400, y: 200, config: {qps_capacity: 1000, latency_ms: 10}}
        ],
        connections: [{from: 'client1', to: 'server1'}]
    },
    {
        id: 'lb_2servers',
        name: 'Load Balancer + 2 Servers',
        description: 'Load balancer distributing traffic to two servers',
        complexity: 2,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200, config: {requests_per_sec: 500}},
            {id: 'lb1', type: 'load_balancer', x: 250, y: 200, config: {algorithm: 'round_robin', qps_capacity: 2000}},
            {id: 'server1', type: 'server', x: 500, y: 150, config: {qps_capacity: 1000, latency_ms: 15}},
            {id: 'server2', type: 'server', x: 500, y: 250, config: {qps_capacity: 1000, latency_ms: 15}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'lb1', to: 'server1'},
            {from: 'lb1', to: 'server2'}
        ]
    },
    {
        id: 'cache_layer',
        name: 'Cache Layer',
        description: 'System with caching layer for improved performance',
        complexity: 3,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200, config: {requests_per_sec: 1000}},
            {id: 'lb1', type: 'load_balancer', x: 200, y: 200, config: {algorithm: 'least_connections'}},
            {id: 'cache1', type: 'cache', x: 400, y: 200, config: {capacity_mb: 512, eviction_policy: 'lru', hit_rate: 0.8}},
            {id: 'server1', type: 'server', x: 600, y: 200, config: {qps_capacity: 1500}},
            {id: 'db1', type: 'database', x: 800, y: 200, config: {type: 'postgresql', connections: 100}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'lb1', to: 'cache1'},
            {from: 'cache1', to: 'server1'},
            {from: 'server1', to: 'db1'}
        ]
    },
    {
        id: 'db_sharding',
        name: 'Database Sharding',
        description: 'Horizontal database sharding for scalability',
        complexity: 4,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200},
            {id: 'lb1', type: 'load_balancer', x: 200, y: 200, config: {algorithm: 'ip_hash'}},
            {id: 'app1', type: 'server', x: 400, y: 200},
            {id: 'shard1', type: 'database', x: 600, y: 150, config: {shard_id: 1, range: 'A-M'}},
            {id: 'shard2', type: 'database', x: 600, y: 250, config: {shard_id: 2, range: 'N-Z'}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'lb1', to: 'app1'},
            {from: 'app1', to: 'shard1'},
            {from: 'app1', to: 'shard2'}
        ]
    },
    {
        id: 'microservices',
        name: 'Microservices Architecture',
        description: 'Multiple microservices with API gateway',
        complexity: 5,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200},
            {id: 'cdn1', type: 'cdn', x: 150, y: 200},
            {id: 'gateway1', type: 'api_gateway', x: 300, y: 200, config: {rate_limit: 10000}},
            {id: 'auth1', type: 'server', x: 500, y: 100, config: {service: 'auth'}},
            {id: 'user1', type: 'server', x: 500, y: 200, config: {service: 'user'}},
            {id: 'order1', type: 'server', x: 500, y: 300, config: {service: 'order'}},
            {id: 'queue1', type: 'message_queue', x: 700, y: 200, config: {type: 'kafka'}}
        ],
        connections: [
            {from: 'client1', to: 'cdn1'},
            {from: 'cdn1', to: 'gateway1'},
            {from: 'gateway1', to: 'auth1'},
            {from: 'gateway1', to: 'user1'},
            {from: 'gateway1', to: 'order1'},
            {from: 'order1', to: 'queue1'}
        ]
    },
    {
        id: 'twitter',
        name: 'Twitter-like System',
        description: 'Simplified Twitter architecture with timeline service',
        complexity: 7,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200},
            {id: 'lb1', type: 'load_balancer', x: 200, y: 200},
            {id: 'web1', type: 'server', x: 350, y: 150, config: {service: 'web'}},
            {id: 'api1', type: 'api_gateway', x: 350, y: 250},
            {id: 'timeline1', type: 'server', x: 550, y: 100, config: {service: 'timeline'}},
            {id: 'tweet1', type: 'server', x: 550, y: 200, config: {service: 'tweet'}},
            {id: 'user1', type: 'server', x: 550, y: 300, config: {service: 'user'}},
            {id: 'cache1', type: 'cache', x: 750, y: 150, config: {capacity_mb: 2048}},
            {id: 'db1', type: 'database', x: 750, y: 250},
            {id: 'queue1', type: 'message_queue', x: 750, y: 350, config: {type: 'kafka'}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'lb1', to: 'web1'},
            {from: 'lb1', to: 'api1'},
            {from: 'web1', to: 'timeline1'},
            {from: 'api1', to: 'tweet1'},
            {from: 'api1', to: 'user1'},
            {from: 'timeline1', to: 'cache1'},
            {from: 'tweet1', to: 'db1'},
            {from: 'user1', to: 'db1'},
            {from: 'tweet1', to: 'queue1'}
        ]
    },
    {
        id: 'youtube',
        name: 'YouTube-like System',
        description: 'Video streaming platform architecture',
        complexity: 8,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200},
            {id: 'cdn1', type: 'cdn', x: 200, y: 200, config: {edge_locations: 50}},
            {id: 'lb1', type: 'load_balancer', x: 350, y: 200},
            {id: 'video1', type: 'server', x: 500, y: 100, config: {service: 'video_upload'}},
            {id: 'stream1', type: 'server', x: 500, y: 200, config: {service: 'streaming'}},
            {id: 'search1', type: 'server', x: 500, y: 300, config: {service: 'search'}},
            {id: 'transcode1', type: 'server', x: 700, y: 100, config: {service: 'transcoding'}},
            {id: 'storage1', type: 'database', x: 700, y: 200, config: {type: 'object_storage'}},
            {id: 'cache1', type: 'cache', x: 700, y: 300},
            {id: 'queue1', type: 'message_queue', x: 900, y: 200, config: {type: 'kafka'}}
        ],
        connections: [
            {from: 'client1', to: 'cdn1'},
            {from: 'cdn1', to: 'lb1'},
            {from: 'lb1', to: 'video1'},
            {from: 'lb1', to: 'stream1'},
            {from: 'lb1', to: 'search1'},
            {from: 'video1', to: 'transcode1'},
            {from: 'video1', to: 'storage1'},
            {from: 'stream1', to: 'cache1'},
            {from: 'search1', to: 'cache1'},
            {from: 'transcode1', to: 'storage1'},
            {from: 'video1', to: 'queue1'}
        ]
    },
    {
        id: 'whatsapp',
        name: 'WhatsApp-like System',
        description: 'Real-time messaging platform',
        complexity: 8,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 150},
            {id: 'client2', type: 'client', x: 50, y: 250},
            {id: 'lb1', type: 'load_balancer', x: 200, y: 200},
            {id: 'websocket1', type: 'server', x: 350, y: 150, config: {service: 'websocket'}},
            {id: 'message1', type: 'server', x: 350, y: 250, config: {service: 'message_handler'}},
            {id: 'presence1', type: 'server', x: 550, y: 100, config: {service: 'presence'}},
            {id: 'storage1', type: 'database', x: 550, y: 200, config: {type: 'cassandra'}},
            {id: 'cache1', type: 'cache', x: 550, y: 300, config: {capacity_mb: 4096}},
            {id: 'queue1', type: 'message_queue', x: 750, y: 200, config: {type: 'kafka'}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'client2', to: 'lb1'},
            {from: 'lb1', to: 'websocket1'},
            {from: 'lb1', to: 'message1'},
            {from: 'websocket1', to: 'presence1'},
            {from: 'message1', to: 'storage1'},
            {from: 'message1', to: 'cache1'},
            {from: 'presence1', to: 'cache1'},
            {from: 'message1', to: 'queue1'}
        ]
    },
    {
        id: 'netflix',
        name: 'Netflix-like System',
        description: 'Video streaming service with recommendations',
        complexity: 9,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 200},
            {id: 'cdn1', type: 'cdn', x: 200, y: 200, config: {edge_locations: 100}},
            {id: 'gateway1', type: 'api_gateway', x: 350, y: 200, config: {rate_limit: 50000}},
            {id: 'recommend1', type: 'server', x: 550, y: 100, config: {service: 'recommendation'}},
            {id: 'playback1', type: 'server', x: 550, y: 200, config: {service: 'playback'}},
            {id: 'user1', type: 'server', x: 550, y: 300, config: {service: 'user_profile'}},
            {id: 'analytics1', type: 'server', x: 750, y: 100, config: {service: 'analytics'}},
            {id: 'cache1', type: 'cache', x: 750, y: 200, config: {capacity_mb: 8192}},
            {id: 'db1', type: 'database', x: 750, y: 300},
            {id: 'queue1', type: 'message_queue', x: 950, y: 200, config: {type: 'kafka'}}
        ],
        connections: [
            {from: 'client1', to: 'cdn1'},
            {from: 'cdn1', to: 'gateway1'},
            {from: 'gateway1', to: 'recommend1'},
            {from: 'gateway1', to: 'playback1'},
            {from: 'gateway1', to: 'user1'},
            {from: 'recommend1', to: 'cache1'},
            {from: 'playback1', to: 'cdn1'},
            {from: 'user1', to: 'db1'},
            {from: 'playback1', to: 'analytics1'},
            {from: 'analytics1', to: 'queue1'}
        ]
    },
    {
        id: 'googledocs',
        name: 'Google Docs-like System',
        description: 'Real-time collaborative document editing',
        complexity: 9,
        components: [
            {id: 'client1', type: 'client', x: 50, y: 150},
            {id: 'client2', type: 'client', x: 50, y: 250},
            {id: 'lb1', type: 'load_balancer', x: 200, y: 200},
            {id: 'websocket1', type: 'server', x: 350, y: 150, config: {service: 'realtime_sync'}},
            {id: 'doc1', type: 'server', x: 350, y: 250, config: {service: 'document'}},
            {id: 'collab1', type: 'server', x: 550, y: 100, config: {service: 'collaboration'}},
            {id: 'storage1', type: 'database', x: 550, y: 200, config: {type: 'distributed_db'}},
            {id: 'cache1', type: 'cache', x: 550, y: 300, config: {capacity_mb: 2048}},
            {id: 'queue1', type: 'message_queue', x: 750, y: 200, config: {type: 'pubsub'}}
        ],
        connections: [
            {from: 'client1', to: 'lb1'},
            {from: 'client2', to: 'lb1'},
            {from: 'lb1', to: 'websocket1'},
            {from: 'lb1', to: 'doc1'},
            {from: 'websocket1', to: 'collab1'},
            {from: 'doc1', to: 'storage1'},
            {from: 'doc1', to: 'cache1'},
            {from: 'collab1', to: 'cache1'},
            {from: 'doc1', to: 'queue1'}
        ]
    }
];

// Load templates into sidebar
async function loadTemplates() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    try {
        // Try to fetch from backend first
        const response = await fetch('/api/templates');
        if (response.ok) {
            const templates = await response.json();
            renderTemplates(templates);
            return;
        }
    } catch (error) {
        console.log('Using local templates');
    }

    // Fallback to local templates
    renderTemplates(TEMPLATES);
}

function renderTemplates(templates) {
    const templateList = document.getElementById('templateList');
    templateList.innerHTML = '';

    templates.forEach(template => {
        const item = document.createElement('div');
        item.className = 'template-item';
        item.innerHTML = `
            <h4>${template.name}</h4>
            <p>${template.description}</p>
            <span class="complexity">Complexity: ${'⭐'.repeat(template.complexity)}</span>
        `;
        item.addEventListener('click', () => loadTemplate(template));
        templateList.appendChild(item);
    });
}

function loadTemplate(template) {
    if (window.app && window.app.loadTemplate) {
        window.app.loadTemplate(template);
    }
}

// Export for use in app.js
window.TEMPLATES = TEMPLATES;
window.loadTemplates = loadTemplates;
