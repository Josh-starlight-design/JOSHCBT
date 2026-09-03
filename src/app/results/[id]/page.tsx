"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface Result {
  id: number;
  examTitle: string;
  subjectName: string;
  studentName: string;
  examPassMark: number;
  examAllowReview: boolean;
  examDurationMinutes: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unanswered: number;
  totalMarks: number;
  scoreObtained: number;
  percentage: string;
  isPassed: boolean;
  timeUsedSeconds: number;
  submittedAt: string;
  sessionId: number;
}

interface DetailQuestion {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionB_text?: string;
  optionC: string;
  optionD: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  marksAwarded: number;
  orderIndex: number;
  explanation: string | null;
}

function ResultContent() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const [result, setResult] = useState<Result | null>(null);
  const [details, setDetails] = useState<DetailQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/results/${resultId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load result");
        return r.json();
      })
      .then((data) => {
        setResult(data.result);
        setDetails(data.details || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [resultId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getOptionText = (q: DetailQuestion, letter: string) => {
    if (letter === "A") return q.optionA;
    if (letter === "B") return q.optionB;
    if (letter === "C") return q.optionC;
    if (letter === "D") return q.optionD;
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">{error || "Result not found"}</p>
          <Link href="/dashboard" className="text-[#1e3a5f] mt-2 inline-block hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const percentage = Math.round(parseFloat(result.percentage));
  const timeUsed = result.timeUsedSeconds ? formatTime(result.timeUsedSeconds) : "—";
  const timeTotal = result.examDurationMinutes * 60;
  const timeRemaining = result.timeUsedSeconds
    ? formatTime(Math.max(0, timeTotal - result.timeUsedSeconds))
    : "—";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1e3a5f] text-white py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-[#1e3a5f] font-black text-sm">CBT</span>
            </div>
            <span className="font-black text-xl">CBT <span className="text-[#0ea5e9]">PRO</span></span>
          </div>
          <h1 className="text-2xl font-black">EXAMINATION COMPLETED</h1>
          <p className="text-blue-200 mt-1 text-sm">{result.examTitle}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className={`rounded-2xl p-8 text-center mb-8 text-white ${result.isPassed ? "bg-gradient-to-br from-green-500 to-green-700" : "bg-gradient-to-br from-red-500 to-red-700"}`}>
          <div className="mb-2">
            <span className="text-7xl font-black">{percentage}%</span>
          </div>
          <div className="text-2xl font-bold mb-1">
            {result.scoreObtained} / {result.totalMarks}
          </div>
          <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-black mt-2 ${result.isPassed ? "bg-green-400/30" : "bg-red-400/30"}`}>
            {result.isPassed ? "✅ PASS" : "❌ FAIL"}
          </div>
          <p className="text-white/80 text-sm mt-2">Pass mark: {result.examPassMark}%</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-black text-green-600">{result.correctAnswers}</p>
            <p className="text-xs text-gray-500 mt-1">Correct</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-black text-red-500">{result.wrongAnswers}</p>
            <p className="text-xs text-gray-500 mt-1">Wrong</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-black text-gray-500">{result.unanswered}</p>
            <p className="text-xs text-gray-500 mt-1">Unanswered</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-black text-[#1e3a5f]">{result.totalQuestions}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
          <h2 className="font-bold text-[#1e3a5f] mb-4">Examination Summary</h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div>
              <span className="text-gray-500">Student:</span>
              <span className="font-semibold text-gray-800 ml-2">{result.studentName}</span>
            </div>
            <div>
              <span className="text-gray-500">Subject:</span>
              <span className="font-semibold text-gray-800 ml-2">{result.subjectName || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="font-semibold text-gray-800 ml-2">{formatDate(result.submittedAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Time Used:</span>
              <span className="font-mono font-semibold text-gray-800 ml-2">{timeUsed}</span>
            </div>
            <div>
              <span className="text-gray-500">Time Remaining:</span>
              <span className="font-mono font-semibold text-gray-800 ml-2">{timeRemaining}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className={`font-bold ml-2 ${result.isPassed ? "text-green-600" : "text-red-500"}`}>
                {result.isPassed ? "PASSED" : "FAILED"}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {result.examAllowReview && details.length > 0 && (
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex-1 bg-[#1e3a5f] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#163050] transition-colors"
            >
              {showReview ? "Hide Review" : "Review Answers"}
            </button>
          )}
          <Link
            href="/dashboard/history"
            className="flex-1 bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition-colors"
          >
            View History
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 bg-[#2563eb] text-white py-3 rounded-xl font-bold text-sm text-center hover:bg-[#1d4ed8] transition-colors"
          >
            Take Another Exam
          </Link>
        </div>

        {/* Review section */}
        {showReview && details.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#1e3a5f]">Answer Review</h2>
            {details.map((q, idx) => (
              <div
                key={q.id}
                className={`bg-white rounded-2xl p-6 border-2 ${
                  q.isCorrect ? "border-green-200" : q.selectedAnswer ? "border-red-200" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    q.isCorrect ? "bg-green-100 text-green-700" : q.selectedAnswer ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {q.isCorrect ? "✓" : q.selectedAnswer ? "✗" : "–"}
                  </span>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Question {idx + 1}</p>
                    <p className="text-gray-800 font-medium">{q.questionText}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const text = getOptionText(q, letter);
                    const isCorrect = letter === q.correctAnswer;
                    const isSelected = letter === q.selectedAnswer;

                    return (
                      <div
                        key={letter}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm ${
                          isCorrect
                            ? "bg-green-50 border border-green-200"
                            : isSelected && !isCorrect
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isCorrect ? "bg-green-600 text-white" : isSelected ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                          {letter}
                        </span>
                        <span className={isCorrect ? "text-green-800 font-medium" : isSelected ? "text-red-700" : "text-gray-600"}>
                          {text}
                        </span>
                        {isCorrect && <span className="ml-auto text-green-600 font-bold text-xs">✓ Correct</span>}
                        {isSelected && !isCorrect && <span className="ml-auto text-red-500 font-bold text-xs">✗ Your answer</span>}
                      </div>
                    );
                  })}
                </div>

                {!q.selectedAnswer && (
                  <p className="text-sm text-gray-400 italic">Not answered</p>
                )}

                {q.explanation && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-blue-700 mb-1">Explanation</p>
                    <p className="text-sm text-blue-800">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <AuthProvider>
      <ResultContent />
      <ToastContainer />
    </AuthProvider>
  );
}
