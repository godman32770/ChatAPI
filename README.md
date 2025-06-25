
# 🧠 Chat API

A simple REST API for a chat application with OpenAI (via LangChain) integration, user authentication (JWT), rate limiting, and a token-based usage system.

---

## 📚 Table of Contents

* [Features](#features)
* [Setup Instructions](#setup-instructions)
* [Environment Variables](#environment-variables)
* [API Documentation](#api-documentation)
  * [Authentication Endpoints](#1-authentication-endpoints)
  * [Chat Endpoints](#2-chat-endpoints)
* [Testing with cURL](#testing-with-curl)
* [Live Demo Deployment](#-live-demo-deployment)

---

## ✅ Features

* **User Authentication**: Register/login using JWT; passwords are hashed with bcrypt.
* **Chat with AI**: Send messages and get responses from OpenAI.
* **LangChain Integration**:
  * Prompt Templates for structured prompts
  * Memory for retaining conversation context
  * Runnable chains for AI interaction
* **Token Credit System**: Each user starts with 100,000 tokens. Tokens are deducted based on LLM usage.
* **Rate Limiting**: 20 chat requests per hour per user.
* **MongoDB Support**: All users and conversations are persisted.
* **Basic Error Handling**: Server and client errors are handled gracefully.

---

## ⚙️ Setup Instructions

Clone the repository:

```bash
git clone https://github.com/godman32770/ChatAPI.git
cd ChatAPI
```

### 🧰 Prerequisites

* Node.js and npm: [Download](https://nodejs.org)
* MongoDB Server: [Install Guide](https://www.mongodb.com/try/download/community)

Ensure MongoDB is running (`mongod`) before continuing.

### 🔧 Installation Steps

```bash
npm install
```

### 🔐 Create `.env` File
*📝 If you're running this project locally, make sure MongoDB is installed and running on port 27017 (default). You can change `MONGO_URI` in the `.env` file if you're using a remote database or MongoDB Atlas.

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatdb
JWT_SECRET=your_super_secret_jwt_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 🚀 Start Server

```bash
npm run dev       # for development (with nodemon)
npm start         # for production
```

You should see:

* `Server running on port 5000`
* `MongoDB Connected...`

### 🧪 Run Unit Tests

```bash
npm test
```

---

## 📘 API Documentation

All endpoints return JSON.

### 1. Authentication Endpoints

#### 🔐 Register User

* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Body**:

```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

* **Success**:

```json
{
  "token": "<JWT_TOKEN>"
}
```

#### 🔐 Login User

* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Body**:

```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

* **Success**:

```json
{
  "token": "<JWT_TOKEN>"
}
```

---

### 2. Chat Endpoints

> **All endpoints below require Authorization header**

#### 🧠 Send Message

* **Endpoint**: `POST /api/chat`
* **Access**: Private (rate-limited)
* **Body (new conversation)**:

```json
{
  "message": "Tell me about AI"
}
```

* **Body (existing conversation)**:

```json
{
  "conversationId": "<ID>",
  "message": "What are its applications?"
}
```

* **Response**:

```json
{
  "message": "AI is a branch of computer science...",
  "conversationId": "<ID>",
  "tokensUsed": 57,
  "remainingTokens": 99943
}
```

#### 📜 Get Chat History

* **Endpoint**: `GET /api/chat/:conversationId`
* **Response**:

```json
{
  "conversation": {
    "id": "<ID>",
    "messages": [
      { "role": "user", "content": "Tell me about AI" },
      { "role": "assistant", "content": "AI is..." }
    ]
  }
}
```

#### 🗂️ List Conversations

* **Endpoint**: `GET /api/chat`
* **Response**:

```json
{
  "conversations": [
    {
      "id": "<ID>",
      "lastMessage": "Tell me about AI",
      "updatedAt": "2024-01-29T10:30:01Z"
    }
  ]
}
```

---

## 🧪 Testing with cURL

### 1. Register User

```bash
curl -X POST   -H "Content-Type: application/json"   -d '{ "email": "test@example.com", "password": "password123" }'   http://localhost:5000/api/auth/register
```

### 2. Login User

```bash
curl -X POST   -H "Content-Type: application/json"   -d '{ "email": "test@example.com", "password": "password123" }'   http://localhost:5000/api/auth/login
```

### 3. Send Message (New)

```bash
curl -X POST   -H "Content-Type: application/json"   -H "Authorization: Bearer YOUR_JWT_TOKEN"   -d '{ "message": "Tell me about the internet." }'   http://localhost:5000/api/chat
```

### 4. Send Message (Existing)

```bash
curl -X POST   -H "Content-Type: application/json"   -H "Authorization: Bearer YOUR_JWT_TOKEN"   -d '{ "conversationId": "YOUR_CONVERSATION_ID", "message": "Who were the key figures?" }'   http://localhost:5000/api/chat
```

### 5. Get Chat History

```bash
curl -X GET   -H "Authorization: Bearer YOUR_JWT_TOKEN"   http://localhost:5000/api/chat/YOUR_CONVERSATION_ID
```

### 6. List Conversations

```bash
curl -X GET   -H "Authorization: Bearer YOUR_JWT_TOKEN"   http://localhost:5000/api/chat
```

---

## 🚀 Live Demo Deployment

### 1. Deploy with Railway

1. Sign up at [Railway.app](https://railway.app)
2. Create Project → “Deploy from GitHub repo”
3. Connect `https://github.com/godman32770/ChatAPI`
4. Add Environment Variables: `MONGO_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `PORT=5000`
5. Deploy and share the live URL

### 2. Deploy with Heroku

```bash
heroku login
heroku create chatapi-demo
heroku config:set MONGO_URI=... JWT_SECRET=... OPENAI_API_KEY=...
git push heroku main
heroku open
```

### 3. Use ngrok for Local Tunnels

```bash
npm run dev
ngrok http 5000
```

### 4. Deploy with Vercel (optional)

This project is server-based and not optimized for Vercel, but you **can deploy**:

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```
