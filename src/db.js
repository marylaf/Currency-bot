import pg from 'pg';
import { config } from "dotenv";

config();

const client = new pg.Client({
  user: process.env.POSTGRESQL_USER,
  host: process.env.POSTGRESQL_HOST,
  database: process.env.DBNAME,
  password: process.env.POSTGRESQL_PASSWORD,
  port: process.env.POSTGRESQL_PORT,
});

client
  .connect()
  .then(() => console.log("PostgreSQL connected successfully"))
  .catch((err) => console.error("PostgreSQL connection error:", err));

export async function addSubscription(chatId) {
  try {
    const res = await client.query(
      'SELECT * FROM subscriptions WHERE "chatId" = $1',
      [chatId]
    );
    if (res.rows.length) {
      return res.rows[0];
    } else {
      const insertRes = await client.query(
        'INSERT INTO subscriptions("chatId") VALUES($1) RETURNING *',
        [chatId]
      );
      return insertRes.rows[0];
    }
  } catch (error) {
    console.log("Error adding subscription:", error);
  }
}

export async function removeSubscription(chatId) {
  try {
    await client.query('DELETE FROM subscriptions WHERE "chatId" = $1', [
      chatId,
    ]);
  } catch (error) {
    console.log("Error removing subscription:", error);
  }
}

export async function getAllSubscriptions() {
  try {
    const res = await client.query("SELECT * FROM subscriptions");
    return res.rows;
  } catch (error) {
    console.log("Error fetching subscriptions:", error);
    return [];
  }
}