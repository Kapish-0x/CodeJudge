import express from "express";
import {
  submitCode,
  getMySubmissions,
  getSubmissionsByProblem,
} from "../controllers/submissionController.js";
import { VerifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

// Logged-in users
router.post("/submit", VerifyToken("user", "admin"), submitCode);
router.get("/my", VerifyToken("user", "admin"), getMySubmissions);

// Admin only
router.get("/problem/:problemId", VerifyToken("admin"), getSubmissionsByProblem);

export default router;