---
title: System Design Lab
emoji: 🏗️
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 6.9.0
app_file: app.py
pinned: false
license: mit
---

# 🏗️ System Design Lab

An interactive web application to simulate and learn various system design concepts and patterns.

## Features

This lab provides hands-on simulations for the following system design components:

### ⚖️ Load Balancer
- **Round Robin**: Distributes requests sequentially across servers
- **Least Connections**: Routes to the server with fewest active connections
- **Weighted**: Distributes based on server capacity weights
- **IP Hash**: Routes based on client IP for session persistence

### 🗄️ Cache
- **LRU (Least Recently Used)**: Evicts the least recently accessed items
- **LFU (Least Frequently Used)**: Evicts the least frequently accessed items

### 🚦 Rate Limiter
- **Token Bucket**: Allows burst traffic while maintaining average rate
- **Sliding Window**: Tracks requests in a rolling time window
- **Fixed Window**: Counts requests in fixed time intervals

### 🗂️ Database Sharding
- **Hash**: Uses hash function to determine shard
- **Range**: Distributes based on key ranges
- **Modulo**: Uses modulo operation on numeric keys

### ⚡ Circuit Breaker
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Service failing, requests blocked
- **HALF_OPEN**: Testing if service recovered

## Usage

1. Select a tab to explore different system design concepts
2. Configure parameters using the input controls
3. Execute actions to see real-time simulation results
4. View statistics and understand how each component behaves

## Requirements

- Python 3.8+
- Gradio 6.9.0+

## Running Locally

```bash
pip install -r requirements.txt
python app.py
```

The application will launch in your default browser at `http://localhost:7860`.

## License

MIT License
