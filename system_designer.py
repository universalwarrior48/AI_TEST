"""
System Design Lab - Visual Drag & Drop System Designer
Build, configure, and simulate distributed systems interactively
"""

import gradio as gr
import random
import time
import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import json


# ============================================================================
# COMPONENT TYPES
# ============================================================================

class ComponentType(Enum):
    LOAD_BALANCER = "Load Balancer"
    SERVER = "Server"
    DATABASE = "Database"
    CACHE = "Cache"
    API_GATEWAY = "API Gateway"
    MESSAGE_QUEUE = "Message Queue"
    CDN = "CDN"
    CLIENT = "Client"


@dataclass
class ComponentConfig:
    """Configuration for each component type"""
    qps: float = 1000.0  # Queries per second capacity
    latency_ms: float = 10.0  # Base latency in milliseconds
    failure_rate: float = 0.01  # Probability of failure
    connections: int = 100  # Max concurrent connections
    timeout_ms: float = 5000.0  # Request timeout
    
    # Specific configs
    cache_size: int = 1000  # For cache components
    cache_hit_rate: float = 0.8  # For cache components
    db_shards: int = 1  # For database components
    replication_factor: int = 3  # For database components
    queue_size: int = 10000  # For message queue


@dataclass
class Component:
    """Represents a system component"""
    id: str
    type: ComponentType
    name: str
    x: int
    y: int
    config: ComponentConfig = field(default_factory=ComponentConfig)
    
    # Runtime metrics
    current_qps: float = 0.0
    current_latency_ms: float = 0.0
    total_requests: int = 0
    total_errors: int = 0
    uptime_seconds: float = 0.0
    is_healthy: bool = True
    
    def get_metrics_display(self) -> str:
        """Get formatted metrics display"""
        status = "🟢" if self.is_healthy else "🔴"
        return (
            f"{status} **{self.name}** ({self.type.value})\n"
            f"• QPS: {self.current_qps:.1f}/{self.config.qps}\n"
            f"• Latency: {self.current_latency_ms:.1f}ms\n"
            f"• Requests: {self.total_requests:,}\n"
            f"• Errors: {self.total_errors:,} ({self.get_error_rate():.2f}%)\n"
            f"• Uptime: {self.uptime_seconds:.1f}s"
        )
    
    def get_error_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return (self.total_errors / self.total_requests) * 100


@dataclass
class Connection:
    """Represents a connection between components"""
    id: str
    from_component: str
    to_component: str
    bandwidth_mbps: float = 1000.0  # Network bandwidth
    latency_ms: float = 1.0  # Network latency
    current_throughput: float = 0.0


# ============================================================================
# SYSTEM SIMULATOR
# ============================================================================

class SystemSimulator:
    """Simulates the entire system architecture"""
    
    def __init__(self):
        self.components: Dict[str, Component] = {}
        self.connections: List[Connection] = []
        self.simulation_time = 0.0
        self.is_running = False
        
    def add_component(self, component: Component):
        self.components[component.id] = component
        
    def remove_component(self, component_id: str):
        if component_id in self.components:
            del self.components[component_id]
        # Remove associated connections
        self.connections = [
            c for c in self.connections 
            if c.from_component != component_id and c.to_component != component_id
        ]
        
    def add_connection(self, connection: Connection):
        self.connections.append(connection)
        
    def update_component_config(self, component_id: str, config: ComponentConfig):
        if component_id in self.components:
            self.components[component_id].config = config
            
    def simulate_tick(self, delta_time: float = 1.0):
        """Run one simulation tick"""
        if not self.is_running:
            return
            
        self.simulation_time += delta_time
        
        # Update all components
        for comp in self.components.values():
            if comp.is_healthy:
                comp.uptime_seconds += delta_time
                
            # Simulate request processing based on component type
            self._simulate_component(comp, delta_time)
    
    def _simulate_component(self, comp: Component, delta_time: float):
        """Simulate behavior of a specific component"""
        # Calculate incoming load based on connections
        incoming_load = self._calculate_incoming_load(comp.id)
        
        # Determine actual processed load (capped by capacity)
        load_ratio = min(1.0, incoming_load / comp.config.qps) if comp.config.qps > 0 else 0
        comp.current_qps = incoming_load
        
        # Calculate latency (increases with load)
        base_latency = comp.config.latency_ms
        load_latency = base_latency * (1 + load_ratio * 2)  # Latency increases under load
        random_variance = random.uniform(0.8, 1.2)
        comp.current_latency_ms = load_latency * random_variance
        
        # Simulate failures
        if random.random() < comp.config.failure_rate:
            comp.total_errors += int(incoming_load * delta_time * 0.1)
            
        comp.total_requests += int(incoming_load * delta_time)
        
        # Check if overloaded
        if load_ratio > 0.95:
            comp.is_healthy = False
        elif load_ratio < 0.7:
            comp.is_healthy = True
            
    def _calculate_incoming_load(self, component_id: str) -> float:
        """Calculate incoming load for a component"""
        # Find all components that send traffic to this one
        incoming_connections = [
            c for c in self.connections if c.to_component == component_id
        ]
        
        if not incoming_connections:
            # This might be an entry point (client)
            if component_id in self.components:
                comp = self.components[component_id]
                if comp.type == ComponentType.CLIENT:
                    return comp.config.qps
            return 0.0
            
        # Sum up traffic from all sources
        total_load = 0.0
        for conn in incoming_connections:
            from_comp = self.components.get(conn.from_component)
            if from_comp:
                # Traffic is limited by source output and connection bandwidth
                source_output = from_comp.current_qps
                bandwidth_limit = conn.bandwidth_mbps * 0.1  # Convert to rough QPS
                total_load += min(source_output, bandwidth_limit)
                
        return total_load
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get overall system metrics"""
        if not self.components:
            return {
                "total_qps": 0,
                "avg_latency_ms": 0,
                "total_requests": 0,
                "total_errors": 0,
                "healthy_components": 0,
                "total_components": 0
            }
            
        total_qps = sum(c.current_qps for c in self.components.values())
        avg_latency = sum(c.current_latency_ms for c in self.components.values()) / len(self.components)
        total_requests = sum(c.total_requests for c in self.components.values())
        total_errors = sum(c.total_errors for c in self.components.values())
        healthy = sum(1 for c in self.components.values() if c.is_healthy)
        
        return {
            "total_qps": total_qps,
            "avg_latency_ms": avg_latency,
            "total_requests": total_requests,
            "total_errors": total_errors,
            "error_rate": (total_errors / total_requests * 100) if total_requests > 0 else 0,
            "healthy_components": healthy,
            "total_components": len(self.components),
            "throughput_mbps": total_qps * 0.01  # Rough estimate
        }
    
    def reset_metrics(self):
        """Reset all runtime metrics"""
        for comp in self.components.values():
            comp.current_qps = 0
            comp.current_latency_ms = 0
            comp.total_requests = 0
            comp.total_errors = 0
            comp.uptime_seconds = 0
            comp.is_healthy = True
        self.simulation_time = 0


# ============================================================================
# PRESET TEMPLATES
# ============================================================================

def create_simple_web_architecture(simulator: SystemSimulator) -> str:
    """Create a simple web application architecture"""
    simulator.reset_metrics()
    simulator.components.clear()
    simulator.connections.clear()
    
    # Create components
    client = Component(
        id="client_1", type=ComponentType.CLIENT, name="Users",
        x=50, y=200,
        config=ComponentConfig(qps=5000, latency_ms=1)
    )
    
    lb = Component(
        id="lb_1", type=ComponentType.LOAD_BALANCER, name="Load Balancer",
        x=200, y=200,
        config=ComponentConfig(qps=10000, latency_ms=2, failure_rate=0.001)
    )
    
    server1 = Component(
        id="server_1", type=ComponentType.SERVER, name="App Server 1",
        x=400, y=100,
        config=ComponentConfig(qps=3000, latency_ms=20, failure_rate=0.01)
    )
    
    server2 = Component(
        id="server_2", type=ComponentType.SERVER, name="App Server 2",
        x=400, y=300,
        config=ComponentConfig(qps=3000, latency_ms=20, failure_rate=0.01)
    )
    
    cache = Component(
        id="cache_1", type=ComponentType.CACHE, name="Redis Cache",
        x=600, y=200,
        config=ComponentConfig(qps=50000, latency_ms=1, cache_size=10000, cache_hit_rate=0.9)
    )
    
    db = Component(
        id="db_1", type=ComponentType.DATABASE, name="PostgreSQL DB",
        x=800, y=200,
        config=ComponentConfig(qps=5000, latency_ms=50, db_shards=1, replication_factor=3)
    )
    
    # Add components
    for comp in [client, lb, server1, server2, cache, db]:
        simulator.add_component(comp)
    
    # Create connections
    connections = [
        Connection("conn_1", "client_1", "lb_1", bandwidth_mbps=10000),
        Connection("conn_2", "lb_1", "server_1", bandwidth_mbps=1000),
        Connection("conn_3", "lb_1", "server_2", bandwidth_mbps=1000),
        Connection("conn_4", "server_1", "cache_1", bandwidth_mbps=1000),
        Connection("conn_5", "server_2", "cache_1", bandwidth_mbps=1000),
        Connection("conn_6", "cache_1", "db_1", bandwidth_mbps=1000),
    ]
    
    for conn in connections:
        simulator.add_connection(conn)
    
    return "Simple web architecture created!"


def create_microservices_architecture(simulator: SystemSimulator) -> str:
    """Create a microservices architecture"""
    simulator.reset_metrics()
    simulator.components.clear()
    simulator.connections.clear()
    
    # API Gateway
    gateway = Component(
        id="gateway_1", type=ComponentType.API_GATEWAY, name="API Gateway",
        x=100, y=200,
        config=ComponentConfig(qps=20000, latency_ms=5, failure_rate=0.001)
    )
    
    # Services
    user_service = Component(
        id="svc_user", type=ComponentType.SERVER, name="User Service",
        x=300, y=50,
        config=ComponentConfig(qps=5000, latency_ms=30)
    )
    
    order_service = Component(
        id="svc_order", type=ComponentType.SERVER, name="Order Service",
        x=300, y=200,
        config=ComponentConfig(qps=5000, latency_ms=40)
    )
    
    payment_service = Component(
        id="svc_payment", type=ComponentType.SERVER, name="Payment Service",
        x=300, y=350,
        config=ComponentConfig(qps=3000, latency_ms=100)
    )
    
    # Databases
    user_db = Component(
        id="db_user", type=ComponentType.DATABASE, name="User DB",
        x=500, y=50,
        config=ComponentConfig(qps=8000, latency_ms=20)
    )
    
    order_db = Component(
        id="db_order", type=ComponentType.DATABASE, name="Order DB",
        x=500, y=200,
        config=ComponentConfig(qps=8000, latency_ms=20)
    )
    
    # Message Queue
    mq = Component(
        id="mq_1", type=ComponentType.MESSAGE_QUEUE, name="Kafka MQ",
        x=500, y=350,
        config=ComponentConfig(qps=50000, latency_ms=5, queue_size=100000)
    )
    
    components = [gateway, user_service, order_service, payment_service, user_db, order_db, mq]
    for comp in components:
        simulator.add_component(comp)
    
    # Connections
    connections = [
        Connection("c1", "gateway_1", "svc_user", 1000),
        Connection("c2", "gateway_1", "svc_order", 1000),
        Connection("c3", "gateway_1", "svc_payment", 1000),
        Connection("c4", "svc_user", "db_user", 1000),
        Connection("c5", "svc_order", "db_order", 1000),
        Connection("c6", "svc_payment", "mq_1", 1000),
    ]
    
    for conn in connections:
        simulator.add_connection(conn)
    
    return "Microservices architecture created!"


def create_cdn_architecture(simulator: SystemSimulator) -> str:
    """Create a CDN-based architecture"""
    simulator.reset_metrics()
    simulator.components.clear()
    simulator.connections.clear()
    
    client = Component(
        id="client_1", type=ComponentType.CLIENT, name="Global Users",
        x=50, y=200,
        config=ComponentConfig(qps=100000, latency_ms=1)
    )
    
    cdn = Component(
        id="cdn_1", type=ComponentType.CDN, name="Cloudflare CDN",
        x=200, y=200,
        config=ComponentConfig(qps=500000, latency_ms=5, cache_hit_rate=0.95)
    )
    
    lb = Component(
        id="lb_1", type=ComponentType.LOAD_BALANCER, name="Global LB",
        x=400, y=200,
        config=ComponentConfig(qps=50000, latency_ms=3)
    )
    
    origin = Component(
        id="origin_1", type=ComponentType.SERVER, name="Origin Servers",
        x=600, y=200,
        config=ComponentConfig(qps=20000, latency_ms=50)
    )
    
    db = Component(
        id="db_1", type=ComponentType.DATABASE, name="Primary DB",
        x=800, y=200,
        config=ComponentConfig(qps=10000, latency_ms=30)
    )
    
    for comp in [client, cdn, lb, origin, db]:
        simulator.add_component(comp)
    
    connections = [
        Connection("cdn_conn", "client_1", "cdn_1", 100000),
        Connection("lb_conn", "cdn_1", "lb_1", 10000),
        Connection("origin_conn", "lb_1", "origin_1", 5000),
        Connection("db_conn", "origin_1", "db_1", 2000),
    ]
    
    for conn in connections:
        simulator.add_connection(conn)
    
    return "CDN architecture created!"


# ============================================================================
# GRADIO INTERFACE
# ============================================================================

# Global simulator instance
simulator = SystemSimulator()

def generate_component_id(comp_type: ComponentType) -> str:
    """Generate unique component ID"""
    return f"{comp_type.name.lower()}_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"


def add_component_to_canvas(comp_type_str: str, name: str, x: int, y: int):
    """Add a new component to the canvas"""
    comp_type = ComponentType(comp_type_str)
    comp_id = generate_component_id(comp_type)
    
    config = ComponentConfig()
    
    # Set defaults based on type
    if comp_type == ComponentType.LOAD_BALANCER:
        config.qps = 10000
        config.latency_ms = 2
        config.failure_rate = 0.001
    elif comp_type == ComponentType.SERVER:
        config.qps = 3000
        config.latency_ms = 20
        config.failure_rate = 0.01
    elif comp_type == ComponentType.DATABASE:
        config.qps = 5000
        config.latency_ms = 50
        config.db_shards = 1
    elif comp_type == ComponentType.CACHE:
        config.qps = 50000
        config.latency_ms = 1
        config.cache_hit_rate = 0.9
    elif comp_type == ComponentType.API_GATEWAY:
        config.qps = 20000
        config.latency_ms = 5
    elif comp_type == ComponentType.MESSAGE_QUEUE:
        config.qps = 50000
        config.latency_ms = 5
        config.queue_size = 100000
    elif comp_type == ComponentType.CDN:
        config.qps = 500000
        config.latency_ms = 5
        config.cache_hit_rate = 0.95
    elif comp_type == ComponentType.CLIENT:
        config.qps = 5000
        config.latency_ms = 1
    
    component = Component(
        id=comp_id,
        type=comp_type,
        name=name or comp_type.value,
        x=x,
        y=y,
        config=config
    )
    
    simulator.add_component(component)
    
    return f"✅ Added {name or comp_type.value} at ({x}, {y})", render_canvas()


def render_canvas():
    """Render the canvas as HTML/SVG"""
    if not simulator.components:
        return """
        <div style="height: 600px; background: #f5f5f5; border-radius: 8px; 
                    display: flex; align-items: center; justify-content: center;
                    color: #666; font-size: 18px;">
            🎨 Canvas is empty. Add components from the left panel!
        </div>
        """
    
    # Build SVG canvas
    svg_width = 1000
    svg_height = 600
    
    svg = f'''
    <svg width="{svg_width}" height="{svg_height}" style="background: #f8f9fa; border-radius: 8px;">
        <!-- Grid pattern -->
        <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
    '''
    
    # Draw connections first (so they appear behind components)
    for conn in simulator.connections:
        from_comp = simulator.components.get(conn.from_component)
        to_comp = simulator.components.get(conn.to_component)
        
        if from_comp and to_comp:
            # Calculate center points
            x1, y1 = from_comp.x + 60, from_comp.y + 30
            x2, y2 = to_comp.x, to_comp.y + 30
            
            # Draw connection line
            svg += f'''
            <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" 
                  stroke="#4a90d9" stroke-width="2" marker-end="url(#arrowhead)" />
            '''
    
    # Arrow marker definition
    svg += '''
    <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4a90d9" />
        </marker>
    </defs>
    '''
    
    # Draw components
    colors = {
        ComponentType.LOAD_BALANCER: "#3498db",
        ComponentType.SERVER: "#2ecc71",
        ComponentType.DATABASE: "#e74c3c",
        ComponentType.CACHE: "#f39c12",
        ComponentType.API_GATEWAY: "#9b59b6",
        ComponentType.MESSAGE_QUEUE: "#1abc9c",
        ComponentType.CDN: "#e67e22",
        ComponentType.CLIENT: "#34495e"
    }
    
    icons = {
        ComponentType.LOAD_BALANCER: "⚖️",
        ComponentType.SERVER: "🖥️",
        ComponentType.DATABASE: "🗄️",
        ComponentType.CACHE: "⚡",
        ComponentType.API_GATEWAY: "🚪",
        ComponentType.MESSAGE_QUEUE: "📬",
        ComponentType.CDN: "🌐",
        ComponentType.CLIENT: "👥"
    }
    
    for comp in simulator.components.values():
        color = colors.get(comp.type, "#95a5a6")
        icon = icons.get(comp.type, "📦")
        status_color = "#27ae60" if comp.is_healthy else "#e74c3c"
        
        # Component box
        svg += f'''
        <g id="{comp.id}" style="cursor: pointer;">
            <rect x="{comp.x}" y="{comp.y}" width="120" height="60" 
                  rx="8" ry="8" fill="{color}" opacity="0.9"
                  stroke="{status_color}" stroke-width="3"/>
            <text x="{comp.x + 35}" y="{comp.y + 25}" font-size="20">{icon}</text>
            <text x="{comp.x + 65}" y="{comp.y + 28}" font-size="11" fill="white" font-weight="bold">
                {comp.name[:15]}{'...' if len(comp.name) > 15 else ''}
            </text>
            <text x="{comp.x + 65}" y="{comp.y + 45}" font-size="9" fill="white" opacity="0.9">
                {comp.current_qps:.0f} QPS | {comp.current_latency_ms:.0f}ms
            </text>
            <circle cx="{comp.x + 10}" cy="{comp.y + 10}" r="6" fill="{status_color}"/>
        </g>
        '''
    
    svg += '</svg>'
    
    # Add component list below
    html = f'<div style="font-family: monospace; padding: 10px;">{svg}</div>'
    html += '<div style="padding: 10px; margin-top: 10px; background: #fff; border-radius: 8px;">'
    html += '<strong>Components:</strong><br>'
    
    for comp in simulator.components.values():
        status = "🟢" if comp.is_healthy else "🔴"
        html += f'{status} {comp.name} ({comp.type.value}) - QPS: {comp.current_qps:.0f}, Latency: {comp.current_latency_ms:.1f}ms<br>'
    
    html += '</div>'
    
    return html


def select_component(component_id: str):
    """Select a component for editing"""
    if component_id not in simulator.components:
        return "Select a component first", "", "", 0, 0, 0, 0, 0
    
    comp = simulator.components[component_id]
    config = comp.config
    
    info = comp.get_metrics_display()
    
    return (
        info,
        comp.name,
        comp.type.value,
        config.qps,
        config.latency_ms,
        config.failure_rate * 100,  # Convert to percentage
        config.connections,
        config.timeout_ms,
        comp.id
    )


def update_component_config(comp_id: str, name: str, qps: float, latency: float, 
                           failure_rate: float, connections: int, timeout: float):
    """Update component configuration"""
    if comp_id not in simulator.components:
        return "⚠️ Select a component first", render_canvas()
    
    comp = simulator.components[comp_id]
    comp.name = name
    comp.config.qps = qps
    comp.config.latency_ms = latency
    comp.config.failure_rate = failure_rate / 100  # Convert from percentage
    comp.config.connections = connections
    comp.config.timeout_ms = timeout
    
    return f"✅ Updated {name}", render_canvas()


def connect_components(from_id: str, to_id: str):
    """Create a connection between two components"""
    if not from_id or not to_id:
        return "⚠️ Select both source and target components"
    
    if from_id == to_id:
        return "⚠️ Cannot connect component to itself"
    
    conn_id = f"conn_{int(time.time() * 1000)}"
    connection = Connection(
        id=conn_id,
        from_component=from_id,
        to_component=to_id,
        bandwidth_mbps=1000,
        latency_ms=1
    )
    
    simulator.add_connection(connection)
    return f"✅ Connected {simulator.components[from_id].name} → {simulator.components[to_id].name}"


def toggle_simulation():
    """Start/stop simulation"""
    simulator.is_running = not simulator.is_running
    status = "▶️ Running" if simulator.is_running else "⏸️ Paused"
    return status, render_canvas()


def run_simulation_step():
    """Run one simulation step and update display"""
    if simulator.is_running:
        simulator.simulate_tick(0.5)  # 500ms steps
    return render_canvas(), get_system_stats()


def get_system_stats():
    """Get system-wide statistics"""
    metrics = simulator.get_system_metrics()
    
    stats = f"""
### 📊 System Metrics

| Metric | Value |
|--------|-------|
| **Total QPS** | {metrics['total_qps']:.1f} |
| **Avg Latency** | {metrics['avg_latency_ms']:.1f} ms |
| **Throughput** | {metrics['throughput_mbps']:.1f} Mbps |
| **Total Requests** | {metrics['total_requests']:,} |
| **Error Rate** | {metrics['error_rate']:.2f}% |
| **Healthy Components** | {metrics['healthy_components']}/{metrics['total_components']} |
| **Simulation Time** | {simulator.simulation_time:.1f}s |
"""
    return stats


def load_template(template_name: str):
    """Load a preset architecture template"""
    if template_name == "Simple Web App":
        msg = create_simple_web_architecture(simulator)
    elif template_name == "Microservices":
        msg = create_microservices_architecture(simulator)
    elif template_name == "CDN Architecture":
        msg = create_cdn_architecture(simulator)
    else:
        return "⚠️ Unknown template", render_canvas()
    
    return msg, render_canvas()


def clear_canvas():
    """Clear all components and connections"""
    simulator.components.clear()
    simulator.connections.clear()
    simulator.reset_metrics()
    return "🗑️ Canvas cleared", render_canvas()


def export_configuration():
    """Export current configuration as JSON"""
    config = {
        "components": [],
        "connections": []
    }
    
    for comp in simulator.components.values():
        config["components"].append({
            "id": comp.id,
            "type": comp.type.value,
            "name": comp.name,
            "x": comp.x,
            "y": comp.y,
            "config": {
                "qps": comp.config.qps,
                "latency_ms": comp.config.latency_ms,
                "failure_rate": comp.config.failure_rate,
                "connections": comp.config.connections,
                "timeout_ms": comp.config.timeout_ms,
                "cache_size": comp.config.cache_size,
                "cache_hit_rate": comp.config.cache_hit_rate,
                "db_shards": comp.config.db_shards,
                "replication_factor": comp.config.replication_factor,
                "queue_size": comp.config.queue_size
            }
        })
    
    for conn in simulator.connections:
        config["connections"].append({
            "id": conn.id,
            "from": conn.from_component,
            "to": conn.to_component,
            "bandwidth_mbps": conn.bandwidth_mbps,
            "latency_ms": conn.latency_ms
        })
    
    return json.dumps(config, indent=2)


# ============================================================================
# MAIN GRADIO APP
# ============================================================================

with gr.Blocks(title="System Design Lab", theme=gr.themes.Soft()) as app:
    gr.Markdown("""
    # 🎨 System Design Lab
    ### Design, Configure & Simulate Distributed Systems Visually
    
    Drag and drop components to build your architecture. Configure each component's capacity, 
    latency, and failure rates. Run simulations to see how your system performs under load!
    """)
    
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 🧩 Add Components")
            
            comp_type = gr.Dropdown(
                label="Component Type",
                choices=[t.value for t in ComponentType],
                value="Server"
            )
            
            comp_name = gr.Textbox(label="Component Name", placeholder="My Server")
            
            comp_x = gr.Slider(label="X Position", minimum=0, maximum=900, value=100, step=20)
            comp_y = gr.Slider(label="Y Position", minimum=0, maximum=500, value=100, step=20)
            
            add_btn = gr.Button("➕ Add to Canvas", variant="primary")
            
            gr.Markdown("### 🔗 Connect Components")
            
            comp_list = gr.Dropdown(
                label="Available Components",
                choices=[],
                interactive=True
            )
            
            from_comp = gr.Dropdown(label="From Component", choices=[])
            to_comp = gr.Dropdown(label="To Component", choices=[])
            
            connect_btn = gr.Button("🔗 Connect", variant="secondary")
            
            gr.Markdown("### 📋 Templates")
            
            template = gr.Dropdown(
                label="Load Template",
                choices=["Simple Web App", "Microservices", "CDN Architecture"]
            )
            
            load_template_btn = gr.Button("📥 Load Template")
            
            gr.Markdown("### ⚙️ Actions")
            
            sim_toggle = gr.Button("▶️ Start Simulation", variant="stop")
            clear_btn = gr.Button("🗑️ Clear Canvas", variant="secondary")
            export_btn = gr.Button("📤 Export Config", variant="secondary")
            
        with gr.Column(scale=2):
            gr.Markdown("### 🎨 Canvas")
            
            canvas_output = gr.HTML(
                value="""
                <div style="height: 600px; background: #f5f5f5; border-radius: 8px; 
                            display: flex; align-items: center; justify-content: center;
                            color: #666; font-size: 18px;">
                    🎨 Canvas is empty. Add components from the left panel!
                </div>
                """,
                label="System Architecture Canvas"
            )
            
            gr.Markdown("### 📈 System Statistics")
            
            stats_output = gr.Markdown("""
            ### 📊 System Metrics
            
            | Metric | Value |
            |--------|-------|
            | **Total QPS** | 0 |
            | **Avg Latency** | 0 ms |
            | **Throughput** | 0 Mbps |
            | **Total Requests** | 0 |
            | **Error Rate** | 0% |
            | **Healthy Components** | 0/0 |
            | **Simulation Time** | 0s |
            """)
            
        with gr.Column(scale=1):
            gr.Markdown("### ⚙️ Configure Component")
            
            selected_info = gr.Textbox(label="Selected Component", lines=6, interactive=False)
            
            edit_name = gr.Textbox(label="Name")
            edit_qps = gr.Number(label="Max QPS", value=1000)
            edit_latency = gr.Number(label="Latency (ms)", value=10)
            edit_failure = gr.Number(label="Failure Rate (%)", value=1)
            edit_connections = gr.Number(label="Max Connections", value=100)
            edit_timeout = gr.Number(label="Timeout (ms)", value=5000)
            
            update_btn = gr.Button("💾 Update Configuration", variant="primary")
            
            hidden_comp_id = gr.Textbox(visible=False)
            
            export_output = gr.Code(label="Exported Configuration", language="json")
    
    # Event handlers
    add_outputs = [gr.Textbox(visible=False), canvas_output]
    add_btn.click(
        fn=add_component_to_canvas,
        inputs=[comp_type, comp_name, comp_x, comp_y],
        outputs=add_outputs
    )
    
    # Update component list when canvas changes
    def update_component_lists():
        choices = [(c.name, c.id) for c in simulator.components.values()]
        return choices, choices, choices
    
    canvas_output.change(
        fn=update_component_lists,
        inputs=[],
        outputs=[comp_list, from_comp, to_comp]
    )
    
    # Selection handler (simulated via click on refresh)
    def handle_selection(comp_id):
        return select_component(comp_id)
    
    # Connect components
    connect_btn.click(
        fn=connect_components,
        inputs=[from_comp, to_comp],
        outputs=[gr.Textbox(visible=False)]
    ).then(
        fn=render_canvas,
        inputs=[],
        outputs=[canvas_output]
    )
    
    # Load template
    load_template_btn.click(
        fn=load_template,
        inputs=[template],
        outputs=[gr.Textbox(visible=False), canvas_output]
    )
    
    # Toggle simulation
    sim_toggle.click(
        fn=toggle_simulation,
        inputs=[],
        outputs=[gr.Textbox(visible=False), canvas_output]
    )
    
    # Clear canvas
    clear_btn.click(
        fn=clear_canvas,
        inputs=[],
        outputs=[gr.Textbox(visible=False), canvas_output]
    )
    
    # Export configuration
    export_btn.click(
        fn=export_configuration,
        inputs=[],
        outputs=[export_output]
    )
    
    # Update component config
    update_btn.click(
        fn=update_component_config,
        inputs=[hidden_comp_id, edit_name, edit_qps, edit_latency, edit_failure, 
                edit_connections, edit_timeout],
        outputs=[gr.Textbox(visible=False), canvas_output]
    )
    
    # Auto-refresh simulation
    def auto_refresh():
        while True:
            yield render_canvas(), get_system_stats()
            time.sleep(0.5)
    
    # Periodic update
    timer = gr.Timer(value=0.5)
    timer.tick(
        fn=run_simulation_step,
        inputs=[],
        outputs=[canvas_output, stats_output]
    )


if __name__ == "__main__":
    print("🚀 Starting System Design Lab...")
    print("Open your browser to access the interactive system designer!")
    app.launch(server_name="0.0.0.0", server_port=7860)
