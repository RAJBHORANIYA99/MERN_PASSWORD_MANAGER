import mongoose from "mongoose";

const passSchema = new mongoose.Schema({
  website: {
    type: String,
    required: [true, "Website is required"],
    trim: true,
  },
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Password is required"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Pass = mongoose.model("Password", passSchema);

export default Pass;
