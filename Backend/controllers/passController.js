import Pass from "../models/passModel.js";
import catchAsyncError from "../middlewares/catchAsyncError.js";
import CustomError from "../middlewares/customError.js";
import { encrypt, decrypt } from "../config/cryptoUtils.js";

// Helper to decrypt the credential object dynamically based on its type
const decryptPassObject = (p) => {
  if (!p) return p;
  const pObj = p.toObject ? p.toObject() : p;
  
  if (pObj.type === "login") {
    pObj.password = pObj.password ? decrypt(pObj.password) : "";
    
    // Decrypt password history array transparently
    if (pObj.passwordHistory && pObj.passwordHistory.length > 0) {
      pObj.passwordHistory = pObj.passwordHistory.map(h => ({
        password: decrypt(h.password),
        changedAt: h.changedAt,
        _id: h._id
      }));
    }
  } else if (pObj.type === "card") {
    pObj.cardholderName = pObj.cardholderName ? decrypt(pObj.cardholderName) : "";
    pObj.cardNumber = pObj.cardNumber ? decrypt(pObj.cardNumber) : "";
    pObj.expiryDate = pObj.expiryDate ? decrypt(pObj.expiryDate) : "";
    pObj.cvv = pObj.cvv ? decrypt(pObj.cvv) : "";
  } else if (pObj.type === "note") {
    pObj.noteContent = pObj.noteContent ? decrypt(pObj.noteContent) : "";
  }
  return pObj;
};

// Save a new credential entry
export const createPass = catchAsyncError(async (req, res) => {
  const { 
    website, type, category, 
    username, password,
    cardholderName, cardNumber, expiryDate, cvv,
    noteContent 
  } = req.body;

  if (!website) {
    throw new CustomError("Please specify a website or title", 400);
  }

  const passData = {
    website,
    type: type || "login",
    category: category || "Others",
    user: req.user._id,
    passwordHistory: []
  };

  if (passData.type === "login") {
    if (!username || !password) {
      throw new CustomError("Username and password are required for Logins", 400);
    }
    passData.username = username;
    passData.password = encrypt(password);
  } else if (passData.type === "card") {
    if (!cardNumber || !expiryDate || !cvv) {
      throw new CustomError("Card Number, Expiry, and CVV are required for Cards", 400);
    }
    passData.cardholderName = cardholderName ? encrypt(cardholderName) : "";
    passData.cardNumber = encrypt(cardNumber);
    passData.expiryDate = encrypt(expiryDate);
    passData.cvv = encrypt(cvv);
  } else if (passData.type === "note") {
    if (!noteContent) {
      throw new CustomError("Note content is required for Notes", 400);
    }
    passData.noteContent = encrypt(noteContent);
  }

  const newPass = await Pass.create(passData);

  res.status(201).json({
    success: true,
    pass: decryptPassObject(newPass),
    message: `${passData.type.charAt(0).toUpperCase() + passData.type.slice(1)} saved successfully!`,
  });
});

// Retrieve all credentials for the current user
export const getAllPasses = catchAsyncError(async (req, res) => {
  const passes = await Pass.find({ user: req.user._id }).sort({ isFavorite: -1, updatedAt: -1 });
  
  const decryptedPasses = passes.map(decryptPassObject);
  res.json({ success: true, passes: decryptedPasses });
});

// Update an existing credential entry
export const updatePass = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Fetch the existing document to check if the password is changing
  const existingPass = await Pass.findOne({ _id: id, user: req.user._id });
  if (!existingPass) {
    throw new CustomError("Credential entry not found", 404);
  }

  // Encrypt parameters appropriately before updating in DB
  if (updateData.type === "login" && updateData.password) {
    const oldDecrypted = existingPass.password ? decrypt(existingPass.password) : "";
    
    // Check if the password has actually changed
    if (oldDecrypted && oldDecrypted !== updateData.password) {
      // Push old encrypted password to history array
      updateData.passwordHistory = existingPass.passwordHistory || [];
      updateData.passwordHistory.push({
        password: existingPass.password, // current encrypted hash
        changedAt: new Date()
      });

      // Cap password history versions at 5
      if (updateData.passwordHistory.length > 5) {
        updateData.passwordHistory.shift();
      }
    }
    
    updateData.password = encrypt(updateData.password);
  } else if (updateData.type === "card") {
    if (updateData.cardholderName) updateData.cardholderName = encrypt(updateData.cardholderName);
    if (updateData.cardNumber) updateData.cardNumber = encrypt(updateData.cardNumber);
    if (updateData.expiryDate) updateData.expiryDate = encrypt(updateData.expiryDate);
    if (updateData.cvv) updateData.cvv = encrypt(updateData.cvv);
  } else if (updateData.type === "note" && updateData.noteContent) {
    updateData.noteContent = encrypt(updateData.noteContent);
  }

  // Update accessed timestamp if needed
  if (updateData.markUsed) {
    updateData.lastUsed = new Date();
    delete updateData.markUsed;
  }

  const updatedPass = await Pass.findOneAndUpdate(
    { _id: id, user: req.user._id },
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedPass) {
    throw new CustomError("Credential entry not found", 404);
  }

  res.json({
    success: true,
    message: `${updatedPass.type.charAt(0).toUpperCase() + updatedPass.type.slice(1)} updated successfully!`,
    pass: decryptPassObject(updatedPass),
  });
});

// Delete a credential entry
export const deletePass = catchAsyncError(async (req, res) => {
  const { id } = req.params;
  const deletedPass = await Pass.findOneAndDelete({
    _id: id,
    user: req.user._id,
  });

  if (!deletedPass) {
    throw new CustomError("Credential not found", 404);
  }

  res.json({
    success: true,
    message: `${deletedPass.type.charAt(0).toUpperCase() + deletedPass.type.slice(1)} deleted successfully!`,
  });
});
