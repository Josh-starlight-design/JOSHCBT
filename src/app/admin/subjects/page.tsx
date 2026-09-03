"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });

  const load = async () => {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    setSubjects(data.subjects || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Subject created", "success");
      setShowModal(false);
      setForm({ name: "", code: "", description: "" });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async (id: number) => {
    if (!confirm("Delete this subject?")) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    showToast("Subject deleted", "success");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Subject Management</h1>
          <p className="text-gray-500 text-sm mt-1">{subjects.length} subjects</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163050] transition-colors">
          + Add Subject
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.length === 0 ? (
            <div className="col-span-3 text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">📚</div>
              <p className="text-gray-500 font-medium">No subjects yet</p>
              <button onClick={() => setShowModal(true)} className="mt-4 bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl text-sm font-bold">
                Add First Subject
              </button>
            </div>
          ) : subjects.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{s.name}</h3>
                  {s.code && <p className="text-xs text-gray-400 mt-0.5">Code: {s.code}</p>}
                  {s.description && <p className="text-sm text-gray-500 mt-2">{s.description}</p>}
                </div>
                <button onClick={() => deleteSubject(s.id)}
                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Subject">
        <form onSubmit={createSubject} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject Name *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]"
              placeholder="e.g. Mathematics" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Code</label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]"
              placeholder="e.g. MTH" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f] resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowModal(false)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <Button type="submit" loading={saving}>Create Subject</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
