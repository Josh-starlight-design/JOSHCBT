import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, subjects, examQuestions, questions } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    const [exam] = await db
      .select({
        id: exams.id,
        title: exams.title,
        description: exams.description,
        durationMinutes: exams.durationMinutes,
        totalQuestions: exams.totalQuestions,
        totalMarks: exams.totalMarks,
        passMark: exams.passMark,
        status: exams.status,
        randomizeQuestions: exams.randomizeQuestions,
        randomizeOptions: exams.randomizeOptions,
        allowPreviousQuestion: exams.allowPreviousQuestion,
        allowReview: exams.allowReview,
        showResultImmediately: exams.showResultImmediately,
        autoSubmit: exams.autoSubmit,
        startDate: exams.startDate,
        endDate: exams.endDate,
        subjectId: exams.subjectId,
        subjectName: subjects.name,
        createdAt: exams.createdAt,
      })
      .from(exams)
      .leftJoin(subjects, eq(exams.subjectId, subjects.id))
      .where(eq(exams.id, examId))
      .limit(1);

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error("Get exam error:", error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    const body = await request.json();
    const { questionIds, startDate, endDate, ...updateData } = body;

    const [updated] = await db
      .update(exams)
      .set({
        ...updateData,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(exams.id, examId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Update question assignments if provided
    if (questionIds !== undefined) {
      await db.delete(examQuestions).where(eq(examQuestions.examId, examId));
      if (questionIds.length > 0) {
        const examQuestionValues = questionIds.map((qId: number, idx: number) => ({
          examId,
          questionId: qId,
          orderIndex: idx,
          marks: 1,
        }));
        await db.insert(examQuestions).values(examQuestionValues);
      }
    }

    return NextResponse.json({ exam: updated });
  } catch (error) {
    console.error("Update exam error:", error);
    return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const examId = parseInt(id);

  try {
    await db.update(exams).set({ status: "archived" }).where(eq(exams.id, examId));
    return NextResponse.json({ message: "Exam archived" });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json({ error: "Failed to delete exam" }, { status: 500 });
  }
}
