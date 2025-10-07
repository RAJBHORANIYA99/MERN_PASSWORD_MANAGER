import User from "../models/userModel.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CustomError from "../middlewares/customError.js";

export const signup = catchAsyncError(async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        throw new CustomError("Please fill in all fields", 400);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new CustomError("User already exists", 400);
    }

    const user = await User.create({
        username,
        email,
        password,
    });

    const token = user.generateToken();

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
        success: true,
        username: user.username,
        email: user.email,
        token,
        message: "User registered successfully",
    });
});

export const login = catchAsyncError(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new CustomError("Please fill in all fields", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (user && (await user.matchPassword(password))) {
        const token = user.generateToken();
        res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        res.status(200).json({
        success: true,
        username: user.username,
        email: user.email,
        token,
        message: "User logged in successfully",
        });
    } else {
        throw new CustomError("Invalid email or password", 404);
    }
});

export const logout = catchAsyncError(async (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.status(200).json({
        success: true,
        message: "User logged out successfully",
    });
});
