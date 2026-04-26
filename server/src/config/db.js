import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MongoDB Atlas connection failed: MONGO_URI is missing in .env');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Atlas connected successfully.');
    return true;
  } catch (error) {
    console.error(`MongoDB Atlas connection failed: ${error.message}`);
    return false;
  }
};

export default connectDB;
