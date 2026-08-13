# Afaai Guide Backend

Backend REST API for **Afaai Guide | دليل الأفاعي**.

The backend handles species data, authentication, user roles, AI conversations, image-based snake identification, expert submissions, content-management workflows, image processing, and cloud storage.

[← Back to Main README](../README.md)

---

## Technology Stack

### Runtime & API

* Node.js
* Express 5
* REST APIs
* JavaScript
* CommonJS

### Database

* PostgreSQL
* `pg`

### Authentication & Security

* JSON Web Tokens (`jsonwebtoken`)
* bcrypt
* CORS
* Express Rate Limit
* dotenv

### AI

* Google Gemini
* `@google/genai`

### Images

* Multer
* Sharp
* WebP processing

### Cloud Storage

* Cloudflare R2
* AWS S3-compatible API
* `@aws-sdk/client-s3`

### Development

* Nodemon

---

## Backend Responsibilities

The backend manages:

* Snake species data
* Species images
* Registration and login
* Password hashing
* JWT authentication
* Role-based authorization
* AI chatbot requests
* AI-assisted image identification
* Anonymous and authenticated interactions
* Expert snake submissions
* Content review workflows
* Species content management
* Image processing
* Cloud image storage
* API error handling
* Request validation
* Rate limiting

---

## API Structure

The Express application exposes the following main API groups:

```text
/api/health
/api/species
/api/auth
/api/chat
/api/expert
/api/content
```

### Health

```text
GET /api/health
```

Used to verify that the Afaai Guide API is running.

### Species

```text
/api/species
```

Handles snake species information and related images.

### Authentication

```text
/api/auth
```

Handles account registration, login, authentication, and related user functionality.

### Chat

```text
/api/chat
```

Handles conversations, text messages, image uploads, AI responses, and snake-identification interactions.

### Expert

```text
/api/expert
```

Handles expert submissions and expert-specific workflows.

### Content Management

```text
/api/content
```

Handles review, approval, rejection, publishing, and species content-management functionality.

---

## Project Structure

```text
backend/
│
├── scripts/
│   ├── migrateUploadsToR2.js
│   └── testGemini.js
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── contentSubmissionController.js
│   │   ├── expertSubmissionController.js
│   │   ├── speciesController.js
│   │   └── speciesImageController.js
│   │
│   ├── middleware/
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── contentRoutes.js
│   │   ├── expertRoutes.js
│   │   └── speciesRoutes.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   └── storageService.js
│   │
│   ├── app.js
│   └── server.js
│
├── uploads/
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

---

## Installation

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables before starting the server.

---

## Environment Variables

Example configuration:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=afaai_guide
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_long_random_jwt_secret
JWT_EXPIRES_IN=7d

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_default_gemini_model
GEMINI_CHAT_MODEL=your_chat_model
GEMINI_VISION_MODEL=your_vision_model

R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_URL=your_r2_public_url
```

> Never commit the real `.env` file or expose database, JWT, Gemini, or Cloudflare credentials.

---

## Database

The backend uses PostgreSQL through a `pg` connection pool.

The database connection uses:

```env
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

The server verifies the PostgreSQL connection before accepting requests.

A compatible Afaai Guide database schema is required when running the backend locally.

---

## Running the Backend

### Development

```bash
npm run dev
```

Uses Nodemon to automatically restart the development server when files change.

### Production

```bash
npm start
```

Runs:

```text
node src/server.js
```

Default local URL:

```text
http://localhost:3000
```

API health endpoint:

```text
http://localhost:3000/api/health
```

---

## AI Integration

Afaai Guide integrates Google Gemini using:

```text
@google/genai
```

The AI layer supports two main use cases.

### Safety Chat

The chatbot is instructed to:

* Answer using the user's language
* Provide practical safety guidance
* Communicate uncertainty
* Avoid confirming snake species based only on text
* Avoid encouraging dangerous interaction with snakes
* Prioritize emergency medical assistance for reported snake bites

### Image Identification

Image-based interactions can use a dedicated vision model for AI-assisted snake identification.

Model configuration can be controlled using:

```env
GEMINI_MODEL
GEMINI_CHAT_MODEL
GEMINI_VISION_MODEL
```

---

## Image Processing

Images are processed using Sharp before being stored.

Current processing includes:

```text
Automatic rotation
        ↓
Maximum 1280 × 1280 dimensions
        ↓
WebP conversion
        ↓
Quality optimization
        ↓
Cloudflare R2 upload
```

The processed image is also available to the AI identification workflow when required.

---

## Cloudflare R2 Storage

New uploaded images are stored in Cloudflare R2 through its S3-compatible interface.

The backend uses:

```text
@aws-sdk/client-s3
```

Required configuration:

```env
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
```

Images are organized into categories such as:

```text
chat/
expert-submissions/
species/
```

Stored files are generated using unique names and WebP format.

---

## Authentication

Passwords are hashed using:

```text
bcrypt
```

Authenticated sessions use:

```text
JSON Web Tokens
```

The authentication layer supports protected routes and role-based access for the platform's different workflows.

---

## Roles & Workflows

### Regular User

Accesses standard platform functionality.

### Expert

Can contribute snake information through the expert-submission workflow.

### Content Management / Admin

Can review expert submissions and manage published species information.

This separation allows expert suggestions to pass through review before becoming platform content.

---

## Security Notes

The backend includes mechanisms such as:

* Password hashing
* JWT-based authentication
* Role authorization
* Input validation
* Error-handling middleware
* CORS
* Request rate limiting
* Environment-based secrets

Production credentials should only be stored as deployment environment variables.

---

## Upload Compatibility

The backend supports the current Cloudflare R2 storage system while maintaining compatibility with previously stored local upload paths.

This allows the application to serve existing images while storing new images in cloud storage.

---

## Scripts

The repository currently includes utility scripts for:

```text
scripts/migrateUploadsToR2.js
scripts/testGemini.js
```

These are intended for maintenance/testing tasks and should be used carefully with the appropriate environment configuration.

---

## Safety

AI responses and image-identification results should not be considered guaranteed species identification.

The system is designed as an awareness and educational tool, not a replacement for:

* Emergency medical services
* Professional medical advice
* Qualified wildlife experts

Snake bites should always be treated as medical emergencies.

---

## Related Documentation

Full project documentation:

[Main README](../README.md)

Frontend documentation:

[Frontend README](../frontend/README.md)
