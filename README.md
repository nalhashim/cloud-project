# Cloud Project Backend

This repository contains the backend code for the Cloud Project, focusing on a Node.js Express server with AWS SDK integration and file processing utilities.

---

## Project Structure

- `server.js` — Main Express server entry point  
- `check-connection.js` — Utility script to check service connectivity  
- `.env` and `cloud.env` — Environment variables files (excluded from version control)  
- `package.json` — Project metadata and dependencies  
- `package-lock.json` — Exact versions of installed npm packages  
- `classifier.json` — Possibly a JSON model or configuration used by the server

---

## Features

- REST API server built with Express.js  
- AWS SDK integration for cloud interactions  
- File upload and processing support (e.g., DOCX to HTML via Mammoth)  
- CORS enabled for cross-origin requests  
- Environment variable configuration using dotenv  
- Basic structure for adding custom endpoints and middleware

---

## Prerequisites

- Node.js (v14 or higher recommended)  
- npm (Node package manager)  

---

## Installation

1. Clone the repository:  
   ```bash
   git clone https://github.com/nalhashim/cloud-project.git
   cd cloud-project

2. Install dependencies:
npm install

3. Create an .env file with necessary environment variables (based on .env.example if available).

--

Usage
Start the server:
npm start
The server will run on the port defined in your .env file or default to 3000.

--

Dependencies
Express — Fast, minimalist web framework for Node.js

AWS SDK — AWS cloud service interactions

Mammoth — DOCX to HTML converter

multer — Middleware for handling multipart/form-data for file uploads

cors — Enable Cross-Origin Resource Sharing

dotenv — Load environment variables

--

Contributing
Feel free to fork, create branches, and submit pull requests for improvements or bug fixes.

--

License
This project is licensed under the ISC License.

--

Contact
For questions or support, contact Nour Al‑Hashim at alhashimnourr@gmail.com.
