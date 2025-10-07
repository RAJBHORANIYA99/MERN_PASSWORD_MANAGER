import express from "express";
import auth from "../middlewares/auth.js";
import {
  createPass,
  getAllPasses,
  updatePass,
  deletePass,
} from "../controllers/passController.js";

const router = express.Router();

router.post("/", auth, createPass);
router.get("/", auth, getAllPasses);
router.put("/:id", auth, updatePass);
router.delete("/:id", auth, deletePass);

export default router;
