import gradio as gr
import random
import time
from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

# ============================================================================
# SYSTEM DESIGN CONCEPT SIMULATORS
# ============================================================================

class LoadBalancerAlgorithm(Enum):
    ROUND_ROBIN = "Round Robin"
    LEAST_CONNECTIONS = "Least Connections"
    WEIGHTED = "Weighted"
    IP_HASH = "IP Hash"

@dataclass
class Server:
    id: int
    connections: int = 0
    weight: int = 1
    health: bool = True
    total_requests: int = 0

class LoadBalancerSimulator:
    def __init__(self, num_servers: int = 3, algorithm: str = "Round Robin"):
        self.servers = [Server(id=i) for i in range(num_servers)]
        self.algorithm = LoadBalancerAlgorithm(algorithm)
        self.current_index = 0
        self.ip_map = {}
    
    def add_request(self, client_ip: str = None) -> int:
        if self.algorithm == LoadBalancerAlgorithm.ROUND_ROBIN:
            return self._round_robin()
        elif self.algorithm == LoadBalancerAlgorithm.LEAST_CONNECTIONS:
            return self._least_connections()
        elif self.algorithm == LoadBalancerAlgorithm.WEIGHTED:
            return self._weighted()
        elif self.algorithm == LoadBalancerAlgorithm.IP_HASH:
            return self._ip_hash(client_ip or f"client_{random.randint(1, 1000)}")
    
    def _round_robin(self) -> int:
        healthy_servers = [s for s in self.servers if s.health]
        if not healthy_servers:
            return -1
        server = healthy_servers[self.current_index % len(healthy_servers)]
        self.current_index += 1
        server.connections += 1
        server.total_requests += 1
        return server.id
    
    def _least_connections(self) -> int:
        healthy_servers = [s for s in self.servers if s.health]
        if not healthy_servers:
            return -1
        server = min(healthy_servers, key=lambda s: s.connections)
        server.connections += 1
        server.total_requests += 1
        return server.id
    
    def _weighted(self) -> int:
        healthy_servers = [s for s in self.servers if s.health]
        if not healthy_servers:
            return -1
        total_weight = sum(s.weight for s in healthy_servers)
        r = random.randint(1, total_weight)
        cumulative = 0
        for server in healthy_servers:
            cumulative += server.weight
            if r <= cumulative:
                server.connections += 1
                server.total_requests += 1
                return server.id
        return healthy_servers[-1].id
    
    def _ip_hash(self, client_ip: str) -> int:
        if client_ip not in self.ip_map:
            healthy_servers = [s for s in self.servers if s.health]
            if not healthy_servers:
                return -1
            self.ip_map[client_ip] = hash(client_ip) % len(healthy_servers)
        idx = self.ip_map[client_ip] % len([s for s in self.servers if s.health])
        healthy_servers = [s for s in self.servers if s.health]
        server = healthy_servers[idx]
        server.connections += 1
        server.total_requests += 1
        return server.id
    
    def release_connection(self, server_id: int):
        if 0 <= server_id < len(self.servers):
            self.servers[server_id].connections = max(0, self.servers[server_id].connections - 1)
    
    def toggle_server_health(self, server_id: int):
        if 0 <= server_id < len(self.servers):
            self.servers[server_id].health = not self.servers[server_id].health
    
    def get_stats(self) -> str:
        stats = "📊 **Load Balancer Statistics**\n\n"
        stats += f"**Algorithm:** {self.algorithm.value}\n\n"
        stats += "| Server | Health | Connections | Total Requests | Weight |\n"
        stats += "|--------|--------|-------------|----------------|--------|\n"
        for server in self.servers:
            health_icon = "✅" if server.health else "❌"
            stats += f"| Server {server.id} | {health_icon} | {server.connections} | {server.total_requests} | {server.weight} |\n"
        return stats


class CacheSimulator:
    def __init__(self, capacity: int = 5, eviction_policy: str = "LRU"):
        self.capacity = capacity
        self.eviction_policy = eviction_policy
        self.cache: Dict[str, any] = {}
        self.access_order: List[str] = []
        self.frequency: Dict[str, int] = {}
        self.hits = 0
        self.misses = 0
        self.evictions = 0
    
    def get(self, key: str) -> Tuple[bool, any]:
        if key in self.cache:
            self.hits += 1
            if self.eviction_policy == "LRU":
                self.access_order.remove(key)
                self.access_order.append(key)
            elif self.eviction_policy == "LFU":
                self.frequency[key] += 1
            return True, self.cache[key]
        self.misses += 1
        return False, None
    
    def put(self, key: str, value: any):
        if key in self.cache:
            if self.eviction_policy == "LRU":
                self.access_order.remove(key)
            elif self.eviction_policy == "LFU":
                self.frequency[key] += 1
            self.cache[key] = value
            if self.eviction_policy == "LRU":
                self.access_order.append(key)
            return
        
        if len(self.cache) >= self.capacity:
            self._evict()
        
        self.cache[key] = value
        if self.eviction_policy == "LRU":
            self.access_order.append(key)
        elif self.eviction_policy == "LFU":
            self.frequency[key] = 1
    
    def _evict(self):
        if not self.cache:
            return
        
        if self.eviction_policy == "LRU":
            oldest_key = self.access_order.pop(0)
            del self.cache[oldest_key]
            if oldest_key in self.frequency:
                del self.frequency[oldest_key]
        elif self.eviction_policy == "LFU":
            min_freq_key = min(self.frequency, key=self.frequency.get)
            del self.cache[min_freq_key]
            del self.frequency[min_freq_key]
        
        self.evictions += 1
    
    def get_stats(self) -> str:
        hit_rate = (self.hits / (self.hits + self.misses) * 100) if (self.hits + self.misses) > 0 else 0
        stats = "🗄️ **Cache Statistics**\n\n"
        stats += f"**Policy:** {self.eviction_policy} | **Capacity:** {self.capacity}\n\n"
        stats += f"**Hits:** {self.hits} | **Misses:** {self.misses} | **Hit Rate:** {hit_rate:.1f}%\n"
        stats += f"**Evictions:** {self.evictions} | **Current Size:** {len(self.cache)}/{self.capacity}\n\n"
        stats += "**Cache Contents:**\n"
        for key, value in self.cache.items():
            freq = self.frequency.get(key, 0)
            stats += f"  - `{key}`: {value} (freq: {freq})\n"
        return stats


class RateLimiterSimulator:
    def __init__(self, rate_limit: int = 10, window_seconds: int = 60, algorithm: str = "Token Bucket"):
        self.rate_limit = rate_limit
        self.window_seconds = window_seconds
        self.algorithm = algorithm
        self.tokens = rate_limit
        self.last_refill = time.time()
        self.request_log: List[float] = []
        self.allowed = 0
        self.rejected = 0
    
    def _refill_tokens(self):
        now = time.time()
        elapsed = now - self.last_refill
        tokens_to_add = elapsed * (self.rate_limit / self.window_seconds)
        self.tokens = min(self.rate_limit, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def allow_request(self) -> bool:
        if self.algorithm == "Token Bucket":
            self._refill_tokens()
            if self.tokens >= 1:
                self.tokens -= 1
                self.allowed += 1
                return True
            self.rejected += 1
            return False
        elif self.algorithm == "Sliding Window":
            now = time.time()
            self.request_log = [t for t in self.request_log if now - t < self.window_seconds]
            if len(self.request_log) < self.rate_limit:
                self.request_log.append(now)
                self.allowed += 1
                return True
            self.rejected += 1
            return False
        elif self.algorithm == "Fixed Window":
            now = time.time()
            window_start = int(now / self.window_seconds) * self.window_seconds
            recent = [t for t in self.request_log if t >= window_start]
            self.request_log = recent
            if len(recent) < self.rate_limit:
                self.request_log.append(now)
                self.allowed += 1
                return True
            self.rejected += 1
            return False
    
    def get_stats(self) -> str:
        total = self.allowed + self.rejected
        success_rate = (self.allowed / total * 100) if total > 0 else 0
        stats = "🚦 **Rate Limiter Statistics**\n\n"
        stats += f"**Algorithm:** {self.algorithm}\n"
        stats += f"**Rate Limit:** {self.rate_limit} requests / {self.window_seconds}s\n\n"
        stats += f"**Allowed:** {self.allowed} | **Rejected:** {self.rejected}\n"
        stats += f"**Success Rate:** {success_rate:.1f}%\n"
        if self.algorithm == "Token Bucket":
            stats += f"**Available Tokens:** {self.tokens:.2f}/{self.rate_limit}\n"
        else:
            current_time = time.time()
            if self.algorithm == "Sliding Window":
                recent = len([t for t in self.request_log if current_time - t < self.window_seconds])
            else:
                window_start = int(current_time / self.window_seconds) * self.window_seconds
                recent = len([t for t in self.request_log if t >= window_start])
            stats += f"**Current Window Usage:** {recent}/{self.rate_limit}\n"
        return stats


class DatabaseShardingSimulator:
    def __init__(self, num_shards: int = 4, sharding_strategy: str = "Hash"):
        self.num_shards = num_shards
        self.sharding_strategy = sharding_strategy
        self.shards: Dict[int, Dict[str, any]] = {i: {} for i in range(num_shards)}
        self.data_distribution: Dict[str, int] = {}
    
    def _get_shard_id(self, key: str) -> int:
        if self.sharding_strategy == "Hash":
            return hash(key) % self.num_shards
        elif self.sharding_strategy == "Range":
            try:
                numeric_key = int(''.join(filter(str.isdigit, key)) or "0")
                return (numeric_key % 100) // (100 // self.num_shards)
            except:
                return hash(key) % self.num_shards
        elif self.sharding_strategy == "Modulo":
            try:
                numeric_key = int(''.join(filter(str.isdigit, key)) or "0")
                return numeric_key % self.num_shards
            except:
                return hash(key) % self.num_shards
        return hash(key) % self.num_shards
    
    def insert(self, key: str, value: any):
        shard_id = self._get_shard_id(key)
        self.shards[shard_id][key] = value
        self.data_distribution[key] = shard_id
    
    def get(self, key: str) -> Tuple[int, any]:
        if key in self.data_distribution:
            shard_id = self.data_distribution[key]
            return shard_id, self.shards[shard_id].get(key)
        return -1, None
    
    def get_stats(self) -> str:
        stats = "🗂️ **Database Sharding Statistics**\n\n"
        stats += f"**Strategy:** {self.sharding_strategy} | **Number of Shards:** {self.num_shards}\n\n"
        stats += "| Shard | Records | Distribution |\n"
        stats += "|-------|---------|---------------|\n"
        total_records = sum(len(shard) for shard in self.shards.values())
        for shard_id, shard_data in self.shards.items():
            count = len(shard_data)
            percentage = (count / total_records * 100) if total_records > 0 else 0
            bar = "█" * int(percentage / 5)
            stats += f"| Shard {shard_id} | {count} | {bar} {percentage:.1f}% |\n"
        
        if self.data_distribution:
            stats += "\n**Sample Data Distribution:**\n"
            sample_keys = list(self.data_distribution.keys())[:5]
            for key in sample_keys:
                stats += f"  - `{key}` → Shard {self.data_distribution[key]}\n"
        return stats


class CircuitBreakerSimulator:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 10):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0
        self.total_requests = 0
        self.total_failures = 0
        self.total_successes = 0
        self.circuit_opens = 0
    
    def execute(self, should_fail: bool = False) -> Tuple[str, str]:
        self.total_requests += 1
        
        if self.state == "OPEN":
            current_time = time.time()
            if current_time - self.last_failure_time >= self.recovery_timeout:
                self.state = "HALF_OPEN"
                return "HALF_OPEN", "Circuit transitioning to half-open state"
            return "OPEN", "Circuit is OPEN - request rejected"
        
        if should_fail:
            self.failure_count += 1
            self.total_failures += 1
            self.last_failure_time = time.time()
            
            if self.state == "HALF_OPEN":
                self.state = "OPEN"
                self.circuit_opens += 1
                self.failure_count = 0
                return "OPEN", "Request failed - circuit opened"
            
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.circuit_opens += 1
                self.failure_count = 0
                return "OPEN", f"Failure threshold reached - circuit opened"
            
            return self.state, f"Request failed (failures: {self.failure_count}/{self.failure_threshold})"
        else:
            self.success_count += 1
            self.total_successes += 1
            
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failure_count = 0
                return "CLOSED", "Success in half-open - circuit closed"
            
            self.failure_count = max(0, self.failure_count - 1)
            return self.state, "Request successful"
    
    def reset(self):
        self.state = "CLOSED"
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0
    
    def get_stats(self) -> str:
        stats = "⚡ **Circuit Breaker Statistics**\n\n"
        state_colors = {"CLOSED": "🟢", "OPEN": "🔴", "HALF_OPEN": "🟡"}
        stats += f"**Current State:** {state_colors.get(self.state, '⚪')} {self.state}\n\n"
        stats += f"**Threshold:** {self.failure_threshold} | **Recovery Timeout:** {self.recovery_timeout}s\n\n"
        stats += f"**Total Requests:** {self.total_requests}\n"
        stats += f"**Successes:** {self.total_successes} | **Failures:** {self.total_failures}\n"
        stats += f"**Circuit Opens:** {self.circuit_opens}\n"
        stats += f"**Current Failure Count:** {self.failure_count}/{self.failure_threshold}\n"
        return stats


# ============================================================================
# GRADIO INTERFACE
# ============================================================================

def simulate_load_balancer(num_servers, algorithm, action, server_id):
    if not hasattr(simulate_load_balancer, 'simulator'):
        simulate_load_balancer.simulator = LoadBalancerSimulator(int(num_servers), algorithm)
    elif simulate_load_balancer.simulator.algorithm.value != algorithm:
        simulate_load_balancer.simulator = LoadBalancerSimulator(int(num_servers), algorithm)
    
    if action == "Add Request":
        server_idx = simulate_load_balancer.simulator.add_request()
        result = f"✅ Request routed to **Server {server_idx}**"
    elif action == "Release Connection":
        simulate_load_balancer.simulator.release_connection(int(server_id))
        result = f"✅ Connection released from Server {server_id}"
    elif action == "Toggle Server Health":
        simulate_load_balancer.simulator.toggle_server_health(int(server_id))
        result = f"✅ Server {server_id} health toggled"
    elif action == "Reset":
        simulate_load_balancer.simulator = LoadBalancerSimulator(int(num_servers), algorithm)
        result = "🔄 Load balancer reset"
    else:
        result = "Select an action"
    
    return result, simulate_load_balancer.simulator.get_stats()


def simulate_cache(capacity, policy, action, key, value):
    if not hasattr(simulate_cache, 'simulator'):
        simulate_cache.simulator = CacheSimulator(int(capacity), policy)
    elif simulate_cache.simulator.eviction_policy != policy or simulate_cache.simulator.capacity != int(capacity):
        simulate_cache.simulator = CacheSimulator(int(capacity), policy)
    
    if action == "Get from Cache":
        found, val = simulate_cache.simulator.get(key)
        if found:
            result = f"✅ Cache HIT - Key `{key}` = {val}"
        else:
            result = f"❌ Cache MISS - Key `{key}` not found"
    elif action == "Put in Cache":
        simulate_cache.simulator.put(key, value)
        result = f"✅ Added `{key}` = {value} to cache"
    elif action == "Reset":
        simulate_cache.simulator = CacheSimulator(int(capacity), policy)
        result = "🔄 Cache reset"
    else:
        result = "Select an action"
    
    return result, simulate_cache.simulator.get_stats()


def simulate_rate_limiter(rate_limit, window, algorithm, num_clicks):
    if not hasattr(simulate_rate_limiter, 'simulator'):
        simulate_rate_limiter.simulator = RateLimiterSimulator(int(rate_limit), int(window), algorithm)
    elif (simulate_rate_limiter.simulator.rate_limit != int(rate_limit) or 
          simulate_rate_limiter.simulator.window_seconds != int(window) or
          simulate_rate_limiter.simulator.algorithm != algorithm):
        simulate_rate_limiter.simulator = RateLimiterSimulator(int(rate_limit), int(window), algorithm)
    
    results = []
    for i in range(int(num_clicks)):
        allowed = simulate_rate_limiter.simulator.allow_request()
        status = "✅ ALLOWED" if allowed else "❌ REJECTED"
        results.append(f"Request {i+1}: {status}")
    
    return "\n".join(results), simulate_rate_limiter.simulator.get_stats()


def simulate_sharding(num_shards, strategy, key, value, action):
    if not hasattr(simulate_sharding, 'simulator'):
        simulate_sharding.simulator = DatabaseShardingSimulator(int(num_shards), strategy)
    elif (simulate_sharding.simulator.num_shards != int(num_shards) or
          simulate_sharding.simulator.sharding_strategy != strategy):
        simulate_sharding.simulator = DatabaseShardingSimulator(int(num_shards), strategy)
    
    if action == "Insert Data":
        simulate_sharding.simulator.insert(key, value)
        shard_id = simulate_sharding.simulator._get_shard_id(key)
        result = f"✅ Inserted `{key}` → Shard {shard_id}"
    elif action == "Lookup Data":
        shard_id, val = simulate_sharding.simulator.get(key)
        if shard_id >= 0:
            result = f"✅ Found `{key}` in Shard {shard_id} = {val}"
        else:
            result = f"❌ Key `{key}` not found"
    elif action == "Reset":
        simulate_sharding.simulator = DatabaseShardingSimulator(int(num_shards), strategy)
        result = "🔄 Sharding simulator reset"
    else:
        result = "Select an action"
    
    return result, simulate_sharding.simulator.get_stats()


def simulate_circuit_breaker(failure_threshold, recovery_timeout, action, num_simulations):
    if not hasattr(simulate_circuit_breaker, 'simulator'):
        simulate_circuit_breaker.simulator = CircuitBreakerSimulator(int(failure_threshold), int(recovery_timeout))
    elif (simulate_circuit_breaker.simulator.failure_threshold != int(failure_threshold) or
          simulate_circuit_breaker.simulator.recovery_timeout != int(recovery_timeout)):
        simulate_circuit_breaker.simulator = CircuitBreakerSimulator(int(failure_threshold), int(recovery_timeout))
    
    results = []
    if action == "Simulate Success":
        for i in range(int(num_simulations)):
            state, msg = simulate_circuit_breaker.simulator.execute(should_fail=False)
            results.append(f"{i+1}. [{state}] {msg}")
    elif action == "Simulate Failure":
        for i in range(int(num_simulations)):
            state, msg = simulate_circuit_breaker.simulator.execute(should_fail=True)
            results.append(f"{i+1}. [{state}] {msg}")
    elif action == "Reset":
        simulate_circuit_breaker.simulator.reset()
        results.append("🔄 Circuit breaker reset")
    
    return "\n".join(results), simulate_circuit_breaker.simulator.get_stats()


# Create the Gradio interface
with gr.Blocks(title="System Design Lab", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🏗️ System Design Lab
    
    Interactive simulations of common system design patterns and concepts.
    Select a tab below to explore different system design components.
    """)
    
    with gr.Tabs():
        # Load Balancer Tab
        with gr.TabItem("⚖️ Load Balancer"):
            gr.Markdown("""
            ### Load Balancer Simulator
            Simulates different load balancing algorithms to distribute traffic across servers.
            """)
            with gr.Row():
                with gr.Column(scale=1):
                    lb_num_servers = gr.Slider(minimum=2, maximum=10, value=3, step=1, label="Number of Servers")
                    lb_algorithm = gr.Dropdown(
                        choices=["Round Robin", "Least Connections", "Weighted", "IP Hash"],
                        value="Round Robin",
                        label="Algorithm"
                    )
                    lb_action = gr.Radio(
                        choices=["Add Request", "Release Connection", "Toggle Server Health", "Reset"],
                        value="Add Request",
                        label="Action"
                    )
                    lb_server_id = gr.Number(minimum=0, maximum=9, value=0, step=1, label="Server ID (for actions)")
                    lb_button = gr.Button("Execute", variant="primary")
                
                with gr.Column(scale=1):
                    lb_result = gr.Textbox(label="Result", lines=3)
                    lb_stats = gr.Markdown()
            
            lb_button.click(
                fn=simulate_load_balancer,
                inputs=[lb_num_servers, lb_algorithm, lb_action, lb_server_id],
                outputs=[lb_result, lb_stats]
            )
        
        # Cache Tab
        with gr.TabItem("🗄️ Cache"):
            gr.Markdown("""
            ### Cache Simulator
            Simulates caching strategies with LRU (Least Recently Used) and LFU (Least Frequently Used) eviction policies.
            """)
            with gr.Row():
                with gr.Column(scale=1):
                    cache_capacity = gr.Slider(minimum=2, maximum=20, value=5, step=1, label="Cache Capacity")
                    cache_policy = gr.Radio(choices=["LRU", "LFU"], value="LRU", label="Eviction Policy")
                    cache_action = gr.Radio(
                        choices=["Get from Cache", "Put in Cache", "Reset"],
                        value="Put in Cache",
                        label="Action"
                    )
                    cache_key = gr.Textbox(label="Key", placeholder="Enter key (e.g., user:123)")
                    cache_value = gr.Textbox(label="Value", placeholder="Enter value")
                    cache_button = gr.Button("Execute", variant="primary")
                
                with gr.Column(scale=1):
                    cache_result = gr.Textbox(label="Result", lines=3)
                    cache_stats = gr.Markdown()
            
            cache_button.click(
                fn=simulate_cache,
                inputs=[cache_capacity, cache_policy, cache_action, cache_key, cache_value],
                outputs=[cache_result, cache_stats]
            )
        
        # Rate Limiter Tab
        with gr.TabItem("🚦 Rate Limiter"):
            gr.Markdown("""
            ### Rate Limiter Simulator
            Simulates rate limiting algorithms to control API request rates.
            """)
            with gr.Row():
                with gr.Column(scale=1):
                    rl_rate_limit = gr.Slider(minimum=1, maximum=100, value=10, step=1, label="Rate Limit (requests)")
                    rl_window = gr.Slider(minimum=1, maximum=300, value=60, step=1, label="Time Window (seconds)")
                    rl_algorithm = gr.Dropdown(
                        choices=["Token Bucket", "Sliding Window", "Fixed Window"],
                        value="Token Bucket",
                        label="Algorithm"
                    )
                    rl_num_clicks = gr.Slider(minimum=1, maximum=50, value=15, step=1, label="Requests to Simulate")
                    rl_button = gr.Button("Simulate Requests", variant="primary")
                
                with gr.Column(scale=1):
                    rl_result = gr.Textbox(label="Request Results", lines=10)
                    rl_stats = gr.Markdown()
            
            rl_button.click(
                fn=simulate_rate_limiter,
                inputs=[rl_rate_limit, rl_window, rl_algorithm, rl_num_clicks],
                outputs=[rl_result, rl_stats]
            )
        
        # Database Sharding Tab
        with gr.TabItem("🗂️ Database Sharding"):
            gr.Markdown("""
            ### Database Sharding Simulator
            Simulates data distribution across database shards using different strategies.
            """)
            with gr.Row():
                with gr.Column(scale=1):
                    shard_num_shards = gr.Slider(minimum=2, maximum=16, value=4, step=1, label="Number of Shards")
                    shard_strategy = gr.Dropdown(
                        choices=["Hash", "Range", "Modulo"],
                        value="Hash",
                        label="Sharding Strategy"
                    )
                    shard_action = gr.Radio(
                        choices=["Insert Data", "Lookup Data", "Reset"],
                        value="Insert Data",
                        label="Action"
                    )
                    shard_key = gr.Textbox(label="Key", placeholder="Enter key (e.g., user_123)")
                    shard_value = gr.Textbox(label="Value", placeholder="Enter value")
                    shard_button = gr.Button("Execute", variant="primary")
                
                with gr.Column(scale=1):
                    shard_result = gr.Textbox(label="Result", lines=3)
                    shard_stats = gr.Markdown()
            
            shard_button.click(
                fn=simulate_sharding,
                inputs=[shard_num_shards, shard_strategy, shard_key, shard_value, shard_action],
                outputs=[shard_result, shard_stats]
            )
        
        # Circuit Breaker Tab
        with gr.TabItem("⚡ Circuit Breaker"):
            gr.Markdown("""
            ### Circuit Breaker Simulator
            Simulates the circuit breaker pattern for fault tolerance in distributed systems.
            """)
            with gr.Row():
                with gr.Column(scale=1):
                    cb_failure_threshold = gr.Slider(minimum=1, maximum=20, value=5, step=1, label="Failure Threshold")
                    cb_recovery_timeout = gr.Slider(minimum=1, maximum=60, value=10, step=1, label="Recovery Timeout (seconds)")
                    cb_action = gr.Radio(
                        choices=["Simulate Success", "Simulate Failure", "Reset"],
                        value="Simulate Failure",
                        label="Action"
                    )
                    cb_num_simulations = gr.Slider(minimum=1, maximum=20, value=5, step=1, label="Number of Simulations")
                    cb_button = gr.Button("Execute", variant="primary")
                
                with gr.Column(scale=1):
                    cb_result = gr.Textbox(label="Simulation Log", lines=10)
                    cb_stats = gr.Markdown()
            
            cb_button.click(
                fn=simulate_circuit_breaker,
                inputs=[cb_failure_threshold, cb_recovery_timeout, cb_action, cb_num_simulations],
                outputs=[cb_result, cb_stats]
            )
        
        # About Tab
        with gr.TabItem("ℹ️ About"):
            gr.Markdown("""
            ## System Design Lab
            
            This interactive lab helps you understand and experiment with common system design patterns:
            
            ### ⚖️ Load Balancer
            Distributes incoming network traffic across multiple servers to ensure no single server bears too much load.
            - **Round Robin**: Distributes requests sequentially across servers
            - **Least Connections**: Routes to the server with fewest active connections
            - **Weighted**: Distributes based on server capacity weights
            - **IP Hash**: Routes based on client IP for session persistence
            
            ### 🗄️ Cache
            Improves data retrieval performance by storing frequently accessed data in fast storage.
            - **LRU (Least Recently Used)**: Evicts the least recently accessed items
            - **LFU (Least Frequently Used)**: Evicts the least frequently accessed items
            
            ### 🚦 Rate Limiter
            Controls the rate of requests to prevent system overload and ensure fair usage.
            - **Token Bucket**: Allows burst traffic while maintaining average rate
            - **Sliding Window**: Tracks requests in a rolling time window
            - **Fixed Window**: Counts requests in fixed time intervals
            
            ### 🗂️ Database Sharding
            Horizontally partitions data across multiple databases for scalability.
            - **Hash**: Uses hash function to determine shard
            - **Range**: Distributes based on key ranges
            - **Modulo**: Uses modulo operation on numeric keys
            
            ### ⚡ Circuit Breaker
            Prevents cascading failures by failing fast when a service is unhealthy.
            - **CLOSED**: Normal operation, requests pass through
            - **OPEN**: Service failing, requests blocked
            - **HALF_OPEN**: Testing if service recovered
            
            ---
            Built with ❤️ using Gradio
            """)

if __name__ == "__main__":
    demo.launch()
