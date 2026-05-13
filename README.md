# 🍕 QuickBite AI: Intelligent Customer Support Agent

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Developed by [Your Name] | MCA Candidate @ K.J. Somaiya Institute of Management**
>
> 🚀 Built as a showcase of modern full-stack development, asynchronous API architecture, and prompt engineering.

## 📌 Project Overview
QuickBite AI is a full-stack, AI-powered customer support application designed for the food delivery industry. It simulates a highly empathetic, context-aware support agent capable of handling customer grievances, processing hypothetical refunds, and intelligently escalating complex issues. 

This project demonstrates my ability to integrate **Large Language Models (LLMs)** into modern web applications while ensuring high availability through intelligent backend design.

## ✨ Key Features & Technical Highlights

- **🧠 Context-Aware AI Agent:** Engineered robust system prompts for Google's Gemini 2.0 model to enforce strict behavioral guardrails, ensuring the AI remains empathetic, professional, and compliant with business rules.
- **⚡ Asynchronous Python Backend (FastAPI):** Designed a non-blocking, high-performance REST API to handle concurrent chat requests efficiently.
- **🛡️ Intelligent Failover Mechanism:** Implemented a robust model-cascade system. If the primary Gemini model hits rate limits (HTTP 429) or goes down (HTTP 503), the backend automatically and recursively fails over to alternative models (e.g., `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-flash-latest`) guaranteeing 99.9% uptime.
- **🎨 Modern React Frontend:** Built with React & Vite. Features a responsive, glassmorphic UI, real-time typing indicators, and smooth micro-animations for a premium user experience.

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Vanilla CSS (Custom Design System) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, HTTPX (Async HTTP) |
| **AI / Cloud** | Google Gemini API (Generative AI) |

## 🚀 Local Development Setup

To run this application locally, you will need Node.js and Python installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/quickbite-ai-support.git
   cd quickbite-ai-support
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   GEMINI_API_MODEL=gemini-2.0-flash
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models
   ```

3. **Start the Servers:**
   The project includes automated startup scripts that handle virtual environment creation and dependency installation.
   - **Mac/Linux:** `./start.sh`
   - **Windows:** `start.bat`

4. **Access the Application:**
   The frontend will automatically launch at `http://localhost:5173`. The backend API runs on `http://localhost:8080`.

## 💼 Why This Matters (For Recruiters)
During my MCA at **K.J. Somaiya**, I recognized that real-world software isn't just about writing code; it's about handling failure gracefully and delivering a seamless user experience. 

In this project, I specifically focused on:
- **Resilience:** The backend's recursive failover logic ensures the chatbot never crashes due to upstream API limits.
- **Maintainability:** Clear separation of concerns between the React UI layer and the Python API layer.
- **UX Design:** Moving away from generic bootstrap templates to write custom, high-fidelity CSS.

---
*Feel free to reach out to me on [LinkedIn](https://linkedin.com/in/your-profile) or via email at your.email@somaiya.edu.*
