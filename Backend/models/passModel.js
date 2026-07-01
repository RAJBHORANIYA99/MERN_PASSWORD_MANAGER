import mongoose from "mongoose";

const passSchema = new mongoose.Schema({
  website: {
    type: String,
    required: [true, "Title/Website is required"],
    trim: true,
  },
  type: {
    type: String,
    enum: ["login", "card", "note"],
    default: "login",
  },
  // Login credentials fields
  username: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
  },
  // Credit / Debit Card fields (encrypted strings stored)
  cardholderName: {
    type: String,
    trim: true,
  },
  cardNumber: {
    type: String,
    trim: true,
  },
  expiryDate: {
    type: String,
    trim: true,
  },
  cvv: {
    type: String,
    trim: true,
  },
  // Secure notes content (encrypted string stored)
  noteContent: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    default: "Others",
    trim: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  // Store encrypted password history versions
  passwordHistory: [
    {
      password: { type: String, required: true },
      changedAt: { type: Date, default: Date.now }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
}, { timestamps: true });

const Pass = mongoose.model("Password", passSchema);

export default Pass;
