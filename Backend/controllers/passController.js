import Pass from "../models/passModel.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CustomError from "../middlewares/customError.js";

const createPass = catchAsyncError(async (req, res) => {
  const { website, username, password } = req.body;

  if (!website || !username || !password) {
    throw new CustomError("Please fill in all fields", 404);
  }

  const newPass = await Pass.create({
    website,
    username,
    password,
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    website: newPass.website,
    username: newPass.username,
    password: newPass.password,
    message: "Password saved successfully!",
  });
});

const getAllPasses = catchAsyncError(async (req, res) => {
  const passes = await Pass.find({ user: req.user._id });
  if (!passes) {
    throw new CustomError("Password not found", 404);
  }
  res.json({ success: true, passes });
});

const updatePass = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, user: req.user._id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedPass) {
    throw new CustomError("Password not found", 404);
  }
  res.json({
    success: true,
    message: "Password updated successfully!y",
    pass: updatedPass,
  });
});

const deletePass = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const deletedPass = await Pass.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });
  if (!deletedPass) {
    throw new CustomError("Password not found", 404);
  }
  res.json({ success: true, message: "Password deleted successfully!" });
});

export { createPass, getAllPasses, updatePass, deletePass };
