# 🚀 Quick Start Guide - System Design Lab

## Launch the Visual Designer (Recommended)

```bash
python system_designer.py
```

Then open your browser to `http://localhost:7860`

---

## 🎯 Your First Architecture (5 minutes)

### Step 1: Load a Template
1. In the left panel, find **"Load Template"** dropdown
2. Select **"Simple Web App"**
3. Click **"📥 Load Template"**

You'll see a complete architecture appear:
- 👥 Users → ⚖️ Load Balancer → 🖥️ Servers → ⚡ Cache → 🗄️ Database

### Step 2: Start the Simulation
1. Click **"▶️ Start Simulation"** button
2. Watch the canvas update every 0.5 seconds
3. Observe QPS and latency numbers on each component

### Step 3: Configure a Component
1. Look at the right panel under **"Configure Component"**
2. Change **Max QPS** of "App Server 1" from 3000 to 1000
3. Click **"💾 Update Configuration"**
4. Watch what happens in the simulation!

### Step 4: Monitor System Metrics
Look at the **"System Statistics"** section in the middle:
- **Total QPS** - Overall throughput
- **Avg Latency** - Average response time
- **Error Rate** - Percentage of failed requests
- **Healthy Components** - How many are not overloaded

---

## 📚 Learning Exercises

### Exercise 1: Find the Bottleneck
1. Load "Simple Web App" template
2. Gradually increase Client QPS from 5000 to 15000
3. Which component turns red (overloaded) first?
4. That's your bottleneck!

### Exercise 2: Scale Horizontally
1. Add another Server component
2. Connect it to the Load Balancer
3. Compare performance with 2 vs 3 servers
4. How does it affect latency?

### Exercise 3: Test Caching Impact
1. Note the current error rate
2. Increase Cache QPS from 50000 to 100000
3. Reduce Database QPS to simulate slow DB
4. See how cache protects the database!

### Exercise 4: Build Microservices
1. Clear the canvas
2. Load "Microservices" template
3. Observe how services communicate
4. What happens when Payment Service fails?

---

## 🎛️ Component Reference

| Component | Icon | Typical QPS | Typical Latency | Use Case |
|-----------|------|-------------|-----------------|----------|
| Client | 👥 | 1,000 - 100,000 | 1ms | Traffic source |
| Load Balancer | ⚖️ | 10,000 - 50,000 | 2-5ms | Distribute traffic |
| Server | 🖥️ | 1,000 - 5,000 | 20-50ms | Application logic |
| Cache | ⚡ | 50,000 - 100,000 | 1-5ms | Fast data access |
| Database | 🗄️ | 5,000 - 10,000 | 30-100ms | Persistent storage |
| API Gateway | 🚪 | 20,000 - 50,000 | 5-10ms | API entry point |
| Message Queue | 📬 | 50,000+ | 5-20ms | Async processing |
| CDN | 🌐 | 500,000+ | 5-15ms | Static content |

---

## 🔧 Configuration Tips

### QPS (Queries Per Second)
- **Low**: 1,000 - Small service
- **Medium**: 5,000 - Typical web server
- **High**: 50,000+ - Specialized infrastructure (CDN, Cache)

### Latency
- **Fast**: 1-5ms - Cache, CDN, LB
- **Normal**: 20-50ms - Application servers
- **Slow**: 50-100ms - Databases, external APIs

### Failure Rate
- **Very Reliable**: 0.001 (0.1%) - Critical infra
- **Normal**: 0.01 (1%) - Standard service
- **Unreliable**: 0.05+ (5%+) - External dependencies

---

## 💡 Pro Tips

1. **Watch the colors**: Green = healthy, Red = overloaded
2. **Latency increases under load**: Notice how latency grows as QPS approaches capacity
3. **Failures cascade**: When one component fails, others may overload
4. **Start small**: Begin with simple architectures, then add complexity
5. **Export configs**: Save interesting setups using "📤 Export Config"

---

## 🎓 What You'll Learn

By experimenting with the System Design Lab, you'll understand:

✅ **Capacity Planning** - How much traffic can your system handle?  
✅ **Bottleneck Identification** - Where does your system break?  
✅ **Scaling Strategies** - When to add more servers vs upgrade existing ones  
✅ **Caching Benefits** - How caches protect databases  
✅ **Latency Accumulation** - How delays add up through the stack  
✅ **Fault Tolerance** - How failures propagate through systems  
✅ **Load Distribution** - How traffic flows through components  

---

## 🆘 Troubleshooting

**Canvas is empty?**
- Click "Load Template" to start with a preset architecture

**Simulation not updating?**
- Make sure you clicked "▶️ Start Simulation"
- Check if the timer is running (updates every 0.5s)

**Component always red?**
- Its QPS capacity is too low for the incoming traffic
- Increase Max QPS or reduce upstream traffic

**Can't connect components?**
- Select "From Component" and "To Component" from dropdowns
- Then click "🔗 Connect"

---

## 📖 Next Steps

After mastering the Visual Designer:
1. Try the individual **Concept Simulators** (`python app.py`)
2. Learn specific algorithms (Load Balancing, Caching, Rate Limiting)
3. Come back and build more complex architectures
4. Experiment with different configurations
5. Share your designs with the team!

---

**Happy System Designing! 🎨🚀**
