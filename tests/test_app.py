import sys
sys.path.insert(0, '/workspace')

from app import (
    LoadBalancerSimulator, CacheSimulator, RateLimiterSimulator,
    DatabaseShardingSimulator, CircuitBreakerSimulator
)


def test_load_balancer_round_robin():
    """Test Round Robin load balancing distributes requests evenly"""
    lb = LoadBalancerSimulator(num_servers=3, algorithm="Round Robin")
    
    # Add 6 requests - should distribute evenly across 3 servers
    for _ in range(6):
        lb.add_request()
    
    # Each server should have 2 requests
    for server in lb.servers:
        assert server.total_requests == 2, f"Server {server.id} should have 2 requests"


def test_load_balancer_least_connections():
    """Test Least Connections routes to server with fewest connections"""
    lb = LoadBalancerSimulator(num_servers=3, algorithm="Least Connections")
    
    # Manually set different connection counts
    lb.servers[0].connections = 5
    lb.servers[1].connections = 2
    lb.servers[2].connections = 8
    
    # Next request should go to server 1 (least connections)
    server_id = lb.add_request()
    assert server_id == 1, "Should route to server with least connections"


def test_cache_lru_eviction():
    """Test LRU cache evicts least recently used items"""
    cache = CacheSimulator(capacity=3, eviction_policy="LRU")
    
    # Fill cache
    cache.put("key1", "value1")
    cache.put("key2", "value2")
    cache.put("key3", "value3")
    
    # Access key1 to make it recently used
    cache.get("key1")
    
    # Add new key - should evict key2 (least recently used)
    cache.put("key4", "value4")
    
    assert "key2" not in cache.cache, "key2 should be evicted"
    assert "key1" in cache.cache, "key1 should still be in cache"
    assert "key4" in cache.cache, "key4 should be in cache"


def test_cache_lfu_eviction():
    """Test LFU cache evicts least frequently used items"""
    cache = CacheSimulator(capacity=3, eviction_policy="LFU")
    
    # Fill cache
    cache.put("key1", "value1")
    cache.put("key2", "value2")
    cache.put("key3", "value3")
    
    # Access key1 and key3 multiple times
    cache.get("key1")
    cache.get("key1")
    cache.get("key3")
    
    # Add new key - should evict key2 (least frequently used)
    cache.put("key4", "value4")
    
    assert "key2" not in cache.cache, "key2 should be evicted"
    assert "key1" in cache.cache, "key1 should still be in cache"


def test_rate_limiter_token_bucket():
    """Test Token Bucket rate limiter"""
    rl = RateLimiterSimulator(rate_limit=5, window_seconds=60, algorithm="Token Bucket")
    
    # Should allow first 5 requests
    allowed_count = sum(1 for _ in range(5) if rl.allow_request())
    assert allowed_count == 5, "Should allow 5 requests"
    
    # Next request should be rejected (no tokens left)
    assert not rl.allow_request(), "Should reject when no tokens available"


def test_rate_limiter_sliding_window():
    """Test Sliding Window rate limiter"""
    rl = RateLimiterSimulator(rate_limit=3, window_seconds=60, algorithm="Sliding Window")
    
    # Should allow first 3 requests
    allowed_count = sum(1 for _ in range(3) if rl.allow_request())
    assert allowed_count == 3, "Should allow 3 requests"
    
    # Next request should be rejected
    assert not rl.allow_request(), "Should reject when limit exceeded"


def test_database_sharding_hash():
    """Test Hash sharding strategy"""
    sharding = DatabaseShardingSimulator(num_shards=4, sharding_strategy="Hash")
    
    # Insert data
    sharding.insert("user_1", "data1")
    sharding.insert("user_2", "data2")
    sharding.insert("user_3", "data3")
    
    # Verify data is distributed
    shard_id, value = sharding.get("user_1")
    assert shard_id >= 0 and shard_id < 4, "Should return valid shard ID"
    assert value == "data1", "Should return correct value"


def test_circuit_breaker_state_transitions():
    """Test Circuit Breaker state transitions"""
    cb = CircuitBreakerSimulator(failure_threshold=3, recovery_timeout=1)
    
    # Start in CLOSED state
    assert cb.state == "CLOSED", "Should start in CLOSED state"
    
    # Trigger failures to open circuit
    for _ in range(3):
        cb.execute(should_fail=True)
    
    assert cb.state == "OPEN", "Should transition to OPEN after threshold failures"
    
    # Success in HALF_OPEN should close circuit
    import time
    time.sleep(1.1)  # Wait for recovery timeout
    cb.execute(should_fail=False)
    cb.execute(should_fail=False)  # Execute again to transition from HALF_OPEN
    
    assert cb.state == "CLOSED", "Should transition to CLOSED after success in HALF_OPEN"


def test_circuit_breaker_rejects_when_open():
    """Test Circuit Breaker rejects requests when OPEN"""
    cb = CircuitBreakerSimulator(failure_threshold=2, recovery_timeout=60)
    
    # Open the circuit
    cb.execute(should_fail=True)
    cb.execute(should_fail=True)
    
    assert cb.state == "OPEN", "Circuit should be OPEN"
    
    # Requests should be rejected
    state, msg = cb.execute(should_fail=False)
    assert state == "OPEN", "Should remain OPEN"
    assert "rejected" in msg.lower(), "Should indicate request was rejected"


def test_cache_hit_miss_statistics():
    """Test cache statistics tracking"""
    cache = CacheSimulator(capacity=5, eviction_policy="LRU")
    
    # Add some data
    cache.put("key1", "value1")
    cache.put("key2", "value2")
    
    # Hit
    cache.get("key1")
    # Miss
    cache.get("nonexistent")
    # Hit
    cache.get("key2")
    
    stats = cache.get_stats()
    assert cache.hits == 2, "Should have 2 hits"
    assert cache.misses == 1, "Should have 1 miss"
    assert "Hit Rate:" in stats, "Stats should include hit rate"
