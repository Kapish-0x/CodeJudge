// import express from "express";
// import { config } from "dotenv";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { connect } from "mongoose";
// import rateLimit from "express-rate-limit";
// import userRouter from "./routes/userRoutes.js";
// import problemRouter from "./routes/problemRouter.js";
// import submissionRouter from "./routes/submissionRoutes.js";

// config();

// const app = express();

// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cors({
//   origin: "http://localhost:5173", // Or whatever port your frontend runs on
//   credentials: true // Crucial if you are using cookies!
// }));

// // ✅ Rate limiter BEFORE routes
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: { message: "Too many requests, please try again later." },
// });
// app.use("/api/", limiter);

// app.use("/api/auth", userRouter);
// app.use("/api/problems", problemRouter);
// app.use("/api/submissions", submissionRouter);

// const connectDB = async () => {
//   try {
//     await connect(process.env.MONGO_URI);
//     console.log("Database connected successfully");

//     const port = process.env.PORT || 4000;
//     app.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//   } catch (err) {
//     console.error("Error occurred!", err);
//   }
// };

// connectDB();





import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import userRouter from "./routes/userRoutes.js";
import problemRouter from "./routes/problemRouter.js";
import submissionRoutes from "./routes/submissionRoutes.js";

dotenv.config();

const app = express();

// CORS — allow frontend origin with credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", userRouter);
app.use("/api/users", userRouter);
app.use("/api/problems", problemRouter);
app.use("/api/submissions", submissionRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Path ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Validation error", error: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Cast error", error: err.message });
  }

  const errCode = err.code ?? err.cause?.code ?? err.errorResponse?.code;
  const keyValue = err.keyValue ?? err.cause?.keyValue ?? err.errorResponse?.keyValue;

  if (errCode === 11000) {
    const field = Object.keys(keyValue)[0];
    const value = keyValue[field];
    return res.status(409).json({
      message: "Duplicate error",
      error: `${field} "${value}" already exists`,
    });
  }

  res.status(500).json({ message: "Server error" });
});