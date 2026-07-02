import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL,{dbName: "PasswordManager"});
    console.log("MongoDB Connected Successfully !");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
