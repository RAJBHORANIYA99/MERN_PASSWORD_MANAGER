# 🛡️ PassX - Enterprise-Grade MERN Password Manager

PassX is a responsive, production-ready, zero-knowledge credential manager. It allows users to securely store logins, payment cards, and private notes, reinforced by Google OAuth Identity Services, Two-Factor Authentication (TOTP), Active Sessions Management, and Have I Been Pwned breach detection.

---

## 🚀 Key Features

*   **🔑 Multi-Type Credentials**: Dynamic layouts and custom forms for Website Logins, Credit/Debit Cards, and Secure Notes.
*   **🔒 AES-256-GCM Server-Side Encryption**: Credentials are GCM-encrypted in MongoDB using a server secret and transparently decrypted on query. Plaintext passwords never rest in the database.
*   **👥 Google Identity Services OAuth**: Passwordless OAuth registration and login via the official Google GSI Identity client script.
*   **📱 Two-Factor Authentication (TOTP)**: Secure your vault using authenticator apps (Google Authenticator, Authy) with QR code setup.
*   **💻 Active Sessions Manager**: View active device names, client IP logs, and last active timestamps. Features remote single-click revocation.
*   **🗄️ Fully Encrypted Vault Backups**: Zero-knowledge E2EE backup. Uses PBKDF2 to derive an AES-GCM-256 key from a backup password, encrypting and downloading the vault purely client-side.
*   **🕵️ Have I Been Pwned Integration**: Privacy-first breach checker using **k-Anonymity**. Only the first 5 characters of a SHA-1 hash leave the device. Features real-time checking during creation and full-vault scanning in the Audit tab.
*   **⏳ Password Version History**: Keeps a rolling window of the last 5 legacy passwords and modification timestamps for every login credential.
*   **📊 Personal Security Score Card**: Interactive summary rating your vault health (0% to 100%) and offering actionable threat remedies.

---

## 🛠️ Tech Stack & Architecture

### Tech Stack
*   **Frontend**: React, Vite, Tailwind CSS v4, Lucide Icons, Axios.
*   **Backend**: Node.js, Express, JWT, Cookie-Parser, Helmet, Express-Rate-Limit.
*   **Database**: MongoDB, Mongoose.
*   **Security & Encryption**: Speakeasy (TOTP), Web Crypto API (E2EE), AES-256-GCM.

### Directory Structure
```
MERN_PASSWORD_MANAGER/
├── Backend/
│   ├── config/            # Cryptographic and database configuration scripts
│   ├── controllers/       # Controller handlers (passController, userController)
│   ├── middlewares/       # Auth validation, rate limiters, error catchers
│   ├── models/            # MongoDB Mongoose models (User, Pass)
│   ├── routers/           # Express router files (authRouter, passRouter)
│   ├── server.js          # Express backend bootstrap script
│   └── package.json
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable widgets (Manager, TwoFactorSettings, ActiveSessions, etc.)
│   │   ├── utils/         # Client-side cryptographic helper libraries
│   │   ├── App.jsx        # Main application state and router mapping
│   │   ├── index.css      # Core styles & Tailwind v4 registrations
│   │   └── main.jsx
│   ├── index.html         # Google GSI platform script loader
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚙️ Environment Configuration

### Backend Configuration
Create a `.env` file inside the `Backend/` directory:

```env
# Server Config
PORT=5000
NODE_ENV=development

# Database Config
DB_URL=your_mongodb_connection_string

# Authentication Config
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=1d

# Google OAuth Config
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

### Frontend Configuration
Create a `.env` file inside the `Frontend/` directory:

```env
# Google OAuth Client ID (must match backend ID)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 💻 Installation & Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **MongoDB** installed and running on your system.

### 2. Configure Backend
```bash
cd Backend
npm install
npm start
```
The backend server starts on `http://localhost:5000`.

### 3. Configure Frontend
```bash
cd ../Frontend
npm install
npm run dev
```
The frontend dev server starts on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔒 Security & Cryptography Workflows

### 1. Transparent Database Encryption
*   **AES-256-GCM** encryption is handled inside `Backend/config/cryptoUtils.js` using Node's native `crypto` library.
*   Sensitive inputs are encrypted with a derived key from `JWT_SECRET` and saved to MongoDB as `iv:authTag:ciphertext`.
*   Decryption happens transparently on-query, keeping passwords, card values, and secure notes safe.

### 2. Client-Side Zero-Knowledge Backups (E2EE)
*   **Export**: The user enters a backup password. The browser uses **PBKDF2** (100,000 iterations, SHA-256, random 16-byte salt) to derive a key, encrypts the vault client-side with **AES-GCM-256**, and downloads a secure JSON backup.
*   **Restore**: The user uploads their `.enc.json` file, inputs their password, and the browser decrypts the data client-side. The items are then sequentially restored to the database.
*   The backup password is never sent to the server.

### 3. k-Anonymity Leak Verification
*   When checking passwords against public data breaches, the browser computes the password's **SHA-1** hash.
*   Only the **first 5 characters** of the hash are sent to the HIBP API.
*   The API returns matching hash suffixes and leak counts. Suffix matching is performed locally.
*   Your password or full hash never leaves the browser.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
