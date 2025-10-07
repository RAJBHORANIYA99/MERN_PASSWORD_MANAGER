import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import cors from "cors";
import authRouter from "./routers/authRouter.js";
import passRouter from "./routers/passRouter.js";

dotenv.config();
connectDB();

const app = express();
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "http://localhost:5173",credentials: true}));
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/pass", passRouter);

app.listen(process.env.PORT,() => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
