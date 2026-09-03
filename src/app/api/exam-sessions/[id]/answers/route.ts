import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examSessions, studentAnswers, exams } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.number().int().positive(),
  selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
  currentQuestion: z.number().int().optional(),
});

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
    // Validate session ownership and status
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

    if (examSession.status !== "active") {
      return NextResponse.json(
        {
          error:
            examSession.status === "submitted"
              ? "Examination has already been submitted"
              : "Your examination session has expired",
        },
        { status: 400 }
      );
    }

    // SERVER-SIDE TIME CHECK — Backend is source of truth
    const now = new Date();
    if (now > examSession.expiresAt) {
      await db
        .update(examSessions)
        .set({ status: "expired" })
        .where(eq(examSessions.id, sessionId));
      return NextResponse.json(
        { error: "Your examination session has expired" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { questionId, selectedAnswer, currentQuestion } = parsed.data;

    // Verify question belongs to session
    const questionOrder = (examSession.questionOrder as number[]) || [];
    if (!questionOrder.includes(questionId)) {
      return NextResponse.json(
        { error: "Question does not belong to this exam session" },
        { status: 400 }
      );
    }

    // Upsert answer
    const existing = await db
      .select({ id: studentAnswers.id })
      .from(studentAnswers)
      .where(
        and(
          eq(studentAnswers.sessionId, sessionId),
          eq(studentAnswers.questionId, questionId)
        )
      )
      .limit(1);

    const now2 = new Date();

    if (existing.length > 0) {
      await db
        .update(studentAnswers)
        .set({
          selectedAnswer,
          updatedAt: now2,
          answeredAt: now2,
        })
        .where(
          and(
            eq(studentAnswers.sessionId, sessionId),
            eq(studentAnswers.questionId, questionId)
          )
        );
    } else {
      await db.insert(studentAnswers).values({
        sessionId,
        questionId,
        selectedAnswer,
        isFlagged: false,
        answeredAt: now2,
        updatedAt: now2,
      });
    }

    // Update current question position if provided
    if (currentQuestion !== undefined) {
      await db
        .update(examSessions)
        .set({ currentQuestion })
        .where(eq(examSessions.id, sessionId));
    }

    return NextResponse.json({ success: true, message: "Answer saved" });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json(
      { error: "Unable to save your answer. Retrying..." },
      { status: 500 }
    );
  }
}
