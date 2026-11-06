import { Client } from "meowsab";
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from "./sub.js";
import { privateGate } from "./system/private.js";

// ملفات اختيارية: لو ناقصة البوت يكمّل عادي بدل ما يقع
const optional = (file) => import(file).catch((e) => {
  console.error(`[OPTIONAL] تعذّر تحميل ${file}:`, e?.message || e);
  return {};
});
const { installDecor } = await optional("./system/decor.js");
const { startWeb } = await optional("./system/web.js");

/* =========== Client ========== */
const client = new Client({
  phoneNumber: "رقم البوت", // Bot number
  prefix: [".", "/", "!"],
  fromMe: false, 
  owners: [
    // Owner 1
    { name: "اسمك", lid: "الايدي بتاعك@lid", jid: "رقمك@s.whatsapp.net" },
  ],
  settings: { noWelcome: false },
  commandsPath: "./plugins"
});

client.onGroupEvent(group);
client.onCommandAccess(access);
global.mainClient = client;          // بيستخدمه system/devs.js
client.onBeforeCommand(privateGate); // 🔒 الوضع الخاص (لازم يتسجل قبل أي plugin)
installDecor?.(client);               // 🎐 بيزخرف ردود الأوامر تلقائياً (system/decor.js)

/* =========== Database ========== */
if (!global.db) {
    global.db = new UltraDB();
}

/* =========== Config ========== */
const { config } = client;
config.info = { 
  nameBot: "𝑅𝑌𝑈𝐾 𝐵𝑂𝑇 🦇", 
  nameChannel: "𝙆𝙄𝙍𝘼 𝘾𝙃𝘼𝙉𝙉𝙀𝙇 🍎", 
  idChannel: "120363427720610028@newsletter",
  urls: {
    repo: "https://github.com/deveni0/Ryuk-AI",
    api: "https://emam-api.web.id",
    channel: "https://whatsapp.com/channel/0029VaQim2bAu3aPsRVaDq3v"
  },
  copyright: { 
    pack: "KIRA", 
    author: "KIRA" 
  },
  images: [
    "https://imgdb.io/i/BB0I4hM.jpg"
  ]
};

/* =========== Web (بيعرض فولدر public على بورت البوت) =========== */
startWeb?.();

/* =========== Start ========== */
client.start();

/* =========== Sub-bots (مع إعادة محاولة لو النظام لسه مش جاهز) =========== */
let subStarted = false;
const startSubs = async (tries = 0) => {
  if (subStarted) return;
  if (client.commandSystem) {
    subStarted = true;
    try {
      await sub(client);
    } catch (e) {
      console.error("[SUB] فشل تشغيل البوتات الفرعية:", e);
    }
    return;
  }
  if (tries < 60) setTimeout(() => startSubs(tries + 1), 1000);
  else console.error("[SUB] commandSystem مجاش جاهز خلال دقيقة، البوتات الفرعية ما اتحمّلتش");
};
setTimeout(() => startSubs(), 2000);

/* =========== Catch Errors =========== */
process.on("uncaughtException", (e) => {
  const msg = String(e?.message || e);
  if (msg.includes("rate-overlimit")) return;
  console.error("[UNCAUGHT]", e);
});

let lastRate = 0;
process.on("unhandledRejection", (err) => {
  const msg = String(err?.message || err);
  if (msg.includes("rate-overlimit")) {
    // واتساب بيحدّ الطلبات: سطر واحد كل 30 ثانية بدل ما الكونسول يتملي
    if (Date.now() - lastRate > 30000) {
      lastRate = Date.now();
      console.warn("[RATE] واتساب رفض طلب (rate-overlimit) - بيتجاهل تلقائي");
    }
    return;
  }
  console.error("Unhandled Rejection:", err);
});

/* =========== Monitor (الرام وعدد البوتات الفرعية كل 5 دقايق) =========== */
setInterval(() => {
  const mb = Math.round(process.memoryUsage().rss / 1048576);
  let subs = 0;
  try {
    const l = global.subBots?.list?.() || [];
    subs = Array.isArray(l) ? l.length : Object.keys(l).length;
  } catch {}
  console.log(`[MEM] ${mb}MB | subs: ${subs} | uptime: ${Math.round(process.uptime() / 60)}m`);
}, 5 * 60 * 1000).unref();

/* =========== Graceful Shutdown =========== */
// لو الاستضافة بتبعت SIGTERM/SIGINT وقت الريستارت أو النشر، لازم نضمن
// إن آخر تعديلات قاعدة البيانات (اللي معلّقة في الـ debounce بتاع UltraDB)
// اتكتبت فعلاً قبل ما البروسيس يقفل، عشان متضيعش.
let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[SHUTDOWN] استلمت ${signal} — بحفظ قاعدة البيانات قبل الإغلاق...`);
  try {
    global.db?.flush?.();
  } catch (e) {
    console.error("[SHUTDOWN] فشل حفظ قاعدة البيانات:", e?.message || e);
  }
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
