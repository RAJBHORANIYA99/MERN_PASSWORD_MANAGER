import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRouter from "./routers/authRouter.js";
import passRouter from "./routers/passRouter.js";

dotenv.config();
connectDB();

const app = express();

// Apply security headers
app.use(helmet());

// Configure CORS
app.use(cors({ 
    origin: process.env.FRONTEND_URL 
        ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"] 
        : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit login/signup requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many attempts, please try again after 15 minutes." }
});

app.use(generalLimiter);
app.use("/api/v1/auth", authLimiter);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/pass", passRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

