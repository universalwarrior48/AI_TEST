"""
System Design Lab - Flask Backend
A visual drag-and-drop system design simulator.
"""

from flask import Flask, render_template, jsonify, request
import json
import time
import random
import threading

app = Flask(__name__)

# Global simulation state
simulation_state = {
    'running': False,
    'components': {},
    'connections': [],
    'metrics': {},
    'start_time': None
}

lock = threading.Lock()

def calculate_metrics():
    """Calculate metrics for all components based on connections and load."""
    if not simulation_state['running']:
        return
    
    with lock:
        components = simulation_state['components']
        connections = simulation_state['connections']
        
        # Initialize metrics
        metrics = {}
        for comp_id, comp in components.items():
            metrics[comp_id] = {
                'qps': 0,
                'latency': comp.get('config', {}).get('latency', 10),
                'throughput': 0,
                'error_rate': 0,
                'health': 'healthy',
                'connections': 0
            }
        
        # Simulate traffic flow from clients
        for comp_id, comp in components.items():
            if comp['type'] == 'client':
                # Client generates load
                base_qps = comp.get('config', {}).get('qps', 100)
                metrics[comp_id]['qps'] = base_qps
                metrics[comp_id]['throughput'] = base_qps * (1 - comp.get('config', {}).get('failure_rate', 0))
                
                # Propagate to connected components
                for conn in connections:
                    if conn['from'] == comp_id:
                        target_id = conn['to']
                        if target_id in metrics:
                            target_comp = components[target_id]
                            failure_rate = target_comp.get('config', {}).get('failure_rate', 0)
                            capacity = target_comp.get('config', {}).get('qps', 1000)
                            
                            # Calculate actual QPS considering capacity
                            incoming_qps = base_qps
                            actual_qps = min(incoming_qps, capacity)
                            error_rate = failure_rate if incoming_qps > capacity else failure_rate * 0.5
                            
                            metrics[target_id]['qps'] = int(actual_qps)
                            metrics[target_id]['throughput'] = int(actual_qps * (1 - error_rate))
                            metrics[target_id]['error_rate'] = round(error_rate * 100, 2)
                            metrics[target_id]['health'] = 'degraded' if error_rate > 0.1 else 'healthy'
                            metrics[target_id]['latency'] = target_comp.get('config', {}).get('latency', 10) * (1 + error_rate)
        
        simulation_state['metrics'] = metrics

def simulation_loop():
    """Background thread for running simulation."""
    while True:
        if simulation_state['running']:
            calculate_metrics()
        time.sleep(0.5)

# Start background thread
sim_thread = threading.Thread(target=simulation_loop, daemon=True)
sim_thread.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/state', methods=['GET'])
def get_state():
    with lock:
        return jsonify({
            'components': simulation_state['components'],
            'connections': simulation_state['connections'],
            'running': simulation_state['running'],
            'metrics': simulation_state['metrics']
        })

@app.route('/api/state', methods=['POST'])
def update_state():
    data = request.json
    with lock:
        if 'components' in data:
            simulation_state['components'] = data['components']
        if 'connections' in data:
            simulation_state['connections'] = data['connections']
        if 'running' in data:
            simulation_state['running'] = data['running']
            if data['running']:
                simulation_state['start_time'] = time.time()
    
    return jsonify({'status': 'success'})

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    with lock:
        return jsonify(simulation_state['metrics'])

@app.route('/api/simulations/<simulation_id>/metrics', methods=['GET'])
def get_simulation_metrics(simulation_id):
    """Get metrics for a specific simulation."""
    with lock:
        return jsonify(simulation_state['metrics'])

@app.route('/api/component/<comp_id>', methods=['PUT'])
def update_component(comp_id):
    data = request.json
    with lock:
        if comp_id in simulation_state['components']:
            simulation_state['components'][comp_id].update(data)
            return jsonify({'status': 'success'})
    return jsonify({'error': 'Component not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
