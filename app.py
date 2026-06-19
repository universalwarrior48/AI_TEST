"""
System Design Lab - Flask Backend
A visual drag-and-drop system design simulator
"""

from flask import Flask, render_template, jsonify, request
import json
import time
import random
from datetime import datetime

app = Flask(__name__)

# Store simulation state
simulations = {}

@app.route('/')
def index():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/api/simulations', methods=['GET'])
def get_simulations():
    """Get all active simulations"""
    return jsonify(list(simulations.values()))

@app.route('/api/simulations/<sim_id>', methods=['GET'])
def get_simulation(sim_id):
    """Get a specific simulation"""
    if sim_id in simulations:
        return jsonify(simulations[sim_id])
    return jsonify({'error': 'Simulation not found'}), 404

@app.route('/api/simulations', methods=['POST'])
def create_simulation():
    """Create a new simulation"""
    data = request.json
    sim_id = str(int(time.time() * 1000))
    
    simulations[sim_id] = {
        'id': sim_id,
        'name': data.get('name', 'Untitled Simulation'),
        'components': data.get('components', []),
        'connections': data.get('connections', []),
        'config': data.get('config', {}),
        'created_at': datetime.now().isoformat(),
        'status': 'stopped',
        'metrics': {}
    }
    
    return jsonify(simulations[sim_id]), 201

@app.route('/api/simulations/<sim_id>', methods=['PUT'])
def update_simulation(sim_id):
    """Update an existing simulation"""
    if sim_id not in simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    data = request.json
    simulations[sim_id].update({
        'name': data.get('name', simulations[sim_id]['name']),
        'components': data.get('components', simulations[sim_id]['components']),
        'connections': data.get('connections', simulations[sim_id]['connections']),
        'config': data.get('config', simulations[sim_id]['config']),
        'updated_at': datetime.now().isoformat()
    })
    
    return jsonify(simulations[sim_id])

@app.route('/api/simulations/<sim_id>', methods=['DELETE'])
def delete_simulation(sim_id):
    """Delete a simulation"""
    if sim_id in simulations:
        del simulations[sim_id]
        return jsonify({'message': 'Simulation deleted'})
    return jsonify({'error': 'Simulation not found'}), 404

@app.route('/api/simulations/<sim_id>/start', methods=['POST'])
def start_simulation(sim_id):
    """Start a simulation"""
    if sim_id not in simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    simulations[sim_id]['status'] = 'running'
    simulations[sim_id]['started_at'] = datetime.now().isoformat()
    
    return jsonify(simulations[sim_id])

@app.route('/api/simulations/<sim_id>/stop', methods=['POST'])
def stop_simulation(sim_id):
    """Stop a simulation"""
    if sim_id not in simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    simulations[sim_id]['status'] = 'stopped'
    
    return jsonify(simulations[sim_id])

@app.route('/api/simulations/<sim_id>/metrics', methods=['GET'])
def get_metrics(sim_id):
    """Get real-time metrics for a simulation"""
    if sim_id not in simulations:
        return jsonify({'error': 'Simulation not found'}), 404
    
    sim = simulations[sim_id]
    
    # Calculate metrics based on components and connections
    metrics = {'components': {}, 'timestamp': datetime.now().isoformat()}
    
    if sim['status'] == 'running':
        for component in sim['components']:
            comp_id = component['id']
            comp_type = component['type']
            config = component.get('config', {})
            
            # Simulate metrics based on component type and configuration
            base_qps = config.get('qps_capacity', 1000)
            base_latency = config.get('latency_ms', 10)
            failure_rate = config.get('failure_rate', 0.01)
            
            # Add some randomness to simulate real-world behavior
            current_qps = base_qps * (0.8 + random.random() * 0.4)
            current_latency = base_latency * (0.9 + random.random() * 0.3)
            current_error_rate = failure_rate * (0.5 + random.random() * 1.0)
            
            metrics['components'][comp_id] = {
                'qps': round(current_qps, 2),
                'latency_ms': round(current_latency, 2),
                'throughput_mbps': round(current_qps * 0.01, 2),
                'error_rate': round(current_error_rate, 4),
                'health': 'healthy' if current_error_rate < 0.1 else 'degraded',
                'connections': config.get('max_connections', 100),
                'active_connections': int(config.get('max_connections', 100) * (0.3 + random.random() * 0.5))
            }
    else:
        # Return zero metrics when stopped
        for component in sim['components']:
            comp_id = component['id']
            metrics['components'][comp_id] = {
                'qps': 0,
                'latency_ms': 0,
                'throughput_mbps': 0,
                'error_rate': 0,
                'health': 'stopped',
                'connections': 0,
                'active_connections': 0
            }
    
    simulations[sim_id]['metrics'] = metrics
    return jsonify(metrics)

@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Get available system design templates"""
    templates = [
        {
            'id': 'client_server',
            'name': 'Client-Server',
            'description': 'Basic client-server architecture',
            'complexity': 1,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 100, 'y': 200, 'config': {'requests_per_sec': 100}},
                {'id': 'server1', 'type': 'server', 'x': 400, 'y': 200, 'config': {'qps_capacity': 1000, 'latency_ms': 10}}
            ],
            'connections': [{'from': 'client1', 'to': 'server1'}]
        },
        {
            'id': 'lb_2servers',
            'name': 'Load Balancer + 2 Servers',
            'description': 'Load balancer distributing traffic to two servers',
            'complexity': 2,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200, 'config': {'requests_per_sec': 500}},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 250, 'y': 200, 'config': {'algorithm': 'round_robin', 'qps_capacity': 2000}},
                {'id': 'server1', 'type': 'server', 'x': 500, 'y': 150, 'config': {'qps_capacity': 1000, 'latency_ms': 15}},
                {'id': 'server2', 'type': 'server', 'x': 500, 'y': 250, 'config': {'qps_capacity': 1000, 'latency_ms': 15}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'server1'},
                {'from': 'lb1', 'to': 'server2'}
            ]
        },
        {
            'id': 'cache_layer',
            'name': 'Cache Layer',
            'description': 'System with caching layer for improved performance',
            'complexity': 3,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200, 'config': {'requests_per_sec': 1000}},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 200, 'y': 200, 'config': {'algorithm': 'least_connections'}},
                {'id': 'cache1', 'type': 'cache', 'x': 400, 'y': 200, 'config': {'capacity_mb': 512, 'eviction_policy': 'lru', 'hit_rate': 0.8}},
                {'id': 'server1', 'type': 'server', 'x': 600, 'y': 200, 'config': {'qps_capacity': 1500}},
                {'id': 'db1', 'type': 'database', 'x': 800, 'y': 200, 'config': {'type': 'postgresql', 'connections': 100}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'cache1'},
                {'from': 'cache1', 'to': 'server1'},
                {'from': 'server1', 'to': 'db1'}
            ]
        },
        {
            'id': 'db_sharding',
            'name': 'Database Sharding',
            'description': 'Horizontal database sharding for scalability',
            'complexity': 4,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 200, 'y': 200, 'config': {'algorithm': 'ip_hash'}},
                {'id': 'app1', 'type': 'server', 'x': 400, 'y': 200},
                {'id': 'shard1', 'type': 'database', 'x': 600, 'y': 150, 'config': {'shard_id': 1, 'range': 'A-M'}},
                {'id': 'shard2', 'type': 'database', 'x': 600, 'y': 250, 'config': {'shard_id': 2, 'range': 'N-Z'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'app1'},
                {'from': 'app1', 'to': 'shard1'},
                {'from': 'app1', 'to': 'shard2'}
            ]
        },
        {
            'id': 'microservices',
            'name': 'Microservices Architecture',
            'description': 'Multiple microservices with API gateway',
            'complexity': 5,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200},
                {'id': 'cdn1', 'type': 'cdn', 'x': 150, 'y': 200},
                {'id': 'gateway1', 'type': 'api_gateway', 'x': 300, 'y': 200, 'config': {'rate_limit': 10000}},
                {'id': 'auth1', 'type': 'server', 'x': 500, 'y': 100, 'config': {'service': 'auth'}},
                {'id': 'user1', 'type': 'server', 'x': 500, 'y': 200, 'config': {'service': 'user'}},
                {'id': 'order1', 'type': 'server', 'x': 500, 'y': 300, 'config': {'service': 'order'}},
                {'id': 'queue1', 'type': 'message_queue', 'x': 700, 'y': 200, 'config': {'type': 'kafka'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'cdn1'},
                {'from': 'cdn1', 'to': 'gateway1'},
                {'from': 'gateway1', 'to': 'auth1'},
                {'from': 'gateway1', 'to': 'user1'},
                {'from': 'gateway1', 'to': 'order1'},
                {'from': 'order1', 'to': 'queue1'}
            ]
        },
        {
            'id': 'twitter',
            'name': 'Twitter-like System',
            'description': 'Simplified Twitter architecture with timeline service',
            'complexity': 7,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 200, 'y': 200},
                {'id': 'web1', 'type': 'server', 'x': 350, 'y': 150, 'config': {'service': 'web'}},
                {'id': 'api1', 'type': 'api_gateway', 'x': 350, 'y': 250},
                {'id': 'timeline1', 'type': 'server', 'x': 550, 'y': 100, 'config': {'service': 'timeline'}},
                {'id': 'tweet1', 'type': 'server', 'x': 550, 'y': 200, 'config': {'service': 'tweet'}},
                {'id': 'user1', 'type': 'server', 'x': 550, 'y': 300, 'config': {'service': 'user'}},
                {'id': 'cache1', 'type': 'cache', 'x': 750, 'y': 150, 'config': {'capacity_mb': 2048}},
                {'id': 'db1', 'type': 'database', 'x': 750, 'y': 250},
                {'id': 'queue1', 'type': 'message_queue', 'x': 750, 'y': 350, 'config': {'type': 'kafka'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'web1'},
                {'from': 'lb1', 'to': 'api1'},
                {'from': 'web1', 'to': 'timeline1'},
                {'from': 'api1', 'to': 'tweet1'},
                {'from': 'api1', 'to': 'user1'},
                {'from': 'timeline1', 'to': 'cache1'},
                {'from': 'tweet1', 'to': 'db1'},
                {'from': 'user1', 'to': 'db1'},
                {'from': 'tweet1', 'to': 'queue1'}
            ]
        },
        {
            'id': 'youtube',
            'name': 'YouTube-like System',
            'description': 'Video streaming platform architecture',
            'complexity': 8,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200},
                {'id': 'cdn1', 'type': 'cdn', 'x': 200, 'y': 200, 'config': {'edge_locations': 50}},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 350, 'y': 200},
                {'id': 'video1', 'type': 'server', 'x': 500, 'y': 100, 'config': {'service': 'video_upload'}},
                {'id': 'stream1', 'type': 'server', 'x': 500, 'y': 200, 'config': {'service': 'streaming'}},
                {'id': 'search1', 'type': 'server', 'x': 500, 'y': 300, 'config': {'service': 'search'}},
                {'id': 'transcode1', 'type': 'server', 'x': 700, 'y': 100, 'config': {'service': 'transcoding'}},
                {'id': 'storage1', 'type': 'database', 'x': 700, 'y': 200, 'config': {'type': 'object_storage'}},
                {'id': 'cache1', 'type': 'cache', 'x': 700, 'y': 300},
                {'id': 'queue1', 'type': 'message_queue', 'x': 900, 'y': 200, 'config': {'type': 'kafka'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'cdn1'},
                {'from': 'cdn1', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'video1'},
                {'from': 'lb1', 'to': 'stream1'},
                {'from': 'lb1', 'to': 'search1'},
                {'from': 'video1', 'to': 'transcode1'},
                {'from': 'video1', 'to': 'storage1'},
                {'from': 'stream1', 'to': 'cache1'},
                {'from': 'search1', 'to': 'cache1'},
                {'from': 'transcode1', 'to': 'storage1'},
                {'from': 'video1', 'to': 'queue1'}
            ]
        },
        {
            'id': 'whatsapp',
            'name': 'WhatsApp-like System',
            'description': 'Real-time messaging platform',
            'complexity': 8,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 150},
                {'id': 'client2', 'type': 'client', 'x': 50, 'y': 250},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 200, 'y': 200},
                {'id': 'websocket1', 'type': 'server', 'x': 350, 'y': 150, 'config': {'service': 'websocket'}},
                {'id': 'message1', 'type': 'server', 'x': 350, 'y': 250, 'config': {'service': 'message_handler'}},
                {'id': 'presence1', 'type': 'server', 'x': 550, 'y': 100, 'config': {'service': 'presence'}},
                {'id': 'storage1', 'type': 'database', 'x': 550, 'y': 200, 'config': {'type': 'cassandra'}},
                {'id': 'cache1', 'type': 'cache', 'x': 550, 'y': 300, 'config': {'capacity_mb': 4096}},
                {'id': 'queue1', 'type': 'message_queue', 'x': 750, 'y': 200, 'config': {'type': 'kafka'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'client2', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'websocket1'},
                {'from': 'lb1', 'to': 'message1'},
                {'from': 'websocket1', 'to': 'presence1'},
                {'from': 'message1', 'to': 'storage1'},
                {'from': 'message1', 'to': 'cache1'},
                {'from': 'presence1', 'to': 'cache1'},
                {'from': 'message1', 'to': 'queue1'}
            ]
        },
        {
            'id': 'netflix',
            'name': 'Netflix-like System',
            'description': 'Video streaming service with recommendations',
            'complexity': 9,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 200},
                {'id': 'cdn1', 'type': 'cdn', 'x': 200, 'y': 200, 'config': {'edge_locations': 100}},
                {'id': 'gateway1', 'type': 'api_gateway', 'x': 350, 'y': 200, 'config': {'rate_limit': 50000}},
                {'id': 'recommend1', 'type': 'server', 'x': 550, 'y': 100, 'config': {'service': 'recommendation'}},
                {'id': 'playback1', 'type': 'server', 'x': 550, 'y': 200, 'config': {'service': 'playback'}},
                {'id': 'user1', 'type': 'server', 'x': 550, 'y': 300, 'config': {'service': 'user_profile'}},
                {'id': 'analytics1', 'type': 'server', 'x': 750, 'y': 100, 'config': {'service': 'analytics'}},
                {'id': 'cache1', 'type': 'cache', 'x': 750, 'y': 200, 'config': {'capacity_mb': 8192}},
                {'id': 'db1', 'type': 'database', 'x': 750, 'y': 300},
                {'id': 'queue1', 'type': 'message_queue', 'x': 950, 'y': 200, 'config': {'type': 'kafka'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'cdn1'},
                {'from': 'cdn1', 'to': 'gateway1'},
                {'from': 'gateway1', 'to': 'recommend1'},
                {'from': 'gateway1', 'to': 'playback1'},
                {'from': 'gateway1', 'to': 'user1'},
                {'from': 'recommend1', 'to': 'cache1'},
                {'from': 'playback1', 'to': 'cdn1'},
                {'from': 'user1', 'to': 'db1'},
                {'from': 'playback1', 'to': 'analytics1'},
                {'from': 'analytics1', 'to': 'queue1'}
            ]
        },
        {
            'id': 'googledocs',
            'name': 'Google Docs-like System',
            'description': 'Real-time collaborative document editing',
            'complexity': 9,
            'components': [
                {'id': 'client1', 'type': 'client', 'x': 50, 'y': 150},
                {'id': 'client2', 'type': 'client', 'x': 50, 'y': 250},
                {'id': 'lb1', 'type': 'load_balancer', 'x': 200, 'y': 200},
                {'id': 'websocket1', 'type': 'server', 'x': 350, 'y': 150, 'config': {'service': 'realtime_sync'}},
                {'id': 'doc1', 'type': 'server', 'x': 350, 'y': 250, 'config': {'service': 'document'}},
                {'id': 'collab1', 'type': 'server', 'x': 550, 'y': 100, 'config': {'service': 'collaboration'}},
                {'id': 'storage1', 'type': 'database', 'x': 550, 'y': 200, 'config': {'type': 'distributed_db'}},
                {'id': 'cache1', 'type': 'cache', 'x': 550, 'y': 300, 'config': {'capacity_mb': 2048}},
                {'id': 'queue1', 'type': 'message_queue', 'x': 750, 'y': 200, 'config': {'type': 'pubsub'}}
            ],
            'connections': [
                {'from': 'client1', 'to': 'lb1'},
                {'from': 'client2', 'to': 'lb1'},
                {'from': 'lb1', 'to': 'websocket1'},
                {'from': 'lb1', 'to': 'doc1'},
                {'from': 'websocket1', 'to': 'collab1'},
                {'from': 'doc1', 'to': 'storage1'},
                {'from': 'doc1', 'to': 'cache1'},
                {'from': 'collab1', 'to': 'cache1'},
                {'from': 'doc1', 'to': 'queue1'}
            ]
        }
    ]
    
    return jsonify(templates)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
