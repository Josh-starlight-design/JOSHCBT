import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  varchar,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "examiner",
  "student",
]);

export const difficultyEnum = pgEnum("difficulty_level", [
  "easy",
  "medium",
  "hard",
]);

export const examStatusEnum = pgEnum("exam_status", [
  "draft",
  "published",
  "archived",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "submitted",
  "expired",
  "abandoned",
]);

export const correctAnswerEnum = pgEnum("correct_answer", ["A", "B", "C", "D"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    username: varchar("username", { length: 100 }),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("student"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_username_idx").on(t.username),
    index("users_role_idx").on(t.role),
  ]
);

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subjects_name_idx").on(t.name)]
);

// ─── Questions ────────────────────────────────────────────────────────────────

export const questions = pgTable(
  "questions",
  {
    id: serial("id").primaryKey(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    questionText: text("question_text").notNull(),
    topic: varchar("topic", { length: 100 }),
    difficulty: difficultyEnum("difficulty").notNull().default("medium"),
    optionA: text("option_a").notNull(),
    optionB: text("option_b").notNull(),
    optionC: text("option_c").notNull(),
    optionD: text("option_d").notNull(),
    correctAnswer: correctAnswerEnum("correct_answer").notNull(),
    marks: integer("marks").notNull().default(1),
    explanation: text("explanation"),
    imageUrl: text("image_url"),
    createdBy: integer("created_by").references(() => users.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("questions_subject_idx").on(t.subjectId),
    index("questions_difficulty_idx").on(t.difficulty),
    index("questions_topic_idx").on(t.topic),
  ]
);

// ─── Exams ────────────────────────────────────────────────────────────────────

export const exams = pgTable(
  "exams",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    subjectId: integer("subject_id").references(() => subjects.id),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    totalQuestions: integer("total_questions").notNull().default(40),
    totalMarks: integer("total_marks").notNull().default(40),
    passMark: integer("pass_mark").notNull().default(50),
    status: examStatusEnum("status").notNull().default("draft"),
    randomizeQuestions: boolean("randomize_questions").notNull().default(true),
    randomizeOptions: boolean("randomize_options").notNull().default(false),
    allowPreviousQuestion: boolean("allow_previous_question")
      .notNull()
      .default(true),
    allowReview: boolean("allow_review").notNull().default(true),
    showResultImmediately: boolean("show_result_immediately")
      .notNull()
      .default(true),
    autoSubmit: boolean("auto_submit").notNull().default(true),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    createdBy: integer("created_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("exams_subject_idx").on(t.subjectId),
    index("exams_status_idx").on(t.status),
  ]
);

// ─── Exam Questions (junction) ────────────────────────────────────────────────

export const examQuestions = pgTable(
  "exam_questions",
  {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    orderIndex: integer("order_index").notNull().default(0),
    marks: integer("marks").notNull().default(1),
  },
  (t) => [
    index("exam_questions_exam_idx").on(t.examId),
    index("exam_questions_question_idx").on(t.questionId),
  ]
);

// ─── Exam Sessions ────────────────────────────────────────────────────────────

export const examSessions = pgTable(
  "exam_sessions",
  {
    id: serial("id").primaryKey(),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id),
    status: sessionStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    submittedAt: timestamp("submitted_at"),
    currentQuestion: integer("current_question").notNull().default(1),
    // Shuffled question ordering stored as JSON array of question IDs
    questionOrder: jsonb("question_order"),
    // Option shuffling map: {questionId: {A: 'C', B: 'A', ...}} (mapped to original)
    optionMapping: jsonb("option_mapping"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("exam_sessions_exam_idx").on(t.examId),
    index("exam_sessions_student_idx").on(t.studentId),
    index("exam_sessions_status_idx").on(t.status),
  ]
);

// ─── Student Answers ──────────────────────────────────────────────────────────

export const studentAnswers = pgTable(
  "student_answers",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => examSessions.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    selectedAnswer: varchar("selected_answer", { length: 1 }),
    isFlagged: boolean("is_flagged").notNull().default(false),
    answeredAt: timestamp("answered_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("student_answers_session_idx").on(t.sessionId),
    index("student_answers_question_idx").on(t.questionId),
  ]
);

// ─── Results ──────────────────────────────────────────────────────────────────

export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => examSessions.id),
    examId: integer("exam_id")
      .notNull()
      .references(() => exams.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id),
    totalQuestions: integer("total_questions").notNull(),
    correctAnswers: integer("correct_answers").notNull().default(0),
    wrongAnswers: integer("wrong_answers").notNull().default(0),
    unanswered: integer("unanswered").notNull().default(0),
    totalMarks: integer("total_marks").notNull(),
    scoreObtained: integer("score_obtained").notNull().default(0),
    percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
    isPassed: boolean("is_passed").notNull().default(false),
    timeUsedSeconds: integer("time_used_seconds"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (t) => [
    index("results_exam_idx").on(t.examId),
    index("results_student_idx").on(t.studentId),
    index("results_session_idx").on(t.sessionId),
  ]
);

// ─── Result Details ───────────────────────────────────────────────────────────

export const resultDetails = pgTable(
  "result_details",
  {
    id: serial("id").primaryKey(),
    resultId: integer("result_id")
      .notNull()
      .references(() => results.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => questions.id),
    selectedAnswer: varchar("selected_answer", { length: 1 }),
    correctAnswer: varchar("correct_answer", { length: 1 }).notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    marksAwarded: integer("marks_awarded").notNull().default(0),
    orderIndex: integer("order_index").notNull().default(0),
  },
  (t) => [
    index("result_details_result_idx").on(t.resultId),
    index("result_details_question_idx").on(t.questionId),
  ]
);

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: integer("entity_id"),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_user_idx").on(t.userId),
    index("audit_logs_action_idx").on(t.action),
    index("audit_logs_created_idx").on(t.createdAt),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  examSessions: many(examSessions),
  results: many(results),
  createdQuestions: many(questions),
  createdExams: many(exams),
  auditLogs: many(auditLogs),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questions),
  exams: many(exams),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
  createdBy: one(users, {
    fields: [questions.createdBy],
    references: [users.id],
  }),
  examQuestions: many(examQuestions),
  studentAnswers: many(studentAnswers),
  resultDetails: many(resultDetails),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [exams.subjectId],
    references: [subjects.id],
  }),
  createdBy: one(users, {
    fields: [exams.createdBy],
    references: [users.id],
  }),
  examQuestions: many(examQuestions),
  examSessions: many(examSessions),
  results: many(results),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams, { fields: [examQuestions.examId], references: [exams.id] }),
  question: one(questions, {
    fields: [examQuestions.questionId],
    references: [questions.id],
  }),
}));

export const examSessionsRelations = relations(
  examSessions,
  ({ one, many }) => ({
    exam: one(exams, {
      fields: [examSessions.examId],
      references: [exams.id],
    }),
    student: one(users, {
      fields: [examSessions.studentId],
      references: [users.id],
    }),
    studentAnswers: many(studentAnswers),
    result: many(results),
  })
);

export const studentAnswersRelations = relations(studentAnswers, ({ one }) => ({
  session: one(examSessions, {
    fields: [studentAnswers.sessionId],
    references: [examSessions.id],
  }),
  question: one(questions, {
    fields: [studentAnswers.questionId],
    references: [questions.id],
  }),
}));

export const resultsRelations = relations(results, ({ one, many }) => ({
  session: one(examSessions, {
    fields: [results.sessionId],
    references: [examSessions.id],
  }),
  exam: one(exams, { fields: [results.examId], references: [exams.id] }),
  student: one(users, {
    fields: [results.studentId],
    references: [users.id],
  }),
  resultDetails: many(resultDetails),
}));

export const resultDetailsRelations = relations(resultDetails, ({ one }) => ({
  result: one(results, {
    fields: [resultDetails.resultId],
    references: [results.id],
  }),
  question: one(questions, {
    fields: [resultDetails.questionId],
    references: [questions.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type ExamQuestion = typeof examQuestions.$inferSelect;
export type ExamSession = typeof examSessions.$inferSelect;
export type NewExamSession = typeof examSessions.$inferInsert;
export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type Result = typeof results.$inferSelect;
export type ResultDetail = typeof resultDetails.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
