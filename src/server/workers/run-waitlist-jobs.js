require("dotenv").config();
const { runWaitlistJobs } = require("./waitlistWorker");

async function main() {
  try {
    console.log("[waitlist] Starting promotion & expiry jobs...");
    await runWaitlistJobs();
    console.log("[waitlist] Done.");
    process.exit(0);
  } catch (err) {
    console.error("[waitlist] Failed:", err);
    process.exit(1);
  }
}

main();
