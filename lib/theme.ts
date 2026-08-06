export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const v = localStorage.getItem("arq-theme");
  return v === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("arq-theme", theme);
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === "light" ? "dark" : "light";
  applyTheme(next);
  return next;
}