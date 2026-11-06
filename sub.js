/**
 * KIRA BOT — SubBots System
 * Developer: KIRA BOT
 */

import { SubBots } from "meowsab";
import { isPrivate, isAllowedRaw, setPrivate } from "./system/private.js";

const BOT_NAME = "⌬ 𝐊𝐈𝐑𝐀 𝐁𝐎𝐓";
const FOOTER = "<blockquote>𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐊𝐈𝐑𝐀 𝐁𝐎𝐓 🍎</blockquote>";

// توكن تليجرام — من متغير البيئة TELEGRAM_BOT_TOKEN (أو اكتبه هنا بين العلامتين)
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN ||
  "حط توكن بوتك هنا";

async function sub(client) {
  global.subBots = new SubBots(client.commandSystem);

  // كود الاقتران
  SubBots.pariCode("KIRA1234");

  const { config } = client;

  await global.subBots.setConfig({
    commandsPath: config.commandsPath || "./plugins",
    owners: config.owners,
    prefix: config.prefix,
    info: config.info,
    printQR: false
  });

  global.subBots.on("error", (uid, error) => {
    console.error(`⟦ KIRA ⟧ [SubBot ${uid}] Error:`, error?.message || error);
  });

  const loadedCount = await global.subBots.load();
  console.log(`⟦ KIRA ⟧ Loaded ${loadedCount} saved bots`);

  global.subBots.on("ready", (uid) => {
    console.log(`⟦ KIRA ⟧ [SubBot ${uid}] Connected`);
  });

  global.subBots.on("pair", (uid, code) => {
    console.log(`⟦ KIRA ⟧ [SubBot ${uid}] Pairing code: ${code}`);
  });

  global.subBots.on("message", async (uid, msg) => {
    if (!msg?.key?.id || msg.key.id.includes("3EB0")) return;

    const body = getMessageText(msg);
    const bot = global.subBots.get(uid);
    const sock = bot?.sock;

    if (!sock || !body) return;

    // 🌐🔒 .عام / .خاص — لصاحب البوت الفرعي بس (لازم قبل فحص الوضع الخاص)
    const modeCmd = body.trim().match(/^[.!\/](عام|خاص)$/);
    if (modeCmd) {
      console.log("[SubBotMode]", uid, modeCmd[1], "fromMe:", msg.key.fromMe);
      if (!msg.key.fromMe) return;
      try {
        const priv = modeCmd[1] === "خاص";
        const ok = setPrivate(bot, priv); // بيحفظ في global.db.subPrivate اللي بيقراه private.js
        await sock.sendMessage(msg.key.remoteJid, {
          text: !ok
            ? "❌ تعذّر تغيير الوضع"
            : priv ? "🔒 تم تفعيل الوضع الخاص" : "🌐 تم تفعيل الوضع العام"
        }, { quoted: msg });
      } catch (error) {
        console.error(`⟦ KIRA ⟧ [SubBot ${uid}] Mode error:`, error?.message || error);
      }
      return;
    }

    if (isPrivate(bot) && !isAllowedRaw(msg, bot)) return; // 🔒 الوضع الخاص

    try {
      if (body.trim() === "تست") {
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "🍎", key: msg.key }
        });
      }
    } catch (error) {
      console.error(`⟦ KIRA ⟧ [SubBot ${uid}] Message error:`, error?.message || error);
    }
  });

  global.subBots.on("close", (uid) => {
    console.log(`⟦ KIRA ⟧ [SubBot ${uid}] Disconnected`);
  });

  global.subBots.on("badSession", (uid) => {
    console.log(`⟦ KIRA ⟧ [SubBot ${uid}] Invalid session removed`);
  });

  // تشغيل بوت تليجرام — لو فشل أو الباكدج ناقصة، واتساب يكمّل عادي
  setupTelegramBot(global.subBots).catch((error) => {
    console.error("⟦ KIRA ⟧ Telegram setup failed:", error?.message || error);
  });

  return global.subBots;
}

// ==========================================
// Telegram Bot — KIRA
// ==========================================

async function setupTelegramBot(subBotsInstance) {
  const token = TELEGRAM_TOKEN;

  if (!token) {
    console.warn("⟦ KIRA ⟧ TELEGRAM_BOT_TOKEN is missing. Telegram bot was not started.");
    return;
  }

  let Telegraf;
  try {
    ({ Telegraf } = await import("telegraf"));
  } catch {
    console.warn("⟦ KIRA ⟧ 'telegraf' is not installed (npm i telegraf). Telegram bot was not started.");
    return;
  }

  console.log("⟦ KIRA ⟧ Telegram: starting...");
  const tgBot = new Telegraf(token);

    tgBot.start(async (ctx) => {
    try {
      const welcomeMsg = `╭━━━〔 🍎 𝐊𝐈𝐑𝐀  〕━━━╮

<b>⚙ أهــلاً بـك فـي نـظـام تـنـصـيـب الـبـوتـات الـفـرعـيـة</b>
<blockquote>🟢 يـمـكـنـك الآن تـنـصـيـب بـوت واتـسـاب خـاص بـك بـدون اي اشـتـراك اجـبـاري</blockquote>

📌 <b>الامـــر</b>

┃ <tg-spoiler>/tansib &lt;رقم_الواتساب&gt;</tg-spoiler>

┃💡 <b>طـريـقـة الاسـتـخـدام</b>

<blockquote>اكتب الأمر متبوعاً بـ رقم هاتفك
مع رمز الدولة وبدون مسافات او علامة +</blockquote>

┃ <b>مـثـال :</b>
┃ <tg-spoiler>〘✅〙/tansib 201234567890</tg-spoiler>
│
╰━━━━━━━━━━━━━━━━━━╯

${FOOTER}`;

      await ctx.reply(welcomeMsg, { parse_mode: 'HTML' });
    } catch (error) {
      console.error("[KIRA Telegram] Start error:", error.message);
    }
  });

  tgBot.command("tansib", async (ctx) => {
    const args = ctx.message?.text?.trim().split(/\s+/) || [];
    const num = (args[1] || "").replace(/[+\s-]/g, "");

    if (!num || !/^\d{8,15}$/.test(num)) {
  return ctx.reply(
`╭━━〔 ⚠️ <b>تـنـبـيـه</b> 〕━━╮

<blockquote>أرسـل رقـم واتـسـاب صـحـيـحًـا مـع رمـز الـدولـة بـدون عـلامـة +</blockquote>

<b>مـثـال :</b>
 <tg-spoiler>/tansib 201234567890</tg-spoiler>

╰━━━━━━━━━━━━━━━━╯`,
    { parse_mode: "HTML" }
  );
}

    if (global.db?.noSub) {
      return ctx.reply("⌁ تنصيب البوتات متوقف حاليًا. حاول لاحقًا.");
    }

    try {
      if (subBotsInstance.list().length >= 70) {
        return ctx.reply("⌁ وصل النظام إلى الحد الأقصى: 70 بوتًا.");
      }
    } catch (error) {
      console.error("[KIRA Telegram] List error:", error.message);
    }

    await ctx.reply(
`╭━━〔 🍎 𝐊𝐈𝐑𝐀 〕━━╮

⌁ جـارٍ بـدء عـمـلـيـة الـتـنـصـيـب...
⌁ الـرقـم: ${num}

╰━━━━━━━━━━━━━━━━╯`
    );

    let pairDone = false;
    let resolved = false;
    let timeout;

    const cleanup = () => {
      clearTimeout(timeout);
      subBotsInstance.off("pair", onPair);
      subBotsInstance.off("ready", onReady);
      subBotsInstance.off("error", onError);
    };

    const onPair = async (uid, code) => {
      if (pairDone || resolved) return;
      pairDone = true;

      try {
        await ctx.reply(
`╭━━〔 🔐 <b>كـود الاقـتـران</b> 〕━━╮

⌁ الـرقـم: ${num}
⌁ الـكـود: <code>${escapeHTML(String(code))}</code>

<blockquote>╭─〔 <b>طـريـقـة الـربـط</b> 〕
│
│ 1. افتح واتساب
│ 2. ادخل إلى الأجهزة المرتبطة
│ 3. اختر ربط جهاز
│ 4. اختر الربط برقم الهاتف
│ 5. أدخل الكود المرسل إليك
│
╰━━━━━━━━━━━━━━━━━━╯</blockquote>

${FOOTER}`,
          { parse_mode: "HTML" }
        );
      } catch (error) {
        console.error("[KIRA Telegram] Pair message error:", error.message);
      }
    };

    const onReady = async () => {
      if (resolved) return;
      resolved = true;
      cleanup();

      try {
        await ctx.reply(
`╭━━〔 ✅ <b>تـم الاتـصـال</b> 〕━━╮

⌁ الـرقـم: ${num}
⌁ 🟢 الـحـالة : مـتـصـل بـنـجـاح
⌁ الـبـوت جـاهـز لـلاسـتـخـدام

╰━━━━━━━━━━━━━━━━━━╯

${FOOTER}`,
          { parse_mode: "HTML" }
        );
      } catch (error) {
        console.error("[KIRA Telegram] Ready message error:", error.message);
      }
    };

    const onError = async (uid, err) => {
      if (resolved) return;
      resolved = true;
      cleanup();

      try {
        await ctx.reply(
`╭━━〔 ❌ <b>فـشـل الـتـنـصـيـب</b> 〕━━╮

⌁ الـرقـم: ${num}
⌁ الـسـبـب: ${escapeHTML(err?.message || "خطأ غير معروف")}

╰━━━━━━━━━━━━━━━━━━╯`,
          { parse_mode: "HTML" }
        );
      } catch (sendError) {
        console.error("[KIRA Telegram] Error reply failed:", sendError.message);
      }
    };

    subBotsInstance.on("pair", onPair);
    subBotsInstance.on("ready", onReady);
    subBotsInstance.on("error", onError);

    try {
      await subBotsInstance.add(num);
    } catch (error) {
      resolved = true;
      cleanup();
      return ctx.reply(`⌁ تعذّر بدء التنصيب.\n⌁ السبب: ${error?.message || "خطأ غير معروف"}`);
    }

    timeout = setTimeout(async () => {
      if (resolved) return;
      resolved = true;
      cleanup();

      try {
        await ctx.reply(
          pairDone
            ? "⌁ تم إرسال كود الاقتران، لكن لم يصل تأكيد الاتصال في الوقت المحدد."
            : "⌁ لم يصل كود الاقتران خلال 120 ثانية. حاول مرة أخرى."
        );
      } catch (error) {
        console.error("[KIRA Telegram] Timeout message error:", error.message);
      }
    }, 120000);
  });

  tgBot.catch((error) => {
    console.error("[KIRA Telegram] Bot error:", error?.message || error);
  });

  // يظهر في الكونسول لما أي رسالة توصل لبوت تليجرام
  tgBot.use(async (ctx, next) => {
    console.log(`[KIRA Telegram] update: ${ctx.updateType} from ${ctx.from?.id || "?"}`);
    return next();
  });

  // فحص التوكن قبل التشغيل
  try {
    const me = await tgBot.telegram.getMe();
    console.log(`⟦ KIRA ⟧ Telegram token OK → @${me.username}`);
    await tgBot.telegram.deleteWebhook().catch(() => {});
  } catch (error) {
    console.error("⟦ KIRA ⟧ Telegram token check FAILED:", error?.message || error);
    return;
  }

  // ملاحظة: launch() في telegraf 4.x بتخلص لما البوت يقف بس، فمنستناهاش
  tgBot.launch().catch((error) => {
    console.error("⟦ KIRA ⟧ Telegram launch error:", error?.message || error);
  });
  console.log("⟦ KIRA ⟧ Telegram polling started — ابعت /start للبوت");
}

// ==========================================
// استخراج نص الرسالة
// ==========================================

function getMessageText(msg) {
  if (!msg?.message) return null;
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
  return msg.body || null;
}

// حماية نصوص HTML في تليجرام
function escapeHTML(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default sub;
