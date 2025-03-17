# DistribuTech Frontend

<img src="https://via.placeholder.com/300x100.png?text=DistribuTech+Logo" alt="DistribuTech Logo" style="display: block; margin: 0 auto;">

## Overview

The DistribuTech frontend is built with React, Vite, Tailwind CSS, and Framer Motion to provide a modern, responsive, and animated user interface for the DistribuTech inventory management system.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Framer Motion
- Inter font

## Features

- Responsive design that works on mobile, tablet, and desktop
- Smooth animations and transitions with Framer Motion
- Gradient text and backgrounds
- Modern UI with a clean, professional look
- Mobile-friendly navigation with hamburger menu

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Project Structure

```
distributech_frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Navbar.jsx        # Navigation bar component
│   │   ├── HeroSection.jsx   # Hero section with call-to-action
│   │   └── FeatureSection.jsx # Features showcase
│   ├── App.jsx               # Main App component
│   ├── App.css               # App-specific styles
│   ├── index.css             # Global styles with Tailwind imports
│   └── main.jsx              # Entry point
├── public/                   # Static assets
├── index.html                # HTML template
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
└── package.json              # Project dependencies and scripts
```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
