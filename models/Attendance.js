import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Se requiere una clase para el registro de asistencia'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Se requiere un estudiante para el registro de asistencia'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    present: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance records for a student in the same class on the same day
AttendanceSchema.index({ class: 1, student: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema); 