import * as XLSX from 'xlsx';
import { IStudent, ISubject } from '../models/Attendance';

export interface ParsedSheet {
  sheetName: string;
  department: string;
  academicYear: string;
  semester: string;
  dateRange: string;
  students: IStudent[];
}

function cleanPct(val: unknown): number | null {
  if (val === undefined || val === null || val === '-' || val === '') return null;
  const s = String(val).replace('%', '').trim();
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function isTheorySubject(name: string): boolean {
  return /[-_\s]TH$/i.test(name) || /\bTH\b/i.test(name);
}

export function parseAttendanceBuffer(buffer: Buffer, originalName: string): ParsedSheet {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

  // Extract metadata from early rows
  let department = 'Computer Engineering';
  let academicYear = '';
  let semester = '';
  let dateRange = '';

  for (let i = 0; i < Math.min(8, rows.length); i++) {
    const rowStr = rows[i].join(' ');
    if (/Academic Year/i.test(rowStr)) {
      const m = rowStr.match(/Academic Year\s*[:\-]?\s*([\d\-]+)/i);
      if (m) academicYear = m[1];
      const sm = rowStr.match(/Semester\s*[:\-]?\s*(\d+)/i);
      if (sm) semester = sm[1];
    }
    if (/Attendance status report from/i.test(rowStr)) {
      dateRange = rowStr.replace(/.*Attendance status report/i, '').trim();
    }
    if (/Department/i.test(rowStr)) {
      const m = rowStr.match(/Department\s*[:\-]?\s*([^,]+)/i);
      if (m) department = m[1].trim();
    }
  }

  // Find header row
  let headerRowIdx = -1;
  let headers: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).trim());
    if (row[0] === 'Sr.No' || row.some(c => c === 'Name of the Student')) {
      headerRowIdx = i;
      headers = row;
      break;
    }
  }

  if (headerRowIdx === -1) throw new Error('Could not find header row in attendance sheet');

  // Map subject columns (between col 3 and last 3)
  const subjectCols: Array<{ idx: number; name: string; isTheory: boolean }> = [];
  for (let j = 3; j < headers.length - 3; j++) {
    const h = headers[j];
    if (h && h !== '' && !['Overall TH Att.', 'Overall PR Att.', 'Overall Att.'].includes(h)) {
      subjectCols.push({ idx: j, name: h, isTheory: isTheorySubject(h) });
    }
  }

  const students: IStudent[] = [];

  for (let i = headerRowIdx + 2; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).trim());
    if (!row[0] || isNaN(Number(row[0]))) continue;

    const overallAttRaw = row[row.length - 1];
    const overallTHRaw = row[row.length - 3];
    const overallPRRaw = row[row.length - 2];

    const overallAtt = cleanPct(overallAttRaw) ?? 0;
    const overallTH = cleanPct(overallTHRaw) ?? 0;
    const overallPR = cleanPct(overallPRRaw) ?? 0;

    const subjects: ISubject[] = subjectCols
      .map(col => ({
        name: col.name,
        value: cleanPct(row[col.idx]),
        isTheory: col.isTheory,
      }))
      .filter(s => s.value !== null);

    students.push({
      srNo: Number(row[0]),
      prn: row[1],
      name: row[2],
      overallAtt,
      overallTH,
      overallPR,
      subjects,
    });
  }

  return {
    sheetName: originalName.replace(/\.[^.]+$/, ''),
    department,
    academicYear,
    semester,
    dateRange,
    students,
  };
}
