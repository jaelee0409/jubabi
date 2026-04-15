import { parseStringPromise } from "xml2js";
import {
  disclosures,
  userNotifications,
  userAlerts,
  users,
  userStockFavorites,
} from "../db/schema";
import { parseDisclosureTitle } from "../utils/parseDisclosureTitle";
import { eq, like, or, and } from "drizzle-orm";
import { sendPushNotification } from "../scripts/notifications";
import { companiesCache } from "../cache/companiesCache";
import { getDb } from "../config/db";

// Test용
// import { ENV } from "../config/env";
// const RSS_URL = `${ENV.BACKEND_BASE_URL}/test-rss`;

// Production용
const RSS_URL = "https://dart.fss.or.kr/api/todayRSS.xml";

const seenDisclosures = new Map<string, number>();

function pruneSeen() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

  for (const [rcpNo, ts] of seenDisclosures.entries()) {
    if (ts < cutoff) {
      seenDisclosures.delete(rcpNo);
    }
  }
}

export function startRssPoller() {
  setInterval(pruneSeen, 24 * 60 * 60 * 1000);

  setInterval(async () => {
    try {
      console.log(`🔎 Fetching DART RSS @ ${new Date().toISOString()}`);

      const res = await fetch(RSS_URL);
      if (!res.ok) {
        console.error("❌ Failed to fetch RSS:", res.statusText);
        return;
      }

      const xml = await res.text();
      const data = await parseStringPromise(xml, { explicitArray: false });

      const rssItems = data.rss.channel.item;
      if (!rssItems) {
        console.log("No items in feed");
        return;
      }

      const arr = Array.isArray(rssItems) ? rssItems : [rssItems];

      for (const disclosure of arr) {
        const url = new URL(disclosure.link);
        const rcpNo = url.searchParams.get("rcpNo");
        if (!rcpNo) continue;

        if (seenDisclosures.has(rcpNo)) continue;

        const parsed = parseDisclosureTitle(disclosure.title);

        const company = companiesCache.getByName(parsed.companyName);
        if (!company) {
          console.warn(`회사 매칭 실패: ${parsed.companyName}`);
          seenDisclosures.set(rcpNo, Date.now());
          continue;
        }

        const db = getDb();

        const ctx = { rcpNo, company: parsed.companyName };

        // 1. Add the disclosure to the DB
        try {
          await db
            .insert(disclosures)
            .values({
              receiptNumber: rcpNo,
              title: parsed.disclosureTitle,
              correctionType: parsed.correctionType,
              disclosedAt: new Date(disclosure.pubDate),
              market: parsed.market,
              companyName: parsed.companyName,
              companyCorpCode: company.corpCode,
              category: parsed.category,
              type: parsed.type,
            })
            .onConflictDoNothing();
          console.log("Added the new disclosure to the DB", ctx);
        } catch (dbErr) {
          console.error("DB insert new disclosure error", { ...ctx, error: dbErr });
        }

        // 2. Find matching users
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let interestedUsers: any[] = [];
        try {
          interestedUsers = await db
            .select()
            .from(users)
            .leftJoin(
              userStockFavorites,
              eq(userStockFavorites.companyCorpCode, company.corpCode)
            )
            .leftJoin(
              userAlerts,
              and(
              like(userAlerts.keyword, `%${parsed.disclosureTitle}%`),
              eq(userAlerts.enabled, true)
            )
            )
            .where(
              or(
                eq(userStockFavorites.companyCorpCode, company.corpCode),
                and(
                  like(userAlerts.keyword, `%${parsed.disclosureTitle}%`),
                  eq(userAlerts.enabled, true)
                )
              )
            );
        } catch (queryErr) {
          console.error("DB query for interested users failed", { ...ctx, error: queryErr });
          seenDisclosures.set(rcpNo, Date.now());
          continue;
        }

        // 3. Send notifications (병렬 처리)
        try {
          await Promise.all(
            interestedUsers
              .filter((row) => row.users) // users가 null 아닌 것만
              .map((row) =>
                sendPushNotification(row.users.id, {
                  title: `새 공시: ${parsed.companyName}`,
                  body: parsed.type,
                  data: { receiptNumber: rcpNo },
                })
              )
          );
          console.log("Sent the new disclosure notification", { ...ctx, type: parsed.type });

          // 4. Add the notifications to the DB
          const notificationValues = interestedUsers
            .filter((row) => row.users)
            .map((row) => ({
              userId: row.users.id,
              disclosureReceiptNumber: rcpNo,
              createdAt: new Date(disclosure.pubDate),
              read: false,
            }));

          if (notificationValues.length > 0) {
            await db.insert(userNotifications).values(notificationValues);
            console.log("🗂️ Inserted into notifications table", ctx);
          } else {
            console.log("ℹ️ No users to notify, skipping notifications insert", ctx);
          }
        } catch (notifyErr) {
          console.error("❌ Notification sending error", { ...ctx, error: notifyErr });
        }

        // mark as seen
        seenDisclosures.set(rcpNo, Date.now());
      }
    } catch (err) {
      console.error("Unhandled error in RSS poller", { error: err });
    }
  }, 5000);
}
