
import http from "http";
import { spawn } from "child_process";
import { Bot, webhookCallback } from "grammy";
import { registerCommands } from "./src/commands.js";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TOKEN) {
  throw new Error("Не задано TELEGRAM_BOT_TOKEN");
}

const MODE = process.env.TELEGRAM_MODE || "polling";
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PORT = Number(process.env.PORT || 3000);

// Запуск Python-бота
const pythonBot = spawn("python", ["bot.py"], {
  stdio: "inherit",
});

pythonBot.on("error", (err) => {
  console.error("Помилка запуску bot.py:", err);
});

pythonBot.on("exit", (code) => {
  console.log(`bot.py завершив роботу. Код: ${code}`);
});

// Створення JavaScript-бота
const bot = new Bot(TOKEN);

registerCommands(bot);

// Запуск у режимі polling або webhook
if (MODE === "webhook") {
  if (!WEBHOOK_URL) {
    throw new Error("Не задано WEBHOOK_URL");
  }

  const server = http.createServer(
    webhookCallback(bot, "http", {
      secretToken: WEBHOOK_SECRET,
    })
  );

  server.listen(PORT, () => {
    console.log(`Webhook запущено на порту ${PORT}`);
  });
} else {
  bot.start({
    onStart: () => {
      console.log("JavaScript-бот запущено!");
    },
  });
}

// Коректне завершення Python-процесу
process.on("SIGINT", () => {
  pythonBot.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  pythonBot.kill();
  process.exit(0);
});
