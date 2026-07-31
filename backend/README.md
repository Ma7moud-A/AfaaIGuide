# Afaai Guide Backend

Backend API for the Afaai Guide web application.

## Technologies

- Node.js
- Express.js
- PostgreSQL
- pg
- dotenv
- cors

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── speciesController.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── validateId.js
│   │   └── validateSpecies.js
│   ├── routes/
│   │   └── speciesRoutes.js
│   ├── app.js
│   └── server.js
├── .env.example
├── package.json
└── README.md