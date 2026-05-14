#  QuickBite AI: Intelligent Customer Support Agent

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-3.1%20Flash--Lite-orange.svg)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Developed by Sahil Singh & Umesh Menariya | MCA Candidate @ K.J. Somaiya Institute of Management**
>
> 🚀Built as a showcase of modern full-stack development and asynchronous API architecture.

##  Project Overview
QuickBite AI is a full-stack, AI-powered customer support application designed for the food delivery industry. It simulates a highly empathetic, context-aware support agent capable of handling customer grievances, processing hypothetical refunds, and intelligently escalating complex issues. 

This project demonstrates my ability to integrate **Large Language Models (LLMs)** like the latest **Gemini 3.1 Flash-Lite** into modern web applications while ensuring high availability through intelligent backend design.

## ✨ Key Features & Technical Highlights

- ** Infrastructure as Code (IaC):** Contains a declarative `render.yaml` for automated, one-click CI/CD deployments using enterprise-grade **Gunicorn** WSGI process managers instead of basic dev servers.
- ** Context-Aware AI Agent:** Engineered robust system prompts for Google's Gemini 3.1 model to enforce strict behavioral guardrails, ensuring the AI remains empathetic, professional, and compliant with business rules.
- ** Asynchronous Python Backend (FastAPI):** Designed a non-blocking, high-performance REST API to handle concurrent chat requests efficiently.
- **Intelligent Failover Mechanism:** Implemented a robust model-cascade system. If the primary Gemini model hits rate limits (HTTP 429) or goes down (HTTP 503), the backend automatically and recursively fails over to alternative models (e.g., `gemini-2.5-flash` -> `gemini-2.0-flash` -> `gemini-flash-latest`) guaranteeing 99.9% uptime.
- **Modern React Frontend:** Built with React & Vite. Features a responsive, glassmorphic UI, real-time typing indicators, and smooth micro-animations for a premium user experience.

## Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Vanilla CSS (Custom Design System) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, HTTPX (Async HTTP) |
| **AI / Cloud** | Google Gemini API (Generative AI) |
