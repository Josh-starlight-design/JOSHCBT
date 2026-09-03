"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardCard from "@/components/ui/DashboardCard";
import { formatDate } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalExams: number;
    totalQuestions: number;
    examsToday: number;
    avgScore: string;
    passRate: string;
  };
  recentResults: {
    id: number;
    studentName: string;
    examTitle: string;
    percentage: string;
    isPassed: boolean;
    submittedAt: string;
  }[];
  examPerformance: {
    examTitle: string;
    avgScore: number;
    count: number;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#1e3a5f]">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of CBT PRO examination system</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <DashboardCard
          title="Students"
          value={stats?.totalStudents || 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          color="blue"
        />
        <DashboardCard
          title="Exams"
          value={stats?.totalExams || 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          color="purple"
        />
        <DashboardCard
          title="Questions"
          value={stats?.totalQuestions || 0}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="teal"
        />
        <DashboardCard
          title="Today"
          value={stats?.examsToday || 0}
          subtitle="Exams taken"
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="amber"
        />
        <DashboardCard
          title="Avg Score"
          value={`${stats?.avgScore || 0}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
          color="green"
        />
        <DashboardCard
          title="Pass Rate"
          value={`${stats?.passRate || 0}%`}
          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          color="green"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Results */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-bold text-[#1e3a5f]">Recent Results</h2>
            <Link href="/admin/results" className="text-sm text-[#2563eb] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recentResults.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">No results yet</p>
            )}
            {data?.recentResults.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{r.studentName}</p>
                  <p className="text-xs text-gray-400 truncate">{r.examTitle}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${parseFloat(r.percentage) >= 50 ? "text-green-600" : "text-red-500"}`}>
                    {Math.round(parseFloat(r.percentage))}%
                  </p>
                  <span className={`text-xs font-bold ${r.isPassed ? "text-green-600" : "text-red-500"}`}>
                    {r.isPassed ? "PASS" : "FAIL"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 hidden sm:block">{formatDate(r.submittedAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-[#1e3a5f] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/exams/create", label: "Create Exam", icon: "➕" },
                { href: "/admin/questions/create", label: "Add Question", icon: "❓" },
                { href: "/admin/students", label: "Manage Students", icon: "👥" },
                { href: "/admin/results", label: "View Results", icon: "📊" },
                { href: "/admin/subjects", label: "Manage Subjects", icon: "📚" },
                { href: "/admin/questions/import", label: "Import Questions", icon: "📥" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 hover:text-[#1e3a5f] rounded-xl text-sm font-medium transition-colors group"
                >
                  <span className="text-xl">{a.icon}</span>
                  <span className="text-gray-600 group-hover:text-[#1e3a5f]">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Exam performance */}
          {data?.examPerformance && data.examPerformance.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-bold text-[#1e3a5f] mb-4">Exam Performance</h2>
              <div className="space-y-3">
                {data.examPerformance.map((e) => (
                  <div key={e.examTitle} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{e.examTitle}</p>
                      <p className="text-xs text-gray-400">{e.count} attempt{e.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${Number(e.avgScore) >= 50 ? "text-green-600" : "text-red-500"}`}>
                        {e.avgScore ? Math.round(Number(e.avgScore)) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
