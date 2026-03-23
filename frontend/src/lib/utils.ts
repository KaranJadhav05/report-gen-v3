import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseAttendanceCSV(text: string) {
  const lines = text.split(/\r?\n/);
  let headerIdx = -1;
  let headers: string[] = [];
  const meta = {
    department: "Computer Engineering",
    academicYear: "",
    semester: "",
    dateRange: "",
  };

  for (let i = 0; i < lines.length; i++) {
    const row = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    if (row[0]?.includes("Department")) {
      meta.department = row[0].split(":")[1]?.trim() || meta.department;
      meta.academicYear = row[1]?.split(":")[1]?.trim() || "";
      meta.semester = row[2]?.split(":")[1]?.trim() || "";
    }
    if (row[0]?.toLowerCase().includes("attendance status"))
      meta.dateRange = row[0];
    if (row[0] === "Sr.No" || row.some((c) => c === "Name of the Student")) {
      headerIdx = i;
      headers = row;
      break;
    }
  }
  if (headerIdx === -1) return null;

  const subjectCols: { idx: number; name: string }[] = [];
  for (let j = 3; j < headers.length - 3; j++) {
    if (headers[j]) subjectCols.push({ idx: j, name: headers[j] });
  }

  const students: Student[] = [];
  for (let i = headerIdx + 2; i < lines.length; i++) {
    const row = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const srNo = Number(row[0]);
    if (!row[0] || isNaN(srNo)) continue;
    const name = row[2];
    const prn = row[1];
    if (!name || !prn) continue;

    const overallAtt =
      parseFloat(row[row.length - 1].replace("%", "").trim()) || 0;
    const overallTH =
      parseFloat(row[row.length - 3].replace("%", "").trim()) || 0;
    const overallPR =
      parseFloat(row[row.length - 2].replace("%", "").trim()) || 0;

    const subjects: Subject[] = subjectCols
      .map((col) => {
        const raw = row[col.idx];
        const value =
          !raw || raw === "-" ? null : parseFloat(raw.replace("%", "").trim());
        const isTheory =
          /[-_]TH$/i.test(col.name) ||
          (!/[-_]PR$/i.test(col.name) && !/LAB/i.test(col.name));
        return { name: col.name, value, isTheory };
      })
      .filter((s) => s.value !== null) as Subject[];

    students.push({
      srNo,
      prn,
      name,
      overallAtt,
      overallTH,
      overallPR,
      subjects,
    });
  }

  const avg = students.length
    ? students.reduce((a, s) => a + s.overallAtt, 0) / students.length
    : 0;
  return {
    students,
    meta,
    totalStudents: students.length,
    averageAttendance: +avg.toFixed(2),
  };
}

export interface Subject {
  name: string;
  value: number;
  isTheory: boolean;
}
export interface Student {
  srNo: number;
  prn: string;
  name: string;
  overallAtt: number;
  overallTH: number;
  overallPR: number;
  subjects: Subject[];
}
export interface Report {
  _id: string;
  sheetName: string;
  totalStudents: number;
  averageAttendance: number;
  uploadedAt: string;
  dateRange: string;
  fileUrl?: string;
  cloudinaryId?: string;
  students?: Student[];
}
