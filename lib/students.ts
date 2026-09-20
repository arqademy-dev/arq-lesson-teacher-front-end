export type StudentStatus = "Active" | "Pending" | "Completed";

export type Student = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  programme: string;
  educator: string;
  progress: number;
  status: StudentStatus;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
};

export const PROGRAMMES = ["University Pathway Programme", "JSS3 → SS1", "Primary → Secondary"];
export const EDUCATORS = ["Grace Bello", "Michael John", "—"];

export const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  programme: PROGRAMMES[0],
  educator: EDUCATORS[0],
  parentName: "",
  parentPhone: "",
  parentEmail: "",
};

export type StudentForm = typeof EMPTY_FORM;

export const STATUS_STYLE: Record<StudentStatus, string> = {
  Active: "bg-[var(--ok-soft)] text-[var(--ok)]",
  Pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
  Completed: "bg-[var(--brand-soft-2)] text-[var(--brand)]",
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export const educatorLabel = (educator: string) => (educator === "—" ? "Unassigned" : educator);

export const SAMPLE_STUDENTS: Student[] = [
  {
    id: "s1",
    name: "Amina Yusuf",
    email: "amina.yusuf@email.com",
    phone: "+234 803 456 7890",
    programme: "University Pathway Programme",
    educator: "Grace Bello",
    progress: 72,
    status: "Active",
  },
  {
    id: "s2",
    name: "David James",
    email: "david.james@email.com",
    phone: "+234 807 123 4567",
    programme: "JSS3 → SS1",
    educator: "Michael John",
    progress: 45,
    status: "Active",
  },
  {
    id: "s3",
    name: "Mary Peter",
    programme: "University Pathway Programme",
    educator: "—",
    progress: 31,
    status: "Active",
  },
  {
    id: "s4",
    name: "Samuel Luka",
    email: "samuel.luka@email.com",
    phone: "+234 809 876 5432",
    programme: "University Pathway Programme",
    educator: "Grace Bello",
    progress: 91,
    status: "Active",
  },
];