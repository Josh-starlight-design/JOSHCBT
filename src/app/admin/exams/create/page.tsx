"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Subject { id: number; name: string; }
interface Question { id: number; questionText: string; difficulty: string; subjectName: string; }

export default function CreateExamPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQIds, setSelectedQIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subjectId: "",
    durationMinutes: 30,
    totalQuestions: 40,
    totalMarks: 40,
    passMark: 50,
    status: "draft",
    randomizeQuestions: true,
    randomizeOptions: false,
    allowPreviousQuestion: true,
    allowReview: true,
    showResultImmediately: true,
    autoSubmit: true,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetch("/api/subjects").then(r => r.json()).then(d => setSubjects(d.subjects || []));
    fetch("/api/questions?limit=200").then(r => r.json()).then(d => setQuestions(d.questions || []));
  }, []);

  const filteredQs = form.subjectId
    ? questions.filter(q => q.subjectName === subjects.find(s => s.id === parseInt(form.subjectId))?.name)
    : questions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subjectId: form.subjectId ? parseInt(form.subjectId) : undefined,
          questionIds: selectedQIds,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Exam created successfully", "success");
      router.push("/admin/exams");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create exam", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = (id: number) => {
    setSelectedQIds(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedQIds.length === filteredQs.length) {
      setSelectedQIds([]);
    } else {
      setSelectedQIds(filteredQs.map(q => q.id));
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="text-gray-400 hover:text-[#1e3a5f]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Create Examination</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Title <span className="text-red-500">*</span></label>
              <input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]"
                placeholder="e.g. JAMB Mathematics Practice Test"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none"
                rows={3}
                placeholder="Brief description of this exam"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <select
                value={form.subjectId}
                onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]"
              >
                <option value="">Select Subject (optional)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Exam Settings */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Exam Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Duration (minutes)", key: "durationMinutes", min: 1, max: 300 },
              { label: "Total Questions", key: "totalQuestions", min: 1, max: 200 },
              { label: "Total Marks", key: "totalMarks", min: 1, max: 1000 },
              { label: "Pass Mark (%)", key: "passMark", min: 0, max: 100 },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{f.label}</label>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={form[f.key as keyof typeof form] as number}
                  onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date (optional)</label>
              <input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (optional)</label>
              <input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Behavior Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: "randomizeQuestions", label: "Randomize Questions" },
              { key: "randomizeOptions", label: "Randomize Options" },
              { key: "allowPreviousQuestion", label: "Allow Previous Question" },
              { key: "allowReview", label: "Allow Review" },
              { key: "showResultImmediately", label: "Show Result Immediately" },
              { key: "autoSubmit", label: "Auto Submit on Timeout" },
            ].map(s => (
              <label key={s.key} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form[s.key as keyof typeof form] as boolean}
                  onChange={e => setForm(p => ({ ...p, [s.key]: e.target.checked }))}
                  className="w-4 h-4 text-[#1e3a5f]"
                />
                <span className="text-sm font-medium text-gray-700">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question Selection */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1e3a5f]">
              Assign Questions ({selectedQIds.length} selected)
            </h2>
            <button type="button" onClick={toggleAll} className="text-sm text-[#2563eb] hover:underline">
              {selectedQIds.length === filteredQs.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
            {filteredQs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No questions available. Add questions first.</p>
            ) : filteredQs.map((q) => (
              <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQIds.includes(q.id)}
                  onChange={() => toggleQuestion(q.id)}
                  className="mt-1 w-4 h-4 text-[#1e3a5f]"
                />
                <div>
                  <p className="text-sm text-gray-800 line-clamp-2">{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{q.subjectName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${
                      q.difficulty === "easy" ? "bg-green-100 text-green-700" :
                      q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{q.difficulty}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Status + Submit */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex gap-3 flex-1 justify-end items-end">
            <Link href="/admin/exams" className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200">
              Cancel
            </Link>
            <Button type="submit" loading={saving} size="lg">
              Create Exam
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
