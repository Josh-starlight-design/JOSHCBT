"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

interface Exam {
  id: number;
  title: string;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passMark: number;
  status: string;
  questionCount: number;
  createdAt: string;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/exams?limit=100");
    const data = await res.json();
    setExams(data.exams || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (exam: Exam) => {
    const newStatus = exam.status === "published" ? "draft" : "published";
    const res = await fetch(`/api/exams/${exam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      showToast(`Exam ${newStatus === "published" ? "published" : "unpublished"}`, "success");
      load();
    }
  };

  const deleteExam = async (id: number) => {
    if (!confirm("Archive this exam?")) return;
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    showToast("Exam archived", "success");
    load();
  };

  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    draft: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Examinations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all examinations</p>
        </div>
        <Link
          href="/admin/exams/create"
          className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163050] transition-colors"
        >
          + Create Exam
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {exams.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-gray-500 font-medium">No exams yet</p>
              <Link href="/admin/exams/create" className="mt-4 inline-block bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl text-sm font-bold">
                Create First Exam
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Exam</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subject</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Questions</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Duration</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{exam.title}</p>
                      <p className="text-xs text-gray-400">Pass: {exam.passMark}% | {exam.totalMarks} marks</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{exam.subjectName || "—"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`font-bold ${Number(exam.questionCount) >= exam.totalQuestions ? "text-green-600" : "text-amber-600"}`}>
                        {exam.questionCount}
                      </span>
                      <span className="text-gray-400"> / {exam.totalQuestions}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{exam.durationMinutes} min</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${statusColors[exam.status] || "bg-gray-100 text-gray-600"}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="text-[#2563eb] hover:underline text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => toggleStatus(exam)}
                          className={`text-sm font-medium ${exam.status === "published" ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"}`}
                        >
                          {exam.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => deleteExam(exam.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
