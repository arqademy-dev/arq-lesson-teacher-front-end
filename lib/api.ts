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

export async function getStudentSession(sessionId: string) {
  return api(`/api/students/me/sessions/${sessionId}`,
    { skipAuthRedirect: false }
  );
}

export async function completeSession(sessionId: string) {
  return api(`/api/students/me/sessions/${sessionId}/complete`, {
    method: "POST",
    skipAuthRedirect: false,
  });
}

// export async function submitInteraction(payload: {
//   interactiveElementId: string;
//   scheduledSessionId: string;
//   response: Record<string, unknown>;
// }) {
//   return api("/api/students/me/submissions", {
//     method: "POST",
//     body: payload,
//     skipAuthRedirect: false,
//   });
// }

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
 
// export async function getStudentPresignedUploadUrl(
//   fileName: string,
//   contentType: string
// ) {
//   return api<PresignedUploadResponse>(
//     "/api/students/me/files/presigned-upload-url",
//     {
//       method: "POST",
//       body: { fileName, contentType },
//       skipAuthRedirect: false,
//     }
//   );
// }

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
// export async function initiateStudentPayment(learningPlanId: string) {
//   return api<{
//     message?: string;
//     payment?: StudentPayment;
//     redirectUrl?: string | null;
//   }>("/api/students/payments/initiate", {
//     method: "POST",
//     body: { learningPlanId },
//     skipAuthRedirect: false,
//   });
// }

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
  classId?: string;
  programId?: string; // NEW — published programme
  academicLevel?: string;
  phone?: string;
  password?: string;
  guardian?: {
    fullName: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
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

// GET /api/admin/students/:studentId/learning-history
export type AdminStudentLearningHistory = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    arqId: string;
    academicLevel: string | null;
    enrollmentDate: string;
  };

  learningPlans: Array<
    AdminStudentLearningPlan & {
      isPaid: boolean;
    }
  >;
};

export async function getAdminStudentLearningHistory(studentId: string) {
  return api<AdminStudentLearningHistory>(
    `/api/admin/students/${studentId}/learning-history`,
    { skipAuthRedirect: false }
  );
}

// GET /api/admin/students/:studentId/report
export type AdminStudentReport = Record<string, any>;

export async function getAdminStudentReport(studentId: string) {
  return api<AdminStudentReport>(
    `/api/admin/students/${studentId}/report`,
    { skipAuthRedirect: false }
  );
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
   
export type SummaryFormatSection = {
  header: string;
  body: string;
};

export type SummaryFormat = SummaryFormatSection[];

export type Topic = {
  id: string;
  subjectId: string | null;
  classId: string | null;
  title: string;
  description: string | null;
  sortOrder: number | null;
  expectedDurationDays: number;
  summaryFormat?: SummaryFormat | null;
  subjectTitle?: string | null;
};

export type CreateTopicPayload = {
  subjectId?: string;          // now optional on backend
  classId?: string;            // now optional
  title: string;
  description?: string;
  sortOrder?: number;          // still send a default if backend requires it
  expectedDurationDays?: number;
  summaryFormat?: SummaryFormat;
};

export type UpdateTopicPayload = {
  subjectId?: string | null;
  classId?: string | null;
  title?: string;
  description?: string;
  sortOrder?: number;
  expectedDurationDays?: number;
  summaryFormat?: SummaryFormat | null;
};

export type TopicFilters = {
  subjectId?: string;
  classId?: string;
};

function topicsQuery(filters: TopicFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.subjectId) params.set("subjectId", filters.subjectId);
  if (filters.classId) params.set("classId", filters.classId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listTopics(filters: TopicFilters = {}) {
  return api<Topic[]>(`/api/admin/curriculum/topics${topicsQuery(filters)}`, {
    skipAuthRedirect: false,
  });
}

export async function createTopic(body: {
  subjectId?: string;
  classId?: string;
  title: string;
  description?: string;
  sortOrder?: number;
  expectedDurationDays?: number;
  summaryFormat?: SummaryFormat;
}) {
  return api<Topic>("/api/admin/curriculum/topics", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function getTopic(id: string) {
  return api<Topic>(`/api/admin/curriculum/topics/${id}`, {
    skipAuthRedirect: false,
  });
}

export async function updateTopic(
  id: string,
  body: {
    subjectId?: string | null;
    classId?: string | null;
    title?: string;
    description?: string;
    sortOrder?: number;
    expectedDurationDays?: number;
    summaryFormat?: SummaryFormat | null;
  }
) {
  return api<Topic>(`/api/admin/curriculum/topics/${id}`, {
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

/* ============================================================
   ADMIN — Curriculum: Resources & Interactive Elements
   ============================================================ */

export type ResourceType =
  | "video"
  | "pdf"
  | "article"
  | "image"
  | "interactive"
  | "quiz"
  | "submission"; // used for file_upload interactive elements


export type ContentBlockHeading = { type: "heading"; level: 1 | 2 | 3; text: string };
export type ContentBlockParagraph = { type: "paragraph"; text: string };
export type ContentBlockImage = {
  type: "image";
  url: string;
  altText?: string;
  caption?: string;
};
export type ContentBlockFile = {
  type: "file";
  url: string;
  fileName?: string;
  mimeType?: string;
};
export type ContentBlockBulletList = { type: "bullet_list"; items: string[] };

export type ContentBlock =
  | ContentBlockHeading
  | ContentBlockParagraph
  | ContentBlockImage
  | ContentBlockFile
  | ContentBlockBulletList;

export type Resource = {
  id: string;
  topicId: string;
  title: string;
  resourceType: ResourceType;
  urlOrPath: string;
  dayNumber: number;
  sortOrder: number;
  /** Only meaningful when resourceType === "article" */
  contentBody?: ContentBlock[] | null;
};

export async function listResources(topicId: string) {
  return api<Resource[]>(`/api/admin/curriculum/topics/${topicId}/resources`, {
    skipAuthRedirect: false,
  });
}

/**
 * NOTE: the OpenAPI request schema for this endpoint only lists
 * title/resourceType/urlOrPath/dayNumber/sortOrder as accepted fields —
 * contentBody isn't in the create requestBody, only in the response
 * schema. Passing it here is an assumption; confirm with backend that
 * POST accepts contentBody directly, or whether article bodies must be
 * set via a follow-up PATCH.
 */
export async function createResource(
  topicId: string,
  body: {
    title: string;
    resourceType: ResourceType;
    urlOrPath: string;
    dayNumber: number;
    sortOrder: number;
    contentBody?: ContentBlock[];
  }
) {
  return api<Resource>(`/api/admin/curriculum/topics/${topicId}/resources`, {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function getResource(id: string) {
  return api<Resource>(`/api/admin/curriculum/resources/${id}`, {
    skipAuthRedirect: false,
  });
}

export async function updateResource(
  id: string,
  body: Partial<{
    title: string;
    resourceType: ResourceType;
    urlOrPath: string;
    dayNumber: number;
    sortOrder: number;
    contentBody: ContentBlock[];
  }>
) {
  return api<Resource>(`/api/admin/curriculum/resources/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

export async function deleteResource(id: string) {
  return api(`/api/admin/curriculum/resources/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
}


export type InteractionType =
  | "drag_and_drop"
  | "fill_blank"
  | "hotspot"
  | "branching"
  | "interactive_video"
  | "image_sequencing"
  | "multiple_choice"
  | "file_upload"; 

export type InteractiveElement = {
  id: string;
  resourceId: string;
  interactionType: InteractionType;
  /** Only used when interactionType === "interactive_video" */
  videoTimestampSeconds?: number | null;
  pauseOnTrigger?: boolean;
  configSchema: Record<string, unknown>;
  /** Admin-only. Never present on student-facing SafeInteractiveElement responses. */
  correctAnswers?: Record<string, unknown>;
};

export async function listInteractiveElements(resourceId: string) {
  return api<InteractiveElement[]>(
    `/api/admin/curriculum/resources/${resourceId}/interactive-elements`,
    { skipAuthRedirect: false }
  );
}

export async function createInteractiveElement(
  resourceId: string,
  body: {
    interactionType: InteractionType;
    videoTimestampSeconds?: number;
    pauseOnTrigger?: boolean;
    configSchema: Record<string, unknown>;
    correctAnswers: Record<string, unknown>;
  }
) {
  return api<InteractiveElement>(
    `/api/admin/curriculum/resources/${resourceId}/interactive-elements`,
    { method: "POST", body, skipAuthRedirect: false }
  );
}

export async function getInteractiveElement(id: string) {
  return api<InteractiveElement>(
    `/api/admin/curriculum/interactive-elements/${id}`,
    { skipAuthRedirect: false }
  );
}

export async function updateInteractiveElement(
  id: string,
  body: Partial<{
    interactionType: InteractionType;
    videoTimestampSeconds: number;
    pauseOnTrigger: boolean;
    configSchema: Record<string, unknown>;
    correctAnswers: Record<string, unknown>;
  }>
) {
  return api<InteractiveElement>(
    `/api/admin/curriculum/interactive-elements/${id}`,
    { method: "PATCH", body, skipAuthRedirect: false }
  );
}

export async function deleteInteractiveElement(id: string) {
  return api(`/api/admin/curriculum/interactive-elements/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
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

export type CurriculumClass = {
  id: string;
  title: string;
  term?: string | null;
  isActive?: boolean;
  subjectId?: string;
};

/** List all classes (standalone catalog). */
export async function listAllClasses() {
  return api<CurriculumClass[]>("/api/admin/curriculum/classes", {
    skipAuthRedirect: false,
  });
}


/* ============================================================
   ADMIN — Programmes
   ============================================================ */

export type ProgrammeStatus = "draft" | "published" | "locked";

export type Programme = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  status: ProgrammeStatus;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  topicCount: number;
};

export type CreateProgrammePayload = {
  title: string;
  subtitle?: string;
  description?: string;
};

export type UpdateProgrammePayload = {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  status?: ProgrammeStatus;
};

export type ListProgrammesQuery = {
  status?: ProgrammeStatus;
  search?: string;
  limit?: number;
  offset?: number;
};


/* ============================================================
   Topic — summaryFormat
   ============================================================ */

function programmesQuery(q: ListProgrammesQuery = {}): string {
  const params = new URLSearchParams();
  if (q.status) params.set("status", q.status);
  if (q.search) params.set("search", q.search);
  if (q.limit != null) params.set("limit", String(q.limit));
  if (q.offset != null) params.set("offset", String(q.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Admin: create a new programme (always starts as draft) */
export async function createProgramme(payload: CreateProgrammePayload) {
  return api<Programme>("/api/admin/programmes", {
    method: "POST",
    body: payload,
    skipAuthRedirect: false,
  });
}

/** Admin: list programmes (optional filters) */
export async function listProgrammes(query: ListProgrammesQuery = {}) {
  return api<Programme[]>(`/api/admin/programmes${programmesQuery(query)}`, {
    skipAuthRedirect: false,
  });
}

/** Admin: get one programme by id */
export async function getProgramme(id: string) {
  return api<Programme>(`/api/admin/programmes/${id}`, {
    skipAuthRedirect: false,
  });
}

/** Admin: update a programme */
export async function updateProgramme(id: string, body: UpdateProgrammePayload) {
  return api<Programme>(`/api/admin/programmes/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

/** Admin: delete a programme (only if no students and no topics) */
export async function deleteProgramme(id: string) {
  return api(`/api/admin/programmes/${id}`, {
    method: "DELETE",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   EDUCATOR — Programmes (read-only, published only)
   ============================================================ */

export type PublishedProgramme = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  topicCount: number;
};

/** Educator: list published programmes (for enrol form dropdown etc.) */
export async function listPublishedProgrammes(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return api<PublishedProgramme[]>(`/api/educators/programmes${qs}`, {
    skipAuthRedirect: false,
  });
}

/** Educator: get one published programme */
export async function getPublishedProgramme(id: string) {
  return api<PublishedProgramme>(`/api/educators/programmes/${id}`, {
    skipAuthRedirect: false,
  });
}

/* ============================================================
   ADMIN — Programme Topics
   ============================================================ */

export type ProgrammeTopic = {
  topicId: string;
  sequenceOrder: number;
  title: string;
  description: string | null;
  expectedDurationDays: number;
  subjectId: string | null;
  subjectTitle: string | null;
};

export type AvailableTopic = {
  id: string;
  title: string;
  description: string | null;
  expectedDurationDays: number;
  subjectId: string | null;
  subjectTitle: string | null;
};

/** List topics already attached to a programme (ordered) */
export async function listProgrammeTopics(programmeId: string) {
  return api<ProgrammeTopic[]>(
    `/api/admin/programmes/${programmeId}/topics`,
    { skipAuthRedirect: false }
  );
}

/** Topics in the pool that are NOT yet in this programme */
export async function listAvailableProgrammeTopics(
  programmeId: string,
  subjectId?: string
) {
  const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : "";
  return api<AvailableTopic[]>(
    `/api/admin/programmes/${programmeId}/topics/available${qs}`,
    { skipAuthRedirect: false }
  );
}

/** Attach an existing topic to the end of the programme sequence */
export async function addExistingTopicToProgramme(
  programmeId: string,
  topicId: string
) {
  return api<ProgrammeTopic[]>(
    `/api/admin/programmes/${programmeId}/topics`,
    {
      method: "POST",
      body: { topicId },
      skipAuthRedirect: false,
    }
  );
}

/** Create a brand-new topic and attach it */
export async function createAndAttachTopicToProgramme(
  programmeId: string,
  body: {
    subjectId: string;
    title: string;
    description?: string;
    expectedDurationDays?: number;
  }
) {
  return api<ProgrammeTopic[]>(
    `/api/admin/programmes/${programmeId}/topics`,
    {
      method: "POST",
      body,
      skipAuthRedirect: false,
    }
  );
}

/** Reorder topics — topicIds must be exactly the current set, each once */
export async function reorderProgrammeTopics(
  programmeId: string,
  topicIds: string[]
) {
  return api<ProgrammeTopic[]>(
    `/api/admin/programmes/${programmeId}/topics/order`,
    {
      method: "PUT",
      body: { topicIds },
      skipAuthRedirect: false,
    }
  );
}

/** Detach a topic from the programme (topic stays in the pool) */
export async function removeTopicFromProgramme(
  programmeId: string,
  topicId: string
) {
  return api<ProgrammeTopic[]>(
    `/api/admin/programmes/${programmeId}/topics/${topicId}`,
    {
      method: "DELETE",
      skipAuthRedirect: false,
    }
  );
}

/* ============================================================
   ADMIN — Programme learning plan (per student)
   ============================================================ */

// export type CreateProgrammePlanPayload = {
//   programmeId: string;
//   weeks: number;
//   quizDay: "friday" | "saturday";
//   quizSize: number;
//   startDate: string; // YYYY-MM-DD — must be a Monday
//   requireCorrectAnswersToProgress?: boolean;
// };

export type ProgrammeLearningPlan = {
  id: string;
  studentId: string;
  programmeId?: string | null;
  weeks?: number;
  quizDay?: string;
  quizSize?: number;
  startDate: string;
  endDate?: string | null;
  status: string;
  sessionsPerWeek?: number;
  preferredDays?: string[];
  requireCorrectAnswersToProgress?: boolean;
  createdAt?: string;
  quizDurationMinutes?: number | null;
};

export type CreateProgrammePlanResult = {
  plan: ProgrammeLearningPlan;
  paymentId: string;
  amountNaira: number;
};

// export async function createStudentProgrammePlan(
//   studentId: string,
//   body: CreateProgrammePlanPayload
// ) {
//   return api<CreateProgrammePlanResult>(
//     `/api/admin/students/${studentId}/learning-plan`,
//     { method: "POST", body, skipAuthRedirect: false }
//   );
// }

export type WeeklyQuizSummary = {
  id: string;
  weekNumber: number;
  scheduledDate: string;
  status: string;
  requestedSize: number;
  score: number | null;
  submittedAt: string | null;
  totalQuestions: number;
};

export async function listAdminWeeklyQuizzes(learningPlanId: string) {
  return api<WeeklyQuizSummary[]>(
    `/api/admin/learning-plans/${learningPlanId}/weekly-quizzes`,
    { skipAuthRedirect: false }
  );
}


/* ============================================================
   ADMIN — Students (enrolment)
   ============================================================ */
export type LearningPlanStatus =
  | "active"
  | "completed"
  | "paused"
  | "cancelled";

export type LearningPlanTopicStatus =
  | "pending"
  | "in_progress"
  | "completed";

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "refunded";

export type AdminStudentGuardian = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  isPrimary: boolean;
};

export type AdminStudent = {
  id: string;
  educatorId: string | null;
  classId: string | null;
  className: string | null;
  programId: string | null;
  programmeTitle: string | null;
  programmeStatus: ProgrammeStatus | null;
  enrollmentDate: string;
  academicLevel: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  email: string;
  arqId: string;
};

export type AdminStudentEducator = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export type AdminScheduledSession = {
  id: string;
  learningPlanTopicId: string;
  scheduledDate: string;
  sessionDayNumber: number;
  isCompleted: boolean;
  educatorNotes: string | null;
};

export type AdminLearningPlanTopic = {
  topicId: string;
  topicTitle?: string;
  status: LearningPlanTopicStatus;
  done: AdminScheduledSession[];
  todo: AdminScheduledSession[];
};

export type AdminStudentLearningPlan = {
  planId: string;
  status: LearningPlanStatus;
  startDate: string;
  endDate: string | null;
  requireCorrectAnswersToProgress: boolean;
  topics: AdminLearningPlanTopic[];
};

export type AdminStudentPaymentProviderMeta = {
  accountName?: string;
  bankName?: string;
  expiresAt?: string;
};

export type AdminStudentPayment = {
  id: string;
  studentId: string;
  learningPlanId: string;
  pricingTierId: string | null;
  providerMeta: AdminStudentPaymentProviderMeta | null;
  amountNaira: number;
  status: PaymentStatus;
  programmePriceId: string | null;
  gafiaAccountNumber: string | null;
  provider: string | null;
  providerReference: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type AdminStudentAssessmentActivity = {
  id: string;
  studentId: string;
  interactiveElementId: string;
  scheduledSessionId: string;
  studentResponse: Record<string, any>;
  isCorrect: boolean;
  scoreAwarded: number;
  attemptNumber: number;
  timeSpentSeconds: number | null;
  submittedAt: string;
  questionId: string | null;
  interactionType?: string;
  resourceTitle?: string;
  topicTitle?: string;
};

export type AdminStudentAssessmentStats = {
  totalSubmissions: number;
  correctSubmissions: number;
  accuracyPercent: number;
  averageScore: number;
};

export type AdminStudentAssessments = {
  stats: AdminStudentAssessmentStats;
  activity: AdminStudentAssessmentActivity[];
};

export type AdminStudentFullProfile = {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    arqId: string;
    classId: string | null;
    className: string | null;
    programId: string | null;
    programmeTitle: string | null;
    programmeStatus: ProgrammeStatus | null;
    academicLevel: string | null;
    enrollmentDate: string;
    phone: string | null;
  };

  educator: AdminStudentEducator | null;

  guardians: AdminStudentGuardian[];

  learningPlans: AdminStudentLearningPlan[];

  payments: AdminStudentPayment[];

  assessments: AdminStudentAssessments;
};

export type AdminEnrollStudentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  classId?: string;
  programId?: string;
  academicLevel?: string;
  phone?: string;
  password?: string;
  educatorId?: string;
  guardian?: {
    fullName: string;
    phone?: string;
    email?: string;
    relationship?: string;
  };
};

export type AdminEnrollStudentResult = {
  message: string;
  student: {
    id: string;
    educatorId: string | null;
    programId: string | null;
    classId: string | null;
    academicLevel?: string | null;
    enrollmentDate: string;
    guardian?: AdminStudentGuardian | null;
  };
  credentials: {
    email: string;
    arqId: string;
    temporaryPassword: string | null;
  };
};

export type ListAdminStudentsQuery = {
  programId?: string;
  educatorId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

function adminStudentsQuery(q: ListAdminStudentsQuery = {}): string {
  const params = new URLSearchParams();
  if (q.programId) params.set("programId", q.programId);
  if (q.educatorId) params.set("educatorId", q.educatorId);
  if (q.search) params.set("search", q.search);
  if (q.limit != null) params.set("limit", String(q.limit));
  if (q.offset != null) params.set("offset", String(q.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function listAdminStudents(query: ListAdminStudentsQuery = {}) {
  return api<AdminStudent[]>(
    `/api/admin/students${adminStudentsQuery(query)}`,
    { skipAuthRedirect: false }
  );
}

export async function enrollAdminStudent(body: AdminEnrollStudentPayload) {
  return api<AdminEnrollStudentResult>("/api/admin/students", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function updateAdminStudent(
  id: string,
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    academicLevel?: string | null;
    phone?: string | null;
    classId?: string | null;
    programId?: string | null;
    educatorId?: string | null;
    active?: boolean;
    guardian?: {
      fullName: string;
      phone?: string;
      email?: string;
      relationship?: string;
    };
  }
) {
  return api<AdminStudent>(`/api/admin/students/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

/** Soft-delete: deactivates the user */
export async function deactivateAdminStudent(id: string) {
  return api<{ message: string; student: AdminStudent }>(
    `/api/admin/students/${id}`,
    { method: "DELETE", skipAuthRedirect: false }
  );
}


/* ============================================================
   ADMIN — Question bank
   ============================================================ */

export type QuestionType = "multiple_choice" | "fill_blank";

// export type BankQuestion = {
//   id: string;
//   topicId: string;
//   topicTitle: string;
//   subjectId: string | null;
//   subjectTitle: string | null;
//   type: QuestionType;
//   text: string;
//   options: string[] | null;
//   correctIndex: number | null;
//   acceptedAnswers: string[] | null;
//   feedback: string | null;
//   isActive: boolean;
//   createdAt?: string;
//   updatedAt?: string;
// };

export type ListQuestionsResult = {
  items: BankQuestion[];
  total: number;
  limit: number;
  offset: number;
};

export type ListQuestionsQuery = {
  subjectId?: string;
  topicId?: string;
  type?: QuestionType;
  search?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
};

 
export type CurriculumSubject = {
  id: string;
  title?: string;
  name?: string; // some call sites read .name instead of .title defensively
  description?: string | null;
};
 

function questionsQuery(q: ListQuestionsQuery = {}): string {
  const p = new URLSearchParams();
  if (q.subjectId) p.set("subjectId", q.subjectId);
  if (q.topicId) p.set("topicId", q.topicId);
  if (q.type) p.set("type", q.type);
  if (q.search) p.set("search", q.search);
  if (q.includeInactive) p.set("includeInactive", "true");
  if (q.limit != null) p.set("limit", String(q.limit));
  if (q.offset != null) p.set("offset", String(q.offset));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function listBankQuestions(query: ListQuestionsQuery = {}) {
  return api<ListQuestionsResult>(
    `/api/admin/questions${questionsQuery(query)}`,
    { skipAuthRedirect: false }
  );
}

export async function getBankQuestion(id: string) {
  return api<BankQuestion>(`/api/admin/questions/${id}`, {
    skipAuthRedirect: false,
  });
}

// export type CreateBankQuestionPayload =
//   | {
//       type: "multiple_choice";
//       topicId: string;
//       text: string;
//       options: string[];
//       correctIndex: number;
//       feedback?: string;
//     }
//   | {
//       type: "fill_blank";
//       topicId: string;
//       text: string;
//       acceptedAnswers: string[];
//       feedback?: string;
//     };

export async function createBankQuestion(body: CreateBankQuestionPayload) {
  return api<BankQuestion>("/api/admin/questions", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function updateBankQuestion(
  id: string,
  body: UpdateBankQuestionPayload
) {
  return api<BankQuestion>(`/api/admin/questions/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

/** Soft-delete (archive) */
export async function archiveBankQuestion(id: string) {
  return api<{ message: string; question: BankQuestion }>(
    `/api/admin/questions/${id}`,
    { method: "DELETE", skipAuthRedirect: false }
  );
}

export type QuestionCoverage = {
  topics: Array<{
    topicId: string;
    sequenceOrder: number;
    title: string;
    subjectTitle: string | null;
    questionCount: number;
  }>;
  totalQuestions: number;
};

export async function getQuestionCoverage(programmeId: string) {
  return api<QuestionCoverage>(
    `/api/admin/questions/coverage?programmeId=${encodeURIComponent(programmeId)}`,
    { skipAuthRedirect: false }
  );
}
/** Daily summary upload for a scheduled learning day */
// export async function uploadSessionSummary(
//   scheduledSessionId: string,
//   file: File
// ) {
//   const API_BASE =
//     process.env.NEXT_PUBLIC_API_BASE_URL ??
//     (typeof window !== "undefined"
//       ? "/backend"
//       : "https://arq-lesson-teacher-back-end.onrender.com");

//   const form = new FormData();
//   form.append("file", file);
//   form.append("scheduledSessionId", scheduledSessionId);
//   // form.append("kind", "summary"); // if your API expects it

//   const res = await fetch(
//     `${API_BASE}/api/students/me/sessions/${scheduledSessionId}/summary`,
//     {
//       method: "POST",
//       credentials: "include",
//       body: form,
//       // do NOT set Content-Type — browser sets multipart boundary
//     }
//   );

//   if (!res.ok) {
//     let message = res.statusText;
//     try {
//       const body = await res.json();
//       message = (body as { message?: string }).message || message;
//     } catch {
//       /* ignore */
//     }
//     throw new ApiError(res.status, message);
//   }
//   return res.json() as Promise<{
//     id?: string;
//     url?: string;
//     fileName?: string;
//   }>;
// }

export async function uploadSessionSummary(
  learningPlanId: string,
  scheduledDate: string, // YYYY-MM-DD — session.scheduledDate
  file: File
) {
  return uploadAndAttachDailySubmissionFile(learningPlanId, scheduledDate, file);
}
 


export async function submitInteraction(body: {
  interactiveElementId: string;
  scheduledSessionId: string;
  response: Record<string, unknown>;
}) {
  return api<{
    isCorrect: boolean;
    scoreAwarded: number;
    attemptNumber: number;
  }>("/api/students/me/submissions", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function getStudentPresignedUploadUrl(
  fileName: string,
  contentType: string
) {
  return api<{ uploadUrl: string; publicUrl: string; key: string }>(
    "/api/students/me/files/presigned-upload-url",
    {
      method: "POST",
      body: { fileName, contentType },
      skipAuthRedirect: false,
    }
  );
}

/** Presign → PUT R2 → returns publicUrl for submitInteraction file_upload */
export async function uploadStudentFileToR2(file: File) {
  const { uploadUrl, publicUrl, key } = await getStudentPresignedUploadUrl(
    file.name,
    file.type || "application/octet-stream"
  );
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Upload to storage failed");
  return { publicUrl, key, fileName: file.name };
}


// Create programme plan body — add duration
export type CreateProgrammePlanPayload = {
  programmeId: string;
  weeks: number;
  quizDay: "friday" | "saturday";
  quizSize: number;
  startDate: string; // Monday YYYY-MM-DD
  requireCorrectAnswersToProgress?: boolean;
  quizDurationMinutes?: number | null; // NEW — null/omit = untimed
};

export async function createStudentProgrammePlan(
  studentId: string,
  body: CreateProgrammePlanPayload
) {
  return api<CreateProgrammePlanResult>(
    `/api/admin/students/${studentId}/learning-plan`,
    {
      method: "POST",
      body,
      skipAuthRedirect: false,
    }
  );
}

// Question bank — include imageUrl
export type BankQuestion = {
  id: string;
  topicId: string;
  topicTitle: string;
  subjectId: string | null;
  subjectTitle: string | null;
  type: "multiple_choice" | "fill_blank";
  text: string;
  imageUrl?: string | null; // NEW
  options: string[] | null;
  correctIndex: number | null;
  acceptedAnswers: string[] | null;
  feedback: string | null;
  isActive: boolean;
};

export type CreateBankQuestionPayload =
  | {
      type: "multiple_choice";
      topicId: string;
      text: string;
      options: string[];
      correctIndex: number;
      feedback?: string;
      imageUrl?: string | null;
    }
  | {
      type: "fill_blank";
      topicId: string;
      text: string;
      acceptedAnswers: string[];
      feedback?: string;
      imageUrl?: string | null;
    };

export type UpdateBankQuestionPayload = {
  topicId?: string;
  text?: string;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  feedback?: string | null;
  isActive?: boolean;
  imageUrl?: string | null; // NEW
};


/* ============================================================
   STUDENT — Weekly quizzes
   Paste into lib/api.ts
   ============================================================ */

export type MyWeeklyQuiz = {
  id: string;
  weekNumber: number;
  scheduledDate: string; // YYYY-MM-DD
  status: "pending" | "submitted";
  requestedSize: number;
  score: number | null;
  submittedAt: string | null;
  totalQuestions: number;
};

export type WeeklyQuizQuestion = {
  id: string;
  orderIndex: number;
  type: "multiple_choice" | "fill_blank";
  text: string;
  imageUrl?: string | null;
  options: string[] | null;
  myAnswer: { selectedIndex?: number | null; answerText?: string | null } | null;
  // Only present once the quiz is submitted:
  correctIndex?: number | null;
  acceptedAnswers?: string[] | null;
  feedback?: string | null;
  isCorrect?: boolean;
  scoreAwarded?: number;
};

export type WeeklyQuizDetail = {
  id: string;
  learningPlanId: string;
  weekNumber: number;
  scheduledDate: string;
  status: "pending" | "submitted";
  score: number | null;
  submittedAt: string | null;
  // Only present if the duration/timer patch was applied on the backend:
  durationMinutes?: number | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  questions: WeeklyQuizQuestion[];
};

/** History: every week's quiz, status and score */
export async function listMyWeeklyQuizzes(learningPlanId: string) {
  return api<MyWeeklyQuiz[]>(`/api/students/me/quizzes/plan/${learningPlanId}`, {
    skipAuthRedirect: false,
  });
}

/** Not submitted: questions only. Submitted: answers + feedback revealed. */
export async function getMyWeeklyQuiz(weeklyQuizId: string) {
  return api<WeeklyQuizDetail>(`/api/students/me/quizzes/${weeklyQuizId}`, {
    skipAuthRedirect: false,
  });
}

export async function saveWeeklyQuizAnswer(
  weeklyQuizId: string,
  questionId: string,
  answer: { selectedIndex?: number; answerText?: string }
) {
  // send ONE key only: selectedIndex (multiple choice) or answerText (fill blank)
  const body =
    answer.selectedIndex !== undefined
      ? { selectedIndex: answer.selectedIndex }
      : { answerText: answer.answerText ?? "" };
  return api<{ saved: boolean }>(
    `/api/students/me/quizzes/${weeklyQuizId}/answers/${questionId}`,
    { method: "PUT", body, skipAuthRedirect: false }
  );
}

/** Grades everything at once and returns the revealed detail */
export async function submitWeeklyQuiz(weeklyQuizId: string) {
  return api<WeeklyQuizDetail>(`/api/students/me/quizzes/${weeklyQuizId}/submit`, {
    method: "POST",
    skipAuthRedirect: false,
  });
}

/* ============================================================
   STUDENT — Daily summary note + files
   ============================================================ */

export type DailySubmissionTopic = {
  learningPlanTopicId: string;
  topicId: string;
  title: string;
  subjectTitle: string | null;
  summaryFormat: { header: string; body: string }[] | null;
};

export type DailySubmissionFile = {
  id: string;
  fileUrl: string;
  fileKey: string | null;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export type DailySubmissionDay = {
  id: string | null; // null until the student first saves something
  learningPlanId: string;
  forDate: string; // YYYY-MM-DD
  status: "not_started" | "draft" | "submitted";
  summaryNote: string | null;
  submittedAt: string | null;
  topics: DailySubmissionTopic[];
  files: DailySubmissionFile[];
};

export type ListDailySubmissionsQuery = {
  learningPlanId?: string;
  topicId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
};

function dailySubmissionsQuery(q: ListDailySubmissionsQuery = {}): string {
  const p = new URLSearchParams();
  if (q.learningPlanId) p.set("learningPlanId", q.learningPlanId);
  if (q.topicId) p.set("topicId", q.topicId);
  if (q.from) p.set("from", q.from);
  if (q.to) p.set("to", q.to);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function listDailySubmissions(query: ListDailySubmissionsQuery = {}) {
  return api<DailySubmissionDay[]>(
    `/api/students/me/daily-submissions${dailySubmissionsQuery(query)}`,
    { skipAuthRedirect: false }
  );
}

export async function getDailySubmission(learningPlanId: string, date: string) {
  return api<DailySubmissionDay>(
    `/api/students/me/daily-submissions/${learningPlanId}/${date}`,
    { skipAuthRedirect: false }
  );
}

export async function saveDailySummaryNote(
  learningPlanId: string,
  date: string,
  summaryNote: string
) {
  return api<DailySubmissionDay>(
    `/api/students/me/daily-submissions/${learningPlanId}/${date}`,
    { method: "PUT", body: { summaryNote }, skipAuthRedirect: false }
  );
}

// Attach files already uploaded via your existing presigned-upload endpoints
// (getStudentPresignedUploadUrl / getStudentBatchPresignedUploadUrls). This
// only records the resulting URL against the day — it does not upload anything itself.
export async function addDailySubmissionFiles(
  learningPlanId: string,
  date: string,
  files: Array<{
    fileUrl: string;
    fileKey?: string;
    fileName: string;
    contentType?: string;
    sizeBytes?: number;
  }>
) {
  return api<DailySubmissionDay>(
    `/api/students/me/daily-submissions/${learningPlanId}/${date}/files`,
    { method: "POST", body: { files }, skipAuthRedirect: false }
  );
}

export async function removeDailySubmissionFile(
  learningPlanId: string,
  date: string,
  fileId: string
) {
  return api<DailySubmissionDay>(
    `/api/students/me/daily-submissions/${learningPlanId}/${date}/files/${fileId}`,
    { method: "DELETE", skipAuthRedirect: false }
  );
}

export async function submitDailySubmission(learningPlanId: string, date: string) {
  return api<DailySubmissionDay>(
    `/api/students/me/daily-submissions/${learningPlanId}/${date}/submit`,
    { method: "POST", skipAuthRedirect: false }
  );
}

// Convenience: upload a real File object end-to-end using your existing
// presign flow, then attach it to the day in one call.
export async function uploadAndAttachDailySubmissionFile(
  learningPlanId: string,
  date: string,
  file: File
) {
  const { uploadUrl, publicUrl, key } = await getStudentPresignedUploadUrl(
    file.name,
    file.type || "application/octet-stream"
  );

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Failed to upload file to storage");

  return addDailySubmissionFiles(learningPlanId, date, [
    {
      fileUrl: publicUrl,
      fileKey: key,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    },
  ]);
}

/* ============================================================
   EDUCATOR / ADMIN — Daily submissions (read + reopen)
   ============================================================ */

export async function listEducatorStudentDailySubmissions(
  studentId: string,
  query: ListDailySubmissionsQuery = {}
) {
  return api<DailySubmissionDay[]>(
    `/api/educators/students/${studentId}/daily-submissions${dailySubmissionsQuery(query)}`,
    { skipAuthRedirect: false }
  );
}

export async function reopenStudentDailySubmission(
  studentId: string,
  submissionId: string
) {
  return api<DailySubmissionDay>(
    `/api/educators/students/${studentId}/daily-submissions/${submissionId}/reopen`,
    { method: "POST", skipAuthRedirect: false }
  );
}

export async function listAdminStudentDailySubmissions(
  studentId: string,
  query: ListDailySubmissionsQuery = {}
) {
  return api<DailySubmissionDay[]>(
    `/api/admin/students/${studentId}/daily-submissions${dailySubmissionsQuery(query)}`,
    { skipAuthRedirect: false }
  );
}

export async function reopenAdminStudentDailySubmission(
  studentId: string,
  submissionId: string
) {
  return api<DailySubmissionDay>(
    `/api/admin/students/${studentId}/daily-submissions/${submissionId}/reopen`,
    { method: "POST", skipAuthRedirect: false }
  );
}


/* ============================================================
   Additions to lib/api.ts for the GafiaPay temporal-account flow.
   ============================================================ */

export type VirtualAccount = {
  accountNumber: string;
  accountName?: string;
  bankName?: string;
  expiresAt?: string; // ISO datetime
};

/** Create invoice — price computed server-side from topic count.
 *  Replaces the existing initiateStudentPayment in lib/api.ts (same name,
 *  wider return type — nothing else about the call changes). */
export async function initiateStudentPayment(learningPlanId: string) {
  return api<{
    message?: string;
    paymentId?: string;
    payment?: StudentPayment;
    redirectUrl?: string | null;
    virtualAccount?: VirtualAccount;
  }>("/api/students/payments/initiate", {
    method: "POST",
    body: { learningPlanId },
    skipAuthRedirect: false,
  });
}

/** Cheap polling target — status only, no full row. */
export async function getStudentPaymentStatus(paymentId: string) {
  return api<{ status: "pending" | "success" | "failed" | "refunded"; paidAt: string | null }>(
    `/api/students/payments/${paymentId}/status`,
    { skipAuthRedirect: false }
  );
}


export type ProgrammePrice = {
  id: string;
  programmeId: string;
  label: string | null;
  priceNaira: number;
  isActive: boolean;
  createdAt: string;
};

export async function listProgrammePrices(programmeId: string) {
  return api<ProgrammePrice[]>(`/api/admin/programme-prices/programme/${programmeId}`, {
    skipAuthRedirect: false,
  });
}

export async function createProgrammePrice(body: {
  programmeId: string;
  priceNaira: number;
  label?: string;
  isActive?: boolean;
}) {
  return api<ProgrammePrice>("/api/admin/programme-prices", {
    method: "POST",
    body,
    skipAuthRedirect: false,
  });
}

export async function updateProgrammePrice(
  id: string,
  body: { priceNaira?: number; label?: string | null; isActive?: boolean }
) {
  return api<ProgrammePrice>(`/api/admin/programme-prices/${id}`, {
    method: "PATCH",
    body,
    skipAuthRedirect: false,
  });
}

// GET /api/admin/students/:studentId/full-profile
export async function getAdminStudentFullProfile(studentId: string) {
  return api<AdminStudentFullProfile>(
    `/api/admin/students/${studentId}/full-profile`,
    { skipAuthRedirect: false }
  );
}

// GET /api/admin/students/:studentId/files
export type AdminStudentFile = {
  id: string;
  dailySubmissionId: string;
  fileUrl: string;
  fileKey: string | null;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export async function getAdminStudentFiles(studentId: string) {
  return api<AdminStudentFile[]>(
    `/api/admin/students/${studentId}/files`,
    { skipAuthRedirect: false }
  );
}

// POST /api/admin/students/:studentId/learning-plan
export type CreateProgrammeLearningPlanPayload = {
  programmeId: string;
  weeks: number;
  quizDay: "friday" | "saturday";
  quizSize: number;
  quizDurationMinutes?: number;
  startDate: string;
  requireCorrectAnswersToProgress?: boolean;
};

export type CreateProgrammeLearningPlanResponse = {
  plan: Record<string, any>;
  paymentId: string;
  amountNaira: number;
};

export async function createAdminStudentLearningPlan(
  studentId: string,
  payload: CreateProgrammeLearningPlanPayload
) {
  return api<CreateProgrammeLearningPlanResponse>(
    `/api/admin/students/${studentId}/learning-plan`,
    {
      method: "POST",
      body: payload, // api() already JSON.stringifies — do NOT stringify here
      skipAuthRedirect: false,
    }
  );
}
