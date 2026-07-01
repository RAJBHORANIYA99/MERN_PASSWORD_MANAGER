import express from "express";
import { 
    logout, verify2FALogin, generate2FASecret, enable2FA, disable2FA, googleLogin,
    getActiveSessions, revokeOtherSessions, revokeSpecificSession 
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// Google Authentication
router.post("/google-login", googleLogin);
router.post("/logout", auth, logout);

// Session Management routes
router.get("/sessions", auth, getActiveSessions);
router.post("/sessions/revoke-others", auth, revokeOtherSessions);
router.delete("/sessions/revoke/:sessionId", auth, revokeSpecificSession);

// Two-Factor Authentication routes
router.post("/verify-2fa-login", verify2FALogin);
router.post("/generate-2fa", auth, generate2FASecret);
router.post("/enable-2fa", auth, enable2FA);
router.post("/disable-2fa", auth, disable2FA);

export default router;
