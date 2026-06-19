/**
 * Simulation Engine
 * Handles metrics calculation, data flow animation, and simulation state
 */

class SimulationEngine {
    constructor() {
        this.running = false;
        this.components = {};
        this.connections = [];
        this.metrics = {}; // Will be populated by calculateMetrics
        this.particles = [];
        this.lastUpdate = 0;
        this.animationFrame = null;
    }

    /**
     * Start simulation
     */
    start(components, connections) {
        this.components = components;
        this.connections = connections;
        this.running = true;
        this.lastUpdate = Date.now();
        this.particles = [];
        
        // Initialize metrics immediately so dashboard isn't empty
        this.calculateMetrics();
        
        this.animate();
    }

    /**
     * Stop simulation
     */
    stop() {
        this.running = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.clearParticles();
    }

    /**
     * Update simulation state
     */
    update(components, connections) {
        this.components = components;
        this.connections = connections;
        if (this.running) {
            this.calculateMetrics();
        }
    }

    /**
     * Calculate metrics for all components
     */
    calculateMetrics() {
        const now = Date.now();
        const delta = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // Reset metrics for all components first
        this.metrics = {};
        for (const compId in this.components) {
            const comp = this.components[compId];
            const isActive = comp.active !== false;
            
            this.metrics[compId] = {
                qps: 0,
                latency: comp.config?.latency || 10,
                throughput: 0,
                errorRate: 0,
                health: isActive ? 'healthy' : 'unhealthy',
                connections: 0
            };
            
            if (!isActive) {
                this.metrics[compId].health = 'unhealthy';
                this.metrics[compId].qps = 0;
                this.metrics[compId].throughput = 0;
            }
        }

        // Simulate traffic flow starting from clients
        for (const compId in this.components) {
            const comp = this.components[compId];
            
            // Skip dead components
            if (comp.active === false) continue;
            
            if (comp.type === 'client') {
                const baseQps = comp.config?.qps || 100;
                this.metrics[compId].qps = baseQps;
                this.metrics[compId].throughput = baseQps * (1 - (comp.config?.failureRate || 0));
                
                // Propagate load to connected components
                this.propagateLoad(compId, baseQps);
            }
        }

        return this.metrics;
    }

    /**
     * Propagate load through connections
     */
    propagateLoad(fromId, incomingQps) {
        const outgoingConnections = this.connections.filter(c => c.from === fromId);
        
        if (outgoingConnections.length === 0) return;

        const qpsPerConnection = incomingQps / outgoingConnections.length;

        for (const conn of outgoingConnections) {
            const targetId = conn.to;
            if (!this.components[targetId] || !this.metrics[targetId]) continue;

            const targetComp = this.components[targetId];
            
            // Skip dead components
            if (targetComp.active === false) continue;
            
            const capacity = targetComp.config?.qps || 1000;
            const failureRate = targetComp.config?.failureRate || 0;
            const latency = targetComp.config?.latency || 10;

            // Calculate actual QPS considering capacity
            const actualQps = Math.min(qpsPerConnection, capacity);
            const errorRate = qpsPerConnection > capacity ? 
                failureRate + 0.1 : failureRate * 0.5;
            
            // Accumulate metrics
            this.metrics[targetId].qps += Math.round(actualQps);
            this.metrics[targetId].throughput += Math.round(actualQps * (1 - errorRate));
            this.metrics[targetId].errorRate = Math.max(
                this.metrics[targetId].errorRate, 
                Math.round(errorRate * 100 * 100) / 100
            );
            this.metrics[targetId].latency = latency * (1 + errorRate);
            
            // Determine health status
            if (errorRate > 0.1 || qpsPerConnection > capacity) {
                this.metrics[targetId].health = 'unhealthy';
            } else if (errorRate > 0.05) {
                this.metrics[targetId].health = 'degraded';
            }

            // Continue propagating recursively
            this.propagateLoad(targetId, actualQps);
        }
    }

    /**
     * Animation loop for particles
     */
    animate() {
        if (!this.running) return;

        // Recalculate metrics every frame for live updates
        this.calculateMetrics();

        this.updateParticles();
        this.renderParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update particle positions
     */
    updateParticles() {
        const now = Date.now();
        
        // Spawn new particles from ALL active components with outgoing connections
        for (const compId in this.components) {
            const comp = this.components[compId];
            if (comp.active === false) continue;
            
            const hasOutgoing = this.connections.some(c => c.from === compId);
            if (!hasOutgoing) continue;
            
            const qps = this.metrics[compId]?.qps || comp.config?.qps || 10;
            const spawnRate = Math.min(qps / 50, 15);
            
            if (Math.random() < spawnRate * 0.05) { // Adjusted probability
                this.spawnParticle(compId);
            }
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.progress += particle.speed;

            if (particle.progress >= 1) {
                const targetComp = this.components[particle.connection.to];
                const sourceComp = this.components[particle.connection.from];
                
                // Handle Cache Miss logic
                if (targetComp && targetComp.type === 'cache') {
                    const hitRate = targetComp.config?.hitRate || 0.8;
                    if (Math.random() > hitRate) {
                        // Cache miss: find DB connection
                        const dbConnection = this.connections.find(c => 
                            c.from === particle.connection.to && 
                            this.components[c.to] && 
                            this.components[c.to].type === 'database'
                        );
                        
                        if (dbConnection) {
                            const dbComp = this.components[dbConnection.to];
                            
                            // Spawn particle to DB
                            this.particles.push({
                                connection: dbConnection,
                                from: targetComp,
                                to: dbComp,
                                progress: 0,
                                speed: particle.speed,
                                type: 'cache-miss'
                            });
                            
                            // Spawn return particle (DB -> Cache) after delay
                            setTimeout(() => {
                                if (!this.running) return;
                                // Try to find explicit return connection, else reverse
                                let returnConn = this.connections.find(c => 
                                    c.from === dbConnection.to && c.to === dbConnection.from
                                );
                                
                                if (!returnConn) {
                                    returnConn = { from: dbConnection.to, to: dbConnection.from };
                                }

                                this.particles.push({
                                    connection: returnConn,
                                    from: dbComp,
                                    to: targetComp,
                                    progress: 0,
                                    speed: particle.speed,
                                    type: 'cache-response'
                                });
                            }, 200);
                        }
                    }
                }
                
                // Remove arrived particle
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Spawn a new particle
     */
    spawnParticle(fromId) {
        const outgoingConnections = this.connections.filter(c => c.from === fromId);
        if (outgoingConnections.length === 0) return;

        const conn = outgoingConnections[Math.floor(Math.random() * outgoingConnections.length)];
        
        const fromComp = this.components[fromId];
        const toComp = this.components[conn.to];

        if (!fromComp || !toComp) return;

        this.particles.push({
            connection: conn,
            from: fromComp,
            to: toComp,
            progress: 0,
            speed: 0.02 + Math.random() * 0.02
        });
    }

    /**
     * Get SVG path element for a connection
     */
    getPathElement(fromId, toId) {
        let path = document.querySelector(`path[data-from="${fromId}"][data-to="${toId}"]`);
        if (!path) {
            path = document.querySelector(`path[data-from="${toId}"][data-to="${fromId}"]`);
        }
        return path;
    }

    /**
     * Render particles to DOM following SVG paths
     */
    renderParticles() {
        const layer = document.getElementById('particles-layer');
        if (!layer) return;

        layer.innerHTML = '';

        for (const particle of this.particles) {
            const pathEl = this.getPathElement(particle.from.id, particle.to.id);
            if (!pathEl) {
                this.renderFallbackParticle(layer, particle);
                continue;
            }

            try {
                const length = pathEl.getTotalLength();
                const point = pathEl.getPointAtLength(length * particle.progress);

                const element = document.createElement('div');
                element.className = 'particle';
                
                if (particle.type === 'cache-miss') {
                    element.style.backgroundColor = '#ff9800';
                } else if (particle.type === 'cache-response') {
                    element.style.backgroundColor = '#2196f3';
                } else {
                    element.style.backgroundColor = '#00e676';
                }

                element.style.left = `${point.x - 4}px`;
                element.style.top = `${point.y - 4}px`;

                layer.appendChild(element);
            } catch (e) {
                this.renderFallbackParticle(layer, particle);
            }
        }
    }

    /**
     * Fallback particle rendering
     */
    renderFallbackParticle(layer, particle) {
        const element = document.createElement('div');
        element.className = 'particle';
        
        const startX = particle.from.x + 70;
        const startY = particle.from.y + 40;
        const endX = particle.to.x + 70;
        const endY = particle.to.y + 40;

        const currentX = startX + (endX - startX) * particle.progress;
        const currentY = startY + (endY - startY) * particle.progress;

        element.style.left = `${currentX - 4}px`;
        element.style.top = `${currentY - 4}px`;

        layer.appendChild(element);
    }

    /**
     * Clear all particles
     */
    clearParticles() {
        this.particles = [];
        const layer = document.getElementById('particles-layer');
        if (layer) {
            layer.innerHTML = '';
        }
    }

    /**
     * Get current metrics
     */
    getMetrics() {
        return this.metrics;
    }

    /**
     * Add a connection
     */
    addConnection(connection) {
        const exists = this.connections.some(c => 
            (c.from === connection.from && c.to === connection.to) ||
            (c.from === connection.to && c.to === connection.from)
        );
        
        if (!exists) {
            this.connections.push(connection);
        }
    }

    /**
     * Remove a connection
     */
    removeConnection(fromId, toId) {
        this.connections = this.connections.filter(c => 
            !((c.from === fromId && c.to === toId) ||
              (c.from === toId && c.to === fromId))
        );
    }

    /**
     * Clear all connections
     */
    clearConnections() {
        this.connections = [];
    }
}

// Create global instance
const simulationEngine = new SimulationEngine();
window.simulationEngine = simulationEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulationEngine;
}