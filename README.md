# Antigravity Planner

Antigravity Planner is a modern, interactive resource capacity planning and Gantt chart application built with Vue 3, TypeScript, and Vite. It helps teams visualize workload distribution, manage project timelines (Epics & Tasks), and ensure optimal resource allocation.

## Application Views

### Resource Heatmap

Visualize team capacity and workload intensity at a glance.
![Resource Heatmap](/Users/filip/.gemini/antigravity/brain/ff55bd78-0135-4070-b6b1-b41a07ee34f1/readme_resource_heatmap_1767727485057.png)

### Gantt Chart

Manage Epics and Tasks on a timeline, with drag-and-drop planning capabilities.
![Gantt Chart](/Users/filip/.gemini/antigravity/brain/ff55bd78-0135-4070-b6b1-b41a07ee34f1/readme_gantt_chart_1767727494281.png)

## Features

- **Resource Management**: Add, edit, and remove resources. Assign colors to roles for easy identification.
- **Capacity Planning**: Heatmap visualization of resource load (Green/Yellow/Red indicators).
- **Project Planning**: Create Epics and Tasks. Edit Epic titles and colors.
- **Data Persistence**: Automatic local storage saving. Import/Export data as JSON.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

```bash
npm install
```

### Running the Application (Development)

Start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for deployment:

```bash
npm run build
```

The output will be in the `dist` directory.
