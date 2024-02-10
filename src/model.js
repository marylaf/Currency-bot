import { mongoose } from 'mongoose';

const Schema = mongoose.Schema;

const url = 'mongodb://127.0.0.1:27017/telegraf-bot';

mongoose.connect(url)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

  const subscriptionSchema = new Schema({
    chatId: { type: Number, unique: true, required: true },
  }, { versionKey: false });
  
  const Subscription = mongoose.model('Subscription', subscriptionSchema);
  
  export async function addSubscription(chatId) {
    try {
      let subscription = await Subscription.findOne({ chatId });
      if ( subscription ) {
        return subscription;
      }
      subscription = new Subscription({ chatId });
      return await subscription.save();
    } catch (error) {
      console.error('Error adding subscription:', error);
    }
  }

  export async function removeSubscription(chatId) {
    try {
      await Subscription.deleteOne({ chatId });
    } catch (error) {
      console.error('Error removing subscription:', error);
    }
  }

  export async function getAllSubscriptions() {
    try {
      return await Subscription.find({});
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }