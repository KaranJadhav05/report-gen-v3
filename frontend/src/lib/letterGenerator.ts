import type { Student } from "./utils";

export interface LetterConfig {
  classTeacher: string;
  coordinator: string;
  hod: string;
  department: string;
  academicYear: string;
  semester: string;
  division: string;
  year: string;
}

export const DEFAULT_CONFIG: LetterConfig = {
  classTeacher: "Mr. Ganesh Kadam",
  coordinator: "Mr. Atul Pawar",
  hod: "Dr. Sonali Patil",
  department: "Computer Engineering",
  academicYear: "2025–2026",
  semester: "I / II",
  division: "A",
  year: "B.Tech",
};

// ── Real PCCOE logo extracted from Borole_Druv.docx
import { PCCOE_LOGO_B64 } from "./pccoe_logo";

// ── Letter HTML generator ─────────────────────────────────────────────────
export function generateLetterHTML(
  student: Student,
  date: string,
  cfg: LetterConfig = DEFAULT_CONFIG,
): string {
  // Build merged subject rows
  const baseNames: string[] = [];
  const thMap: Record<string, number> = {};
  const prMap: Record<string, number> = {};

  student.subjects.forEach((s) => {
    const base = s.name
      .replace(/[-_\s]TH$/i, "")
      .replace(/[-_\s]PR$/i, "")
      .replace(/AL$/i, "")
      .trim();
    if (!baseNames.includes(base)) baseNames.push(base);
    if (s.isTheory) thMap[base] = s.value;
    else prMap[base] = s.value;
  });

  const rows = baseNames
    .map((base, idx) => {
      const th = thMap[base] != null ? thMap[base] : "";
      const pr = prMap[base] != null ? prMap[base] : "";
      const thLow = typeof th === "number" && th < 75;
      const prLow = typeof pr === "number" && pr < 75;
      return `<tr>
      <td style="border:1px solid #aaa;padding:5px 9px;text-align:center;">${idx + 1}</td>
      <td style="border:1px solid #aaa;padding:5px 9px;">${base}</td>
      <td style="border:1px solid #aaa;padding:5px 9px;text-align:center;${thLow ? "color:#cc0000;font-weight:bold;" : ""}">${th}</td>
      <td style="border:1px solid #aaa;padding:5px 9px;text-align:center;${prLow ? "color:#cc0000;font-weight:bold;" : ""}">${pr}</td>
    </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt; margin: 0; padding: 28px 38px;
    color: #000; background: #fff;
  }
  .outer { border: 2px solid #000; padding: 16px 22px; }
  .hdr-table  { width:100%; border-collapse:collapse; margin-bottom:10px; }
  .hdr-table td { border:1px solid #000; padding:6px 10px; vertical-align:middle; }
  .college-name { font-size:13.5pt; font-weight:bold; text-align:center; line-height:1.5; }
  .college-sub  { font-size:9pt; text-align:center; font-style:italic; margin-top:3px; color:#333; }
  .rec-info     { font-size:10pt; line-height:1.75; vertical-align:top !important; }
  .title-row td { font-size:12pt; font-weight:bold; text-align:center; padding:7px 10px; }
  .dept-line    { font-size:11pt; margin-bottom:4px; }
  .date-right   { text-align:right; font-size:11pt; margin-bottom:14px; }
  p             { margin:9px 0; line-height:1.65; font-size:11.5pt; }
  .att-table    { width:100%; border-collapse:collapse; margin:13px 0; font-size:11pt; }
  .att-table th { border:1px solid #aaa; padding:6px 9px; background:#e8e8e8;
                  text-align:center; font-weight:bold; }
  .att-table td { border:1px solid #aaa; padding:5px 9px; }
  .total-row td { font-weight:bold; background:#f0f0f0; }
  .sig-row      { display:flex; justify-content:space-between; margin-top:50px; }
  .sig          { text-align:center; font-size:10.5pt; min-width:155px; }
  @media print  { body { padding:18px 26px; } }
</style>
</head>
<body>
<div class="outer">

  <!-- ── Header ── -->
  <table class="hdr-table">
    <tr>
      <td style="width:13%;text-align:center;padding:8px;">
        <img src="${PCCOE_LOGO_B64}" alt="PCCOE Logo" style="width:74px;height:74px;display:block;margin:0 auto;"/>
      </td>
      <td style="width:63%;" class="college-name">
        Pimpri Chinchwad Education Trust&rsquo;s<br/>
        Pimpri Chinchwad College of Engineering
        <div class="college-sub">Akurdi, Pune &ndash; 411 044 &nbsp;|&nbsp; www.pccoe.org</div>
      </td>
      <td style="width:24%;" class="rec-info">
        Record No.: ACAD/R/23<br/>
        Revision: 01<br/>
        Date: 28/08/2024
      </td>
    </tr>
    <tr class="title-row">
      <td colspan="3">Letter to Parents of Poor Performing Students</td>
    </tr>
  </table>

  <!-- ── Dept / Date ── -->
  <p class="dept-line">
    <strong>Department:</strong>&nbsp;${cfg.department}
    &nbsp;&nbsp;&nbsp;
    <strong>Academic Year:</strong>&nbsp;${cfg.academicYear}
    &nbsp;&nbsp;&nbsp;
    <strong>Semester:</strong>&nbsp;${cfg.semester}
  </p>
  <div class="date-right"><strong>Date:</strong>&nbsp;${date}</div>

  <p>To,<br/>Dear Sir / Madam,</p>

  <p>
    We are sorry to inform you that the attendance of your ward
    <strong>${student.name}</strong>,&nbsp;PRN No.&nbsp;<strong>${student.prn}</strong>,
    Year&nbsp;${cfg.year}, Div&nbsp;${cfg.division} is poor.
  </p>

  <p>1. Subject wise attendance up to ${date} is as follows.</p>

  <!-- ── Subject Table ── -->
  <table class="att-table">
    <thead>
      <tr>
        <th style="width:8%;">Sr. No</th>
        <th>Subject</th>
        <th style="width:22%;">Theory Attendance (%)</th>
        <th style="width:24%;">Practical Attendance (%)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="2" style="border:1px solid #aaa;padding:5px 9px;">Average attendance (%)</td>
        <td style="border:1px solid #aaa;padding:5px 9px;text-align:center;">${student.overallTH.toFixed(0)}</td>
        <td style="border:1px solid #aaa;padding:5px 9px;text-align:center;">${student.overallPR.toFixed(0)}</td>
      </tr>
      <tr class="total-row">
        <td colspan="2" style="border:1px solid #aaa;padding:5px 9px;">Total Attendance (%)</td>
        <td colspan="2" style="border:1px solid #aaa;padding:5px 9px;text-align:center;">${student.overallAtt.toFixed(1)}</td>
      </tr>
    </tbody>
  </table>

  <p>
    If he/she fails to improve attendance and to satisfy the minimum criteria of
    <strong>75% attendance</strong> in Theory and Practical&rsquo;s conducted by the college,
    he/she shall not be eligible to appear for the Final SA in Semester&nbsp;I&nbsp;/&nbsp;II
    Theory Examination.
  </p>

  <!-- ── Signatures ── -->
  <div class="sig-row">
    <div class="sig">
      <br/><br/>___________________<br/>
      Class Teacher<br/><strong>${cfg.classTeacher}</strong>
    </div>
    <div class="sig">
      <br/><br/>___________________<br/>
      Academic Coordinator<br/><strong>${cfg.coordinator}</strong>
    </div>
    <div class="sig">
      <br/><br/>___________________<br/>
      Head of the Department<br/><strong>${cfg.hod}</strong>
    </div>
  </div>

</div>
</body>
</html>`;
}

// ── Pop-up window wrapper ─────────────────────────────────────────────────
function makeWindow(title: string, bodyHTML: string, count?: number): void {
  const win = window.open(
    "",
    "_blank",
    "width=960,height=800,scrollbars=yes,resizable=yes",
  );
  if (!win) {
    alert(
      "Pop-up blocked!\n\nPlease allow pop-ups for this site:\n" +
        "Chrome → Click the 🔒 icon in the address bar → Site settings → Pop-ups: Allow\n" +
        "Then click the button again.",
    );
    return;
  }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background:#b0b8c4; font-family:sans-serif; }
    .toolbar {
      position:sticky; top:0; z-index:99;
      background:#0f172a; color:#fff;
      padding:10px 20px; display:flex; align-items:center; gap:12px;
      border-bottom:3px solid #2563eb;
    }
    .toolbar-title { font-weight:800; font-size:14px; flex:1; }
    .btn { padding:7px 20px; border:none; border-radius:7px; cursor:pointer; font-size:13px; font-weight:700; }
    .btn-print { background:#2563eb; color:#fff; }
    .btn-print:hover { background:#1d4ed8; }
    .btn-close { background:#374151; color:#fff; }
    .btn-close:hover { background:#1f2937; }
    .letter-wrapper { background:#fff; margin:24px auto; max-width:870px; box-shadow:0 4px 28px rgba(0,0,0,.28); }
    .page-sep { height:0; page-break-after:always; break-after:page; }
    @media print {
      .toolbar { display:none !important; }
      .letter-wrapper { margin:0; box-shadow:none; max-width:100%; }
      .page-sep { page-break-after:always; break-after:page; }
    }
  </style>
  </head><body>
  <div class="toolbar">
    <span class="toolbar-title">📄 ${title}${count ? ` &mdash; ${count} letter${count > 1 ? "s" : ""}` : ""}</span>
    <button class="btn btn-print" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Close</button>
  </div>
  ${bodyHTML}
  </body></html>`);
  win.document.close();
}

export function openLetter(
  student: Student,
  cfg: LetterConfig = DEFAULT_CONFIG,
): void {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  makeWindow(
    `Letter – ${student.name}`,
    `<div class="letter-wrapper">${generateLetterHTML(student, date, cfg)}</div>`,
  );
}

export function openAllLetters(
  students: Student[],
  cfg: LetterConfig = DEFAULT_CONFIG,
): void {
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const body = students
    .map(
      (s, i) =>
        `<div class="letter-wrapper">${generateLetterHTML(s, date, cfg)}</div>` +
        (i < students.length - 1 ? '<div class="page-sep"></div>' : ""),
    )
    .join("");
  makeWindow("ReportGen — Defaulter Letters", body, students.length);
}
