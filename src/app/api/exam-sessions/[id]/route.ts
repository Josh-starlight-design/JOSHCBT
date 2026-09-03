import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  examSessions,
  exams,
  questions,
  studentAnswers,
  subjects,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSession = await getSession();
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = parseInt(id);

  try {
    const [examSession] = await db
      .select()
      .from(examSessions)
      .where(eq(examSessions.id, sessionId))
      .limit(1);

    if (!examSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Ensure student owns this session (or is admin)
    if (
      examSession.studentId !== authSession.userId &&
      !["super_admin", "admin", "examiner"].includes(authSession.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if session has expired
    const now = new Date();
    if (examSession.status === "active" && examSession.expiresAt <= now) {
      await db
        .update(examSessions)
        .set({ status: "expired" })
        .where(eq(examSessions.id, sessionId));
      examSession.status = "expired";
    }

    // Get exam details
    const [exam] = await db
      .select({
        id: exams.id,
        title: exams.title,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalMarks: exams.totalMarks,
        passMark: exams.passMark,
        allowPreviousQuestion: exams.allowPreviousQuestion,
        allowReview: exams.allowReview,
        showResultImmediately: exams.showResultImmediately,
        autoSubmit: exams.autoSubmit,
        randomizeOptions: exams.randomizeOptions,
        subjectName: subjects.name,
      })
      .from(exams)
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(eq(exams.id, examSession.examId))
      .limit(1);

    const questionOrder = (examSession.questionOrder as number[]) || [];
    const optionMapping = (examSession.optionMapping as Record<number, Record<string, string>>) || {};

    // Fetch questions in order — DO NOT SEND CORRECT ANSWERS
    const questionDetails = await db
      .select({
        id: questions.id,
        questionText: questions.questionText,
        topic: questions.topic,
        difficulty: questions.difficulty,
        optionA: questions.optionA,
        optionB: questions.optionB,
        optionC: questions.optionC,
        optionD: questions.optionD,
        marks: questions.marks,
        imageUrl: questions.imageUrl,
      })
      .from(questions)
      .where(
        questionOrder.length > 0
          ? inArray(questions.id, questionOrder)
          : eq(questions.id, -1)
      );

    // Sort by question order
    const questionMap = new Map(questionDetails.map((q) => [q.id, q]));
    const orderedQuestions = questionOrder
      .map((qId, index) => {
        const q = questionMap.get(qId);
        if (!q) return null;

        // Apply option mapping if enabled
        const mapping = optionMapping[qId];
        let optA = q.optionA;
        let optB = q.optionB;
        let optC = q.optionC;
        let optD = q.optionD;

        if (mapping) {
          const optionsMap: Record<string, string> = {
            A: q.optionA,
            B: q.optionB,
            C: q.optionC,
            D: q.optionD,
          };
          optA = optionsMap[mapping.A];
          optB = optionsMap[mapping.B];
          optC = optionsMap[mapping.C];
          optD = optionsMap[mapping.D];
        }

        return {
          ...q,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          questionNumber: index + 1,
        };
      })
      .filter(Boolean);

    // Fetch student answers
    const answers = await db
      .select({
        questionId: studentAnswers.questionId,
        selectedAnswer: studentAnswers.selectedAnswer,
        isFlagged: studentAnswers.isFlagged,
        updatedAt: studentAnswers.updatedAt,
      })
      .from(studentAnswers)
      .where(eq(studentAnswers.sessionId, sessionId));

    // Calculate remaining time (server-authoritative)
    const remainingSeconds = Math.max(
      0,
      Math.floor((examSession.expiresAt.getTime() - now.getTime()) / 1000)
    );

    return NextResponse.json({
      session: {
        id: examSession.id,
        status: examSession.status,
        startedAt: examSession.startedAt,
        expiresAt: examSession.expiresAt,
        currentQuestion: examSession.currentQuestion,
        remainingSeconds,
      },
      exam,
      questions: orderedQuestions,
      answers,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
