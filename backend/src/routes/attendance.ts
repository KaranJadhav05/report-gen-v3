import { Router, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { protect, AuthRequest } from "../middleware/auth";
import Attendance from "../models/Attendance";
import { uploadExcelFileToCloudinary } from "../utils/cloudinary";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ─── Parser ──────────────────────────────────────────────────────────────────
function parseBuffer(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  let headerIdx = -1;
  let headers: string[] = [];
  const meta = {
    department: "Computer Engineering",
    academicYear: "",
    semester: "",
    dateRange: "",
  };

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i].map((c: any) => String(c).trim());
    if (String(row[0]).includes("Department")) {
      meta.department = String(row[0]).split(":")[1]?.trim() || meta.department;
      meta.academicYear = String(row[1]).split(":")[1]?.trim() || "";
      meta.semester = String(row[2]).split(":")[1]?.trim() || "";
    }
    if (String(row[0]).toLowerCase().includes("attendance status"))
      meta.dateRange = row[0];
    if (
      row[0] === "Sr.No" ||
      row.some((c: string) => c === "Name of the Student")
    ) {
      headerIdx = i;
      headers = row;
      break;
    }
  }

  if (headerIdx === -1)
    throw new Error("Cannot locate header row in spreadsheet");

  // Subject columns sit between index 3 and last-3
  const subjectCols: { idx: number; name: string }[] = [];
  for (let j = 3; j < headers.length - 3; j++) {
    if (headers[j]) subjectCols.push({ idx: j, name: headers[j] });
  }

  const students = [];
  for (let i = headerIdx + 2; i < raw.length; i++) {
    const row = raw[i].map((c: any) => String(c).trim());
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

    const subjects = subjectCols
      .map((col) => {
        const val = row[col.idx];
        const value =
          !val || val === "-" ? null : parseFloat(val.replace("%", "").trim());
        const isTheory =
          /[-_]TH$/i.test(col.name) ||
          (!/[-_]PR$/i.test(col.name) && !/LAB/i.test(col.name));
        return { name: col.name, value, isTheory };
      })
      .filter((s) => s.value !== null);

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

// POST /api/attendance/upload
router.post(
  "/upload",
  protect,
  upload.single("file"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    try {
      const { students, meta, totalStudents, averageAttendance } = parseBuffer(
        req.file.buffer,
      );
      let fileUrl = "",
        cloudinaryId = "";

      try {
        const uploaded = await uploadExcelFileToCloudinary(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
        );
        fileUrl = uploaded.fileUrl;
        cloudinaryId = uploaded.cloudinaryId;
      } catch (err: any) {
        console.warn("Cloudinary upload failed:", err?.message || err);
        // still continue to persist parsed data in DB; the fileUrl might be empty if Cloudinary is not configured
      }

      const doc = await Attendance.create({
        sheetName: req.file.originalname,
        ...meta,
        students,
        uploadedBy: req.userId,
        fileUrl,
        cloudinaryId,
        totalStudents,
        averageAttendance,
      });
      res.status(201).json({ message: "Upload successful", report: doc });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to parse file" });
    }
  },
);

// GET /api/attendance/history
router.get(
  "/history",
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const reports = await Attendance.find({ uploadedBy: req.userId })
        .sort({ uploadedAt: -1 })
        .limit(50)
        .select("-students");
      res.json({ reports });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  },
);

// GET /api/attendance/report/:id
router.get(
  "/report/:id",
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const report = await Attendance.findOne({
        _id: req.params.id,
        uploadedBy: req.userId,
      });
      if (!report) {
        res.status(404).json({ message: "Report not found" });
        return;
      }
      res.json({ report });
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
