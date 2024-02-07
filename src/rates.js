import axios from "axios";
import puppeteer from "puppeteer";

export async function getForexRate() {
  let message = '';
  try {
    const url = 'https://www.profinance.ru/';
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForFunction(
      () => {
        return document.querySelector('.curs td:nth-child(2)').textContent.trim() !== "0.00";
      },
      { timeout: 30000 }
    );

    const rates = await page.evaluate(() => {
      const rates = [];
      const rows = document.querySelectorAll(".curs");

      rows.forEach((row) => {
        const titleElement = row.querySelector("td > a");
        const priceElement = row.querySelector('td:nth-child(2)');

        if (titleElement && priceElement) {
          rates.push({
            title: titleElement.textContent.trim(),
            price: priceElement.textContent.trim(),
          });
        }
      });

      return rates;
    });

    await browser.close();

    const numberRegex = /^[+-]?(\d+(\.\d+)?|\.\d+)(%)?$/;

    //select only what need
    const filteredRates = rates.filter(rate =>
      numberRegex.test(rate.price) &&
      (rate.title === "USD/RUB" ||
      rate.title === "EUR/RUB" ||
      rate.title === "CNY/RUB" ||
      rate.title === "EUR/USD")
    );

    // Форматируем сообщение
    message = filteredRates.map(rate => `${rate.title}(Forex покупка) - ${rate.price}`).join('\n');

  } catch (error) {
    console.error(`Ошибка при получении курсов Forex: ${error.message}`);
  }
  return message;
}

// Функция для получения курсов криптовалют
export async function getCryptoRate() {
  let messages = [];
  try {
    const markets = ["btcusdt", "btcrub", "ethusdt", "usdteur"];
    const responses = await Promise.all(markets.map(market =>
      axios.get(`https://garantex.org/api/v2/depth?market=${market}`)
    ));

    messages = responses.map((res, index) => {
      const market = markets[index].toUpperCase();
      const data = res.data["asks"][0];
      return `${market} - ${data.price}`;
    });

  } catch (error) {
    console.error(`Ошибка при получении курсов криптовалют: ${error.message}`);
  }
  return messages.join('\n');
}

// Теперь напишем функцию sendCombinedMessage
export async function sendCombinedMessage(ctx) {
  const cryptoRates = await getCryptoRate();
  const forexRates = await getForexRate();

  // Соединяем отформатированные сообщения
  const combinedMessage = `\`\`\`\n${cryptoRates}\n\n${forexRates}\`\`\``;

  // Отправляем соединенное сообщение
  ctx.reply(combinedMessage, { parse_mode: "Markdown" });
}