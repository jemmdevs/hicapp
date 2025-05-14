import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor proporciona un nombre'],
      maxlength: [60, 'El nombre no puede tener más de 60 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'Por favor proporciona un email'],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Por favor proporciona un email válido'],
    },
    password: {
      type: String,
      required: [true, 'Por favor proporciona una contraseña'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      default: 'student',
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema); 