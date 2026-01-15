# FUNCTOR 001B

**A FUNCTOR 001 variant with screen synchronization.**

FUNCTOR 001B is a multi-view web application built with A-Frame and Three.js that creates immersive 3D experiences with real-time peer-to-peer communication. The project implements a "boid" system (flocking behavior) with emoji representations and integrates with Google Maps for 3D landscape visualization.

## Key Features

* **Multi-View Architecture**: Synchronized experiences across different devices via PeerJS.
* **Boid System**: GPU-accelerated flocking behavior simulation using Emojis.
* **3D Landscape (Optional)**: Integration with Google Maps API and 3D Tiles for real-time city visualization.
* **AR Integration**: AR experiences via mobile device cameras.

## Views

The application handles different roles through specific URLs.

### Main Views

**1. Hyper Landscape View** (`/`)
The primary landscape visualization.

**2. Functor View** (`/functor/`)
An AR view designed for mobile devices (specifically iPhones). It renders emoji boids over real-time video and provides peer-to-peer video streaming.

**3. Room View** (`/room/`)
A third-person perspective of the scene. It visualizes the environment and emoji animations from an external viewpoint.

### Experimental Views

**Landscape Receiver** (`/receiver.html`)
An experimental view designed to test the transmission of large-scale emoji position data encoded within a WebRTC video stream.

## Optional Configuration for Full Functionality

The application can run without the following, but they are required to unlock specific features.

### 1. Google Maps API (for 3D Landscape)

To enable the 3D city visualization in the Hyper Landscape view (`/`), a valid Google Maps API key with "Map Tiles API" enabled is required.

* **URL**: `/?key=YOUR_GOOGLE_MAPS_API_KEY`
* **Note**: Without an API key, the 3D city landscape will not be rendered, but the basic application loop remains functional.

```
http://localhost:8080/?key=YOUR_API_KEY

```

### 2. WebRTC Sync Debugging

* **Debug**: Add `&debug=true` to enable texture previews.

```
http://localhost:8080/?debug=true

```

### 3. Network Infrastructure (for Pigeon Room Sync)

For advanced synchronization features tailored to the "Pigeon Room" environment:

* A **Pigeon Room** configuration on the local network is required for full functionality.
* Devices must be connected to the **Circuit Lab.** GER network.

## Technologies Used

* **Three.js**: Core 3D rendering and GPU computation.
* **A-Frame**: Framework for VR/AR web experiences.
* **PeerJS**: WebRTC library for peer-to-peer connections.
* **AR.js**: Augmented reality framework.
* **three-loader-3dtiles**: Loading 3D Tiles.
* **GPUComputationRenderer**: For high-performance flocking simulation.

## Getting Started

### 1. Installation

Install the project dependencies:

```bash
npm install

```

### 2. Running the Project

Start the local development server (with watch mode).

```bash
npm run dev

```

Serve the `public` directory to launch the application.

```bash
http-server public

```

### 3. Production Build

To bundle the project for production deployment:

```bash
npm run build

```

## File Structure

* `public/`: Static assets and HTML entry points for each view.
* `src/`: JavaScript source files implementing core functionality.
* `assets/`: Images, videos, GLTF models, and CSS styles.
* `rollup.config.mjs`: Build configuration.