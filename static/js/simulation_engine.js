// Simulation Engine - Handles metrics calculation and data flow animation

class SimulationEngine {
    constructor() {
        this.simulationId = null;
        this.isRunning = false;
        this.metricsInterval = null;
        this.animationFrame = null;
        this.particles = [];
        this.connections = [];
    }

    async start(simulationId, components, connections) {
        this.simulationId = simulationId;
        this.isRunning = true;
        this.connections = connections;
        
        // Start metrics polling
        this.metricsInterval = setInterval(() => {
            this.fetchMetrics();
        }, 500);

        // Start animation
        this.animate();
        
        return true;
    }

    stop() {
        this.isRunning = false;
        
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        
        this.clearParticles();
    }

    async fetchMetrics() {
        if (!this.simulationId || !this.isRunning) return;
        
        try {
            const response = await fetch(`/api/simulations/${this.simulationId}/metrics`);
            const metrics = await response.json();
            
            if (metrics.components) {
                this.updateComponentMetrics(metrics.components);
            }
        } catch (error) {
            console.error('Error fetching metrics:', error);
        }
    }

    updateComponentMetrics(componentsMetrics) {
        for (const [compId, metrics] of Object.entries(componentsMetrics)) {
            const componentEl = document.querySelector(`[data-component-id="${compId}"]`);
            if (componentEl) {
                this.updateComponentDisplay(componentEl, metrics);
            }
        }
    }

    updateComponentDisplay(componentEl, metrics) {
        let metricsEl = componentEl.querySelector('.component-metrics');
        
        if (!metricsEl) {
            metricsEl = document.createElement('div');
            metricsEl.className = 'component-metrics';
            componentEl.appendChild(metricsEl);
        }

        const healthClass = metrics.health === 'healthy' ? '' : 
                           metrics.health === 'degraded' ? 'degraded' : 'error';
        
        metricsEl.innerHTML = `
            <div class="metric-item">
                <span>QPS:</span>
                <span class="metric-value">${metrics.qps.toLocaleString()}</span>
            </div>
            <div class="metric-item">
                <span>Latency:</span>
                <span class="metric-value">${metrics.latency_ms.toFixed(1)}ms</span>
            </div>
            <div class="metric-item">
                <span>Throughput:</span>
                <span class="metric-value">${metrics.throughput_mbps.toFixed(1)} Mb/s</span>
            </div>
            <div class="metric-item">
                <span>Errors:</span>
                <span class="metric-value">${(metrics.error_rate * 100).toFixed(2)}%</span>
            </div>
            <div class="metric-item" style="grid-column: span 2;">
                <span>Health:</span>
                <div class="health-indicator ${healthClass}"></div>
            </div>
        `;
    }

    animate() {
        if (!this.isRunning) return;

        // Create new particles for active connections
        if (Math.random() < 0.1) {
            this.createParticle();
        }

        // Update particle positions
        this.updateParticles();

        // Render particles
        this.renderParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    createParticle() {
        if (this.connections.length === 0) return;
        
        const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
        const fromComp = document.querySelector(`[data-component-id="${connection.from}"]`);
        const toComp = document.querySelector(`[data-component-id="${connection.to}"]`);
        
        if (fromComp && toComp) {
            const fromRect = fromComp.getBoundingClientRect();
            const toRect = toComp.getBoundingClientRect();
            const canvasRect = document.getElementById('canvas').getBoundingClientRect();
            
            this.particles.push({
                from: connection.from,
                to: connection.to,
                progress: 0,
                speed: 0.02 + Math.random() * 0.02,
                startX: fromRect.left - canvasRect.left + fromRect.width / 2,
                startY: fromRect.top - canvasRect.top + fromRect.height / 2,
                endX: toRect.left - canvasRect.left + toRect.width / 2,
                endY: toRect.top - canvasRect.top + toRect.height / 2
            });
        }
    }

    updateParticles() {
        this.particles.forEach(particle => {
            particle.progress += particle.speed;
            if (particle.progress >= 1) {
                particle.progress = 0;
            }
        });

        // Remove old particles
        this.particles = this.particles.filter(p => p.progress < 1);
    }

    renderParticles() {
        const svg = document.getElementById('connectionsSvg');
        if (!svg) return;

        // Clear existing particles
        svg.querySelectorAll('.data-particle').forEach(el => el.remove());

        // Add new particles
        this.particles.forEach(particle => {
            const x = particle.startX + (particle.endX - particle.startX) * particle.progress;
            const y = particle.startY + (particle.endY - particle.startY) * particle.progress;
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('class', 'data-particle');
            
            svg.appendChild(circle);
        });
    }

    clearParticles() {
        this.particles = [];
        const svg = document.getElementById('connectionsSvg');
        if (svg) {
            svg.querySelectorAll('.data-particle').forEach(el => el.remove());
        }
    }

    drawConnections(connections) {
        const svg = document.getElementById('connectionsSvg');
        if (!svg) return;

        // Clear existing connections
        svg.querySelectorAll('.connection-line').forEach(el => el.remove());

        connections.forEach(conn => {
            const fromComp = document.querySelector(`[data-component-id="${conn.from}"]`);
            const toComp = document.querySelector(`[data-component-id="${conn.to}"]`);
            
            if (fromComp && toComp) {
                const fromRect = fromComp.getBoundingClientRect();
                const toRect = toComp.getBoundingClientRect();
                const canvasRect = document.getElementById('canvas').getBoundingClientRect();
                
                const x1 = fromRect.left - canvasRect.left + fromRect.width / 2;
                const y1 = fromRect.top - canvasRect.top + fromRect.height / 2;
                const x2 = toRect.left - canvasRect.left + toRect.width / 2;
                const y2 = toRect.top - canvasRect.top + toRect.height / 2;
                
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
                path.setAttribute('class', 'connection-line');
                
                svg.appendChild(path);
            }
        });
    }
}

// Export for use in app.js
window.SimulationEngine = SimulationEngine;
