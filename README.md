# Afaai Guide | دليل الأفاعي

**An AI-assisted snake awareness, identification, and safety platform focused on snakes found in Palestine.**

Afaai Guide is an Arabic-first full-stack web platform designed to make snake information more accessible to the Palestinian public.

The platform combines a structured snake species guide, AI-assisted image identification, an intelligent safety chatbot, user accounts, expert contributions, and content-management workflows in one application.

> **Version 1.0** — This is the first public version of Afaai Guide and serves as the foundation for continued development.

---

## Live Platform

**[Open Afaai Guide](https://afaai-guide-frontend.onrender.com/)**

---

## About the Project

Afaai Guide was independently planned, designed, developed, integrated, tested, and deployed over more than three months.

The project was built to address a practical problem: people who encounter a snake often need clear and accessible information about the species, its potential danger, and the safest way to respond.

Afaai Guide provides that information through an Arabic-first interface while combining traditional species information with AI-assisted tools.

---

## Key Features

### Snake Species Guide

Browse documented snake species and access information including:

* Arabic name
* English name
* Scientific name
* Description
* Venom status
* Danger level
* Minimum and maximum size
* Behavior
* Recommended actions when encountering the snake
* Actions to avoid
* Species images

### AI-Assisted Snake Identification

Users can upload a snake image and receive an AI-assisted identification result.

The system processes uploaded images before sending them through the identification workflow.

### AI Safety Assistant

A conversational assistant provides snake-related information and practical safety guidance.

The assistant is designed to:

* Respond in the user's language
* Communicate uncertainty
* Prioritize safety
* Avoid encouraging users to touch, capture, chase, or kill snakes
* Direct bite-related situations toward urgent medical assistance

### Authentication

The platform includes:

* User registration
* User login
* JWT-based authentication
* Password hashing
* Role-based access

### Role-Based Platform

Afaai Guide supports multiple levels of access.

#### User

Regular users can:

* Browse snake species
* View species details
* Use AI identification
* Interact with the chatbot
* Create an account and sign in

#### Expert

Approved experts can:

* Submit new snake suggestions
* Upload snake images
* Add field observations and notes
* Track their submissions
* View submission status and details

#### Content Management / Admin

Authorized content managers can:

* Review expert submissions
* Accept or reject submitted content
* Manage snake species
* Edit published species information
* Manage content before publication

---

## Technology Stack

### Frontend

* React 19
* Vite 8
* JavaScript
* React Router
* Axios
* Lucide React
* HTML5
* CSS3
* Responsive RTL interface

### Backend

* Node.js
* Express 5
* REST API architecture
* JavaScript / CommonJS

### Database

* PostgreSQL
* `pg`

### Authentication & Security

* JSON Web Tokens (JWT)
* bcrypt
* CORS
* Express Rate Limit
* Environment-based configuration

### Artificial Intelligence

* Google Gemini
* `@google/genai`
* Text-based safety assistant
* Image-based snake identification

### Image Processing & Storage

* Multer
* Sharp
* WebP image optimization
* Cloudflare R2
* AWS S3 SDK

### Deployment & Development

* Render
* Git
* GitHub
* npm
* Postman

---

## Architecture

```text
┌───────────────────────────────┐
│          React Client         │
│       Vite + React Router     │
└───────────────┬───────────────┘
                │
                │ HTTP / REST
                ▼
┌───────────────────────────────┐
│       Node.js / Express       │
│            REST API           │
├───────────────────────────────┤
│ Authentication / Roles        │
│ Species Management            │
│ Expert Submissions            │
│ Content Review                │
│ Chat & Identification         │
└──────┬────────────┬───────────┘
       │            │
       ▼            ▼
┌────────────┐  ┌───────────────┐
│ PostgreSQL │  │ Google Gemini │
└────────────┘  └───────────────┘
       │
       │ Images
       ▼
┌───────────────────────────────┐
│        Cloudflare R2          │
└───────────────────────────────┘
```

---

## Project Structure

```text
AfaaIGuide/
│
├── backend/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── config/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## Main API Areas

The backend is organized around the following API areas:

```text
/api/health
/api/species
/api/auth
/api/chat
/api/expert
/api/content
```

These APIs support public species information, authentication, AI-powered interactions, expert submissions, and content-management workflows.

---

## Running the Project Locally

### Prerequisites

Make sure you have:

* Node.js
* npm
* PostgreSQL
* Google Gemini API credentials
* Cloudflare R2 credentials if image uploading is required

Clone the repository:

```bash
git clone https://github.com/Ma7moud-A/AfaaIGuide.git
cd AfaaIGuide
```

### Backend

```bash
cd backend
npm install
```

Create a `.env` file based on:

```text
backend/.env.example
```

Then run:

```bash
npm run dev
```

By default, the backend runs on:

```text
http://localhost:3000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend API URL can be configured using:

```env
VITE_API_URL=http://localhost:3000
```

---

## Environment Variables

Never commit real credentials or secrets.

The backend requires configuration for:

```env
PORT=

DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=

JWT_SECRET=
JWT_EXPIRES_IN=

GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_CHAT_MODEL=
GEMINI_VISION_MODEL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

The frontend can use:

```env
VITE_API_URL=
```

---

## Image Pipeline

Uploaded images are processed before storage.

The current pipeline includes:

1. Receiving the image through Multer
2. Automatic image orientation
3. Resizing images to a maximum of 1280 × 1280
4. Conversion to WebP
5. Image compression
6. Uploading processed images to Cloudflare R2

This reduces storage and bandwidth requirements while keeping images suitable for the platform and AI analysis.

---

## Current Status

Afaai Guide is currently in its **first public version**.

The current release establishes the platform's main architecture and workflows, but it is not intended to represent the final scope of the project.

Future versions can continue improving:

* Identification reliability
* Verified snake data
* Expert collaboration
* Content-management workflows
* User experience
* Performance
* Accessibility
* Safety resources
* Platform scalability

---

## Safety Disclaimer

Afaai Guide is an educational and awareness platform.

AI-generated snake identification can be incorrect and should **not** be treated as a guaranteed identification.

Do not approach, touch, capture, chase, or kill a snake based on information provided by the platform.

In the event of a snake bite or another medical emergency, seek professional medical assistance immediately.

The platform is not a replacement for emergency services, medical professionals, or qualified wildlife experts.

---

## Development

Afaai Guide was independently developed from initial planning and analysis through implementation, integration, testing, and deployment.

**Developer:** Mahmoud Abu Amria

GitHub: [Ma7moud-A](https://github.com/Ma7moud-A)

---

## Repository

This repository contains both the frontend and backend of Afaai Guide.

For implementation-specific documentation:

* [Frontend Documentation](./frontend/README.md)
* [Backend Documentation](./backend/README.md)

---

## Version

**Afaai Guide — Version 1.0**

First public release.

---

© 2026 Mahmoud Abu Amria — Afaai Guide
