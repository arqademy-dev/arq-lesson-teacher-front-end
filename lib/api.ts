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
  return api("/api/students/me", { skipAuthRedirect: true });
}

export async function getStudentDashboard() {
  return api("/api/students/me/dashboard", { skipAuthRedirect: true });
}

export async function getCurrentSession() {
  return api("/api/students/me/current-session", { skipAuthRedirect: true });
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
    skipAuthRedirect: true,
  });
}

export async function educatorLogin(payload: EducatorLoginPayload) {
  return api("/api/users/login", {
    method: "POST",
    body: payload,
    skipAuthRedirect: true,
  });
}

export async function educatorLogout() {
  return api("/api/users/logout", {
    method: "POST",
    skipAuthRedirect: true,
  });
}

export async function getEducatorMe() {
  return api<EducatorProfile>("/api/users/me", { skipAuthRedirect: true });
}

export async function getEducatorDashboard() {
  return api("/api/educators/dashboard/summary", { skipAuthRedirect: true });
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
    skipAuthRedirect: true,
  });
}

export async function listAllEducators() {
  return api<AdminEducator[]>("/api/admin/educators", {
    skipAuthRedirect: true,
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
  return api("/api/admin/dashboard/summary", { skipAuthRedirect: true });
}