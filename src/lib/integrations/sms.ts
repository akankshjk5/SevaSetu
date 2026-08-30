/**
 * SMS / OTP provider boundary.
 *
 * The app only ever talks to `smsProvider`. Replacing the mock with MSG91,
 * Exotel or Gupshup means writing another object with the same shape and
 * exporting it from here — no feature code changes.
 */
export interface SmsProvider {
  name: string;
  sendOtp(phone: string): Promise<{ requestId: string; hint: string }>;
  verifyOtp(phone: string, code: string, requestId?: string): Promise<{ ok: boolean; reason?: string }>;
  sendMessage(phone: string, body: string): Promise<{ ok: boolean }>;
}

export const mockSmsProvider: SmsProvider = {
  name: "mock-sms",
  async sendOtp(phone) {
    console.info(`[mock-sms] OTP requested for ${phone}`);
    return { requestId: `otp_${Date.now()}`, hint: "Demo mode: any 6-digit code works" };
  },
  async verifyOtp(_phone, code) {
    if (!/^\d{6}$/.test(code)) return { ok: false, reason: "Enter the 6-digit code" };
    return { ok: true };
  },
  async sendMessage(phone, body) {
    console.info(`[mock-sms] -> ${phone}: ${body}`);
    return { ok: true };
  },
};

// Swap here when a real provider is wired up (e.g. msg91Provider).
export const smsProvider: SmsProvider = mockSmsProvider;
