// import express from "express";
// import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
// import { VerifyToken } from "../middleware/VerifyToken.js";

// const userRouter = express.Router();

// // ✅ Public routes — no auth needed
// userRouter.post("/register", registerUser);
// userRouter.post("/login", loginUser);

// // ✅ Protected
// userRouter.post("/logout", VerifyToken("user", "admin"), logoutUser);

// export default userRouter;





import express from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/authController.js";
import { VerifyToken } from "../middleware/VerifyToken.js";
import { User } from "../models/User.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Protected
userRouter.post("/logout", VerifyToken("user", "admin"), logoutUser);

// Leaderboard — public, sorted by solved count desc
userRouter.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("name solvedProblems totalSubmissions createdAt")
      .lean();

    const sorted = users
      .map((u) => ({
        ...u,
        solvedCount: u.solvedProblems?.length || 0,
      }))
      .sort((a, b) => b.solvedCount - a.solvedCount || a.totalSubmissions - b.totalSubmissions)
      .slice(0, 50); // top 50

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

export default userRouter;