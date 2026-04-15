import cron from "node-cron";
import { syncCompanies } from "../scripts/syncCompanies";

// Job 1: Fetch DART list of companies data every weekday at 7 AM
cron.schedule("0 7 * * 1-5", syncCompanies, {
  timezone: "Asia/Seoul", // Adjust to your timezone
});

// 테스트용: 1분마다 실행
// cron.schedule("* * * * *", async () => {
//   console.log("🕐 Running test cron:", new Date().toISOString());
//   await syncCompanies();
// });
