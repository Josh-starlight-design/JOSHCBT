"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Subject { id: number; name: string; }

export default function EditExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "", description: "", subjectId: "",
    durationMinutes: 30, totalQuestions: 40, totalMarks: 40, passMark: 50,
    status: "draft",
    randomizeQuestions: true, randomizeOptions: false,
    allowPreviousQuestion: true, allowReview: true,
    showResultImmediately: true, autoSubmit: true,
    startDate: "", endDate: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/subjects").then(r => r.json()),
      fetch(`/api/exams/${examId}`).then(r => r.json()),
    ]).then(([sData, eData]) => {
      setSubjects(sData.subjects || []);
      const e = eData.exam;
      if (e) {
        setForm({
          title: e.title || "",
          description: e.description || "",
          subjectId: e.subjectId?.toString() || "",
          durationMinutes: e.durationMinutes || 30,
          totalQuestions: e.totalQuestions || 40,
          totalMarks: e.totalMarks || 40,
          passMark: e.passMark || 50,
          status: e.status || "draft",
          randomizeQuestions: e.randomizeQuestions ?? true,
          randomizeOptions: e.randomizeOptions ?? false,
          allowPreviousQuestion: e.allowPreviousQuestion ?? true,
          allowReview: e.allowReview ?? true,
          showResultImmediately: e.showResultImmediately ?? true,
          autoSubmit: e.autoSubmit ?? true,
          startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 16) : "",
          endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 16) : "",
        });
      }
    }).finally(() => setLoading(false));
  }, [examId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subjectId: form.subjectId ? parseInt(form.subjectId) : null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Exam updated", "success");
      router.push("/admin/exams");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/exams" className="text-gray-400 hover:text-[#1e3a5f]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-black text-[#1e3a5f]">Edit Examination</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
          <h2 className="font-bold text-[#1e3a5f]">Basic Information</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <select value={form.subjectId} onChange={e => setForm(p => ({ ...p, subjectId: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
                <option value="">No Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Duration (min)", key: "durationMinutes" },
              { label: "Total Questions", key: "totalQuestions" },
              { label: "Total Marks", key: "totalMarks" },
              { label: "Pass Mark (%)", key: "passMark" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{f.label}</label>
                <input type="number" min={0} value={form[f.key as keyof typeof form] as number}
                  onChange={e => setForm(p => ({ ...p, [f.key]: parseInt(e.target.value) || 0 }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1e3a5f]" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Behavior</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: "randomizeQuestions", label: "Randomize Questions" },
              { key: "randomizeOptions", label: "Randomize Options" },
              { key: "allowPreviousQuestion", label: "Allow Back Navigation" },
              { key: "allowReview", label: "Allow Review" },
              { key: "showResultImmediately", label: "Show Result Now" },
              { key: "autoSubmit", label: "Auto Submit" },
            ].map(s => (
              <label key={s.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form[s.key as keyof typeof form] as boolean}
                  onChange={e => setForm(p => ({ ...p, [s.key]: e.target.checked }))}
                  className="w-4 h-4 text-[#1e3a5f]" />
                <span className="text-sm font-medium text-gray-700">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/exams" className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl text-sm font-semibold">Cancel</Link>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
