"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { showToast } from "@/components/ui/Toast";

interface Question {
  id: number;
  questionText: string;
  subjectName: string;
  topic: string;
  difficulty: string;
  correctAnswer: string;
  marks: number;
  createdAt: string;
}

interface Subject { id: number; name: string; }

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subjectId: "", difficulty: "", search: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (filters.subjectId) p.set("subjectId", filters.subjectId);
    if (filters.difficulty) p.set("difficulty", filters.difficulty);
    if (filters.search) p.set("search", filters.search);
    const res = await fetch(`/api/questions?${p}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setTotalPages(data.pages || 1);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/subjects").then(r => r.json()).then(d => setSubjects(d.subjects || []));
  }, []);

  const deleteQuestion = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    showToast("Question deleted", "success");
    load();
  };

  const diffColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Question Bank</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total questions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/questions/import" className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
            Import CSV
          </Link>
          <Link href="/admin/questions/create" className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163050] transition-colors">
            + Add Question
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-5 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search questions..."
          value={filters.search}
          onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }}
          className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:border-[#1e3a5f]"
        />
        <select
          value={filters.subjectId}
          onChange={e => { setFilters(p => ({ ...p, subjectId: e.target.value })); setPage(1); }}
          className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          value={filters.difficulty}
          onChange={e => { setFilters(p => ({ ...p, difficulty: e.target.value })); setPage(1); }}
          className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {questions.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">❓</div>
              <p className="text-gray-500 font-medium">No questions found</p>
              <Link href="/admin/questions/create" className="mt-4 inline-block bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl text-sm font-bold">
                Add First Question
              </Link>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">#</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Question</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subject</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Difficulty</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Answer</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {questions.map((q, idx) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400">{(page - 1) * 20 + idx + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800 line-clamp-2 max-w-md">{q.questionText}</p>
                        {q.topic && <p className="text-xs text-gray-400 mt-0.5">Topic: {q.topic}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{q.subjectName || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${diffColors[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="w-7 h-7 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {q.correctAnswer}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/questions/${q.id}/edit`} className="text-[#2563eb] hover:underline text-sm font-medium">Edit</Link>
                          <button onClick={() => deleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 p-4 border-t border-gray-100">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-200">← Prev</button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-200">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
