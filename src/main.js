import { Telegraf, session } from "telegraf";
import { config } from "dotenv";
import { getRandomFlower, shuffleArrayForFlowers } from "./captcha.js";
import { Mongo } from "@telegraf/session/mongodb";

const store = Mongo({
	url: "mongodb://127.0.0.1:27017",
	database: "telegraf-bot",
});

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  handlerTimeout: Infinity,
});

bot.use(session({ store, defaultSession: () => ({ count: 0 }) }));

bot.start((ctx) => {
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
});

bot.on('callback_query', async (ctx) => {
  try {
      const callbackData = ctx.callbackQuery.data;
  if (callbackData === ctx.session.correctAnswer) {
      // Отправка сообщения о правильном выборе
      await ctx.reply('✅ Вы успешно подписались на бота.\n\n🔔 Теперь вам будут приходить актуальные курсы!');
  } else {
     // Отправка сообщения о неправильном выборе
    await ctx.answerCbQuery(ctx.callbackQuery.id, {text: '❌ Вы не прошли капчу, попробуйте ещё раз',  show_alert: true });
  }
  } catch (error) {
      console.error(`Ошибка: ${error.message}`, error);
  }
});

bot.launch();
