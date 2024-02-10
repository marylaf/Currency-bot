import { Telegraf, session } from "telegraf";
import { config } from "dotenv";
import { getRandomFlower, shuffleArrayForFlowers } from "./captcha.js";
import { Mongo } from "@telegraf/session/mongodb";
import {
  addSubscription,
  removeSubscription,
  getAllSubscriptions,
} from "./model.js";
import "./rates.js";

const store = Mongo({
  url: "mongodb://127.0.0.1:27017",
  database: "telegraf-bot",
});

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  handlerTimeout: Infinity,
});

bot.use(session({ store, defaultSession: () => ({ count: 0 }) }));

export async function sendMessageToAllUsers(message) {
  const subscriptions = await getAllSubscriptions();
  for (const subscriptionKey of subscriptions) {
    try {
      await bot.telegram.sendMessage(subscriptionKey.chatId, message, {
        parse_mode: "Markdown",
      });
    } catch (e) {
      console.error(
        `Ошибка при отправке сообщения пользователю с ID ${subscriptionKey.chatId}: ${e}`
      );

      if (e.code === 403) {
        await removeSubscription(subscriptionKey.chatId);
        console.log(
          `Подписка для chatId: ${subscriptionKey.chatId} удалена из-за блокировки бота.`
        );
      }
    }
  }
}

bot.start((ctx) => {
  const userId = ctx.update.message.from.id;
  
  if (userId === ctx.session.userId) {
    addSubscription(ctx.update.message.chat.id);
    ctx.reply("👋 Добро пожаловать обратно! Вы уже прошли капчу. Подписка на курсы снова активна.");
  } else {
    const flowers = [
      { text: "🌼", callback_data: "daisy" },
      { text: "🌺", callback_data: "hibiscus" },
      { text: "🥀", callback_data: "wilted_flower" },
      { text: "🍀", callback_data: "clover" },
      { text: "🌸", callback_data: "peony" },
      { text: "🌷", callback_data: "tulip" },
      { text: "🌹", callback_data: "rose" },
      { text: "🪷", callback_data: "lotos" },
      { text: "💐", callback_data: "bouquet" },
      { text: "🌾", callback_data: "wheat" },
    ];
    const captchaFlower = getRandomFlower(flowers); // random flower element
    const captchaArray = shuffleArrayForFlowers(flowers); // random flower array

    ctx.session.correctAnswer = captchaFlower.callback_data; // saving state in storage

    const startTextMessage = `🤖 Для того, чтобы начать получать актуальные курсы, вам необходимо пройти капчу!\n\nВыберите на клавиатуре ${captchaFlower.text}`;
    const startCaptchaMessage = {
      reply_markup: {
        inline_keyboard: captchaArray,
      },
    };

    ctx.reply(startTextMessage, startCaptchaMessage);
  }
});

bot.on("callback_query", async (ctx) => {
  try {
    const callbackData = ctx.callbackQuery.data;
    const userId = ctx.callbackQuery.from.id;
    const userName = ctx.callbackQuery.from.username;
   
    if (callbackData === ctx.session.correctAnswer) {
      ctx.session.userId = userId;
      ctx.session.username = userName;

      addSubscription(ctx.callbackQuery.message.chat.id);

      await ctx.reply(
        "✅ Вы успешно подписались на бота.\n\n🔔 Теперь вам будут приходить актуальные курсы!"
      );
    } else {
      await ctx.answerCbQuery(ctx.callbackQuery.id, {
        text: "❌ Вы не прошли капчу, попробуйте ещё раз",
        show_alert: true,
      });
    }
  } catch (error) {
    console.error(`Ошибка: ${error.message}`, error);
  }
});

bot.launch();
