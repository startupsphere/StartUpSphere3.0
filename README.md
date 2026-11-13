# StartUpSphere 3.0 🌐🚀

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%20LTS-orange?logo=openjdk)](https://openjdk.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple?logo=vite)](https://vitejs.dev/)
[![Mapbox](https://img.shields.io/badge/Mapbox%20GL%20JS-3D%20Engine-black?logo=mapbox)](https://www.mapbox.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![AI Powered](https://img.shields.io/badge/AI-Groq%20%26%20Gemini-red?logo=openai)](https://groq.com/)

> **An Interactive 3D Geospatial Ecosystem Mapping, Analytical Heatmap, and Decision Support Platform for Regional Startups and Innovation Enablers.**

---

## 📌 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [Environment Variables](#-environment-variables)
- [Core API Endpoints](#-core-api-endpoints)
- [Dual-Mode Heatmap Engine](#-dual-mode-heatmap-engine)
- [Authors & Acknowledgments](#-authors--acknowledgments)

---

## 📖 Overview

Regional startup ecosystems (such as in Cebu and the wider Philippine innovation corridor) often struggle with **fragmented databases**, **low visibility for early-stage ventures**, and **ambiguous metrics** that confuse social popularity with technological readiness.

**StartUpSphere 3.0** centralizes and visualizes the ecosystem through a rich 3D digital twin. By pairing real-time database intelligence with Mapbox GL JS 3D terrain and extruded architecture, StartUpSphere enables founders, angel investors, venture capitalists, university Technology Business Incubators (TBIs), and government agencies (DTI, DICT, DOST) to discover, evaluate, and collaborate with verified regional businesses.

---

## ✨ Key Features

### 🗺️ 1. Interactive 3D Geospatial Engine
- **3D Building Extrusion**: Realistic polygon heights, terrain shadows, and smooth pitch/bearing camera controls.
- **Street View vs. Satellite**: One-click switching between vector cartography and high-resolution aerial imagery.
- **Dynamic Startup Popups**: Instant business intelligence card with live metrics, TRL stage indicator, AI summary, and verified links.
- **Incubator Connection Arcs**: Visualizes relationships connecting startups to their supporting incubation hubs and mentors.

### 🔥 2. Dual-Mode Analytical Heatmap Engine
*Complete decoupling of technological maturity and community engagement:*
- **Technology Readiness Level (TRL 1–9) Heatmap**:
  - 🟢 **Green (TRL 1–3)**: Research & Concept Feasibility
  - 🟡 **Yellow (TRL 4–6)**: Prototype & Relevant Environment Validation
  - 🔴 **Red (TRL 7–9)**: Market-Ready & Commercially Deployed Systems
- **Business Engagement Heatmap**:
  - Independent individual markers (`cluster: false`) pinned directly to registered coordinates.
  - **Constant Screen-Space Pixel Size**: Markers maintain an exact `18px` circle radius across all zoom levels without ballooning into blobs or disappearing.
  - **Exact 60% Opacity (`0.60`)**: Keeps underlying roads, buildings, and street labels legible.
  - **5-Tier Solid Color Classification**:
    - **0**: Blue (`#2563eb`) — Base / Newly Registered Business
    - **1–10**: Cyan (`#06b6d4`) — Developing Engagement
    - **11–20**: Yellow (`#eab308`) — Moderate Engagement
    - **21–30**: Orange (`#f97316`) — High Engagement
    - **31+**: Red (`#ef4444`) — Very High / Viral Engagement

### 📊 3. Multi-Source Verified Engagement Scoring
$$\text{Engagement Summary Score} = \text{Total Likes} + \text{Total Views} + \text{Total Bookmarks}$$
$$\text{Total Likes} = \text{Facebook Likes} + \text{StartUpSphere Platform Likes}$$
- **Conditional Social Metrics**: If a business registers a verified Facebook link, verified Facebook likes are displayed alongside a direct link to the page; businesses without a Facebook link hide the card cleanly to prevent misleading zeroes.

### 🤖 4. AI Ecosystem Intelligence (Groq & Gemini)
- **Real-Time Executive Summarizer**: Powered by Groq AI (Llama 3) to summarize extensive startup business models into concise, investor-ready executive briefs inside map cards.
- **Conversational Ecosystem Advisor**: Embedded floating chat assistant answering questions about startups, industries, and regional capabilities.

### 🏢 5. Complete Startup & Enabler Lifecycle
- **Multi-Step Onboarding Wizard**: Guided registration for profiles, geocoding coordinates, TRL levels, financials, compliance (SEC, DTI, BIR, TIN), and enabler affiliations.
- **Draft Autosaving**: Save and resume draft submissions at any time before final review.
- **Bulk CSV Ingestion**: Fast bulk-onboarding tool for government enablers and event organizers.
- **Automated 6-Month Reminder Scheduler**: Background cron job dispatching update reminders to keep ecosystem data current.

### 🔐 6. Security & 3-Step Password Recovery
- Stateless JWT authentication with Role-Based Access Control (`ROLE_USER`, `ROLE_ADMIN`).
- Resilient Brevo (Sendinblue) 6-digit OTP verification email pipeline for account confirmation and forgot password flows.

---

## 🏗️ Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 18 + Vite | Tailwind CSS + DaisyUI | Mapbox GL JS 3D | Lucide & React Icons|
+-----------------------------------------+-----------------------------------------+
                                          | REST API (JSON / Multipart / JWT)
                                          v
+-----------------------------------------------------------------------------------+
|                               APPLICATION BACKEND                                 |
|                     Spring Boot 3.x (Java 17) on Port 8080                        |
|                                                                                   |
|  [Security & Auth Filter]  ---> [JWT Stateless Authentication & Spring Security]  |
|  [Controllers]             ---> User, Startup, Stakeholder, Metrics, Search       |
|  [Business Services]       ---> StartupService, EngagementDTO, RankingService     |
|  [Scheduled Tasks]         ---> UpdateReminderScheduler (Automated 6-month check) |
+---------------------+-------------------+-------------------+---------------------+
                      |                   |                   |
                      v                   v                   v
+-----------------------------+ +-------------------+ +-----------------------------+
|      DATABASE LAYER         | |  COMMUNICATIONS   | |         AI SERVICES         |
| PostgreSQL Database         | | Brevo (Sendinblue)| | Groq AI (Llama 3 models)    |
| Hibernate / Spring Data JPA | | Gmail SMTP Relay  | | Gemini AI Engine            |
+-----------------------------+ +-------------------+ +-----------------------------+
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, DaisyUI, Mapbox GL JS, Framer Motion |
| **Backend** | Java 17, Spring Boot 3.x, Spring Security 6, Spring Data JPA, Hibernate |
| **Database** | PostgreSQL (Relational schema with connection pooling) |
| **Email Services** | Brevo (Sendinblue API v3), Gmail SMTP Relay |
| **AI Synthesis** | Groq Cloud (Llama 3 70B/8B), Google Gemini API |

---

## 📁 Repository Structure

```text
StartUpSphere3.0/
├── startupspherev2-backend/           # Spring Boot REST API
│   ├── src/main/java/com/startupsphere/capstone/
│   │   ├── configs/                  # Security, JWT, CORS, Mail configurations
│   │   ├── controller/               # REST Endpoints (Auth, Startup, Stakeholder, etc.)
│   │   ├── dtos/                     # Data Transfer Objects (EngagementDTO, AuthDTOs)
│   │   ├── entity/                   # JPA Entities (User, Startup, Stakeholder, etc.)
│   │   ├── repository/               # Spring Data JPA Repositories
│   │   └── service/                  # Business Logic, EmailService, RankingService
│   ├── src/main/resources/           # application.properties & SQL migrations
│   ├── pom.xml                       # Maven configuration
│   └── mvnw / mvnw.cmd               # Maven wrapper
│
└── startupspherev2-frontend/          # React + Vite Client
    ├── src/
    │   ├── 3dmap/                    # Startupmap.jsx (Mapbox GL JS 3D implementation)
    │   ├── components/               # EngagementChart, TooltipInfo, Cards, Modals
    │   ├── config/                   # API base URL & auth headers
    │   ├── modals/                   # Login, Signup, ForgotPassword, Verification
    │   ├── services/                 # Groq AI & social analytics service calls
    │   ├── sidebar/                  # Navigation drawer, search filter, bookmarks
    │   └── startup/                  # Onboarding wizard, dashboards, CSV upload
    ├── package.json                  # NPM dependencies
    └── vite.config.js                # Vite build configuration
```

---

## ⚙️ Prerequisites

Ensure you have the following installed locally:
- **Java Development Kit (JDK)**: Version 17 or higher
- **Node.js**: Version 18.x or 20.x
- **npm** or **pnpm**
- **Git**
- **PostgreSQL Database** (local instance or cloud service like Railway / Supabase)

---

## 🚀 Getting Started

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd StartUpSphere3.0/startupspherev2-backend
   ```

2. Create a `.env` file in `startupspherev2-backend/`:
   ```properties
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/startupsphere
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=your_password
   SECURITY_JWT_SECRET_KEY=your_base64_encoded_jwt_secret_key_minimum_256_bits
   BREVO_API_KEY=your_brevo_api_key_here
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_gmail_app_password
   ```

3. Build and compile the backend:
   ```bash
   ./mvnw clean compile
   ```

4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend will boot up on `http://localhost:8080`.*

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd StartUpSphere3.0/startupspherev2-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `startupspherev2-frontend/`:
   ```properties
   VITE_BACKEND_URL=http://localhost:8080
   VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173`.*

---

## 🔑 Environment Variables

### Backend (`startupspherev2-backend/.env`)
| Variable | Description |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | Database password |
| `SECURITY_JWT_SECRET_KEY` | Base64-encoded secret key for signing JWT tokens |
| `BREVO_API_KEY` | Sendinblue / Brevo API key for transactional emails |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Gmail SMTP credentials for email delivery |

### Frontend (`startupspherev2-frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_BACKEND_URL` | Base URL of the running Spring Boot backend |
| `VITE_MAPBOX_TOKEN` | Public Mapbox GL access token for 3D map tiles |
| `VITE_GROQ_API_KEY` | Groq Cloud API key for Llama 3 summarization |

---

## 📡 Core API Endpoints

### 🔐 Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/signup` — Register a new account
- `POST /api/v1/auth/login` — Sign in and obtain JWT token
- `POST /api/v1/auth/forgot-password` — Request a 6-digit Brevo OTP verification code
- `POST /api/v1/auth/verify-reset-code` — Verify submitted 6-digit reset code
- `POST /api/v1/auth/reset-password` — Set a new password upon code confirmation

### 🚀 Startups & Geospatial Analytics (`/startups`)
- `GET /startups/approved` — Paginated list of approved startups
- `GET /startups/engagement-heatmap` — Coordinates, scores, and solid colors for all approved businesses
- `GET /startups/{id}/engagement` — Complete engagement breakdown for a specific startup
- `GET /startups/{id}` — Full startup profile details
- `POST /startups` — Submit a new startup profile for review
- `PUT /startups/{id}/increment-views` — Increment verified profile impressions
- `GET /startups/{id}/photo` — Stream startup logo / profile image

### 💬 Social Interactions & Bookmarks
- `POST /api/likes/toggle` — Like or unlike a startup
- `GET /api/likes/count/startup/{id}` — Total platform likes count
- `POST /api/bookmarks` — Add startup to user bookmarks
- `GET /api/bookmarks` — Retrieve user bookmarks list
- `GET /api/recents` — Retrieve user recent browsing trajectory

---

## 🎯 Dual-Mode Heatmap Engine

```text
                  +-----------------------------------+
                  |      StartUpSphere 3D Map         |
                  +-----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          ▼                                                   ▼
[ Mode A: TRL Heatmap ]                             [ Mode B: Engagement Heatmap ]
• Focus: Technology Maturity                        • Focus: Attention & Interactions
• Metric: TRL Stages 1 to 9                         • Metric: Score (Likes + Views + Bookmarks)
• Rendering: Clustered Density Kernels              • Rendering: Unclustered Fixed Circles (18px)
• Colors: Green (1-3), Yellow (4-6), Red (7-9)      • Colors: Blue (0), Cyan (1-10), Yellow (11-20),
• Aggregation: Nearby clusters merge                  Orange (21-30), Red (31+)
                                                    • Opacity: Strictly 60% (Underlying map visible)
                                                    • Zoom: Constant screen-space size across all zooms
```

---

## 👥 Authors & Acknowledgments

- **Development Team**: StartUpSphere Capstone Development Team
- **Academic Program**: Bachelor of Science in Information Technology / Computer Science
- **Special Thanks**: Regional Innovation Enablers, TBIs, and Startups across Cebu and Central Visayas.

---

<p align="center">
  <b>StartUpSphere 3.0 — Empowering Regional Innovation Through Geospatial Intelligence</b>
</p>
