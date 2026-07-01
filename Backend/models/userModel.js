import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        trim: true,
        required: [true, "Username is required"],
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [30, "Username cannot exceed 30 characters"]
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
        required: [true, "Please enter your Email!"],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid Email!",
        ],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        maxlength: [100, "Password length invalid"], // extended for complex hash structures
        trim: true,
        select: false,
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    // Store user active sessions (browser tokens, device name, IP logs)
    sessions: [
        {
            token: { type: String, required: true },
            device: { type: String, default: "Unknown Device" },
            ip: { type: String, default: "127.0.0.1" },
            lastActive: { type: Date, default: Date.now }
        }
    ]
},{ timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
    return JWT.sign({ id: this._id }, process.env.JWT_SECRET || "your_jwt_secret", {
        expiresIn: process.env.JWT_EXPIRE || "1d",
    });
};

const User = mongoose.model("User", userSchema);

export default User;