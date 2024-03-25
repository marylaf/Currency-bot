import axios from "axios";
import puppeteer from "puppeteer";
import { sendMessageToAllUsers } from "./main.js";

// Function for receiving Forex rates
async function getForexRate() {
  let message = "";
  let browser;
  try {
    const url = "https://www.profinance.ru/";
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".curs td:nth-child(2)");

    const rates = await page.evaluate(() => {
      const rates = [];
      const rows = document.querySelectorAll(".curs");

      rows.forEach((row) => {
        const titleElement = row.querySelector("td > a");
        const priceElement = row.querySelector("td:nth-child(2)");

        if (titleElement && priceElement) {
          rates.push({
            title: titleElement.textContent.trim(),
            price: priceElement.textContent.trim(),
          });
        }
      });

      return rates;
    });

    const numberRegex = /^[+-]?(\d+(\.\d+)?|\.\d+)(%)?$/;

    const filteredRates = rates.filter(
      (rate) =>
        numberRegex.test(rate.price) &&
        (rate.title === "USD/RUB" ||
          rate.title === "EUR/RUB" ||
          rate.title === "CNY/RUB" ||
          rate.title === "EUR/USD")
    );

    message = filteredRates
      .map((rate) => `${rate.title}(Forex покупка) - ${rate.price}`)
      .join("\n");
  } catch (error) {
    console.error(`Ошибка при получении курсов Forex: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  return message;
}

// Function for receiving currency rates
async function getLigRate() {
  let message = "";
  let browser;
  try {
    const url = "https://ligovka.ru/pda/";
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--ignore-certificate-errors",
      ],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".currency_contaner");

    const rates = await page.evaluate(() => {
      const containers = document.querySelectorAll(".currency_contaner");
      const rates = Array.from(containers).map((container) => {
        const title = container
          .querySelector(".currency_name")
          .textContent.trim();
        const tableRows = container.querySelectorAll(
          "table.currency_table tbody tr"
        );
        const firstRow = tableRows[0];

        const buyPrice = firstRow.cells[1].textContent.trim();
        const sellPrice = firstRow.cells[2].textContent.trim();

        return {
          title,
          buyPrice,
          sellPrice,
        };
      });

      return rates;
    });

    const filteredRates = rates.filter(
      (rate) =>
        rate.title === "USD" ||
        rate.title === "EUR" ||
        rate.title === "EUR/USD" ||
        rate.title === "CNY" ||
        rate.title === "GBP" ||
        rate.title === "CHF"
    );

    message = filteredRates
      .map((rate) => `${rate.title}: ${rate.buyPrice}/${rate.sellPrice}`)
      .join("\n");
  } catch (error) {
    console.error(`Ошибка при получении курсов валют: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  return message;
}

async function getXeRate() {
  let message = "";
  let browser;
  try {
    const url = "https://www.xe.com/currencycharts/";
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    await page.waitForSelector(".table__TableCell-sc-1j0jd5l-1.Zbklu");

    const rate = await page.evaluate(() => {
      const priceElements = document.querySelectorAll(
        ".table__TableCell-sc-1j0jd5l-1.Zbklu"
      );
      const price = priceElements[4].textContent.trim();

      return {
        price,
      };
    });

    message = `EUR/USD(XE) - ${rate.price}`;
  } catch (error) {
    console.error(`Ошибка при получении курса с XE: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  return message;
}

// Function for receiving cryptocurrency rates
export async function getCryptoRate() {
  let messages = [];
  try {
    const markets = ["btcusdt", "btcrub", "ethusdt", "usdteur"];
    const responses = await Promise.all(
      markets.map((market) =>
        axios.get(`https://garantex.org/api/v2/depth?market=${market}`)
      )
    );

    messages = responses.map((res, index) => {
      const market = markets[index].toUpperCase();
      const data = res.data["asks"][0];
      return `${market} - ${data.price}`;
    });
  } catch (error) {
    console.error(`Ошибка при получении курсов криптовалют: ${error.message}`);
  }
  return messages.join("\n");
}

// Function for receiving usdt rates
export async function getUsdtRate() {
  let messages = [];
  try {
    const markets = ["usdtrub", "usdtusd", "usdteur"];
    const responses = await Promise.all(
      markets.map((market) =>
        axios.get(`https://garantex.org/api/v2/depth?market=${market}`)
      )
    );

    messages = responses.map((res, index) => {
      const market = markets[index];
      const dataBid = res.data["bids"][0];
      const dataAsk = res.data["asks"][0];
      const formattedBidFactor =
        (parseFloat(dataBid.factor) * 100).toFixed(1) + "%";
      const formattedAskFactor =
        (parseFloat(dataAsk.factor) * 100).toFixed(1) + "%";
      if (market === "usdtrub") {
        return `GAsk ${dataAsk.price}|${formattedAskFactor}\nGBid ${dataBid.price}|${formattedBidFactor}`;
      }
      if (market === "usdtusd") {
        return `GAsk ${dataAsk.price}$\nGBid ${dataBid.price}$`;
      }
      return `GAsk ${dataAsk.price}€\nGBid ${dataBid.price}€`;
    });
  } catch (error) {
    console.error(`Ошибка при получении курсов USDT: ${error.message}`);
  }
  return messages.join("\n");
}

// function for getting time
export async function getTime() {
  try {
    const timestamp = await axios.get("https://garantex.org/api/v2/timestamp");
    return `Текущее время: ${timestamp.data} UTC`;
  } catch (error) {
    console.error(`Ошибка при получении времени: ${error.message}`);
  }
}

let lastCombinedMessage = null;

async function doCrawling() {
  console.log("DO CRAWLING");
  const usdtRates = await getUsdtRate();
  const cryptoRates = await getCryptoRate();
  const forexRates = await getForexRate();
  const ligRates = await getLigRate();
  const exRate = await getXeRate();
  const time = await getTime();

  lastCombinedMessage = `\`\`\`\n${usdtRates}\n\n${exRate}\n\n${cryptoRates}\n\n${ligRates}\n\n${forexRates}\`\`\`
  *${time}*`;

  sendMessageToAllUsers(lastCombinedMessage);
}

doCrawling();
setInterval(() => {
  doCrawling();
}, 30000);
