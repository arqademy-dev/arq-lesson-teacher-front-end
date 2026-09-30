"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  listAdminStudents,
  listProgrammes,
  type Programme,
  type AdminStudent,
  ApiError,
} from "@/lib/api";
import {
  Loader2,
  Search,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [search, setSearch] = useState("");
  const [programmeFilter, setProgrammeFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [studentData, programmeData] = await Promise.all([
          listAdminStudents({ limit: 100 }),
          listProgrammes({ limit: 100 }),
        ]);

        if (!cancelled) {
          setStudents(Array.isArray(studentData) ? studentData : []);
          setProgrammes(Array.isArray(programmeData) ? programmeData : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? `${err.status}: ${err.message}`
              : err instanceof Error
                ? err.message
                : "Failed to load students"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesProgramme =
        programmeFilter === "all" ||
        String(student.programId ?? "") === programmeFilter;

      if (!matchesProgramme) return false;

      if (!q) return true;

      const searchable = [
        student.firstName,
        student.lastName,
        student.email,
        student.arqId,
        student.phone,
        student.className,
        student.programmeTitle,
        student.academicLevel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [students, search, programmeFilter]);

  const programmeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    students.forEach((student) => {
      if (!student.programId) return;
      counts[student.programId] = (counts[student.programId] || 0) + 1;
    });

    return counts;
  }, [students]);

  return (
    <AdminShell
      title="Students"
      subtitle="Arqademy Academy"
      pendingCount={0}
      onLogout={() => {
        window.location.href = "/admin/login";
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-heading text-[20px] text-[var(--ink)] mb-1">
            Student directory
          </h2>
          <p className="text-[13px] text-[var(--ink-3)]">
            View and manage students enrolled across your programmes.
          </p>
        </div>

        {!loading && !error && (
          <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-[var(--shadow-sm)]">
            <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
              Total students
            </div>
            <div className="font-heading text-[20px] font-semibold mt-0.5 text-[var(--ink)] tabular-nums">
              {students.length}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[240px] max-w-[500px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-3)]" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ARQ ID, phone..."
            className="w-full h-10 pl-9 pr-3 rounded-[9px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--brand)]"
          />
        </div>

        <select
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
          className="h-10 px-3 rounded-[9px] border border-[var(--line)] bg-[var(--surface)] text-[12.5px] font-semibold text-[var(--ink)] outline-none focus:border-[var(--brand)]"
        >
          <option value="all">All programmes</option>

          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.title}
              {programmeCounts[programme.id]
                ? ` (${programmeCounts[programme.id]})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 text-[13px] text-[var(--danger)] font-semibold">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-[13px] text-[var(--ink-3)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading students…
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="rounded-[var(--r-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Student
                  </th>

                  <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Programme
                  </th>

                  <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Academic level
                  </th>

                  <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Class
                  </th>

                  <th className="text-left px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    Enrolled
                  </th>

                  <th className="text-right px-4 py-2.5 text-[9.5px] font-bold tracking-[0.14em] uppercase text-[var(--ink-3)]">
                    View
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-14 text-center text-[var(--ink-3)]"
                    >
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />

                      {students.length === 0
                        ? "No students found."
                        : "No students match your search or filter."}
                    </td>
                  </tr>
                )}

                {filteredStudents.map((student) => {
                  const fullName =
                    [student.firstName, student.lastName]
                      .filter(Boolean)
                      .join(" ") || "Unnamed student";

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-[var(--line-soft)] last:border-0 hover:bg-[var(--surface-2)]"
                    >
                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-[var(--ink)] text-[12.5px]">
                          {fullName}
                        </div>

                        <div className="text-[11px] text-[var(--ink-3)] mt-1 space-y-0.5">
                          {student.email && <div>{student.email}</div>}

                          {student.arqId && (
                            <div className="font-mono text-[var(--ink-4)]">
                              {student.arqId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Programme */}
                      <td className="px-4 py-3.5">
                        {student.programmeTitle ? (
                          <>
                            <div className="font-semibold text-[var(--ink)]">
                              {student.programmeTitle}
                            </div>

                            {student.programmeStatus && (
                              <span
                                className={cn(
                                  "inline-flex mt-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold capitalize",
                                  student.programmeStatus === "published"
                                    ? "bg-[var(--ok-soft)] text-[var(--ok)]"
                                    : "bg-[var(--surface-3)] text-[var(--ink-3)]"
                                )}
                              >
                                {student.programmeStatus}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[var(--ink-4)]">—</span>
                        )}
                      </td>

                      {/* Academic level */}
                      <td className="px-4 py-3.5">
                        <span className="text-[var(--ink-2)]">
                          {student.academicLevel || "—"}
                        </span>
                      </td>

                      {/* Class */}
                      <td className="px-4 py-3.5">
                        <span className="text-[var(--ink-2)]">
                          {student.className || "—"}
                        </span>
                      </td>

                      {/* Enrollment */}
                      <td className="px-4 py-3.5">
                        <span className="text-[var(--ink-2)]">
                          {student.enrollmentDate
                            ? new Date(
                                student.enrollmentDate
                              ).toLocaleDateString()
                            : "—"}
                        </span>
                      </td>

                      {/* View */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                        <Link
                            href={`/admin/students/${student.id}/profile`}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[7px] text-[11px] font-bold text-[var(--brand)] hover:bg-[var(--surface-2)]"
                          >
                            Profile
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                            href={`/admin/students/${student.id}/reports`}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[7px] text-[11px] font-bold text-[var(--brand)] hover:bg-[var(--surface-2)]"
                          >
                            Report
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {filteredStudents.length > 0 && (
            <div className="px-4 py-3 border-t border-[var(--line)] text-[11px] text-[var(--ink-3)]">
              Showing{" "}
              <span className="font-semibold text-[var(--ink-2)]">
                {filteredStudents.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[var(--ink-2)]">
                {students.length}
              </span>{" "}
              students
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
