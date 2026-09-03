import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { exams, subjects, examQuestions, questions, results } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";

const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subjectId: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive().default(30),
  totalQuestions: z.number().int().positive().default(40),
  totalMarks: z.number().int().positive().default(40),
  passMark: z.number().int().min(0).max(100).default(50),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(false),
  allowPreviousQuestion: z.boolean().default(true),
  allowReview: z.boolean().default(true),
  showResultImmediately: z.boolean().default(true),
  autoSubmit: z.boolean().default(true),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  questionIds: z.array(z.number()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    let conditions;
    if (!isAdmin(session.role)) {
      conditions = eq(exams.status, "published");
    }

    const [allExams, countResult] = await Promise.all([
      db
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
          questionCount: sql<number>`(select count(*) from exam_questions where exam_id = ${exams.id})`,
        })
        .from(exams)
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .where(conditions)
        .orderBy(desc(exams.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(exams)
        .where(conditions),
    ]);

    return NextResponse.json({
      exams: allExams,
      total: Number(countResult[0].count),
      page,
      limit,
      pages: Math.ceil(Number(countResult[0].count) / limit),
    });
  } catch (error) {
    console.error("Get exams error:", error);
    return NextResponse.json({ error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = examSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { questionIds, startDate, endDate, ...examData } = parsed.data;

    const [exam] = await db
      .insert(exams)
      .values({
        ...examData,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: session.userId,
      })
      .returning();

    // Assign questions if provided
    if (questionIds && questionIds.length > 0) {
      const examQuestionValues = questionIds.map((qId, idx) => ({
        examId: exam.id,
        questionId: qId,
        orderIndex: idx,
        marks: 1,
      }));
      await db.insert(examQuestions).values(examQuestionValues);
    }

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Failed to create exam" }, { status: 500 });
  }
}
