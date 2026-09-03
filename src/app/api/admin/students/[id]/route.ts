import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession, isAdmin, hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const studentId = parseInt(id);

  try {
    const body = await request.json();
    const { password, ...updateData } = body;

    const updateValues: Record<string, unknown> = {
      ...updateData,
      updatedAt: new Date(),
    };

    if (password) {
      updateValues.passwordHash = await hashPassword(password);
    }

    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, studentId))
      .returning({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        isActive: users.isActive,
      });

    if (!updated) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student: updated });
  } catch (error) {
    console.error("Update student error:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
