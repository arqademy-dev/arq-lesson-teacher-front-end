/**
 * Typed API client for Arqademy Lesson Teacher backend.
 * Always sends credentials (HTTP-only cookie auth).
 *
 * skipAuthRedirect is true ONLY on the three login mutations —
 * a 401 there means "wrong password" and should surface inline,
 * not bounce the user off the login page they're already on.
 * Everything else defaults to false: an expired/invalid session
 * redirects straight to the correct login route.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined"
    ? "/backend"
    : "https://arq-lesson-teacher-back-end.onrender.com");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuthRedirect?: boolean;
};

function loginPathForCurrentRoute(): string {
  if (typeof window === "undefined") return "/students/login";
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "/admin/login";
  if (path.startsWith("/educators")) return "/educators/login";
  return "/students/login";
}

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, skipAuthRedirect = false } =
    options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuthRedirect) {
    if (typeof window !== "undefined") {
      window.location.href = loginPathForCurrentRoute();
    }
    throw new ApiError(401, "Unauthorized");
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ??
      res.statusText ??
      "Request failed";
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

/* ============================================================
   STUDENT — Auth
   ============================================================ */

export type StudentLoginPayload = {
  email: string;
  password: string;
};

export async function studentLogin(payload: StudentLoginPayload) {
  return api("/api/students/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true, // exception — see file header
  });
}

export async function getStudentMe() {
  return api("/api/students/me", { skipAuthRedirect: false });
}

/**
 * NOTE: not in the current OpenAPI doc — guessed by symmetry with
 * /api/students/login. Confirm the real route with backend; swap
 * to /api/users/logout if the cookie/session is role-agnostic.
 */
export async function studentLogout() {
  // return api("/api/students/logout", {
  return api("/api/users/logout", {
    method: "POST",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   STUDENT — Daily workflow
   ============================================================ */

export async function getStudentDashboard() {
  return api("/api/students/me/dashboard", { skipAuthRedirect: false });
}

export async function getCurrentSession() {
  return api("/api/students/me/current-session", { skipAuthRedirect: false });
}

export async function completeSession(sessionId: string) {
  return api(`/api/students/me/sessions/${sessionId}/complete`, {
    method: "POST",
    skipAuthRedirect: false,
  });
}

export async function submitInteraction(payload: {
  interactiveElementId: string;
  scheduledSessionId: string;
  response: Record<string, unknown>;
}) {
  return api("/api/students/me/submissions", {
    method: "POST",
    body: payload,
    skipAuthRedirect: false,
  });
}

/* ============================================================
   STUDENT — Own learning plan breakdown
   Add this block under the "STUDENT — Daily workflow" section
   in lib/api.ts.
   ============================================================ */

export type LearningPlanBreakdownSession = {
  id: string;
  scheduledDate: string;
  sessionDayNumber: number;
  isCompleted: boolean;
};

export type LearningPlanBreakdownTopic = {
  topicId: string;
  topicTitle: string;
  status: "pending" | "in_progress" | "completed";
  done: LearningPlanBreakdownSession[];
  todo: LearningPlanBreakdownSession[];
};

export type LearningPlanBreakdownPlan = {
  planId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  requireCorrectAnswersToProgress: boolean;
  topics: LearningPlanBreakdownTopic[];
};

export async function getMyLearningPlanBreakdown() {
  return api<LearningPlanBreakdownPlan[]>("/api/students/me/learning-plan", {
    skipAuthRedirect: false,
  });
}

/* ============================================================
   STUDENT — Files (submission uploads)
   Add this block under the "STUDENT — Payments & report" section
   in lib/api.ts.
   ============================================================ */
 
export type PresignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};
 
export async function getStudentPresignedUploadUrl(
  fileName: string,
  contentType: string
) {
  return api<PresignedUploadResponse>(
    "/api/students/me/files/presigned-upload-url",
    {
      method: "POST",
      body: { fileName, contentType },
      skipAuthRedirect: false,
    }
  );
}

export async function getStudentBatchPresignedUploadUrls(
  files: { fileName: string; contentType: string }[]
) {
  return api<{ files: PresignedUploadResponse[] }>(
    "/api/students/me/files/presigned-upload-urls",
    {
      method: "POST",
      body: { files },
      skipAuthRedirect: false,
    }
  );
}
 
export type FileHistoryFile = {
  id: string;
  response: Record<string, unknown>;
  attemptNumber: number;
  submittedAt: string;
  resourceId: string | null;
  resourceTitle: string | null;
};
 
export type FileHistorySession = {
  sessionId: string | null;
  scheduledDate: string | null;
  sessionDayNumber: number | null;
  files: FileHistoryFile[];
};
 
export type FileHistoryTopicGroup = {
  topicId: string | null;
  topicTitle: string | null;
  sessions: FileHistorySession[];
};
 
export async function getStudentFileHistory() {
  return api<FileHistoryTopicGroup[]>("/api/students/me/files/history", {
    skipAuthRedirect: false,
  });
}
 
 

/* ============================================================
   STUDENT — Payments & report
   ============================================================ */

export type StudentPayment = {
  id: string;
  studentId?: string;
  learningPlanId?: string;
  pricingTierId?: string;
  amountNaira?: number;
  status: "pending" | "success" | "failed" | "refunded";
  provider?: string | null;
  providerReference?: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

/** Create invoice — price computed server-side from topic count */
export async function initiateStudentPayment(learningPlanId: string) {
  return api<{
    message?: string;
    payment?: StudentPayment;
    redirectUrl?: string | null;
  }>("/api/students/payments/initiate", {
    method: "POST",
    body: { learningPlanId },
    skipAuthRedirect: false,
  });
}

export async function listStudentPayments() {
  return api<StudentPayment[]>("/api/students/payments/me", {
    skipAuthRedirect: false,
  });
}

export async function getStudentReport() {
  return api("/api/students/me/report", { skipAuthRedirect: false });
}

/* ============================================================
   EDUCATOR — Auth
   ============================================================ */

export type EducatorRegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type EducatorLoginPayload = {
  email: string;
  password: string;
};

export type EducatorProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  arqId: string;
  role?: string;
  approvalStatus: "approve" | "pending" | "closed" | "suspended";
  accountApproval?: "approve" | "pending" | "closed" | "suspended";
  specialization?: string | null;
  bio?: string | null;
  hiredDate?: string | null;
  userId?: string;
};

export function educatorIsApproved(me: EducatorProfile): boolean {
  const status = me.approvalStatus ?? me.accountApproval;
  return status === "approve";
}

export function educatorApprovalStatus(
  me: EducatorProfile
): "approve" | "pending" | "closed" | "suspended" {
  return (me.approvalStatus ?? me.accountApproval ?? "pending") as
    | "approve"
    | "pending"
    | "closed"
    | "suspended";
}

export async function educatorRegister(payload: EducatorRegisterPayload) {
  return api<{ message: string; arqId: string }>("/api/users/register", {
    method: "POST",
    body: payload,
    skipAuthRedirect: false,
  });
}

export async function educatorLogin(payload: EducatorLoginPayload) {
  return api("/api/users/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true, // exception — see file header
  });
}

export async function educatorLogout() {
  return api("/api/users/logout", {
    method: "POST",
    skipAuthRedirect: false,
  });
}

export async function getEducatorMe() {
  return api<EducatorProfile>("/api/users/me", { skipAuthRedirect: false });
}

/* ============================================================
   EDUCATOR — Dashboard
   ============================================================ */

export async function getEducatorDashboard() {
  return api("/api/educators/dashboard/summary", { skipAuthRedirect: false });
}

/* ============================================================
   EDUCATOR — Students
   ============================================================ */

export type EnrollStudentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  academicLevel?: string;
  password?: string;
};

export async function enrollStudent(payload: EnrollStudentPayload) {
  return api("/api/educators/students", {
    method: "POST",
    body: payload,
    skipAuthRedirect: false,
  });
}

export async function listEducatorStudents() {
  return api("/api/educators/students", { skipAuthRedirect: false });
}

export async function getEducatorStudent(studentId: string) {
  return api(`/api/educators/students/${studentId}`, {
    skipAuthRedirect: false,
  });
}

export async function getEducatorStudentReport(studentId: string) {
  return api(`/api/educators/students/${studentId}/report`, {
    skipAuthRedirect: false,
  });
}

export async function getEducatorStudentLearningHistory(studentId: string) {
  return api(`/api/educators/students/${studentId}/learning-history`, {
    skipAuthRedirect: false,
  });
}

/* ============================================================
   EDUCATOR — Learning plans
   ============================================================ */

export type CreateLearningPlanPayload = {
  studentId: string;
  sessionsPerWeek: number;
  preferredDays: string[];
  startDate: string; // YYYY-MM-DD
  requireCorrectAnswersToProgress?: boolean;
  topics: Array<{ topicId: string; customDurationDays?: number }>;
};

export async function listEducatorLearningPlans() {
  return api("/api/educators/learning-plans", { skipAuthRedirect: false });
}

export async function createLearningPlan(payload: CreateLearningPlanPayload) {
  return api("/api/educators/learning-plans", {
    method: "POST",
    body: payload,
    skipAuthRedirect: false,
  });
}

export async function getLearningPlan(planId: string) {
  return api(`/api/educators/learning-plans/${planId}`, {
    skipAuthRedirect: false,
  });
}

export async function listLearningPlansForStudent(studentId: string) {
  return api(`/api/educators/learning-plans/student/${studentId}`, {
    skipAuthRedirect: false,
  });
}

export type UpdateLearningPlanPayload = {
  sessionsPerWeek?: number;
  preferredDays?: string[];
  startDate?: string;
  endDate?: string | null;
  status?: "active" | "completed" | "paused" | "cancelled";
  requireCorrectAnswersToProgress?: boolean;
};

export async function updateLearningPlan(
  id: string,
  body: UpdateLearningPlanPayload
) {
  return api(`/api/educators/learning-plans/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

export type UpdateScheduledSessionPayload = {
  scheduledDate?: string;
  sessionDayNumber?: number;
  isCompleted?: boolean;
  educatorNotes?: string;
};

export async function updateScheduledSession(
  sessionId: string,
  body: UpdateScheduledSessionPayload
) {
  return api(`/api/educators/learning-plans/sessions/${sessionId}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Auth
   ============================================================ */

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export async function adminLogin(payload: AdminLoginPayload) {
  return api("/api/admin/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true, // exception — see file header
  });
}

export async function adminLogout() {
  // return api("/api/admin/logout", {
  return api("/api/users/logout", {
    method: "POST",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Educators
   ============================================================ */

export type AdminEducator = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  arqId: string;
  approvalStatus?: "approve" | "pending" | "closed" | "suspended";
  accountApproval?: "approve" | "pending" | "closed" | "suspended";
  specialization?: string | null;
  bio?: string | null;
  hiredDate?: string | null;
  userId?: string;
};

export function educatorStatusOf(e: {
  approvalStatus?: string;
  accountApproval?: string;
}): string {
  return e.approvalStatus ?? e.accountApproval ?? "pending";
}

export async function listPendingEducators() {
  return api<AdminEducator[]>("/api/admin/educators/pending", {
    skipAuthRedirect: false,
  });
}

export async function listAllEducators() {
  return api<AdminEducator[]>("/api/admin/educators", {
    skipAuthRedirect: false,
  });
}

export async function getAdminEducator(educatorId: string) {
  return api(`/api/admin/educators/${educatorId}`, {
    skipAuthRedirect: false,
  });
}

export async function setEducatorApproval(
  educatorId: string,
  action: "approve" | "suspend" | "close"
) {
  return api(`/api/admin/educators/${educatorId}/approval`, {
    method: "PATCH",
    body: { action },
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Students
   ============================================================ */

export async function getAdminStudentReport(studentId: string) {
  return api(`/api/admin/students/${studentId}/report`, {
    skipAuthRedirect: false,
  });
}

export async function getAdminStudentLearningHistory(studentId: string) {
  return api(`/api/admin/students/${studentId}/learning-history`, {
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Payments
   ============================================================ */

export async function listPendingPayments() {
  return api("/api/admin/payments/pending", { skipAuthRedirect: false });
}

export async function listAllPayments() {
  return api("/api/admin/payments", { skipAuthRedirect: false });
}

export async function setPaymentStatus(
  paymentId: string,
  action: "approve" | "reject"
) {
  return api(`/api/admin/payments/${paymentId}/${action}`, {
    method: "PATCH",
    body: { action },
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Curriculum: Subjects
   ============================================================ */

export async function listSubjects() {
  return api("/api/admin/curriculum/subjects", { skipAuthRedirect: false });
}

export async function createSubject(body: {
  title: string;
  description?: string;
}) {
  return api("/api/admin/curriculum/subjects", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function getSubject(id: string) {
  return api(`/api/admin/curriculum/subjects/${id}`, {
    skipAuthRedirect: false,
  });
}

export async function updateSubject(
  id: string,
  body: { title?: string; description?: string }
) {
  return api(`/api/admin/curriculum/subjects/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

export async function deleteSubject(id: string) {
  return api(`/api/admin/curriculum/subjects/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Curriculum: Classes
   ============================================================ */

export async function listClasses() {
  return api("/api/admin/curriculum/classes", { skipAuthRedirect: false });
}
 
export async function createClass(body: {
  title: string;
  term?: string;
  isActive?: boolean;
}) {
  return api("/api/admin/curriculum/classes", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}
 
export async function getClass(id: string) {
  return api(`/api/admin/curriculum/classes/${id}`, {
    skipAuthRedirect: false,
  });
}
 
export async function updateClass(
  id: string,
  body: { title?: string; term?: string; isActive?: boolean }
) {
  return api(`/api/admin/curriculum/classes/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}
 
export async function deleteClass(id: string) {
  return api(`/api/admin/curriculum/classes/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
}
 
/* ============================================================
   ADMIN — Curriculum: Topics
   ============================================================ */
   export type TopicFilters = { subjectId?: string; classId?: string };


function topicsQuery(filters: TopicFilters): string {
  const params = new URLSearchParams();
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.classId) params.set("classId", filters.classId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
 
export async function listTopics(filters: TopicFilters = {}) {
  return api(`/api/admin/curriculum/topics${topicsQuery(filters)}`, {
    skipAuthRedirect: false,
  });
}
 
export async function createTopic(body: {
  subjectId: string;
  classId: string;
  title: string;
  description?: string;
  sortOrder: number;
  expectedDurationDays: number;
}) {
  return api("/api/admin/curriculum/topics", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}
 
export async function getTopic(id: string) {
  return api(`/api/admin/curriculum/topics/${id}`, {
    skipAuthRedirect: false,
  });
}
 
export async function updateTopic(
  id: string,
  body: {
    subjectId?: string;
    classId?: string;
    title?: string;
    description?: string;
    sortOrder?: number;
    expectedDurationDays?: number;
  }
) {
  return api(`/api/admin/curriculum/topics/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}
 
export async function deleteTopic(id: string) {
  return api(`/api/admin/curriculum/topics/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Curriculum: Resources & Interactive Elements
   ============================================================ */

export async function listResources(topicId: string) {
  return api(`/api/admin/curriculum/topics/${topicId}/resources`, {
    skipAuthRedirect: false,
  });
}

export async function listInteractiveElements(resourceId: string) {
  return api(
    `/api/admin/curriculum/resources/${resourceId}/interactive-elements`,
    { skipAuthRedirect: false }
  );
}

/* ============================================================
   ADMIN — Dashboard
   ============================================================ */

export async function getAdminDashboard() {
  return api("/api/admin/dashboard/summary", { skipAuthRedirect: false });
}

/* ============================================================
   CURRICULUM CATALOG — read-only, shared by the educator plan builder
   (same admin routes, kept as separate named exports for clarity
   at the call site)
   ============================================================ */


export async function listCurriculumSubjects() {
  return api("/api/admin/curriculum/subjects", { skipAuthRedirect: false });
}
 
export async function listCurriculumClasses() {
  return api("/api/admin/curriculum/classes", { skipAuthRedirect: false });
}
 
export async function listCurriculumTopics(filters: TopicFilters) {
  return api(`/api/admin/curriculum/topics${topicsQuery(filters)}`, {
    skipAuthRedirect: false,
  });
}
 
export async function listCurriculumResources(topicId: string) {
  return api(`/api/admin/curriculum/topics/${topicId}/resources`, {
    skipAuthRedirect: false,
  });
}

/* ============================================================
   STUDENT — Payments (typed)
   Replaces initiateStudentPayment and listStudentPayments in
   lib/api.ts. Two real fixes here, not just typing:
   - Both had skipAuthRedirect: true, which was wrong — that flag
     should only be true on the three *login* mutations (a 401
     there means "wrong password", not "your session expired").
     Payment calls need the normal expired-session → login redirect
     like everything else.
   - listStudentPayments now returns a typed StudentPayment[]
     instead of unknown, so callers can check .status and
     .learningPlanId without casting.
   ============================================================ */

