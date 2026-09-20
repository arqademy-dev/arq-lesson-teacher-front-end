import { topicCode, type PlanDay } from "@/lib/plan";

const TYPE_STYLE = {
  learning: { label: "Learning", cls: "bg-[var(--brand-soft-2)] text-[var(--brand)]" },
  revision: { label: "Revision", cls: "bg-[var(--warn-soft)] text-[var(--warn)]" },
  quiz: { label: "Quiz", cls: "bg-[var(--accent-blue-soft)] text-[var(--ink)]" },
} as const;

export function PlanTable({ days }: { days: PlanDay[] }) {
  const weeks = Array.from(new Set(days.map((d) => d.week)));

  return (
    <div className="space-y-6">
      {weeks.map((week) => {
        const rows = days.filter((d) => d.week === week);
        const topicCount = rows.find((d) => d.type === "quiz")?.topics.length ?? 0;

        return (
          <section key={week} className="card border border-[var(--line)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--surface-3)]">
              <h3 className="font-heading text-lg font-semibold">Week {week}</h3>
              <span className="text-xs text-[var(--ink-3)] font-semibold">
                {topicCount} topic{topicCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] w-32">
                      Day
                    </th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      Assigned workload
                    </th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-3)] w-32">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => {
                    const style = TYPE_STYLE[d.type];
                    return (
                      <tr
                        key={`${d.week}-${d.day}`}
                        className={`border-b border-[var(--line-soft)] last:border-0 ${
                          d.type === "quiz" ? "bg-[var(--surface-2)]" : ""
                        }`}
                      >
                        <td className="px-6 py-4 align-top">
                          <div className="font-semibold text-[var(--ink)]">{d.dayName}</div>
                          <div className="text-[11px] text-[var(--ink-3)]">Day {d.day}</div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          {d.type === "learning" &&
                            d.topics.map((t) => (
                              <div key={t.id} className="mb-1.5 last:mb-0">
                                <div className="font-medium text-[var(--ink)]">{t.topic}</div>
                                <div className="text-[11px] text-[var(--ink-3)]">{t.subject}</div>
                              </div>
                            ))}

                          {d.type === "revision" && (
                            <div className="text-[var(--ink-3)]">
                              Catch-up and revision. No new topic.
                            </div>
                          )}

                          {d.type === "quiz" && (
                            <>
                              <div className="font-semibold text-[var(--ink)]">
                                Weekly quiz • {d.quizSize} questions
                              </div>
                              <div className="text-[11px] text-[var(--ink-3)] mt-0.5">
                                Covers:{" "}
                                {d.topics.length
                                  ? d.topics.map((t) => topicCode(t.topic)).join(" · ")
                                  : "all previous topics"}
                              </div>
                            </>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${style.cls}`}
                          >
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}