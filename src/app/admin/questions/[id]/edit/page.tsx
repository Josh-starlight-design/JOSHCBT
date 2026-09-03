"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Subject { id: number; name: string; }

export default function EditQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const qId = params.id as string;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subjectId: "", questionText: "", topic: "", difficulty: "medium",
    optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: "A", marks: 1, explanation: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then(r => r.json()),
      fetch(`/api/questions/${qId}`).then(r => r.json()),
    ]).then(([sData, qData]) => {
      setSubjects(sData.subjects || []);
      const q = qData.question;
      if (q) {
        setForm({
          subjectId: q.subjectId?.toString() || "",
          questionText: q.questionText || "",
          topic: q.topic || "",
          difficulty: q.difficulty || "medium",
          optionA: q.optionA || "",
          optionB: q.optionB || "",
          optionC: q.optionC || "",
          optionD: q.optionD || "",
          correctAnswer: q.correctAnswer || "A",
          marks: q.marks || 1,
          explanation: q.explanation || "",
        });
      }
    }).finally(() => setLoading(false));
  }, [qId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${qId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subjectId: parseInt(form.subjectId), marks: parseInt(String(form.marks)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Question updated", "success");
      router.push("/admin/questions");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/questions" className="text-gray-400 hover:text-[#1e3a5f]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Edit Question</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
            <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text</label>
          <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))} required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none" rows={3} />
        </div>

        {(["A", "B", "C", "D"] as const).map(letter => (
          <div key={letter}>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Option {letter} {form.correctAnswer === letter && <span className="text-green-600">(Correct)</span>}
            </label>
            <div className="flex gap-2">
              <input value={form[`option${letter}` as keyof typeof form] as string}
                onChange={e => setForm(p => ({ ...p, [`option${letter}`]: e.target.value }))} required
                className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none ${form.correctAnswer === letter ? "border-green-300 bg-green-50" : "border-gray-200 focus:border-[#1e3a5f]"}`} />
              <button type="button" onClick={() => setForm(p => ({ ...p, correctAnswer: letter }))}
                className={`px-3 py-2.5 rounded-xl text-sm font-bold ${form.correctAnswer === letter ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                ✓
              </button>
            </div>
          </div>
        ))}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer</label>
            <select value={form.correctAnswer} onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
              {["A","B","C","D"].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
            <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Marks</label>
            <input type="number" min={1} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: parseInt(e.target.value) || 1 }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation</label>
          <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none" />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <Link href="/admin/questions" className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</Link>
          <Button type="submit" loading={saving}>Update Question</Button>
        </div>
      </form>
    </div>
  );
}
