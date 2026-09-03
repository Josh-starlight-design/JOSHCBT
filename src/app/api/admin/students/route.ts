import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, results } from "@/db/schema";
import { getSession, isAdmin, hashPassword } from "@/lib/auth";
import { eq, ilike, and, desc, sql, or } from "drizzle-orm";
import { z } from "zod";

const createStudentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    let conditions = eq(users.role, "student");
    if (search) {
      const searchCondition = or(
        ilike(users.fullName, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.username, `%${search}%`)
      );
      if (searchCondition) {
        conditions = and(conditions, searchCondition) as typeof conditions;
      }
    }

    const [allStudents, countResult] = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          phone: users.phone,
          username: users.username,
          isActive: users.isActive,
          createdAt: users.createdAt,
          examsCompleted: sql<number>`(select count(*) from results where student_id = ${users.id})`,
          avgScore: sql<number>`(select avg(percentage::float) from results where student_id = ${users.id})`,
          bestScore: sql<number>`(select max(percentage::float) from results where student_id = ${users.id})`,
        })
        .from(users)
        .where(conditions)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(conditions),
    ]);

    return NextResponse.json({
      students: allStudents,
      total: Number(countResult[0].count),
      page,
      limit,
      pages: Math.ceil(Number(countResult[0].count) / limit),
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createStudentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { password, ...userData } = parsed.data;
    const passwordHash = await hashPassword(password);

    const [student] = await db
      .insert(users)
      .values({ ...userData, passwordHash, role: "student" })
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
