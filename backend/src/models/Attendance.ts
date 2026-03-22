import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject {
  name: string;
  value: number | null;
  isTheory: boolean;
}

export interface IStudent {
  srNo: number;
  prn: string;
  name: string;
  overallAtt: number;
  overallTH: number;
  overallPR: number;
  subjects: ISubject[];
}

export interface IAttendance extends Document {
  sheetName: string;
  department: string;
  academicYear: string;
  semester: string;
  dateRange: string;
  students: IStudent[];
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  fileUrl: string;
  cloudinaryId: string;
  totalStudents: number;
  averageAttendance: number;
}

const SubjectSchema = new Schema<ISubject>(
  { name: String, value: { type: Number, default: null }, isTheory: Boolean },
  { _id: false }
);

const StudentSchema = new Schema<IStudent>(
  {
    srNo: Number, prn: String, name: String,
    overallAtt: Number, overallTH: Number, overallPR: Number,
    subjects: [SubjectSchema],
  },
  { _id: false }
);

const AttendanceSchema = new Schema<IAttendance>({
  sheetName:         { type: String, required: true },
  department:        { type: String, default: 'Computer Engineering' },
  academicYear:      { type: String, default: '' },
  semester:          { type: String, default: '' },
  dateRange:         { type: String, default: '' },
  students:          [StudentSchema],
  uploadedBy:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt:        { type: Date, default: Date.now },
  fileUrl:           { type: String, default: '' },
  cloudinaryId:      { type: String, default: '' },
  totalStudents:     { type: Number, default: 0 },
  averageAttendance: { type: Number, default: 0 },
});

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
