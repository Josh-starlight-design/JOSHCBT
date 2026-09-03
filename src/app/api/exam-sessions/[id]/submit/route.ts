import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  examSessions,
  exams,
  studentAnswers,
  questions,
  results,
  resultDetails,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSession = await getSession();
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = parseInt(id);

  try {
    // Load session
    const [examSession] = await db
      .select()
      .from(examSessions)
      .where(
        and(
          eq(examSessions.id, sessionId),
          eq(examSessions.studentId, authSession.userId)
        )
      )
      .limit(1);

    if (!examSession) {
      return NextResponse.json(
        { error: "Invalid examination session" },
        { status: 404 }
      );
    }

    if (examSession.status === "submitted") {
      return NextResponse.json(
        { error: "Examination has already been submitted" },
        { status: 400 }
      );
    }

    if (examSession.status === "expired") {
      return NextResponse.json(
        { error: "Your examination session has expired" },
        { status: 400 }
      );
    }

    // Load exam details
    const [exam] = await db
      .select()
      .from(exams)
      .where(eq(exams.id, examSession.examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const now = new Date();
    const isAutoSubmit = now > examSession.expiresAt;

    // Load student answers
    const answers = await db
      .select()
      .from(studentAnswers)
      .where(eq(studentAnswers.sessionId, sessionId));

    const questionOrder = (examSession.questionOrder as number[]) || [];
    const optionMapping = (examSession.optionMapping as Record<number, Record<string, string>>) || {};

    // Load correct answers for all questions
    const correctAnswerData = await db
      .select({
        id: questions.id,
        correctAnswer: questions.correctAnswer,
        marks: questions.marks,
      })
      .from(questions)
      .where(
        questionOrder.length > 0
          ? inArray(questions.id, questionOrder)
          : eq(questions.id, -1)
      );

    const correctMap = new Map(
      correctAnswerData.map((q) => [q.id, q])
    );

    // Score calculation
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;
    let scoreObtained = 0;

    const detailsToInsert: {
      resultId: number;
      questionId: number;
      selectedAnswer: string | null;
      correctAnswer: string;
      isCorrect: boolean;
      marksAwarded: number;
      orderIndex: number;
    }[] = [];

    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    for (let i = 0; i < questionOrder.length; i++) {
      const qId = questionOrder[i];
      const qData = correctMap.get(qId);
      if (!qData) continue;

      const studentAnswer = answersMap.get(qId);
      let studentSelected = studentAnswer?.selectedAnswer || null;

      // Reverse map option if options were shuffled
      const mapping = optionMapping[qId];
      if (mapping && studentSelected) {
        // mapping[displayPos] = originalPos
        // We need to find what original answer the student's displayed choice maps to
        studentSelected = mapping[studentSelected] || studentSelected;
      }

      const isCorrect =
        studentSelected !== null && studentSelected === qData.correctAnswer;
      const marks = qData.marks || 1;
      const marksAwarded = isCorrect ? marks : 0;

      if (!studentSelected) {
        unanswered++;
      } else if (isCorrect) {
        correctAnswers++;
        scoreObtained += marksAwarded;
      } else {
        wrongAnswers++;
      }

      detailsToInsert.push({
        resultId: 0, // Will be set after result insert
        questionId: qId,
        selectedAnswer: studentSelected,
        correctAnswer: qData.correctAnswer,
        isCorrect,
        marksAwarded,
        orderIndex: i,
      });
    }

    const totalQuestions = questionOrder.length;
    const totalMarks = exam.totalMarks;
    const percentage =
      totalMarks > 0 ? (scoreObtained / totalMarks) * 100 : 0;
    const isPassed = percentage >= exam.passMark;

    const timeUsedSeconds = Math.floor(
      (now.getTime() - examSession.startedAt.getTime()) / 1000
    );

    // Insert result
    const [result] = await db
      .insert(results)
      .values({
        sessionId,
        examId: examSession.examId,
        studentId: authSession.userId,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        unanswered,
        totalMarks,
        scoreObtained,
        percentage: percentage.toFixed(2),
        isPassed,
        timeUsedSeconds,
        submittedAt: now,
      })
      .returning();

    // Insert result details
    const detailsWithResultId = detailsToInsert.map((d) => ({
      ...d,
      resultId: result.id,
    }));

    if (detailsWithResultId.length > 0) {
      await db.insert(resultDetails).values(detailsWithResultId);
    }

    // Mark session as submitted
    await db
      .update(examSessions)
      .set({
        status: "submitted",
        submittedAt: now,
      })
      .where(eq(examSessions.id, sessionId));

    return NextResponse.json({
      resultId: result.id,
      message: isAutoSubmit
        ? "Time has expired. Your examination has been submitted automatically."
        : "Examination submitted successfully",
      autoSubmitted: isAutoSubmit,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json(
      { error: "Failed to submit examination" },
      { status: 500 }
    );
  }
}
