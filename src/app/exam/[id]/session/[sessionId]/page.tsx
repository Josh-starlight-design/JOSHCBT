"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import { formatSeconds } from "@/lib/auth-client";
import { ToastContainer, showToast } from "@/components/ui/Toast";

interface Question {
  id: number;
  questionText: string;
  questionNumber: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  marks: number;
  imageUrl?: string;
}

interface Answer {
  questionId: number;
  selectedAnswer: string | null;
  isFlagged: boolean;
}

type SaveStatus = "saved" | "saving" | "offline" | "idle";

const WARNING_THRESHOLDS = [600, 300, 60, 30]; // 10min, 5min, 1min, 30sec in seconds

function ExamInterface() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const sessionId = params.sessionId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionData, setSessionData] = useState<{
    id: number;
    status: string;
    expiresAt: string;
  } | null>(null);
  const [examData, setExamData] = useState<{
    title: string;
    allowPreviousQuestion: boolean;
    allowReview: boolean;
    autoSubmit: boolean;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeExpiredModal, setShowTimeExpiredModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warningsShown, setWarningsShown] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingAnswers = useRef<Map<number, string | null>>(new Map());
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnline = useRef(true);

  // Load session data
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/exam-sessions/${sessionId}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load exam session");
        return;
      }
      const data = await res.json();

      if (data.session.status === "submitted") {
        router.push(`/dashboard`);
        return;
      }

      if (data.session.status === "expired") {
        setShowTimeExpiredModal(true);
        return;
      }

      setSessionData(data.session);
      setExamData(data.exam);
      setQuestions(data.questions);
      setRemainingSeconds(data.session.remainingSeconds);

      // Restore answers
      const answerMap = new Map<number, Answer>();
      for (const ans of data.answers) {
        answerMap.set(ans.questionId, {
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isFlagged: ans.isFlagged,
        });
      }
      setAnswers(answerMap);

      // Restore current question
      const savedIdx = (data.session.currentQuestion || 1) - 1;
      setCurrentIdx(Math.min(savedIdx, data.questions.length - 1));
    } catch {
      setError("Failed to connect to the exam server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Countdown timer (frontend display only; server is authoritative)
  useEffect(() => {
    if (remainingSeconds <= 0 || !sessionData) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;

        // Show warnings
        for (const threshold of WARNING_THRESHOLDS) {
          if (next === threshold && !warningsShown.has(threshold)) {
            setWarningsShown((w) => new Set([...w, threshold]));
            const mins = Math.floor(threshold / 60);
            const secs = threshold % 60;
            const label = mins > 0 ? `${mins} minute${mins > 1 ? "s" : ""}` : `${secs} seconds`;
            showToast(`⚠️ ${label} remaining!`, threshold <= 60 ? "error" : "warning");
          }
        }

        if (next <= 0) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionData]); // eslint-disable-line

  // Also sync remaining time with server every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/exam-sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.session.status !== "active") {
            clearInterval(interval);
            if (data.session.status === "expired") setShowTimeExpiredModal(true);
            return;
          }
          // Correct drift — server is the source of truth
          setRemainingSeconds(data.session.remainingSeconds);
          isOnline.current = true;
        }
      } catch {
        isOnline.current = false;
        setSaveStatus("offline");
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const saveAnswer = useCallback(
    async (questionId: number, selectedAnswer: string | null) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/exam-sessions/${sessionId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedAnswer,
            currentQuestion: currentIdx + 1,
          }),
        });
        if (res.ok) {
          setSaveStatus("saved");
          pendingAnswers.current.delete(questionId);
          isOnline.current = true;
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          const data = await res.json();
          if (data.error?.includes("expired")) {
            setShowTimeExpiredModal(true);
          }
          throw new Error(data.error);
        }
      } catch {
        setSaveStatus("offline");
        pendingAnswers.current.set(questionId, selectedAnswer);
        // Retry sync
        if (syncRef.current) clearTimeout(syncRef.current);
        syncRef.current = setTimeout(() => syncPendingAnswers(), 5000);
      }
    },
    [sessionId, currentIdx] // eslint-disable-line
  );

  const syncPendingAnswers = async () => {
    for (const [qId, ans] of pendingAnswers.current) {
      await saveAnswer(qId, ans);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const question = questions[currentIdx];
    if (!question) return;

    const currentAnswer = answers.get(question.id);
    const newAnswer = currentAnswer?.selectedAnswer === answer ? null : answer;

    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(question.id, {
        questionId: question.id,
        selectedAnswer: newAnswer,
        isFlagged: currentAnswer?.isFlagged || false,
      });
      return next;
    });

    saveAnswer(question.id, newAnswer);
  };

  const handleFlag = async () => {
    const question = questions[currentIdx];
    if (!question) return;

    const currentAnswer = answers.get(question.id);
    const newFlagged = !currentAnswer?.isFlagged;

    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(question.id, {
        questionId: question.id,
        selectedAnswer: currentAnswer?.selectedAnswer || null,
        isFlagged: newFlagged,
      });
      return next;
    });

    await fetch(`/api/exam-sessions/${sessionId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, isFlagged: newFlagged }),
    });
  };

  const handleClearAnswer = () => {
    const question = questions[currentIdx];
    if (!question) return;
    handleAnswerSelect(answers.get(question.id)?.selectedAnswer || "");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Sync any pending answers first
      await syncPendingAnswers();

      const res = await fetch(`/api/exam-sessions/${sessionId}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/results/${data.resultId}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Submission failed", "error");
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = async () => {
    setShowTimeExpiredModal(true);
    try {
      await syncPendingAnswers();
      const res = await fetch(`/api/exam-sessions/${sessionId}/submit`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => router.push(`/results/${data.resultId}`), 3000);
      }
    } catch {
      // Will retry
    }
  };

  const navigateTo = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    if (!examData?.allowPreviousQuestion && idx < currentIdx) return;
    setCurrentIdx(idx);
  };

  // Computed stats
  const answeredCount = Array.from(answers.values()).filter(
    (a) => a.selectedAnswer !== null
  ).length;
  const flaggedCount = Array.from(answers.values()).filter((a) => a.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;

  const currentQuestion = questions[currentIdx];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;

  const getTimerColor = () => {
    if (remainingSeconds <= 60) return "bg-red-600 text-white timer-warning";
    if (remainingSeconds <= 300) return "bg-amber-500 text-white";
    if (remainingSeconds <= 600) return "bg-yellow-500 text-white";
    return "bg-[#1e3a5f] text-white";
  };

  const getQuestionBtnClass = (idx: number) => {
    const q = questions[idx];
    if (!q) return "q-btn-unanswered";
    if (idx === currentIdx) return "q-btn-current";
    const ans = answers.get(q.id);
    if (ans?.isFlagged) return "q-btn-flagged";
    if (ans?.selectedAnswer) return "q-btn-answered";
    return "q-btn-unanswered";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading examination...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait while we prepare your questions</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Exam</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 exam-interface flex flex-col">
      {/* ── HEADER ── */}
      <header className="bg-[#1e3a5f] text-white sticky top-0 z-30 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo + Exam name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-[#1e3a5f] font-black text-xs">CBT</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{examData?.title}</p>
              <p className="text-blue-300 text-xs">
                Question {currentIdx + 1} of {questions.length}
              </p>
            </div>
          </div>

          {/* Timer + save status */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Save status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              {saveStatus === "saving" && (
                <><div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div><span className="text-blue-200">Saving...</span></>
              )}
              {saveStatus === "saved" && (
                <><div className="w-2 h-2 bg-green-400 rounded-full"></div><span className="text-blue-200">Saved</span></>
              )}
              {saveStatus === "offline" && (
                <><div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div><span className="text-red-300">Offline — will sync</span></>
              )}
            </div>

            {/* Timer */}
            <div className={`px-4 py-2 rounded-xl font-mono font-bold text-lg flex items-center gap-2 ${getTimerColor()}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatSeconds(remainingSeconds)}
            </div>

            {/* Submit button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors hidden sm:block"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-blue-900">
          <div
            className="h-full bg-[#0ea5e9] transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── MAIN QUESTION AREA ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            {currentQuestion ? (
              <>
                {/* Question header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-[#1e3a5f] text-white text-sm font-bold px-3 py-1 rounded-full">
                      Q {currentIdx + 1}
                    </span>
                    {currentQuestion.marks > 1 && (
                      <span className="text-sm text-gray-500">{currentQuestion.marks} marks</span>
                    )}
                  </div>
                  <button
                    onClick={handleFlag}
                    className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                      currentAnswer?.isFlagged
                        ? "bg-amber-100 text-amber-700 border border-amber-300"
                        : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                    }`}
                  >
                    🚩 {currentAnswer?.isFlagged ? "Flagged" : "Flag"}
                  </button>
                </div>

                {/* Question text */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                  {currentQuestion.imageUrl && (
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question illustration"
                      className="w-full max-h-64 object-contain rounded-xl mb-4"
                    />
                  )}
                  <p className="text-gray-800 text-lg font-medium leading-relaxed">
                    {currentQuestion.questionText}
                  </p>
                </div>

                {/* Answer options */}
                <div className="space-y-3">
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const optionText =
                      letter === "A" ? currentQuestion.optionA :
                      letter === "B" ? currentQuestion.optionB :
                      letter === "C" ? currentQuestion.optionC :
                      currentQuestion.optionD;

                    const isSelected = currentAnswer?.selectedAnswer === letter;

                    return (
                      <button
                        key={letter}
                        onClick={() => handleAnswerSelect(letter)}
                        className={`w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 text-left answer-option transition-all ${
                          isSelected
                            ? "border-[#1e3a5f] bg-[#1e3a5f]/5 shadow-md"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        aria-label={`Option ${letter}: ${optionText}`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-[#1e3a5f] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {letter}
                        </div>
                        <span className={`text-base flex-1 ${isSelected ? "text-[#1e3a5f] font-semibold" : "text-gray-700"}`}>
                          {optionText}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-[#1e3a5f] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-6 gap-3">
                  <button
                    onClick={() => navigateTo(currentIdx - 1)}
                    disabled={currentIdx === 0 || !examData?.allowPreviousQuestion}
                    className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {currentAnswer?.selectedAnswer && (
                      <button
                        onClick={handleClearAnswer}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => setShowSubmitModal(true)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors sm:hidden"
                    >
                      Submit
                    </button>
                  </div>

                  <button
                    onClick={() => navigateTo(currentIdx + 1)}
                    disabled={currentIdx === questions.length - 1}
                    className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#163050] text-white px-5 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500">No questions available</p>
              </div>
            )}
          </div>
        </main>

        {/* ── QUESTION PALETTE ── */}
        <aside className="w-60 bg-white border-l border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-4 sticky top-0 bg-white border-b border-gray-100 z-10">
            <h3 className="font-bold text-[#1e3a5f] text-sm">Question Navigation</h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-[#1e3a5f] rounded"></div> Current
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div> Done
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-200 border border-amber-400 rounded"></div> Flagged
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div> Empty
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => navigateTo(idx)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${getQuestionBtnClass(idx)}`}
                  aria-label={`Go to question ${idx + 1}`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Answered</span>
                <span className="font-bold text-green-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unanswered</span>
                <span className="font-bold text-gray-500">{unansweredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Flagged</span>
                <span className="font-bold text-amber-600">{flaggedCount}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-500">Total</span>
                <span className="font-bold">{questions.length}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              Submit Exam
            </button>
          </div>
        </aside>
      </div>

      {/* ── SUBMIT CONFIRMATION MODAL ── */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => !submitting && setShowSubmitModal(false)}
        title="Submit Examination"
        closeable={!submitting}
        size="sm"
      >
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600 mb-6">Are you sure you want to submit your examination?</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Answered:</span>
              <span className="font-bold text-green-600">{answeredCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Unanswered:</span>
              <span className={`font-bold ${unansweredCount > 0 ? "text-red-500" : "text-gray-500"}`}>
                {unansweredCount} / {questions.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Flagged:</span>
              <span className="font-bold text-amber-600">{flaggedCount}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="text-gray-500">Time Remaining:</span>
              <span className="font-bold font-mono">{formatSeconds(remainingSeconds)}</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 text-sm mb-5">
              ⚠️ You have {unansweredCount} unanswered question{unansweredCount !== 1 ? "s" : ""}. Unanswered questions will receive no marks.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Continue Exam
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...</>
              ) : (
                "Submit Exam"
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── TIME EXPIRED MODAL ── */}
      <Modal
        isOpen={showTimeExpiredModal}
        onClose={() => {}}
        closeable={false}
        size="sm"
      >
        <div className="text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-xl font-black text-red-600 mb-2">Time Expired!</h2>
          <p className="text-gray-600 mb-4">
            Time has expired. Your examination has been submitted automatically.
          </p>
          <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Redirecting to your results...</p>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default function ExamSessionPage() {
  return (
    <AuthProvider>
      <ExamInterface />
    </AuthProvider>
  );
}
