import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions, subjects } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

const questionSchema = z.object({
  subjectId: z.number().int().positive(),
  questionText: z.string().min(1, "Question text is required"),
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().min(1, "Option C is required"),
  optionD: z.string().min(1, "Option D is required"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  marks: z.number().int().positive().default(1),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const conditions = [eq(questions.isActive, true)];
    if (subjectId) conditions.push(eq(questions.subjectId, parseInt(subjectId)));
    if (difficulty) conditions.push(eq(questions.difficulty, difficulty as "easy" | "medium" | "hard"));
    if (search) conditions.push(ilike(questions.questionText, `%${search}%`));

    const whereClause = and(...conditions);

    const [allQuestions, countResult] = await Promise.all([
      db
        .select({
          id: questions.id,
          questionText: questions.questionText,
          topic: questions.topic,
          difficulty: questions.difficulty,
          optionA: questions.optionA,
          optionB: questions.optionB,
          optionC: questions.optionC,
          optionD: questions.optionD,
          correctAnswer: questions.correctAnswer,
          marks: questions.marks,
          explanation: questions.explanation,
          imageUrl: questions.imageUrl,
          subjectId: questions.subjectId,
          subjectName: subjects.name,
          createdAt: questions.createdAt,
        })
        .from(questions)
        .leftJoin(subjects, eq(questions.subjectId, subjects.id))
        .where(whereClause)
        .orderBy(desc(questions.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(whereClause),
    ]);

    return NextResponse.json({
      questions: allQuestions,
      total: Number(countResult[0].count),
      page,
      limit,
      pages: Math.ceil(Number(countResult[0].count) / limit),
    });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = questionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const [question] = await db
      .insert(questions)
      .values({
        ...parsed.data,
        createdBy: session.userId,
      })
      .returning();

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
