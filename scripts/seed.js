import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connection URI
const MONGODB_URI = 'mongodb+srv://jemmdev:19Septiembre@cluster0.z7axq3p.mongodb.net/hicapp';

// Define user schema directly for the script
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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Check if the default teacher account already exists
    const existingTeacher = await User.findOne({ email: 'monroyprofesor@gmail.com' });
    
    if (existingTeacher) {
      console.log('Default teacher account already exists.');
      
      // Update the password for the existing account
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('monroyprofesor', salt);
      
      existingTeacher.password = hashedPassword;
      await existingTeacher.save();
      
      console.log('Teacher account password updated successfully!');
    } else {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('monroyprofesor', salt);

      // Create the default teacher account
      const teacher = await User.create({
        name: 'Profesor Monroy',
        email: 'monroyprofesor@gmail.com',
        password: hashedPassword,
        role: 'teacher',
      });

      console.log('Default teacher account created successfully!');
      console.log(`Teacher ID: ${teacher._id}`);
    }

    console.log('Database seeding complete!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

// Run the seed function
seedDatabase(); 