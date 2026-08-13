# Afaai Guide Frontend

Frontend application for **Afaai Guide | دليل الأفاعي**.

Afaai Guide provides an Arabic-first interface for snake awareness, species information, AI-assisted identification, expert submissions, and content management.

**Live Platform:** [Afaai Guide](https://afaai-guide-frontend.onrender.com/)

[← Back to Main README](../README.md)

---

## Technology Stack

* React 19
* Vite 8
* JavaScript
* React Router DOM
* Axios
* Lucide React
* HTML5
* CSS3
* Responsive Design
* RTL Arabic Interface

---

## Main Application Areas

The frontend includes interfaces for:

### Public Users

* Home page
* Snake species directory
* Species details
* AI-assisted snake identification
* AI safety chatbot
* Registration
* Login
* Privacy information
* Safety disclaimer

### Experts

* New species submission
* Submission history
* Submission status
* Submission details

### Content Management

* Expert-submission review
* Submission management
* Species management
* Species editing

---

## Pages

The current application includes:

```text
HomePage
SpeciesPage
SpeciesDetailsPage
IdentifyPage
ChatPage
LoginPage
RegisterPage

ExpertSubmissionPage
ExpertSubmissionsPage
ExpertSubmissionDetailsPage

ContentSubmissionsPage
ContentSubmissionReviewPage
ContentSpeciesPage
ContentSpeciesEditPage

PrivacyPage
DisclaimerPage
NotFoundPage
```

---

## Project Structure

```text
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   │   └── api.js
│   ├── pages/
│   │
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── .oxlintrc.json
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## API Configuration

The frontend communicates with the Afaai Guide backend through a configurable base URL.

The API configuration is located in:

```text
src/config/api.js
```

The backend URL is read from:

```env
VITE_API_URL
```

If `VITE_API_URL` is not provided, the frontend falls back to:

```text
http://localhost:3000
```

API requests are then made through:

```text
{BACKEND_URL}/api
```

---

## Local Development

### Requirements

* Node.js
* npm
* Running Afaai Guide backend

Install dependencies:

```bash
npm install
```

Create a frontend environment file when necessary:

```text
.env
```

Example:

```env
VITE_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

---

## Available Scripts

### Development

```bash
npm run dev
```

Starts the Vite development server.

### Production Build

```bash
npm run build
```

Generates the production build.

### Preview Production Build

```bash
npm run preview
```

Runs a local preview of the production build.

### Lint

```bash
npm run lint
```

Runs Oxlint against the frontend codebase.

---

## Routing

The application uses `react-router-dom` for client-side navigation.

Major routes include:

```text
/
/species
/species/:id
/identify
/chat
/login
/register
```

Additional protected routes provide Expert and Content Management functionality.

---

## Design

The frontend was designed as an Arabic-first experience.

Core interface characteristics include:

* RTL layout
* Responsive desktop and mobile design
* Dark green, beige, and white visual identity
* Snake-focused information cards
* Interactive navigation
* Smooth interface transitions
* Separate user, expert, and management experiences

---

## Communication Layer

Axios is used to communicate with the backend REST API.

The frontend handles interactions with services including:

* Authentication
* Species data
* AI chat
* Image identification
* Expert submissions
* Content review and management

---

## Production

The frontend is deployed on Render.

Production application:

[Afaai Guide Live Platform](https://afaai-guide-frontend.onrender.com/)

---

## Related Documentation

For full project documentation:

[Main Afaai Guide README](../README.md)

For backend documentation:

[Backend README](../backend/README.md)
