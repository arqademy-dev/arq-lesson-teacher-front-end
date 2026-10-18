"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/layout/AdminShell";
import { DayFeedbackUpload } from "@/components/admin/DayFeedbackUpload";
import {
  listAdminStudents,
  listProgrammes,
  listAllClasses,
  getAdminStudentProgrammePlan,
  listAdminStudentDailySubmissions,
  listAdminWeeklyQuizzes,
  ApiError,
  type AdminStudent,
  type Programme,
  type CurriculumClass,
  type DailySubmissionDay,
  type AdminDailySubmissionFile,
  type WeeklyQuizSummary,
} from "@/lib/api";
import {
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

function isImage(contentType: string | null) {
  return !!contentType && contentType.startsWith("image/");
}

export default function AdminAssessmentsPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [classes, setClasses] = useState<CurriculumClass[]>([]);
  const [programId, setProgramId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [days, setDays] = useState<DailySubmissionDay[]>([]);
  const [quizzes, setQuizzes] = useState<WeeklyQuizSummary[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  useEffect(() => {
    listProgrammes({ status: "published", limit: 100 }).then((p) => setProgrammes(Array.isArray(p) ? p : [])).catch(() => {});
    listAllClasses().then((c) => setClasses(Array.isArray(c) ? c : [])).catch(() => {});
  }, []);

  const loadStudents = useCallback(() => {
    setLoadingStudents(true);
    listAdminStudents({ programId: programId || undefined, search: search.trim() || undefined, limit: 100 })
      .then((list) => setStudents(Array.isArray(list) ? list : []))
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Failed to load students"))
      .finally(() => setLoadingStudents(false));
  }, [programId, search]);

  useEffect(() => {
    const t = setTimeout(loadStudents, 200);
    return () => clearTimeout(t);
  }, [loadStudents]);

  // classId filtering is client-side for now (list endpoint's classId support
  // may not be deployed yet — this keeps the page working either way)
  const visibleStudents = useMemo(
    () => (classId ? students.filter((s) => s.classId === classId) : students),
    [students, classId]
  );

  async function openStudent(student: AdminStudent) {
    setSelected(student);
    setOpenDay(null);
    setLoadingDetail(true);
    setDays([]);
    setQuizzes([]);
    try {
      const { plan } = await getAdminStudentProgrammePlan(student.id);
      setPlanId(plan.id);
      const [dayList, quizList] = await Promise.all([
        listAdminStudentDailySubmissions(student.id, { learningPlanId: plan.id }),
        listAdminWeeklyQuizzes(plan.id).catch(() => []),
      ]);
      setDays(Array.isArray(dayList) ? dayList : []);
      setQuizzes(Array.isArray(quizList) ? quizList : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPlanId(null);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to load student activity");
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleAttached(dayForDate: string, adminFiles: AdminDailySubmissionFile[]) {
    setDays((prev) => prev.map((d) => (d.forDate === dayForDate ? { ...d, adminFiles } : d)));
    toast.success("Report attached");
  }

  return (
    <AdminShell title="Assessments" subtitle="Arqademy" onLogout={() => (window.location.href = "/admin/login")}>
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Student picker */}
        <aside className="card border border-[var(--line)] overflow-hidden h-fit">
          <div className="p-4 space-y-3 border-b border-[var(--line)]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-9 pr-3 py-2 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm"
              />
            </div>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm font-semibold"
            >
              <option value="">All programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--r-card)] bg-[var(--surface)] text-sm font-semibold"
            >
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loadingStudents ? (
              <div className="p-6 flex items-center justify-center gap-2 text-[var(--ink-3)] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : visibleStudents.length === 0 ? (
              <p className="p-6 text-sm text-[var(--ink-3)] text-center">No students match.</p>
            ) : (
              visibleStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openStudent(s)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-[var(--line-soft)] last:border-0 transition-colors",
                    selected?.id === s.id ? "bg-[var(--brand-soft)]" : "hover:bg-[var(--surface-2)]"
                  )}
                >
                  <div className="text-sm font-bold text-[var(--ink)]">{s.firstName} {s.lastName}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{s.programmeTitle ?? s.className ?? "—"}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Detail */}
        <div className="space-y-6">
          {!selected ? (
            <div className="card border border-dashed border-[var(--line)] p-16 text-center text-[var(--ink-3)]">
              Select a student to review their daily submissions and quizzes.
            </div>
          ) : loadingDetail ? (
            <div className="card border border-[var(--line)] p-16 text-center text-[var(--ink-3)]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : !planId ? (
            <div className="card border border-[var(--line)] p-10 text-center text-[var(--ink-3)]">
              {selected.firstName} has no learning plan yet.
            </div>
          ) : (
            <>
              {/* Quizzes */}
              <section className="card border border-[var(--line)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--surface-3)]">
                  <h3 className="font-heading text-base font-semibold">Weekly quizzes</h3>
                </div>
                {quizzes.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-[var(--ink-3)]">No quizzes yet.</p>
                ) : (
                  <ul>
                    {quizzes.map((q) => (
                      <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--line-soft)] last:border-0">
                        <span className="text-sm font-semibold">
                          Week {q.weekNumber} · {q.scheduledDate}
                        </span>
                        <span className="text-xs text-[var(--ink-3)]">
                          {q.status === "submitted" ? `Score ${q.score}/${q.totalQuestions}` : "Not taken"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Daily submissions */}
              <section className="card border border-[var(--line)] overflow-hidden">
                <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--surface-3)]">
                  <h3 className="font-heading text-base font-semibold">Daily submissions</h3>
                </div>
                {days.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-[var(--ink-3)]">No submissions yet.</p>
                ) : (
                  days.map((day) => {
                    const open = openDay === day.forDate;
                    return (
                      <div key={day.forDate} className="border-b border-[var(--line-soft)] last:border-0">
                        <button
                          type="button"
                          onClick={() => setOpenDay(open ? null : day.forDate)}
                          className="w-full flex items-center justify-between gap-3 px-5 py-3 hover:bg-[var(--surface-2)]"
                        >
                          <div className="text-left">
                            <div className="text-sm font-bold">{day.forDate}</div>
                            <div className="text-[11px] text-[var(--ink-3)]">
                              {day.topics.map((t) => t.title).join(", ") || "No topics"} ·{" "}
                              {day.files.length} file{day.files.length === 1 ? "" : "s"} ·{" "}
                              {day.status}
                            </div>
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-[var(--ink-3)] transition-transform", open && "rotate-180")} />
                        </button>

                        {open && (
                          <div className="px-5 pb-4 space-y-4">
                            {day.summaryNote && (
                              <p className="text-[13px] text-[var(--ink-2)] bg-[var(--surface-2)] rounded-[10px] p-3">
                                {day.summaryNote}
                              </p>
                            )}

                            <div>
                              <p className="text-[11px] font-bold uppercase text-[var(--ink-3)] mb-1.5">Student files</p>
                              {day.files.length === 0 ? (
                                <p className="text-[12px] text-[var(--ink-3)]">None submitted.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {day.files.map((f) => (
                                    <a
                                      key={f.id}
                                      href={f.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--brand)] hover:underline"
                                    >
                                      {isImage(f.contentType) ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                      {f.fileName}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="text-[11px] font-bold uppercase text-[var(--ink-3)] mb-1.5">Your report for this day</p>
                              <DayFeedbackUpload
                                studentId={selected.id}
                                learningPlanId={planId}
                                date={day.forDate}
                                existing={day.adminFiles}
                                onAttached={(files) => handleAttached(day.forDate, files)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}