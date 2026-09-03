import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, exams, questions, results, examSessions } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq, and, gte, desc, sql } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalExams,
      totalQuestions,
      examsToday,
      avgScoreResult,
      passRateResult,
      recentResults,
      examPerformance,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, "student")),
      db.select({ count: sql<number>`count(*)` }).from(exams),
      db
        .select({ count: sql<number>`count(*)` })
        .from(questions)
        .where(eq(questions.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(examSessions)
        .where(gte(examSessions.startedAt, today)),
      db
        .select({ avg: sql<number>`avg(score_obtained::float / NULLIF(total_marks, 0) * 100)` })
        .from(results),
      db
        .select({
          total: sql<number>`count(*)`,
          passed: sql<number>`count(*) filter (where is_passed = true)`,
        })
        .from(results),
      db
        .select({
          id: results.id,
          studentName: users.fullName,
          examTitle: exams.title,
          percentage: results.percentage,
          isPassed: results.isPassed,
          submittedAt: results.submittedAt,
        })
        .from(results)
        .leftJoin(users, eq(results.studentId, users.id))
        .leftJoin(exams, eq(results.examId, exams.id))
        .orderBy(desc(results.submittedAt))
        .limit(10),
      db
        .select({
          examTitle: exams.title,
          avgScore: sql<number>`avg(r.score_obtained::float / NULLIF(r.total_marks, 0) * 100)`,
          count: sql<number>`count(r.id)`,
        })
        .from(exams)
        .leftJoin(results, eq(results.examId, exams.id))
        .groupBy(exams.id, exams.title)
        .orderBy(desc(sql`count(r.id)`))
        .limit(5),
    ]);

    const totalRes = Number(passRateResult[0]?.total || 0);
    const passedRes = Number(passRateResult[0]?.passed || 0);
    const passRate = totalRes > 0 ? ((passedRes / totalRes) * 100).toFixed(1) : "0";

    return NextResponse.json({
      stats: {
        totalStudents: Number(totalStudents[0].count),
        totalExams: Number(totalExams[0].count),
        totalQuestions: Number(totalQuestions[0].count),
        examsToday: Number(examsToday[0].count),
        avgScore: Number(avgScoreResult[0]?.avg || 0).toFixed(1),
        passRate,
      },
      recentResults,
      examPerformance,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
