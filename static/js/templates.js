/**
 * System Design Templates
 * Pre-built system architectures for learning
 */

const TEMPLATES = [
    {
        id: 'simple_client_server',
        name: '1. Client-Server',
        description: 'Basic client-server architecture',
        complexity: 1,
        components: [
            { id: 'client1', type: 'client', x: 100, y: 200, config: { qps: 100 } },
            { id: 'server1', type: 'server', x: 400, y: 200, config: { qps: 500 } }
        ],
        connections: [
            { from: 'client1', to: 'server1' }
        ]
    },
    {
        id: 'load_balancer_2servers',
        name: '2. Load Balancer + 2 Servers',
        description: 'Load balancer distributing traffic to two servers',
        complexity: 2,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 200, config: { qps: 200 } },
            { id: 'lb1', type: 'loadbalancer', x: 250, y: 200, config: { qps: 1000 } },
            { id: 'server1', type: 'server', x: 500, y: 150, config: { qps: 500 } },
            { id: 'server2', type: 'server', x: 500, y: 300, config: { qps: 500 } }
        ],
        connections: [
            { from: 'client1', to: 'lb1' },
            { from: 'lb1', to: 'server1' },
            { from: 'lb1', to: 'server2' }
        ]
    },
    {
        id: 'cache_layer',
        name: '3. Cache Layer',
        description: 'Adding cache for faster responses',
        complexity: 3,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 200, config: { qps: 500 } },
            { id: 'lb1', type: 'loadbalancer', x: 200, y: 200, config: { qps: 2000 } },
            { id: 'cache1', type: 'cache', x: 400, y: 200, config: { qps: 10000, hitRate: 0.9 } },
            { id: 'server1', type: 'server', x: 600, y: 200, config: { qps: 1000 } },
            { id: 'db1', type: 'database', x: 800, y: 200, config: { qps: 2000 } }
        ],
        connections: [
            { from: 'client1', to: 'lb1' },
            { from: 'lb1', to: 'cache1' },
            { from: 'cache1', to: 'server1' },
            { from: 'server1', to: 'db1' }
        ]
    },
    {
        id: 'db_sharding',
        name: '4. Database Sharding',
        description: 'Horizontal database sharding for scalability',
        complexity: 4,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 200, config: { qps: 1000 } },
            { id: 'lb1', type: 'loadbalancer', x: 200, y: 200, config: { qps: 5000 } },
            { id: 'server1', type: 'server', x: 400, y: 150, config: { qps: 2000 } },
            { id: 'server2', type: 'server', x: 400, y: 250, config: { qps: 2000 } },
            { id: 'db1', type: 'database', x: 650, y: 100, config: { qps: 3000 } },
            { id: 'db2', type: 'database', x: 650, y: 200, config: { qps: 3000 } },
            { id: 'db3', type: 'database', x: 650, y: 300, config: { qps: 3000 } }
        ],
        connections: [
            { from: 'client1', to: 'lb1' },
            { from: 'lb1', to: 'server1' },
            { from: 'lb1', to: 'server2' },
            { from: 'server1', to: 'db1' },
            { from: 'server1', to: 'db2' },
            { from: 'server2', to: 'db2' },
            { from: 'server2', to: 'db3' }
        ]
    },
    {
        id: 'api_gateway',
        name: '5. API Gateway Pattern',
        description: 'Centralized API gateway with authentication',
        complexity: 4,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 200, config: { qps: 800 } },
            { id: 'gateway1', type: 'apigateway', x: 250, y: 200, config: { qps: 5000, rateLimit: 1000 } },
            { id: 'server1', type: 'server', x: 500, y: 150, config: { qps: 2000 } },
            { id: 'server2', type: 'server', x: 500, y: 250, config: { qps: 2000 } },
            { id: 'cache1', type: 'cache', x: 750, y: 200, config: { qps: 10000 } },
            { id: 'db1', type: 'database', x: 950, y: 200, config: { qps: 5000 } }
        ],
        connections: [
            { from: 'client1', to: 'gateway1' },
            { from: 'gateway1', to: 'server1' },
            { from: 'gateway1', to: 'server2' },
            { from: 'server1', to: 'cache1' },
            { from: 'server2', to: 'cache1' },
            { from: 'cache1', to: 'db1' }
        ]
    },
    {
        id: 'message_queue',
        name: '6. Message Queue Async',
        description: 'Asynchronous processing with message queue',
        complexity: 5,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 200, config: { qps: 500 } },
            { id: 'gateway1', type: 'apigateway', x: 200, y: 200, config: { qps: 3000 } },
            { id: 'queue1', type: 'queue', x: 400, y: 200, config: { qps: 2000, maxSize: 10000 } },
            { id: 'worker1', type: 'server', x: 600, y: 150, config: { qps: 1000 } },
            { id: 'worker2', type: 'server', x: 600, y: 250, config: { qps: 1000 } },
            { id: 'db1', type: 'database', x: 800, y: 200, config: { qps: 3000 } }
        ],
        connections: [
            { from: 'client1', to: 'gateway1' },
            { from: 'gateway1', to: 'queue1' },
            { from: 'queue1', to: 'worker1' },
            { from: 'queue1', to: 'worker2' },
            { from: 'worker1', to: 'db1' },
            { from: 'worker2', to: 'db1' }
        ]
    },
    {
        id: 'twitter_architecture',
        name: '7. Twitter-like System',
        description: 'Simplified Twitter architecture with feed generation',
        complexity: 6,
        components: [
            { id: 'client1', type: 'client', x: 50, y: 100, config: { qps: 2000 } },
            { id: 'cdn1', type: 'cdn', x: 200, y: 100, config: { qps: 50000 } },
            { id: 'lb1', type: 'loadbalancer', x: 350, y: 100, config: { qps: 10000 } },
            { id: 'gateway1', type: 'apigateway', x: 500, y: 100, config: { qps: 8000 } },
            { id: 'tweet_service', type: 'server', x: 700, y: 50, config: { qps: 3000 } },
            { id: 'timeline_service', type: 'server', x: 700, y: 150, config: { qps: 5000 } },
            { id: 'cache1', type: 'cache', x: 900, y: 50, config: { qps: 20000 } },
            { id: 'cache2', type: 'cache', x: 900, y: 150, config: { qps: 20000 } },
            { id: 'db_tweets', type: 'database', x: 1100, y: 50, config: { qps: 5000 } },
            { id: 'db_timeline', type: 'database', x: 1100, y: 150, config: { qps: 8000 } },
            { id: 'queue1', type: 'queue', x: 700, y: 250, config: { qps: 5000 } },
            { id: 'fanout_worker', type: 'server', x: 900, y: 250, config: { qps: 2000 } }
        ],
        connections: [
            { from: 'client1', to: 'cdn1' },
            { from: 'cdn1', to: 'lb1' },
            { from: 'lb1', to: 'gateway1' },
            { from: 'gateway1', to: 'tweet_service' },
            { from: 'gateway1', to: 'timeline_service' },
            { from: 'tweet_service', to: 'cache1' },
            { from: 'timeline_service', to: 'cache2' },
            { from: 'cache1', to: 'db_tweets' },
            { from: 'cache2', to: 'db_timeline' },
            { from: 'tweet_service', to: 'queue1' },
            { from: 'queue1', to: 'fanout_worker' },
            { from: 'fanout_worker', to: 'db_timeline' }
        ]
    },
    {
        id: 'youtube_streaming',
        name: '8. YouTube Streaming',
        description: 'Video streaming platform architecture',
        complexity: 7,
        components: [
            { id: 'viewer', type: 'client', x: 50, y: 100, config: { qps: 5000 } },
            { id: 'uploader', type: 'client', x: 50, y: 300, config: { qps: 100 } },
            { id: 'cdn1', type: 'cdn', x: 250, y: 100, config: { qps: 100000 } },
            { id: 'lb1', type: 'loadbalancer', x: 250, y: 300, config: { qps: 5000 } },
            { id: 'gateway1', type: 'apigateway', x: 450, y: 300, config: { qps: 10000 } },
            { id: 'video_service', type: 'server', x: 650, y: 250, config: { qps: 2000 } },
            { id: 'transcode_service', type: 'server', x: 650, y: 350, config: { qps: 500 } },
            { id: 'cache_video', type: 'cache', x: 850, y: 100, config: { qps: 50000 } },
            { id: 'cache_meta', type: 'cache', x: 850, y: 300, config: { qps: 30000 } },
            { id: 'object_store', type: 'database', x: 1050, y: 100, config: { qps: 20000 } },
            { id: 'db_meta', type: 'database', x: 1050, y: 300, config: { qps: 10000 } },
            { id: 'queue_transcode', type: 'queue', x: 650, y: 450, config: { qps: 1000 } }
        ],
        connections: [
            { from: 'viewer', to: 'cdn1' },
            { from: 'cdn1', to: 'cache_video' },
            { from: 'cache_video', to: 'object_store' },
            { from: 'uploader', to: 'lb1' },
            { from: 'lb1', to: 'gateway1' },
            { from: 'gateway1', to: 'video_service' },
            { from: 'gateway1', to: 'transcode_service' },
            { from: 'video_service', to: 'cache_meta' },
            { from: 'cache_meta', to: 'db_meta' },
            { from: 'transcode_service', to: 'queue_transcode' },
            { from: 'queue_transcode', to: 'object_store' }
        ]
    },
    {
        id: 'whatsapp_messaging',
        name: '9. WhatsApp Messaging',
        description: 'Real-time messaging system with delivery guarantees',
        complexity: 8,
        components: [
            { id: 'user1', type: 'client', x: 50, y: 100, config: { qps: 1000 } },
            { id: 'user2', type: 'client', x: 50, y: 300, config: { qps: 1000 } },
            { id: 'lb1', type: 'loadbalancer', x: 250, y: 200, config: { qps: 20000 } },
            { id: 'websocket_server', type: 'server', x: 450, y: 150, config: { qps: 10000 } },
            { id: 'message_service', type: 'server', x: 450, y: 250, config: { qps: 8000 } },
            { id: 'queue_messages', type: 'queue', x: 650, y: 200, config: { qps: 15000 } },
            { id: 'delivery_worker', type: 'server', x: 850, y: 150, config: { qps: 10000 } },
            { id: 'status_worker', type: 'server', x: 850, y: 250, config: { qps: 5000 } },
            { id: 'cache_online', type: 'cache', x: 650, y: 100, config: { qps: 30000 } },
            { id: 'cache_messages', type: 'cache', x: 650, y: 300, config: { qps: 20000 } },
            { id: 'db_messages', type: 'database', x: 1050, y: 200, config: { qps: 10000 } },
            { id: 'db_users', type: 'database', x: 1050, y: 350, config: { qps: 5000 } }
        ],
        connections: [
            { from: 'user1', to: 'lb1' },
            { from: 'user2', to: 'lb1' },
            { from: 'lb1', to: 'websocket_server' },
            { from: 'lb1', to: 'message_service' },
            { from: 'websocket_server', to: 'cache_online' },
            { from: 'message_service', to: 'queue_messages' },
            { from: 'queue_messages', to: 'delivery_worker' },
            { from: 'queue_messages', to: 'status_worker' },
            { from: 'delivery_worker', to: 'cache_messages' },
            { from: 'status_worker', to: 'db_messages' },
            { from: 'cache_messages', to: 'db_messages' },
            { from: 'cache_online', to: 'db_users' }
        ]
    },
    {
        id: 'netflix_streaming',
        name: '10. Netflix Architecture',
        description: 'Complete video streaming with recommendations and CDN',
        complexity: 9,
        components: [
            { id: 'viewer', type: 'client', x: 50, y: 200, config: { qps: 10000 } },
            { id: 'cdn_edge', type: 'cdn', x: 200, y: 200, config: { qps: 200000 } },
            { id: 'dns_lb', type: 'loadbalancer', x: 350, y: 200, config: { qps: 50000 } },
            { id: 'api_gateway', type: 'apigateway', x: 500, y: 200, config: { qps: 20000 } },
            { id: 'recommendation_svc', type: 'server', x: 700, y: 100, config: { qps: 5000 } },
            { id: 'playback_svc', type: 'server', x: 700, y: 200, config: { qps: 10000 } },
            { id: 'search_svc', type: 'server', x: 700, y: 300, config: { qps: 3000 } },
            { id: 'user_svc', type: 'server', x: 700, y: 400, config: { qps: 8000 } },
            { id: 'cache_recommendations', type: 'cache', x: 900, y: 100, config: { qps: 30000 } },
            { id: 'cache_catalog', type: 'cache', x: 900, y: 200, config: { qps: 50000 } },
            { id: 'cache_user', type: 'cache', x: 900, y: 300, config: { qps: 40000 } },
            { id: 'video_storage', type: 'database', x: 1100, y: 150, config: { qps: 30000 } },
            { id: 'metadata_db', type: 'database', x: 1100, y: 250, config: { qps: 15000 } },
            { id: 'user_db', type: 'database', x: 1100, y: 350, config: { qps: 10000 } },
            { id: 'analytics_queue', type: 'queue', x: 700, y: 500, config: { qps: 20000 } },
            { id: 'analytics_worker', type: 'server', x: 900, y: 500, config: { qps: 10000 } }
        ],
        connections: [
            { from: 'viewer', to: 'cdn_edge' },
            { from: 'cdn_edge', to: 'dns_lb' },
            { from: 'dns_lb', to: 'api_gateway' },
            { from: 'api_gateway', to: 'recommendation_svc' },
            { from: 'api_gateway', to: 'playback_svc' },
            { from: 'api_gateway', to: 'search_svc' },
            { from: 'api_gateway', to: 'user_svc' },
            { from: 'recommendation_svc', to: 'cache_recommendations' },
            { from: 'playback_svc', to: 'cache_catalog' },
            { from: 'search_svc', to: 'cache_catalog' },
            { from: 'user_svc', to: 'cache_user' },
            { from: 'cache_recommendations', to: 'metadata_db' },
            { from: 'cache_catalog', to: 'metadata_db' },
            { from: 'cache_catalog', to: 'video_storage' },
            { from: 'cache_user', to: 'user_db' },
            { from: 'playback_svc', to: 'analytics_queue' },
            { from: 'analytics_queue', to: 'analytics_worker' }
        ]
    },
    {
        id: 'google_docs_collab',
        name: '11. Google Docs Collaboration',
        description: 'Real-time collaborative document editing',
        complexity: 10,
        components: [
            { id: 'editor1', type: 'client', x: 50, y: 100, config: { qps: 500 } },
            { id: 'editor2', type: 'client', x: 50, y: 200, config: { qps: 500 } },
            { id: 'editor3', type: 'client', x: 50, y: 300, config: { qps: 500 } },
            { id: 'lb_ws', type: 'loadbalancer', x: 250, y: 200, config: { qps: 10000 } },
            { id: 'websocket_server', type: 'server', x: 450, y: 150, config: { qps: 8000 } },
            { id: 'operation_transform', type: 'server', x: 450, y: 250, config: { qps: 5000 } },
            { id: 'doc_service', type: 'server', x: 650, y: 200, config: { qps: 3000 } },
            { id: 'presence_service', type: 'server', x: 650, y: 300, config: { qps: 4000 } },
            { id: 'version_history', type: 'server', x: 650, y: 100, config: { qps: 1000 } },
            { id: 'cache_doc', type: 'cache', x: 850, y: 150, config: { qps: 20000 } },
            { id: 'cache_presence', type: 'cache', x: 850, y: 250, config: { qps: 15000 } },
            { id: 'queue_operations', type: 'queue', x: 650, y: 400, config: { qps: 10000 } },
            { id: 'persist_worker', type: 'server', x: 850, y: 400, config: { qps: 5000 } },
            { id: 'db_documents', type: 'database', x: 1050, y: 200, config: { qps: 8000 } },
            { id: 'db_versions', type: 'database', x: 1050, y: 300, config: { qps: 3000 } }
        ],
        connections: [
            { from: 'editor1', to: 'lb_ws' },
            { from: 'editor2', to: 'lb_ws' },
            { from: 'editor3', to: 'lb_ws' },
            { from: 'lb_ws', to: 'websocket_server' },
            { from: 'lb_ws', to: 'operation_transform' },
            { from: 'websocket_server', to: 'operation_transform' },
            { from: 'operation_transform', to: 'doc_service' },
            { from: 'operation_transform', to: 'presence_service' },
            { from: 'doc_service', to: 'version_history' },
            { from: 'doc_service', to: 'cache_doc' },
            { from: 'presence_service', to: 'cache_presence' },
            { from: 'operation_transform', to: 'queue_operations' },
            { from: 'queue_operations', to: 'persist_worker' },
            { from: 'cache_doc', to: 'db_documents' },
            { from: 'version_history', to: 'db_versions' },
            { from: 'persist_worker', to: 'db_documents' }
        ]
    }
];

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Object|null} Template object or null
 */
function getTemplate(templateId) {
    return TEMPLATES.find(t => t.id === templateId) || null;
}

/**
 * Get all templates sorted by complexity
 * @returns {Array} Array of templates
 */
function getAllTemplates() {
    return [...TEMPLATES].sort((a, b) => a.complexity - b.complexity);
}

// Export for browser global access
if (typeof window !== 'undefined') {
    window.TEMPLATES = TEMPLATES;
    window.getTemplate = getTemplate;
    window.getAllTemplates = getAllTemplates;
}

// Export for Node.js/CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TEMPLATES, getTemplate, getAllTemplates };
}
