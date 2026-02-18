# 🎓 Ionic Scholar
[![Deploy](https://github.com/woodRock/ionic-scholar/actions/workflows/deploy.yml/badge.svg)](https://github.com/woodRock/ionic-scholar/actions/workflows/deploy.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/6a024dc9-e34e-48c9-9866-ab33e0d6f8f2/deploy-status)](https://app.netlify.com/sites/ionic-scholar/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Ionic Scholar** is a modern, cross-platform academic research companion designed to streamline the way you manage, read, and organize scholarly articles. Built with React and Ionic, it provides a seamless experience for tracking your academic progress.

---

## 🚀 Key Features

- **🔍 Smart Search** – Integrated search engine querying Google Scholar for the latest academic papers.
- **📚 Library Management** – Keep all your references in one place with offline-first capabilities.
- **🏷️ Tagging Wizard** – Rapidly categorize your library with an AI-assisted tagging workflow.
- **📝 Research Notes** – Write and store Markdown-based notes directly on each paper.
- **🌐 Network Map** – Visualize the relationships between your papers using an interactive D3-powered force graph.
- **📄 PDF Reader** – Integrated PDF viewer with progress tracking.
- **💬 Research Chat** – Interact with your papers using integrated generative AI models.
- **📑 Citation Generator** – Instantly generate BibTeX and other citation formats.
- **🔐 Secure Sync** – Real-time synchronization across devices using Firebase Authentication and Firestore.

## 🛠 Tech Stack

- **Frontend:** [React](https://reactjs.org/), [Ionic Framework](https://ionicframework.com/), [Vite](https://vitejs.dev/)
- **Styling:** [Ionic UI Components](https://ionicframework.com/docs/components), [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database:** [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **Visualization:** [D3.js](https://d3js.org/), [React Force Graph](https://github.com/vasturiano/react-force-graph)
- **AI Integration:** [Google Generative AI](https://ai.google.dev/) (Gemini)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/woodRock/ionic-scholar.git
   cd ionic-scholar
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory and add your Firebase and Gemini API configurations (see `src/api/firebase.tsx` for required keys).

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗺️ Application Map

- **Explore:** Discover new papers via trending topics.
- **Library:** Manage your saved collection.
- **Tagging Wizard:** Quick-fire tagging for untagged papers.
- **Network Map:** Visual graph of your research landscape.
- **Discover:** Search for new papers directly from Google Scholar.

## 🛑 Troubleshooting

### CORS Policy
Calls to Google Scholar scraping APIs may be blocked by browser CORS policies during local development.
- **Recommendation:** Use a browser extension like "CORS Everywhere" (Firefox) or "Allow CORS" (Chrome) during development.

### Rate Limiting (Error 429)
Excessive automated queries may trigger Google's bot detection. 
- **Symptoms:** Search results failing to load or 403/429 errors.
- **Solution:** Wait for the cooldown period (usually 2-3 hours) or use a VPN to rotate your IP.

## 📝 Citation

If you use this project in your research, please cite it:

```bibtex
@online { ionic_scholar,
  author = {Jesse Wood},
  title = {Ionic Scholar},
  journal = {GitHub},
  year = {2020},
  url = {https://github.com/woodRock/ionic-scholar}
}
```

## ⚖️ License

Distributed under the MIT License. See `LICENSE` (if available) for more information.
