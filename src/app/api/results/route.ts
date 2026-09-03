import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { results, exams, users, subjects } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");

  try {
    let conditions;

    if (!isAdmin(session.role)) {
      // Students can only see their own results
      conditions = eq(results.studentId, session.userId);
    } else {
      // Admin can filter by student or exam
      if (examId) conditions = eq(results.examId, parseInt(examId));
      if (studentId) {
        const studentCondition = eq(results.studentId, parseInt(studentId));
        conditions = conditions ? and(conditions, studentCondition) : studentCondition;
      }
    }

    const [allResults, countResult] = await Promise.all([
      db
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
          studentId: results.studentId,
          studentName: users.fullName,
          subjectName: subjects.name,
          sessionId: results.sessionId,
        })
        .from(results)
        .leftJoin(exams, eq(results.examId, exams.id))
        .leftJoin(users, eq(results.studentId, users.id))
        .leftJoin(subjects, eq(exams.subjectId, subjects.id))
        .where(conditions)
        .orderBy(desc(results.submittedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(results)
        .where(conditions),
    ]);

    return NextResponse.json({
      results: allResults,
      total: Number(countResult[0].count),
      page,
      limit,
      pages: Math.ceil(Number(countResult[0].count) / limit),
    });
  } catch (error) {
    console.error("Get results error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
