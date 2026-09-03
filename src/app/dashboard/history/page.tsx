"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { formatDate } from "@/lib/utils";

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

export default function HistoryPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/results?page=${p}&limit=10`);
      const data = await res.json();
      setResults(data.results || []);
      setTotalPages(data.pages || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-[#1e3a5f]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Exam History</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-500 font-medium">No exam history yet</p>
            <Link href="/dashboard" className="mt-4 inline-block bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl text-sm font-bold">
              Take an Exam
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Exam</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Score</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Percentage</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800 text-sm">{r.examTitle}</p>
                        {r.subjectName && <p className="text-xs text-gray-400">{r.subjectName}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">
                        {r.scoreObtained} / {r.totalMarks}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className={`text-sm font-bold ${parseFloat(r.percentage) >= 50 ? "text-green-600" : "text-red-500"}`}>
                            {Math.round(parseFloat(r.percentage))}%
                          </p>
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full ${parseFloat(r.percentage) >= 50 ? "bg-green-500" : "bg-red-500"}`}
                              style={{ width: `${Math.min(parseFloat(r.percentage), 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${r.isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.isPassed ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/results/${r.id}`}
                          className="text-[#2563eb] hover:underline text-sm font-medium"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50">
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
