import User from "../models/userModel.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CustomError from "../middlewares/customError.js";
import JWT from "jsonwebtoken";

// Helper to set token cookie and save active session log in MongoDB
const sendTokenResponse = async (user, statusCode, req, res, message) => {
    const token = user.generateToken();

    // Parse user agent and client IP
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.headers["x-forwarded-for"] || req.ip || "127.0.0.1";
    
    let deviceName = "Unknown Device";
    if (userAgent.includes("Mobile") || userAgent.includes("Android") || userAgent.includes("iPhone")) {
        if (userAgent.includes("iPhone")) deviceName = "iPhone (Mobile)";
        else if (userAgent.includes("Android")) deviceName = "Android (Mobile)";
        else deviceName = "Mobile Device";
    } else {
        if (userAgent.includes("Windows")) deviceName = "Windows PC";
        else if (userAgent.includes("Macintosh")) deviceName = "MacBook / iMac";
        else if (userAgent.includes("Linux")) deviceName = "Linux PC";
        else deviceName = "Desktop Device";
    }

    // Register session log
    user.sessions = user.sessions || [];
    user.sessions.push({
        token,
        device: deviceName,
        ip,
        lastActive: new Date()
    });

    // Limit active sessions history size
    if (user.sessions.length > 10) {
        user.sessions.shift();
    }

    await user.save();
    
    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });

    res.status(statusCode).json({
        success: true,
        username: user.username,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        token,
        message,
    });
};

// Google Authentication Endpoint
export const googleLogin = catchAsyncError(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        throw new CustomError("Google token is required", 400);
    }

    let googleUser;

    // Real Google OAuth verification
    try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
        const response = await fetch(verifyUrl);
        if (!response.ok) {
            throw new CustomError("Invalid Google Token", 400);
        }
        googleUser = await response.json();
    } catch (error) {
        throw new CustomError("Google token verification failed", 400);
    }

    // Verify audience matching configured client ID
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId && googleUser.aud !== clientId) {
        throw new CustomError("Token audience mismatch", 400);
    }

    const { email, name } = googleUser;
    if (!email) {
        throw new CustomError("Google account has no email associated", 400);
    }

    // Find or create user
    let user = await User.findOne({ email }).select("+twoFactorSecret");
    if (!user) {
        // Create user with random password
        user = await User.create({
            username: name || email.split("@")[0],
            email,
            password: Math.random().toString(36).slice(-12), // random complex password
        });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
        const tempToken = JWT.sign(
            { id: user._id, isTemp: true },
            process.env.JWT_SECRET || "your_jwt_secret",
            { expiresIn: "5m" }
        );

        return res.status(200).json({
            success: true,
            requires2FA: true,
            tempToken,
            message: "Two-factor authentication required"
        });
    }

    await sendTokenResponse(user, 200, req, res, "Logged in successfully with Google");
});

// Verify 2FA and enable session
export const verify2FALogin = catchAsyncError(async (req, res) => {
    const { code, tempToken } = req.body;
    if (!code || !tempToken) {
        throw new CustomError("2FA code and session token are required", 400);
    }

    let decoded;
    try {
        decoded = JWT.verify(tempToken, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (error) {
        throw new CustomError("Session expired, please login again", 401);
    }

    if (!decoded.isTemp) {
        throw new CustomError("Invalid verification token", 401);
    }

    const user = await User.findById(decoded.id).select("+twoFactorSecret");
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    const speakeasy = (await import("speakeasy")).default;
    const isVerified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 1
    });

    if (!isVerified) {
        throw new CustomError("Invalid 2FA code", 400);
    }

    await sendTokenResponse(user, 200, req, res, "User logged in successfully");
});

// Logout current session
export const logout = catchAsyncError(async (req, res) => {
    // Remove the current token from user's sessions list in DB
    const user = await User.findById(req.user._id);
    if (user) {
        user.sessions = user.sessions.filter(s => s.token !== req.token);
        await user.save();
    }

    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    });
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});

// GET all active sessions
export const getActiveSessions = catchAsyncError(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    const sessionList = (user.sessions || []).map(s => ({
        _id: s._id,
        device: s.device,
        ip: s.ip,
        lastActive: s.lastActive,
        isCurrent: s.token === req.token
    })).sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

    res.status(200).json({
        success: true,
        sessions: sessionList
    });
});

// Revoke all other active sessions (logout everywhere else)
export const revokeOtherSessions = catchAsyncError(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    // Retain only the current active session
    user.sessions = user.sessions.filter(s => s.token === req.token);
    await user.save();

    res.status(200).json({
        success: true,
        message: "Sign out of all other devices completed successfully!"
    });
});

// Revoke specific session by ID
export const revokeSpecificSession = catchAsyncError(async (req, res) => {
    const { sessionId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId);
    await user.save();

    res.status(200).json({
        success: true,
        message: "Selected session revoked successfully!"
    });
});

// Setup 2FA: Generate secret & QR code
export const generate2FASecret = catchAsyncError(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new CustomError("User not found", 404);
    }

    const speakeasy = (await import("speakeasy")).default;
    const qrcode = (await import("qrcode")).default;

    const secret = speakeasy.generateSecret({
        name: `PassX (${user.email})`
    });

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
        success: true,
        secret: secret.base32,
        qrCode: qrCodeDataUrl
    });
});

// Verify 2FA and enable it
export const enable2FA = catchAsyncError(async (req, res) => {
    const { secret, code } = req.body;
    if (!secret || !code) {
        throw new CustomError("Secret and verification code are required", 400);
    }

    const speakeasy = (await import("speakeasy")).default;
    const isVerified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: code,
        window: 1
    });

    if (!isVerified) {
        throw new CustomError("Invalid 2FA code. Please try again.", 400);
    }

    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Two-factor authentication enabled successfully!"
    });
});

// Disable 2FA
export const disable2FA = catchAsyncError(async (req, res) => {
    const { password } = req.body;
    if (!password) {
        throw new CustomError("Password is required to disable 2FA", 400);
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await user.matchPassword(password))) {
        throw new CustomError("Incorrect password", 401);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: "Two-factor authentication disabled successfully!"
    });
});
