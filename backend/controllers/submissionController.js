import { Problem } from "../models/Problem.js";
import { Submission } from "../models/Submission.js";
import { User } from "../models/User.js";
import expressAsyncHandler from "express-async-handler";
import axios from "axios";

// Piston API language map
// Full list: https://emkc.org/api/v2/piston/runtimes
const LANGUAGE_MAP = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
  c: { language: "c", version: "10.2.0" },
};

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

// Helper: run one test case via Piston
const runTestCase = async (code, language, input) => {
  const { language: lang, version } = LANGUAGE_MAP[language];

  const res = await axios.post(PISTON_URL, {
    language: lang,
    version,
    files: [{ content: code }],
    stdin: input,
  });

  return res.data; // { run: { stdout, stderr, code, signal }, compile: {...} }
};

// POST /api/submissions/submit
export const submitCode = expressAsyncHandler(async (req, res) => {
  const { problemId, code, language } = req.body;
  const userId = req.user._id;

  if (!LANGUAGE_MAP[language]) {
    return res.status(400).json({ message: `Unsupported language: ${language}` });
  }

  if (!code || code.trim().length === 0) {
    return res.status(400).json({ message: "Code cannot be empty" });
  }

  // 1. Fetch problem with test cases
  const problem = await Problem.findById(problemId);
  if (!problem) return res.status(404).json({ message: "Problem not found" });

  if (!problem.testCases || problem.testCases.length === 0) {
    return res.status(400).json({ message: "Problem has no test cases" });
  }

  // 2. Create pending submission
  const submission = await Submission.create({
    userId,
    problemId,
    code,
    language,
    status: "Pending",
  });

  try {
    let finalStatus = "Accepted";
    let lastOutput = "";
    const startTime = Date.now();

    // 3. Run each test case
    for (const testCase of problem.testCases) {
      const result = await runTestCase(code, language, testCase.input);

      const run = result.run;
      const compileError = result.compile?.stderr;

      // Compilation error
      if (compileError) {
        finalStatus = "Compilation Error";
        lastOutput = compileError;
        break;
      }

      // Runtime error (non-zero exit code)
      if (run.code !== 0 || run.signal) {
        finalStatus = "Runtime Error";
        lastOutput = run.stderr || `Exited with code ${run.code}`;
        break;
      }

      const output = run.stdout.trim();
      const expected = testCase.expectedOutput.trim();
      lastOutput = output;

      // Check execution time
      const elapsed = Date.now() - startTime;
      if (elapsed > problem.timeLimit) {
        finalStatus = "Time Limit Exceeded";
        break;
      }

      // Wrong answer
      if (output !== expected) {
        finalStatus = "Wrong Answer";
        lastOutput = output;
        break;
      }
    }

    const executionTime = Date.now() - startTime;

    // 4. Save result
    submission.status = finalStatus;
    submission.output = lastOutput;
    submission.executionTime = executionTime;
    await submission.save();

    // 5. Update user stats
    if (finalStatus === "Accepted") {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { solvedProblems: problemId },
        $inc: { totalSubmissions: 1 },
      });
    } else {
      await User.findByIdAndUpdate(userId, { $inc: { totalSubmissions: 1 } });
    }

    res.json({
      status: finalStatus,
      output: lastOutput,
      executionTime,
      submissionId: submission._id,
    });

  } catch (err) {
    console.error("Piston API Error:", err.message);
    submission.status = "Runtime Error";
    submission.output = "Execution service error. Please try again.";
    await submission.save();
    res.status(500).json({ message: "Code execution failed", error: err.message });
  }
});

// GET /api/submissions/my
export const getMySubmissions = expressAsyncHandler(async (req, res) => {
  const submissions = await Submission.find({ userId: req.user._id })
    .populate("problemId", "title difficulty")
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(submissions);
});

// GET /api/submissions/problem/:problemId (admin)
export const getSubmissionsByProblem = expressAsyncHandler(async (req, res) => {
  const submissions = await Submission.find({ problemId: req.params.problemId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  res.json(submissions);
});