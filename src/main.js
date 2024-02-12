import { Telegraf, session } from "telegraf";
import { Postgres } from "@telegraf/session/pg";
import { config } from "dotenv";
import { getRandomFlower, shuffleArrayForFlowers } from "./captcha.js";
import {
  addSubscription,
  removeSubscription,
  getAllSubscriptions,
} from "./db.js";
import "./rates.js";
import { flowers } from "./constants.js";

config();

const store = Postgres({
  user: process.env.POSTGRESQL_USER,
  host: process.env.POSTGRESQL_HOST,
  database: process.env.POSTGRESQL_DBNAME,
  password: process.env.POSTGRESQL_PASSWORD,
  port: process.env.POSTGRESQL_PORT,
});

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
  if (ctx.session.isSaved == true) {
    addSubscription(ctx.update.message.chat.id);
    ctx.reply(
      "👋 Добро пожаловать обратно! Вы уже прошли капчу. Подписка на курсы снова активна."
    );
  } else {
    const captchaFlower = getRandomFlower(flowers); // random flower element
    const captchaArray = shuffleArrayForFlowers(flowers); // random flower array
    ctx.session.correctAnswer = captchaFlower.callback_data; // saving state in storage
    ctx.session.username = userName; // saving username in storage
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
    const userName = ctx.callbackQuery.from.username;

    if (callbackData === ctx.session.correctAnswer) {
      console.log("Получилось!");
      ctx.session.isSaved = true;
      ctx.session.username = userName;

      addSubscription(ctx.callbackQuery.message.chat.id);

      await ctx.reply(
        "✅ Вы успешно подписались на бота.\n\n🔔 Теперь вам будут приходить актуальные курсы!"
      );
    } else {
      const newCaptchaFlower = getRandomFlower(flowers);
      const newCaptchaArray = shuffleArrayForFlowers(flowers);

      ctx.session.correctAnswer = newCaptchaFlower.callback_data;

      await ctx.editMessageText(
        `🤖 Для того, чтобы начать получать актуальные курсы, вам необходимо пройти капчу!\n\nВыберите на клавиатуре ${newCaptchaFlower.text}`
      );

      await ctx.editMessageReplyMarkup({
        inline_keyboard: newCaptchaArray,
      });

      await ctx.answerCbQuery(ctx.callbackQuery.id, {
        text: "❌ Вы не прошли капчу, попробуйте ещё раз",
        show_alert: true,
      });
    }
  } catch (error) {
    console.error(`Ошибка: ${error.message}`, error);
  }
});

// bot.launch({
//   webhook: {
//     domain: webhookDomain,
//     port: port,
//     path: webhookPath,
//     secretToken: randomAlphaNumericString,
//   },
// }); 

bot.launch();
