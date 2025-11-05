import mongoose from 'mongoose';

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://jayp3172004:PatelJay2004@cluster0.4kaeisk.mongodb.net/SlotSwapper?retryWrites=true&w=majority';
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true
  });
}

