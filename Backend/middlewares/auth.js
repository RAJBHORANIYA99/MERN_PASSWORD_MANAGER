import User from "../models/userModel.js";
import JWT from "jsonwebtoken";
import catchAsyncError from "./catchAsyncError.js";
import CustomError from "./customError.js";

const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        throw new CustomError("Login first to access this resource", 401);
    }
    
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        throw new CustomError("Not authorized, token failed", 401);
    }
});   

export default isAuthenticated;