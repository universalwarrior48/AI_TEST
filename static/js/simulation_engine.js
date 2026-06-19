/**
 * Simulation Engine
 * Handles metrics calculation, data flow animation, and simulation state
 */

class SimulationEngine {
    constructor() {
        this.running = false;
        this.components = {};
        this.connections = [];
        this.metrics = {};
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

        // Initialize metrics
        this.metrics = {};
        for (const compId in this.components) {
            const comp = this.components[compId];
            this.metrics[compId] = {
                qps: 0,
                latency: comp.config.latency || 10,
                throughput: 0,
                errorRate: 0,
                health: 'healthy',
                connections: 0
            };
        }

        // Simulate traffic flow from clients
        for (const compId in this.components) {
            const comp = this.components[compId];
            
            if (comp.type === 'client') {
                // Client generates load
                const baseQps = comp.config.qps || 100;
                this.metrics[compId].qps = baseQps;
                this.metrics[compId].throughput = baseQps * (1 - (comp.config.failureRate || 0));
                
                // Propagate to connected components
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
            const capacity = targetComp.config.qps || 1000;
            const failureRate = targetComp.config.failureRate || 0;
            const latency = targetComp.config.latency || 10;

            // Calculate actual QPS considering capacity
            const actualQps = Math.min(qpsPerConnection, capacity);
            const errorRate = qpsPerConnection > capacity ? 
                failureRate + 0.1 : failureRate * 0.5;
            
            // Update metrics
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

            // Continue propagating
            this.propagateLoad(targetId, actualQps);
        }
    }

    /**
     * Animation loop for particles
     */
    animate() {
        if (!this.running) return;

        this.updateParticles();
        this.renderParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update particle positions
     */
    updateParticles() {
        // Spawn new particles from clients
        for (const compId in this.components) {
            const comp = this.components[compId];
            if (comp.type === 'client' && this.metrics[compId]?.qps > 0) {
                // Spawn particles based on QPS
                const spawnRate = Math.min(this.metrics[compId].qps / 100, 10);
                if (Math.random() < spawnRate * 0.1) {
                    this.spawnParticle(compId);
                }
            }
        }

        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.progress += particle.speed;

            if (particle.progress >= 1) {
                // Particle reached destination
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
     * Render particles to DOM
     */
    renderParticles() {
        const layer = document.getElementById('particles-layer');
        if (!layer) return;

        // Clear existing particles
        layer.innerHTML = '';

        // Render each particle
        for (const particle of this.particles) {
            const element = document.createElement('div');
            element.className = 'particle';
            
            const startX = particle.from.x + 70;
            const startY = particle.from.y + 40;
            const endX = particle.to.x + 70;
            const endY = particle.to.y + 40;

            const currentX = startX + (endX - startX) * particle.progress;
            const currentY = startY + (endY - startY) * particle.progress;

            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;

            layer.appendChild(element);
        }
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
}

// Create global instance
const simulationEngine = new SimulationEngine();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimulationEngine;
}
