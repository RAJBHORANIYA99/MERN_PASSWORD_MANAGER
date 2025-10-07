# 🔐 Password Manager


A **secure full-stack Password Manager** built with **Node.js, Express, MongoDB**, and **React (Vite)**.  
Users can **sign up, log in, and safely manage website credentials** with encrypted storage and **JWT authentication**.

## 🧭 Overview

This repository houses the complete source code for a web-based Password Manager.
The goal is to provide users with a reliable, accessible, and secure tool for storing and organizing their credentials.
Built using modern frontend and backend web technologies, it delivers an intuitive, privacy-focused, and user-friendly experience to enhance online security.


## 🚀 Tech Stack

### **Backend**
- Node.js & Express  
- MongoDB with Mongoose ORM  
- JWT for authentication  
- bcryptjs for password encryption  
- cookie-parser, CORS, dotenv

### **Frontend**
- React (Vite)  
- React Router DOM  
- Axios  
- React Toastify  
- Tailwind CSS


## 🏗️ Monorepo Structure

```
Password-Manager/
├── Backend/      
└── Frontend/ 
```

## ⚙️ Prerequisites

- Node.js **v18+**
- MongoDB Atlas connection string **or** Local MongoDB instance

## 🔑 Environment Variables

Create a `.env` file inside the `Backend/` folder and add:

```env
PORT=5000
DB_URL=mongodb+srv://<user>:<password>@<cluster-host>/
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=1d
```


## 🧩 Installation

Install dependencies in both subdirectories:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

---

## 🧠 Run the App in Development

Start both backend and frontend servers:

```bash
cd Backend
npm start

cd Frontend
npm run dev
```

### 🌐 Default URLs
- **Backend API:** `http://localhost:5000`
- **Frontend App:** `http://localhost:5173`
