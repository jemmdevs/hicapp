import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSession',
      required: [true, 'Session is required'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    present: {
      type: Boolean,
      default: true,
    },
    scanTime: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: {
        latitude: Number,
        longitude: Number,
      },
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance records for a student in the same session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema); 