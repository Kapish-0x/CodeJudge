import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

const WebBackground = ({ isDark }) => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="web-profile" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 40 80 M 0 40 L 80 40" stroke="#E31B23" strokeWidth="0.5" />
        <path d="M 0 0 L 80 80 M 80 0 L 0 80" stroke="#E31B23" strokeWidth="0.3" />
        <circle cx="40" cy="40" r="1" fill="#E31B23" />
        <circle cx="0" cy="0" r="1" fill="#E31B23" />
        <circle cx="80" cy="0" r="1" fill="#E31B23" />
        <circle cx="0" cy="80" r="1" fill="#E31B23" />
        <circle cx="80" cy="80" r="1" fill="#E31B23" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#web-profile)" />
  </svg>
);

const difficultyColor = {
  Easy: "text-green-400 bg-green-400/10 border-green-400/20",
  Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  Hard: "text-[#E31B23] bg-[#E31B23]/10 border-[#E31B23]/20",
};

const statusColor = {
  Accepted: "text-green-400",
  "Wrong Answer": "text-red-400",
  "Time Limit Exceeded": "text-yellow-400",
  "Runtime Error": "text-orange-400",
  "Compilation Error": "text-purple-400",
  Pending: "text-gray-400",
};

export default function ProfilePage() {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(true);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const solved = user?.solvedProblems?.length || 0;
  const total = user?.totalSubmissions || 0;
  const acceptRate = total > 0 ? Math.round((solved / total) * 100) : 0;

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/submissions/my`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSubmissions(data);
      } catch (_) {}
      setSubLoading(false);
    };
    fetchSubmissions();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className={`min-h-screen pt-20 relative ${isDark ? "bg-[#0D0D1A] text-white" : "bg-[#F8F8FC] text-[#0D0D1A]"}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#E31B23]" />
      <WebBackground isDark={isDark} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`rounded-2xl border p-8 mb-8 ${isDark ? "bg-[#13131F] border-white/8" : "bg-white border-gray-200 shadow-sm"}`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-[#E31B23] flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black">{user?.name}</h1>
                {user?.role === "admin" && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E31B23]/20 text-[#E31B23] uppercase tracking-wide">Admin</span>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user?.email}</p>
              <p className={`text-xs mt-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                isDark ? "border-white/10 text-gray-400 hover:border-red-500/40 hover:text-red-400" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-4 mt-6 pt-6 border-t ${isDark ? "border-white/8" : "border-gray-100"}`}>
            {[
              { label: "Solved", value: solved, color: "text-green-400" },
              { label: "Submissions", value: total, color: "text-[#E31B23]" },
              { label: "Accept Rate", value: `${acceptRate}%`, color: "text-blue-400" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent submissions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <h2 className="text-lg font-black mb-4">Recent Submissions</h2>

          {subLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-14 rounded-xl animate-pulse ${isDark ? "bg-white/5" : "bg-gray-100"}`} />
              ))}
            </div>
          ) : submissions.length === 0 ? (
            <div className={`rounded-2xl border p-10 text-center ${isDark ? "bg-white/[0.02] border-white/8" : "bg-white border-gray-200"}`}>
              <div className="text-4xl mb-3">🕸️</div>
              <p className={`font-semibold mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>No submissions yet</p>
              <Link to="/problems">
                <button className="px-5 py-2 rounded-xl bg-[#E31B23] text-white text-sm font-bold hover:bg-[#c41520] transition-colors">
                  Start Solving →
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub, i) => (
                <motion.div
                  key={sub._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/8" : "bg-white border-gray-200 shadow-sm"}`}
                >
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    sub.status === "Accepted" ? "bg-green-400" :
                    sub.status === "Pending" ? "bg-gray-400" : "bg-red-400"
                  }`} />

                  {/* Problem name */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/problems/${sub.problemId?._id || sub.problemId}`}>
                      <span className={`text-sm font-semibold hover:text-[#E31B23] transition-colors truncate block ${isDark ? "text-white" : "text-[#0D0D1A]"}`}>
                        {sub.problemId?.title || "Unknown Problem"}
                      </span>
                    </Link>
                    <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                      {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Difficulty */}
                  {sub.problemId?.difficulty && (
                    <span className={`hidden sm:inline-flex text-xs font-bold px-2 py-0.5 rounded-lg border flex-shrink-0 ${difficultyColor[sub.problemId.difficulty]}`}>
                      {sub.problemId.difficulty}
                    </span>
                  )}

                  {/* Status + lang */}
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs font-bold ${statusColor[sub.status] || "text-gray-400"}`}>
                      {sub.status}
                    </span>
                    <p className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                      {sub.language?.toUpperCase()} · {sub.executionTime}ms
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}