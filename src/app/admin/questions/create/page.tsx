"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Subject { id: number; name: string; }

const emptyForm = {
  subjectId: "",
  questionText: "",
  topic: "",
  difficulty: "medium",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  marks: 1,
  explanation: "",
};

export default function CreateQuestionPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [addAnother, setAddAnother] = useState(false);

  useEffect(() => {
    fetch("/api/subjects").then(r => r.json()).then(d => setSubjects(d.subjects || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subjectId) { showToast("Please select a subject", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subjectId: parseInt(form.subjectId), marks: parseInt(String(form.marks)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Question created!", "success");
      if (addAnother) {
        setForm({ ...emptyForm, subjectId: form.subjectId, difficulty: form.difficulty });
      } else {
        router.push("/admin/questions");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/questions" className="text-gray-400 hover:text-[#1e3a5f]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Add Question</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
            <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
            <input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]"
              placeholder="e.g. Algebra" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question Text <span className="text-red-500">*</span></label>
          <textarea value={form.questionText} onChange={e => setForm(p => ({ ...p, questionText: e.target.value }))} required
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none"
            rows={3} placeholder="Enter the question here..." />
        </div>

        <div className="space-y-3">
          {(["A", "B", "C", "D"] as const).map(letter => (
            <div key={letter}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Option {letter} {form.correctAnswer === letter && <span className="text-green-600">(Correct)</span>}
              </label>
              <div className="flex gap-2">
                <input
                  value={form[`option${letter}` as keyof typeof form] as string}
                  onChange={e => setForm(p => ({ ...p, [`option${letter}`]: e.target.value }))}
                  required
                  className={`flex-1 border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                    form.correctAnswer === letter
                      ? "border-green-300 bg-green-50 focus:border-green-500"
                      : "border-gray-200 focus:border-[#1e3a5f]"
                  }`}
                  placeholder={`Option ${letter}`}
                />
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, correctAnswer: letter }))}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    form.correctAnswer === letter
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
                  }`}
                  title="Mark as correct"
                >
                  ✓
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Correct Answer</label>
            <select value={form.correctAnswer} onChange={e => setForm(p => ({ ...p, correctAnswer: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Explanation (optional)</label>
          <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none"
            rows={2} placeholder="Explain the correct answer..." />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={addAnother} onChange={e => setAddAnother(e.target.checked)}
              className="w-4 h-4 text-[#1e3a5f]" />
            <span className="text-sm text-gray-600">Add another after saving</span>
          </label>
          <div className="flex gap-3">
            <Link href="/admin/questions" className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</Link>
            <Button type="submit" loading={saving}>Save Question</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
