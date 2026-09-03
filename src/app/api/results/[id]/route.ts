import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  results,
  resultDetails,
  exams,
  users,
  questions,
  subjects,
} from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const resultId = parseInt(id);

  try {
    const [result] = await db
      .select({
        id: results.id,
        totalQuestions: results.totalQuestions,
        correctAnswers: results.correctAnswers,
        wrongAnswers: results.wrongAnswers,
        unanswered: results.unanswered,
        totalMarks: results.totalMarks,
        scoreObtained: results.scoreObtained,
        percentage: results.percentage,
        isPassed: results.isPassed,
        timeUsedSeconds: results.timeUsedSeconds,
        submittedAt: results.submittedAt,
        examId: results.examId,
        examTitle: exams.title,
        examDurationMinutes: exams.durationMinutes,
        examPassMark: exams.passMark,
        examAllowReview: exams.allowReview,
        studentId: results.studentId,
        studentName: users.fullName,
        subjectName: subjects.name,
        sessionId: results.sessionId,
      })
      .from(results)
      .leftJoin(exams, eq(results.examId, exams.id))
      .leftJoin(users, eq(results.studentId, users.id))
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(eq(results.id, resultId))
      .limit(1);

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    // Ensure student owns this result or is admin
    if (result.studentId !== session.userId && !isAdmin(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load result details with question info (only if review is allowed)
    let details = null;
    if (result.examAllowReview || isAdmin(session.role)) {
      const rawDetails = await db
        .select({
          id: resultDetails.id,
          questionId: resultDetails.questionId,
          questionText: questions.questionText,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          explanation: questions.explanation,
          selectedAnswer: resultDetails.selectedAnswer,
          correctAnswer: resultDetails.correctAnswer,
          isCorrect: resultDetails.isCorrect,
          marksAwarded: resultDetails.marksAwarded,
          orderIndex: resultDetails.orderIndex,
        })
        .from(resultDetails)
        .leftJoin(questions, eq(resultDetails.questionId, questions.id))
        .where(eq(resultDetails.resultId, resultId))
        .orderBy(resultDetails.orderIndex);

      details = rawDetails;
    }

    return NextResponse.json({ result, details });
  } catch (error) {
    console.error("Get result error:", error);
    return NextResponse.json({ error: "Failed to fetch result" }, { status: 500 });
  }
}
