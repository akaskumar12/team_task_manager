import express from "express";
import { authenticate, requireAdmin } from "../middleware/authMiddleware.js";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;