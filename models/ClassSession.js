import mongoose from 'mongoose';

const ClassSessionSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      default: Date.now,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    qrCode: {
      type: String,
      required: false,
    },
    qrExpiration: {
      type: Date,
      required: false,
    },
    location: {
      type: {
        latitude: Number,
        longitude: Number,
        radius: Number, // radio en metros para validar la geolocalización
      },
      required: false,
    },
    notes: {
      type: String,
      required: false,
      trim: true,
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.ClassSession || mongoose.model('ClassSession', ClassSessionSchema); 