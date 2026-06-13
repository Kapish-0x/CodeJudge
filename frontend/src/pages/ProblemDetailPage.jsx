import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const BOILERPLATES = {
  python: `def solution():
    # Read input
    line = input()
    
    # Your code here
    
    print()

solution()`,
  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', line => lines.push(line));
rl.on('close', () => {
  // Your code here
  
  console.log();
});`,
  java: `import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    
    // Your code here
    
    System.out.println();
  }
}`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
  ios_base::sync_with_stdio(false);
  cin.tie(NULL);
  
  // Your code here
  
  return 0;
}`,
  c: `#include <stdio.h>

int main() {
  // Your code here
  
  return 0;
}`,
};

const MONACO_LANG = {
  python: "python",
  javascript: "javascript",
  java: "java",
  cpp: "cpp",
  c: "c",
};

const difficultyColor = {
  Easy: "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Hard: "text-[#E31B23] bg-[#E31B23]/10 border-[#E31B23]/20",
};

const statusColor = {
  Accepted: "text-green-400 bg-green-400/10 border-green-400/30",
  "Wrong Answer": "text-red-400 bg-red-400/10 border-red-400/30",
  "Time Limit Exceeded": "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  "Runtime Error": "text-orange-400 bg-orange-400/10 border-orange-400/30",
  "Compilation Error": "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Pending: "text-gray-400 bg-gray-400/10 border-gray-400/30",
};

const statusEmoji = {
  Accepted: "✅",
  "Wrong Answer": "❌",
  "Time Limit Exceeded": "⏱️",
  "Runtime Error": "💥",
  "Compilation Error": "🔴",
  Pending: "⏳",
};

export default function ProblemDetailPage() {
  const { id } = useParams();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(BOILERPLATES["python"]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const [activeTab, setActiveTab] = useState("description"); // description | submissions

  const [mySubmissions, setMySubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/problems/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Problem not found");
        const data = await res.json();
        setProblem(data);
        if (data.boilerplate) setCode(data.boilerplate);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProblem();
  }, [id]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCode(BOILERPLATES[lang]);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!user) { navigate("/login"); return; }
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submissions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ problemId: id, code, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setResult(data);
    } catch (err) {
      setResult({ status: "Runtime Error", output: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchMySubmissions = async () => {
    setSubLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submissions/my`, {
        credentials: "include",
      });
      const data = await res.json();
      const forThis = data.filter((s) => s.problemId?._id === id || s.problemId === id);
      setMySubmissions(forThis);
    } catch (_) {}
    setSubLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "submissions" && mySubmissions.length === 0) fetchMySubmissions();
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-16 ${isDark ? "bg-[#0D0D1A]" : "bg-[#F8F8FC]"}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#E31B23] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-16 ${isDark ? "bg-[#0D0D1A] text-white" : "bg-[#F8F8FC]"}`}>
        <div className="text-center">
          <div className="text-5xl mb-4">🕸️</div>
          <p className="text-[#E31B23] font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 flex flex-col ${isDark ? "bg-[#0D0D1A] text-white" : "bg-[#F8F8FC] text-[#0D0D1A]"}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#E31B23]" />

      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${isDark ? "border-white/8 bg-[#0D0D1A]" : "border-gray-200 bg-white"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/problems")}
            className={`text-sm font-semibold flex items-center gap-1 flex-shrink-0 ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-[#0D0D1A]"}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Problems
          </button>
          <span className={`text-sm ${isDark ? "text-gray-600" : "text-gray-300"}`}>/</span>
          <h1 className="text-sm font-bold truncate">{problem?.title}</h1>
          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold flex-shrink-0 ${difficultyColor[problem?.difficulty]}`}>
            {problem?.difficulty}
          </span>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none transition-colors ${
              isDark ? "bg-white/5 border-white/10 text-gray-300" : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {Object.keys(BOILERPLATES).map((lang) => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#E31B23] text-white text-xs font-bold hover:bg-[#c41520] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Judging...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                Submit
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Main layout: left panel + editor */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 104px)" }}>

        {/* LEFT: Problem info */}
        <div className={`w-full md:w-[42%] flex flex-col border-r overflow-hidden ${isDark ? "border-white/8" : "border-gray-200"}`}>
          {/* Tabs */}
          <div className={`flex border-b ${isDark ? "border-white/8" : "border-gray-200"}`}>
            {["description", "submissions"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-2.5 text-xs font-bold capitalize tracking-wide transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "text-[#E31B23] border-[#E31B23]"
                    : `border-transparent ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "description" ? (
              <div className="space-y-6">
                {/* Title + difficulty */}
                <div>
                  <h2 className="text-xl font-black">{problem?.title}</h2>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${difficultyColor[problem?.difficulty]}`}>
                      {problem?.difficulty}
                    </span>
                    {problem?.tags?.map((tag) => (
                      <span key={tag} className={`px-2 py-0.5 rounded border text-xs ${isDark ? "border-white/10 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    {problem?.description}
                  </p>
                </div>

                {/* Constraints */}
                <div className={`rounded-xl p-4 border ${isDark ? "bg-white/[0.02] border-white/8" : "bg-gray-50 border-gray-200"}`}>
                  <h3 className="text-xs font-bold mb-2 text-[#E31B23] uppercase tracking-wide">Constraints</h3>
                  <div className="space-y-1">
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      ⏱ Time limit: <span className="font-semibold">{(problem?.timeLimit || 2000) / 1000}s</span>
                    </p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      💾 Memory limit: <span className="font-semibold">{problem?.memoryLimit || 256} MB</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* My Submissions tab */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">My Submissions</h3>
                  <button
                    onClick={fetchMySubmissions}
                    className={`text-xs font-semibold ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
                  >
                    ↻ Refresh
                  </button>
                </div>
                {subLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`h-12 rounded-lg animate-pulse ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
                    ))}
                  </div>
                ) : mySubmissions.length === 0 ? (
                  <div className="text-center py-10">
                    <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>No submissions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mySubmissions.map((sub) => (
                      <div key={sub._id} className={`px-4 py-3 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/8" : "bg-white border-gray-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusColor[sub.status] || statusColor.Pending}`}>
                            {statusEmoji[sub.status]} {sub.status}
                          </span>
                          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            {sub.language?.toUpperCase()} · {sub.executionTime}ms
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                          {new Date(sub.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Editor + result */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={MONACO_LANG[language]}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme={isDark ? "vs-dark" : "light"}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                tabSize: 2,
                wordWrap: "on",
                automaticLayout: true,
                scrollbar: { verticalScrollbarSize: 4 },
                cursorBlinking: "smooth",
                smoothScrolling: true,
              }}
            />
          </div>

          {/* Result panel */}
          <AnimatePresence>
            {(result || submitting) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`border-t overflow-hidden ${isDark ? "border-white/8 bg-[#0D0D1A]" : "border-gray-200 bg-white"}`}
              >
                <div className="px-5 py-4">
                  {submitting ? (
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#E31B23] border-t-transparent rounded-full"
                      />
                      <span className={`text-sm font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        Running your code against test cases...
                      </span>
                    </div>
                  ) : result ? (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${statusColor[result.status] || statusColor.Pending}`}>
                          {statusEmoji[result.status]} {result.status}
                        </span>
                        {result.executionTime !== undefined && (
                          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            {result.executionTime}ms
                          </span>
                        )}
                      </div>
                      {result.output && (
                        <pre className={`text-xs p-3 rounded-lg font-mono overflow-x-auto max-h-28 ${
                          isDark ? "bg-black/30 text-gray-300" : "bg-gray-50 text-gray-700"
                        }`}>
                          {result.output}
                        </pre>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}