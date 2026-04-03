import { env } from "../../config/env.js";

export type SmsPayload = {
  to: string;
  body: string;
  meta?: Record<string, unknown>;
};

export async function sendMockSms(payload: SmsPayload): Promise<void> {
  if (env.nodeEnv !== "test") {
    console.log(
      "[SMS MOCK]",
      JSON.stringify({ to: payload.to, body: payload.body, ...payload.meta })
    );
  }
}
