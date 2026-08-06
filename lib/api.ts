/**
 * Typed API client for Arqademy Lesson Teacher backend.
 * Always sends credentials (HTTP-only cookie auth).
 * Base URL points at the live Render deployment.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined" ? "/backend" : "https://arq-lesson-teacher-back-end.onrender.com");

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
  /** Skip redirect on 401 (useful for login page itself) */
  skipAuthRedirect?: boolean;
};

export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, skipAuthRedirect = false } =
    options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", // critical for cookie auth
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuthRedirect) {
    if (typeof window !== "undefined") {
      window.location.href = "/students/login";
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

/* ---------- Student-facing helpers ---------- */

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
  // return api("/api/students/me/dashboard");
  return api("/api/students/me/dashboard", {
    skipAuthRedirect: true, // show error on page instead of bouncing
  });
}

export async function getCurrentSession() {
  // return api("/api/students/me/current-session");
  return api("/api/students/me/current-session", {
    skipAuthRedirect: true,
  });
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