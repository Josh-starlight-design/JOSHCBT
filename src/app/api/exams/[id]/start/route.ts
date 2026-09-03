import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  exams,
  examQuestions,
  examSessions,
  questions,
  studentAnswers,
} from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { shuffleArray } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    // Load exam
    const [exam] = await db
      .select()
      .from(exams)
      .where(and(eq(exams.id, examId), eq(exams.status, "published")))
      .limit(1);

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found or not available" },
        { status: 404 }
      );
    }

    // Check for existing active session
    const existingSession = await db
      .select()
      .from(examSessions)
      .where(
        and(
          eq(examSessions.examId, examId),
          eq(examSessions.studentId, session.userId),
          eq(examSessions.status, "active")
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      const activeSession = existingSession[0];
      const now = new Date();

      if (activeSession.expiresAt > now) {
        // Return existing session
        return NextResponse.json({
          sessionId: activeSession.id,
          existingSession: true,
          message: "Resuming existing exam session",
        });
      } else {
        // Session expired - mark as expired
        await db
          .update(examSessions)
          .set({ status: "expired" })
          .where(eq(examSessions.id, activeSession.id));
      }
    }

    // Load exam questions
    const examQuestionsList = await db
      .select({
        questionId: examQuestions.questionId,
        orderIndex: examQuestions.orderIndex,
      })
      .from(examQuestions)
      .where(eq(examQuestions.examId, examId))
      .orderBy(examQuestions.orderIndex);

    if (examQuestionsList.length === 0) {
      return NextResponse.json(
        { error: "This exam has no questions assigned" },
        { status: 400 }
      );
    }

    // Determine question order
    let questionIds = examQuestionsList.map((eq) => eq.questionId);
    if (exam.randomizeQuestions) {
      questionIds = shuffleArray(questionIds);
    }

    // Limit to totalQuestions
    questionIds = questionIds.slice(0, exam.totalQuestions);

    // Build option mapping if randomize options is enabled
    let optionMapping: Record<number, Record<string, string>> = {};
    if (exam.randomizeOptions) {
      const qDetails = await db
        .select({
          id: questions.id,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          correctAnswer: questions.correctAnswer,
        })
        .from(questions)
        .where(
          questionIds.length > 0
            ? // Filter only needed questions
              eq(questions.id, questionIds[0]) // Will be replaced below
            : eq(questions.id, -1)
        );

      // For each question, create a shuffle mapping
      for (const qId of questionIds) {
        const options = ["A", "B", "C", "D"];
        const shuffled = shuffleArray([...options]);
        // mapping[displayPosition] = originalPosition
        optionMapping[qId] = {
          A: shuffled[0],
          B: shuffled[1],
          C: shuffled[2],
          D: shuffled[3],
        };
      }
    }

    // Calculate expiry time (server-side - this is the source of truth)
    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + exam.durationMinutes * 60 * 1000
    );

    const req = request;
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Create session
    const [newSession] = await db
      .insert(examSessions)
      .values({
        examId,
        studentId: session.userId,
        status: "active",
        startedAt,
        expiresAt,
        currentQuestion: 1,
        questionOrder: questionIds,
        optionMapping:
          Object.keys(optionMapping).length > 0 ? optionMapping : null,
        ipAddress: ip.split(",")[0].trim(),
        userAgent,
      })
      .returning();

    // Initialize answer placeholders
    const answerValues = questionIds.map((qId) => ({
      sessionId: newSession.id,
      questionId: qId,
      selectedAnswer: null,
      isFlagged: false,
      answeredAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(studentAnswers).values(answerValues);

    return NextResponse.json({
      sessionId: newSession.id,
      existingSession: false,
      message: "Exam session created",
    });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json(
      { error: "Failed to start exam" },
      { status: 500 }
    );
  }
}
