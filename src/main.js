import { Telegraf } from "telegraf";
import { config } from "dotenv";

config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN, {
  handlerTimeout: Infinity,
});

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

  function getRandomFlower(array) {
    const randomIndex = Math.floor(Math.random() * array.length); // getting random element
    return array[randomIndex];
  }

  function shuffleArrayForFlowers(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // getting random array

      [array[i], array[j]] = [array[j], array[i]];
    }

    const chunkSize = 3;
    let chunkedArray = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunkedArray.push(array.slice(i, i + chunkSize)); // converting multidimensional array
    }

    return chunkedArray;
  }

  const captchaFlower = getRandomFlower(flowers); // random flower element
  const captchaArray = shuffleArrayForFlowers(flowers); // random flower array

  console.log(captchaArray);

  const startTextMessage = `🤖 Для того, чтобы начать получать актуальные курсы, вам необходимо пройти капчу!\n\nВыберите на клавиатуре ${captchaFlower.text}`;
  const startCaptchaMessage = {
    reply_markup: {
      inline_keyboard: captchaArray,
    },
  };

  ctx.reply(startTextMessage, startCaptchaMessage);
});

bot.launch();
