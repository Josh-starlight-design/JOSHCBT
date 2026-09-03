"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import { ToastContainer } from "@/components/ui/Toast";

interface Exam {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  passMark: number;
  subjectName: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowPreviousQuestion: boolean;
  allowReview: boolean;
  showResultImmediately: boolean;
  autoSubmit: boolean;
}

function InstructionsContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/exams/${examId}`)
      .then((r) => r.json())
      .then((d) => setExam(d.exam))
      .catch(() => setError("Failed to load exam"))
      .finally(() => setLoading(false));
  }, [examId]);

  const handleStart = async () => {
    if (!agreed) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start exam");
      router.push(`/exam/${examId}/session/${data.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start exam");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error || "Exam not found"}</p>
          <Link href="/dashboard" className="text-[#1e3a5f] mt-2 inline-block">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const rules = [
    `This exam contains ${exam.totalQuestions} questions worth ${exam.totalMarks} marks total.`,
    `You have ${exam.durationMinutes} minutes to complete this examination. The timer starts immediately when you click "Start Exam".`,
    `The pass mark for this examination is ${exam.passMark}%.`,
    exam.randomizeQuestions ? "Questions are randomized — each student may see questions in a different order." : "Questions appear in a fixed order.",
    exam.allowPreviousQuestion ? "You can navigate freely between questions using the Previous/Next buttons or the question palette." : "You cannot return to previous questions. Answer carefully before proceeding.",
    "Click on an answer option to select it. Your answer is saved automatically — no separate Save button is needed.",
    "You can flag questions for review using the Flag button. Flagged questions appear in yellow/orange in the navigation palette.",
    exam.allowReview ? "You may review your answers before submitting." : "Answer review is not available for this exam.",
    exam.autoSubmit ? "The exam will be automatically submitted when time expires. Any unanswered questions will be marked as unanswered." : "You must manually submit the exam.",
    "Do NOT close the browser tab during the exam. If you accidentally refresh, your session will be restored.",
    "Do NOT share your exam answers with other students. Academic integrity is required.",
    "Ensure you have a stable internet connection before starting.",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-[#1e3a5f] text-white rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {exam.subjectName && (
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block">
                  {exam.subjectName}
                </span>
              )}
              <h1 className="text-2xl font-black">{exam.title}</h1>
              {exam.description && (
                <p className="text-blue-200 mt-2 text-sm">{exam.description}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-3xl font-black">{exam.totalQuestions}</p>
              <p className="text-blue-200 text-xs mt-1">Questions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black">{exam.durationMinutes}</p>
              <p className="text-blue-200 text-xs mt-1">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black">{exam.totalMarks}</p>
              <p className="text-blue-200 text-xs mt-1">Total Marks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black">{exam.passMark}%</p>
              <p className="text-blue-200 text-xs mt-1">Pass Mark</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <h2 className="text-lg font-black text-[#1e3a5f] mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> Examination Instructions
          </h2>
          <p className="text-sm text-gray-500 mb-4">Please read all instructions carefully before starting the exam.</p>
          <ol className="space-y-3">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-6 h-6 bg-[#1e3a5f]/10 text-[#1e3a5f] rounded-full flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Exam settings summary */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">Exam Configuration</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Question Order", value: exam.randomizeQuestions ? "Randomized" : "Fixed" },
              { label: "Answer Options", value: exam.randomizeOptions ? "Randomized" : "Fixed" },
              { label: "Back Navigation", value: exam.allowPreviousQuestion ? "Allowed" : "Not Allowed" },
              { label: "Review Answers", value: exam.allowReview ? "Allowed" : "Not Allowed" },
              { label: "Results", value: exam.showResultImmediately ? "Shown Immediately" : "After Review" },
              { label: "Auto Submit", value: exam.autoSubmit ? "Enabled" : "Manual Only" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs text-gray-500">{s.label}</span>
                <span className="text-xs font-bold text-[#1e3a5f]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#1e3a5f] rounded"
            />
            <span className="text-sm text-gray-700">
              I have read and understood all the examination instructions. I agree to maintain academic integrity
              during this examination. I understand that my exam will be automatically submitted when the time expires.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl text-center font-semibold hover:bg-gray-50 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <Button
            onClick={handleStart}
            disabled={!agreed}
            loading={starting}
            className="flex-1"
            size="lg"
          >
            {starting ? "Starting Exam..." : "Start Exam →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InstructionsPage() {
  return (
    <AuthProvider>
      <InstructionsContent />
      <ToastContainer />
    </AuthProvider>
  );
}
