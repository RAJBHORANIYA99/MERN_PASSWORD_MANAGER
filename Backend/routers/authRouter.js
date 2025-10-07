import express from "express";
import { signup, login, logout } from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", auth, logout);

export default router;
