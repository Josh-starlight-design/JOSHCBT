"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Result {
  id: number;
  studentName: string;
  examTitle: string;
  subjectName: string;
  scoreObtained: number;
  totalMarks: number;
  percentage: string;
  isPassed: boolean;
  submittedAt: string;
  sessionId: number;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/results?page=${page}&limit=20`);
    const data = await res.json();
    setResults(data.results || []);
    setTotal(data.total || 0);
    setTotalPages(data.pages || 1);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const headers = ["Student", "Exam", "Subject", "Score", "Percentage", "Status", "Date"];
    const rows = results.map(r => [
      r.studentName, r.examTitle, r.subjectName || "",
      `${r.scoreObtained}/${r.totalMarks}`, `${Math.round(parseFloat(r.percentage))}%`,
      r.isPassed ? "PASS" : "FAIL", formatDate(r.submittedAt),
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "results.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Results Management</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total results</p>
        </div>
        <button onClick={exportCsv}
          className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
          ⬇ Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {results.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-gray-500 font-medium">No results yet</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Student</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Exam</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">%</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{r.studentName}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700">{r.examTitle}</p>
                        {r.subjectName && <p className="text-xs text-gray-400">{r.subjectName}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">{r.scoreObtained}/{r.totalMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${parseFloat(r.percentage) >= 50 ? "text-green-600" : "text-red-500"}`}>
                          {Math.round(parseFloat(r.percentage))}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r.isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {r.isPassed ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(r.submittedAt)}</td>
                      <td className="px-6 py-4">
                        <Link href={`/results/${r.id}`} className="text-[#2563eb] hover:underline text-sm font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 p-4 border-t border-gray-100">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50">← Prev</button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
