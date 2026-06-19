# System Design Lab

A visual drag-and-drop system design simulator that helps you learn system design by actually building and testing distributed systems.

## 🚀 Features

- **Visual Drag-and-Drop Interface**: Build systems by dragging components onto a canvas
- **Real-time Metrics**: Monitor QPS, latency, throughput, and error rates
- **Animated Data Flow**: Watch data particles flow through your system
- **10 Example Templates**: From simple client-server to complex systems like Twitter, YouTube, WhatsApp, Netflix, and Google Docs
- **Configurable Components**: Fine-tune each component's parameters
- **Dark Theme**: Easy on the eyes for long design sessions
- **Auto-resizable Canvas**: Pan and zoom to work with large systems
- **Save/Load/Export**: Persist your designs locally or export as JSON

## 📋 Components Available

- 🖥️ **Client** - End users accessing your system
- ⚖️ **Load Balancer** - Distributes traffic across servers
- 🖧 **Server** - Application servers processing requests
- 🗄️ **Database** - Data storage (SQL, NoSQL, etc.)
- ⚡ **Cache** - In-memory caching layer (Redis, Memcached)
- 🚪 **API Gateway** - Entry point for API requests
- 📨 **Message Queue** - Async messaging (Kafka, RabbitMQ)
- 🌐 **CDN** - Content Delivery Network

## 🏗️ Example Templates

1. **Client-Server** (⭐) - Basic architecture
2. **Load Balancer + 2 Servers** (⭐⭐) - Horizontal scaling
3. **Cache Layer** (⭐⭐⭐) - Performance optimization
4. **Database Sharding** (⭐⭐⭐⭐) - Horizontal DB scaling
5. **Microservices** (⭐⭐⭐⭐⭐) - Service-oriented architecture
6. **Twitter-like System** (⭐⭐⭐⭐⭐⭐⭐) - Social media platform
7. **YouTube-like System** (⭐⭐⭐⭐⭐⭐⭐⭐) - Video streaming
8. **WhatsApp-like System** (⭐⭐⭐⭐⭐⭐⭐⭐) - Real-time messaging
9. **Netflix-like System** (⭐⭐⭐⭐⭐⭐⭐⭐⭐) - Streaming with recommendations
10. **Google Docs-like System** (⭐⭐⭐⭐⭐⭐⭐⭐⭐) - Real-time collaboration

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd system-design-lab

# Install dependencies
pip install flask

# Run the application
python app.py
```

## 🎮 Usage

1. **Open your browser** and navigate to `http://localhost:5000`

2. **Add Components**:
   - Drag components from the left sidebar onto the canvas
   - Or click on a template to load a pre-built system

3. **Connect Components**:
   - Double-click a component to enter connection mode
   - Click on another component to connect them
   - Or use the connection indicator at the top

4. **Configure Components**:
   - Click on any component to see its properties
   - Adjust parameters like QPS capacity, latency, connections, etc.

5. **Run Simulation**:
   - Click the "Start" button to begin simulation
   - Watch animated data particles flow through your system
   - Monitor real-time metrics for each component

6. **Analyze & Optimize**:
   - Identify bottlenecks (red/yellow health indicators)
   - Adjust component configurations
   - Add more servers, caches, or load balancers
   - Re-run simulation to see improvements

7. **Save/Export**:
   - Save your design to browser local storage
   - Export as JSON for sharing or version control

## 🎯 Learning Objectives

- Understand how different components interact in a distributed system
- Learn about load balancing strategies
- See the impact of caching on performance
- Understand database sharding and replication
- Explore microservices architecture patterns
- Identify single points of failure
- Practice capacity planning and scaling

## 📁 Project Structure

```
system-design-lab/
├── app.py                      # Flask backend
├── templates/
│   └── index.html              # Main HTML template
├── static/
│   ├── css/
│   │   └── styles.css          # Dark theme styles
│   └── js/
│       ├── app.js              # Main application logic
│       ├── component_types.js  # Component definitions
│       ├── simulation_engine.js # Metrics & animations
│       └── templates.js        # Example templates
└── README.md                   # This file
```

## 🔧 Configuration

Each component type has configurable parameters:

- **Client**: requests_per_sec, timeout_ms
- **Load Balancer**: algorithm, qps_capacity, latency_ms, max_connections
- **Server**: qps_capacity, latency_ms, max_connections, failure_rate
- **Database**: type, connections, latency_ms, storage_gb
- **Cache**: capacity_mb, eviction_policy, hit_rate, latency_ms
- **API Gateway**: rate_limit, latency_ms, max_connections
- **Message Queue**: type, throughput_mbps, retention_hours
- **CDN**: edge_locations, cache_hit_rate, bandwidth_gbps

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new component types
- Create more example templates
- Improve the simulation engine
- Enhance the UI/UX
- Fix bugs

## 📄 License

MIT License - feel free to use this for learning and teaching!

## 🙏 Acknowledgments

This tool was built to help developers learn system design concepts through hands-on experimentation. Inspired by real-world architectures from companies like Twitter, YouTube, Netflix, and Google.
