"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

interface Exam {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passMark: number;
  subjectName: string;
  questionCount: number;
}

interface Result {
  id: number;
  examTitle: string;
  subjectName: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: string;
  isPassed: boolean;
  submittedAt: string;
}

interface Stats {
  available: number;
  completed: number;
  avgScore: number;
  bestScore: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<Stats>({ available: 0, completed: 0, avgScore: 0, bestScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          fetch("/api/exams"),
          fetch("/api/results?limit=5"),
        ]);
        const examsData = await examsRes.json();
        const resultsData = await resultsRes.json();

        setExams(examsData.exams || []);
        setResults(resultsData.results || []);

        const resArray = resultsData.results || [];
        const scores = resArray.map((r: Result) => parseFloat(r.percentage));
        setStats({
          available: examsData.exams?.length || 0,
          completed: resultsData.total || 0,
          avgScore: scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0,
          bestScore: scores.length ? Math.round(Math.max(...scores)) : 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: "Available Exams", value: stats.available, color: "bg-blue-50 text-[#1e3a5f]", icon: "📋" },
    { label: "Completed Exams", value: stats.completed, color: "bg-green-50 text-green-700", icon: "✅" },
    { label: "Average Score", value: `${stats.avgScore}%`, color: "bg-purple-50 text-purple-700", icon: "📊" },
    { label: "Best Score", value: `${stats.bestScore}%`, color: "bg-amber-50 text-amber-700", icon: "🏆" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1e3a5f]">
            Welcome, {user?.fullName?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Ready to take your next exam? Choose from the available examinations below.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 ${s.color} border border-opacity-20`}>
              <div className="text-3xl mb-2">{s.icon}</div>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-sm font-medium opacity-80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Available Exams */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#1e3a5f]">Available Examinations</h2>
              <span className="text-sm text-gray-500">{exams.length} exam{exams.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-4">
              {exams.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500 font-medium">No exams available at the moment</p>
                  <p className="text-gray-400 text-sm mt-1">Check back later for new examinations</p>
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {exam.subjectName && (
                            <span className="bg-blue-50 text-[#1e3a5f] text-xs font-bold px-2.5 py-0.5 rounded-full">
                              {exam.subjectName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {exam.totalQuestions} Questions
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {exam.durationMinutes} Minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {exam.totalMarks} Marks
                          </span>
                          <span className="flex items-center gap-1 text-green-600">
                            Pass: {exam.passMark}%
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/exam/${exam.id}/instructions`}
                        className="bg-[#1e3a5f] hover:bg-[#163050] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
                      >
                        Start Exam
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-[#1e3a5f]">Recent Results</h2>
              <Link href="/dashboard/history" className="text-sm text-[#2563eb] hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-500 text-sm">No results yet. Take your first exam!</p>
                </div>
              ) : (
                results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/results/${result.id}`}
                    className="block bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{result.examTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(result.submittedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${parseFloat(result.percentage) >= 50 ? "text-green-600" : "text-red-500"}`}>
                          {Math.round(parseFloat(result.percentage))}%
                        </p>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${result.isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {result.isPassed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${parseFloat(result.percentage) >= 50 ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${Math.min(parseFloat(result.percentage), 100)}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Quick links */}
            <div className="mt-6 bg-[#1e3a5f] rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/dashboard/history" className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors">
                  <span>📚</span> Exam History
                </Link>
                <Link href="/dashboard/profile" className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors">
                  <span>👤</span> My Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
