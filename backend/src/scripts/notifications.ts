import { Expo } from "expo-server-sdk";
import { userPushTokens } from "../db/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../config/db";

type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, any>;
};

const expo = new Expo();

export async function sendPushNotification(
  userId: string,
  { title, body, data }: PushNotificationPayload
) {
  // 유저의 모든 기기 토큰 가져오기
  const db = getDb();
  const tokens = await db
    .select()
    .from(userPushTokens)
    .where(eq(userPushTokens.userId, userId));

  const messages = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({
      to: t.token,
      sound: "default",
      title,
      body,
      data,
    }));

  if (messages.length === 0) {
    console.warn(`User ${userId} has no valid Expo push tokens`);
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);
  // const tickets = [];

  for (const chunk of chunks) {
    try {
      // const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      // tickets.push(...ticketChunk);
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }
}
