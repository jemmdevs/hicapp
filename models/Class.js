import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor proporciona un nombre para la clase'],
      maxlength: [100, 'El nombre no puede tener más de 100 caracteres'],
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Debe haber un profesor asignado a la clase'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    code: {
      type: String,
      unique: true,
      required: [true, 'Se requiere un código único para la clase'],
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Class || mongoose.model('Class', ClassSchema); 