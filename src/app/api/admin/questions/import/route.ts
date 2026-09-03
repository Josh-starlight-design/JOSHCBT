import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questions, subjects } from "@/db/schema";
import { getSession, isAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    // Cache subjects
    const allSubjects = await db.select().from(subjects);
    const subjectMap = new Map(
      allSubjects.map((s) => [s.name.toLowerCase(), s.id])
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const subjectName = (row.subject || "").toLowerCase().trim();
        let subjectId = subjectMap.get(subjectName);

        if (!subjectId) {
          // Create subject if not found
          if (subjectName) {
            const [newSubject] = await db
              .insert(subjects)
              .values({ name: row.subject.trim() })
              .returning();
            subjectId = newSubject.id;
            subjectMap.set(subjectName, subjectId);
          } else {
            errors.push({ row: i + 1, error: "Subject is required" });
            failed++;
            continue;
          }
        }

        const correctAnswer = (row.correct_answer || "").toUpperCase().trim();
        if (!["A", "B", "C", "D"].includes(correctAnswer)) {
          errors.push({
            row: i + 1,
            error: "Correct answer must be A, B, C, or D",
          });
          failed++;
          continue;
        }

        if (!row.question || !row.option_a || !row.option_b || !row.option_c || !row.option_d) {
          errors.push({
            row: i + 1,
            error: "Missing required fields",
          });
          failed++;
          continue;
        }

        const difficulty = (row.difficulty || "medium").toLowerCase();
        const validDifficulty = ["easy", "medium", "hard"].includes(difficulty)
          ? (difficulty as "easy" | "medium" | "hard")
          : "medium";

        await db.insert(questions).values({
          subjectId,
          questionText: row.question.trim(),
          topic: row.topic?.trim() || null,
          difficulty: validDifficulty,
          optionA: row.option_a.trim(),
          optionB: row.option_b.trim(),
          optionC: row.option_c.trim(),
          optionD: row.option_d.trim(),
          correctAnswer: correctAnswer as "A" | "B" | "C" | "D",
          marks: parseInt(row.marks) || 1,
          explanation: row.explanation?.trim() || null,
          createdBy: session.userId,
        });

        successful++;
      } catch (err) {
        errors.push({ row: i + 1, error: "Failed to insert question" });
        failed++;
      }
    }

    return NextResponse.json({
      total: rows.length,
      successful,
      failed,
      errors,
    });
  } catch (error) {
    console.error("Import questions error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
