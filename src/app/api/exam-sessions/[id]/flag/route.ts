import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { examSessions, studentAnswers } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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
    const [examSession] = await db
      .select()
      .from(examSessions)
      .where(
        and(
          eq(examSessions.id, sessionId),
          eq(examSessions.studentId, authSession.userId),
          eq(examSessions.status, "active")
        )
      )
      .limit(1);

    if (!examSession) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (now > examSession.expiresAt) {
      return NextResponse.json(
        { error: "Examination session has expired" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { questionId, isFlagged } = body;

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

    if (existing.length > 0) {
      await db
        .update(studentAnswers)
        .set({ isFlagged: !!isFlagged })
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
        selectedAnswer: null,
        isFlagged: !!isFlagged,
        answeredAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Flag question error:", error);
    return NextResponse.json({ error: "Failed to flag question" }, { status: 500 });
  }
}
