"use client";

import { useEffect, useState, useCallback } from "react";
import { showToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface Student {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  isActive: boolean;
  createdAt: string;
  examsCompleted: number;
  avgScore: number;
  bestScore: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: "", email: "", phone: "", username: "", password: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) p.set("search", search);
    const res = await fetch(`/api/admin/students?${p}`);
    const data = await res.json();
    setStudents(data.students || []);
    setTotal(data.total || 0);
    setTotalPages(data.pages || 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (student: Student) => {
    const res = await fetch(`/api/admin/students/${student.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !student.isActive }),
    });
    if (res.ok) {
      showToast(`Student ${!student.isActive ? "activated" : "deactivated"}`, "success");
      load();
    }
  };

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Student created", "success");
      setShowModal(false);
      setNewStudent({ fullName: "", email: "", phone: "", username: "", password: "" });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#1e3a5f]">Student Management</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total students</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-[#1e3a5f] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163050] transition-colors">
          + Add Student
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-5">
        <input
          type="text"
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#1e3a5f]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {students.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-gray-500 font-medium">No students found</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Student</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Exams</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Avg Score</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Joined</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#1e3a5f]/10 rounded-full flex items-center justify-center text-[#1e3a5f] font-bold text-sm">
                            {s.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{s.fullName}</p>
                            {s.username && <p className="text-xs text-gray-400">@{s.username}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{s.email}</p>
                        {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#1e3a5f]">{s.examsCompleted || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold ${Number(s.avgScore) >= 50 ? "text-green-600" : "text-red-500"}`}>
                          {s.avgScore ? Math.round(Number(s.avgScore)) : 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(s.createdAt)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleActive(s)}
                          className={`text-sm font-medium ${s.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-800"}`}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
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

      {/* Create Student Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Student Account">
        <form onSubmit={createStudent} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
            <input value={newStudent.fullName} onChange={e => setNewStudent(p => ({ ...p, fullName: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
            <input type="email" value={newStudent.email} onChange={e => setNewStudent(p => ({ ...p, email: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input value={newStudent.phone} onChange={e => setNewStudent(p => ({ ...p, phone: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input value={newStudent.username} onChange={e => setNewStudent(p => ({ ...p, username: e.target.value }))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
            <input type="password" value={newStudent.password} onChange={e => setNewStudent(p => ({ ...p, password: e.target.value }))} required
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1e3a5f]" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
            <Button type="submit" loading={creating}>Create Student</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
