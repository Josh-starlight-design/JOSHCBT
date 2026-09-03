// Client-safe auth utilities (no server-only imports)

export function isAdmin(role: string): boolean {
  return ["super_admin", "admin", "examiner"].includes(role);
}

export function isSuperAdmin(role: string): boolean {
  return role === "super_admin";
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    examiner: "Examiner",
    student: "Student",
  };
  return labels[role] || role;
}

export function formatSeconds(seconds: number): string {
  if (seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
