# System Design Lab 🏗️

An interactive visual drag-and-drop system design simulator for learning distributed system architectures.

## Features

✅ **Drag & Drop Interface** - Easily add components from palette to canvas  
✅ **Dynamic Connections** - Connect components to define traffic flow  
✅ **Real-time Metrics** - Monitor QPS, latency, throughput, and error rates  
✅ **Animated Data Flow** - Visualize request flow with particle animations  
✅ **Auto-resizable Canvas** - Pan and zoom with mouse controls  
✅ **Dark Theme** - Complete dark mode UI  
✅ **10+ Templates** - From simple client-server to complex systems (Twitter, Netflix, WhatsApp, etc.)  
✅ **Component Configuration** - Fine-tune each component's parameters  
✅ **Start/Stop Simulation** - Control simulation execution  
✅ **Export Configurations** - Save and load your designs  

## Components Available

- 🖥️ **Client** - End users or external services
- ⚖️ **Load Balancer** - Distributes traffic across servers
- 🖧 **Server** - Application servers processing requests
- 🗄️ **Database** - Data storage systems
- ⚡ **Cache** - Fast caching layer (Redis/Memcached)
- 🚪 **API Gateway** - Entry point for API requests
- 📬 **Message Queue** - Async message processing (Kafka/RabbitMQ)
- 🌐 **CDN** - Content delivery network

## Templates Included

1. Client-Server (Basic)
2. Load Balancer + 2 Servers
3. Cache Layer
4. Database Sharding
5. API Gateway Pattern
6. Message Queue Async
7. Twitter-like System
8. YouTube Streaming
9. WhatsApp Messaging
10. Netflix Architecture
11. Google Docs Collaboration

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <repo-directory>

# Install dependencies
pip install flask

# Run the application
python app.py
```

## Usage

1. Open browser to `http://localhost:5000`
2. **Add Components**: Drag from left palette to canvas
3. **Connect**: Click "Connect Mode", then click source → target
4. **Configure**: Select a component to edit properties in right panel
5. **Simulate**: Click "Start" to run simulation with live metrics
6. **Pan/Zoom**: Use pan mode or scroll to navigate canvas
7. **Load Template**: Select from dropdown to load pre-built architectures

## Project Structure

```
/workspace
├── app.py                      # Flask backend
├── templates/
│   └── index.html             # Main HTML template
├── static/
│   ├── css/
│   │   └── styles.css         # Dark theme styles
│   └── js/
│       ├── app.js             # Main application logic
│       ├── component_types.js # Component definitions
│       ├── templates.js       # System templates
│       └── simulation_engine.js # Metrics & animation engine
└── README.md                  # This file
```

## Learning Objectives

- Understand system design patterns
- Learn about load balancing strategies
- Explore caching mechanisms
- Practice database sharding concepts
- Study microservices architectures
- Analyze real-world system designs (Twitter, Netflix, etc.)
- Identify bottlenecks and optimize performance

## Technologies

- **Backend**: Flask (Python)
- **Frontend**: Vanilla JavaScript
- **Styling**: CSS3 with CSS Variables
- **Visualization**: SVG for connections, DOM for components

## License

MIT License

## Contributing

Feel free to submit issues and enhancement requests!
