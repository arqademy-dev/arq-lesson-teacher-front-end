/**
 * Typed API client for Arqademy Lesson Teacher backend.
 * Always sends credentials (HTTP-only cookie auth).
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

/* ---------- Student ---------- */

export type StudentLoginPayload = {
  email: string;
  password: string;
};

export async function studentLogin(payload: StudentLoginPayload) {
  return api("/api/students/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
}

export async function getStudentMe() {
  return api("/api/students/me", { skipAuthRedirect: false });
}

export async function getStudentDashboard() {
  return api("/api/students/me/dashboard", { skipAuthRedirect: false });
}

export async function getCurrentSession() {
  return api("/api/students/me/current-session", { skipAuthRedirect: false });
}

export async function completeSession(sessionId: string) {
  return api(`/api/students/me/sessions/${sessionId}/complete`, {
    method: "POST",
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
  });
}

/* ---------- Educator ---------- */

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
  /** Live API field */
  approvalStatus: "approve" | "pending" | "closed" | "suspended";
  /** Optional alias if some responses still use the old name */
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
    skipAuthRedirect: false,
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

export async function getEducatorDashboard() {
  return api("/api/educators/dashboard/summary", { skipAuthRedirect: false });
}












/* ---------- Admin ---------- */
/* ---------- Admin ---------- */
/* ---------- Admin ---------- */
/* ---------- Admin ---------- */

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export async function adminLogin(payload: AdminLoginPayload) {
  return api("/api/admin/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
}

export async function adminLogout() {
  return api("/api/admin/logout", {
    method: "POST",
    skipAuthRedirect: true,
  }).catch(() => null); // if endpoint missing, still clear client route
}

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

export async function setEducatorApproval(
  educatorId: string,
  action: "approve" | "suspend" | "close"
) {
  return api(`/api/admin/educators/${educatorId}/approval`, {
    method: "PATCH",
    body: { action },
  });
}

export async function getAdminDashboard() {
  return api("/api/admin/dashboard/summary", { skipAuthRedirect: false });
}


/* ---------- Admin educators detail / students ---------- */

export function educatorStatusOf(e: {
  approvalStatus?: string;
  accountApproval?: string;
}): string {
  return e.approvalStatus ?? e.accountApproval ?? "pending";
}

/** Full educator profile + attached students (admin) */
export async function getAdminEducator(educatorId: string) {
  return api(`/api/admin/educators/${educatorId}`, {
    skipAuthRedirect: false,
  });
}

/** Admin full assessment report for any student */
export async function getAdminStudentReport(studentId: string) {
  return api(`/api/admin/students/${studentId}/report`, {
    skipAuthRedirect: false,
  });
}

/** Admin learning history for a student (if backend exposes it) */
export async function getAdminStudentLearningHistory(studentId: string) {
  return api(`/api/admin/students/${studentId}/learning-history`, {
    skipAuthRedirect: false,
  });
}

/* ---------- Educator students ---------- */

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

export async function enrollStudent(payload: {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  academicLevel?: string;
}) {
  return api("/api/educators/students", {
    method: "POST",
    body: payload,
  });
}

/* ---------- Admin payments ---------- */

export async function listPendingPayments() {
  return api("/api/admin/payments/pending", { skipAuthRedirect: true });
}

export async function listAllPayments() {
  return api("/api/admin/payments", { skipAuthRedirect: true });
}

/** action: approve → success, reject → failed (adjust if backend uses different verbs) */
export async function setPaymentStatus(
  paymentId: string,
  action: "approve" | "reject"
) {
  return api(`/api/admin/payments/${paymentId}/status`, {
    method: "PATCH",
    body: { action },
  });
}

/* ---------- Admin curriculum ---------- */

export async function listSubjects() {
  return api("/api/admin/curriculum/subjects", { skipAuthRedirect: true });
}

export async function createSubject(body: {
  title: string;
  description?: string;
}) {
  return api("/api/admin/curriculum/subjects", { method: "POST", body });
}

export async function getSubject(id: string) {
  return api(`/api/admin/curriculum/subjects/${id}`, {
    skipAuthRedirect: true,
  });
}

export async function updateSubject(
  id: string,
  body: { title?: string; description?: string }
) {
  return api(`/api/admin/curriculum/subjects/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteSubject(id: string) {
  return api(`/api/admin/curriculum/subjects/${id}`, { method: "DELETE" });
}

export async function listClasses(subjectId: string) {
  return api(`/api/admin/curriculum/subjects/${subjectId}/classes`, {
    skipAuthRedirect: true,
  });
}

export async function createClass(
  subjectId: string,
  body: { title: string; term?: string; isActive?: boolean }
) {
  return api(`/api/admin/curriculum/subjects/${subjectId}/classes`, {
    method: "POST",
    body,
  });
}

export async function updateClass(
  id: string,
  body: { title?: string; term?: string; isActive?: boolean }
) {
  return api(`/api/admin/curriculum/classes/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteClass(id: string) {
  return api(`/api/admin/curriculum/classes/${id}`, { method: "DELETE" });
}

export async function listTopics(classId: string) {
  return api(`/api/admin/curriculum/classes/${classId}/topics`, {
    skipAuthRedirect: true,
  });
}

export async function createTopic(
  classId: string,
  body: {
    title: string;
    description?: string;
    sortOrder: number;
    expectedDurationDays: number;
  }
) {
  return api(`/api/admin/curriculum/classes/${classId}/topics`, {
    method: "POST",
    body,
  });
}

export async function updateTopic(
  id: string,
  body: {
    title?: string;
    description?: string;
    sortOrder?: number;
    expectedDurationDays?: number;
  }
) {
  return api(`/api/admin/curriculum/topics/${id}`, {
    method: "PATCH",
    body,
  });
}

export async function deleteTopic(id: string) {
  return api(`/api/admin/curriculum/topics/${id}`, { method: "DELETE" });
}

export async function listResources(topicId: string) {
  return api(`/api/admin/curriculum/topics/${topicId}/resources`, {
    skipAuthRedirect: true,
  });
}

export async function listInteractiveElements(resourceId: string) {
  return api(
    `/api/admin/curriculum/resources/${resourceId}/interactive-elements`,
    { skipAuthRedirect: true }
  );
}

/* ---------- Educator learning plans & reports ---------- */

export async function listEducatorLearningPlans() {
  return api("/api/educators/learning-plans", { skipAuthRedirect: true });
}

export async function listLearningPlansForStudent(studentId: string) {
  return api(`/api/educators/students/${studentId}/learning-plans`, {
    skipAuthRedirect: true,
  });
}

export async function getLearningPlan(planId: string) {
  return api(`/api/educators/learning-plans/${planId}`, {
    skipAuthRedirect: true,
  });
}


/* ---------- Student payments ---------- */

/* ---------- Student payments ---------- */

/** Create invoice — price computed server-side from topic count */
export async function initiateStudentPayment(learningPlanId: string) {
  return api<{
    message?: string;
    payment?: {
      id: string;
      studentId?: string;
      learningPlanId?: string;
      pricingTierId?: string;
      amountNaira?: number;
      status?: string;
      provider?: string | null;
      providerReference?: string | null;
      paidAt?: string | null;
      createdAt?: string;
    };
    redirectUrl?: string | null;
  }>("/api/students/payments/initiate", {
    method: "POST",
    body: { learningPlanId },
    skipAuthRedirect: true,
  });
}

/** History — try me/payments; if 404 we'll show initiate result only */
export async function listStudentPayments() {
  return api("/api/students/payments/me", { skipAuthRedirect: true });
}

export async function getStudentReport() {
  return api("/api/students/me/report", { skipAuthRedirect: true });
}

export async function getSessionSubmissions(sessionId: string) {
  return api(`/api/students/me/sessions/${sessionId}/submissions`, {
    skipAuthRedirect: true,
  });
}