import User from "../models/userModel.js";
import JWT from "jsonwebtoken";
import catchAsyncError from "./catchAsyncError.js";
import CustomError from "./customError.js";

const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        throw new CustomError("Login first to access this resource", 401);
    }
    
    let decoded;
    try {
        decoded = JWT.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    } catch (error) {
        throw new CustomError("Not authorized, token failed", 401);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
        throw new CustomError("User not found", 401);
    }

    // Active Session Check: Make sure session has not been revoked remotely
    const activeSession = user.sessions && user.sessions.find(s => s.token === token);
    if (!activeSession) {
        throw new CustomError("Your session has expired or been revoked. Please login again.", 401);
    }

    // Update last active time
    activeSession.lastActive = new Date();
    await user.save();

    req.user = user;
    req.token = token; // expose current session token to routes/controllers
    next();
});   

export default isAuthenticated;