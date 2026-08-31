/**
 * WhatsApp / SMS notification boundary. Job alerts to workers and booking
 * updates to households go through here.
 *
 * `template` + `vars` is what a real WhatsApp Business API needs (approved
 * templates, variable substitution). `body` carries the fully rendered text in
 * the recipient's language, which is what a plain SMS provider or a wa.me link
 * uses. Both travel together so either kind of provider can be dropped in.
 */
export type NotifyMessage = {
  to: string;
  template: string;
  vars: Record<string, string>;
  body?: string;
};

export type NotifyResult = { ok: boolean; id?: string; error?: string };

export interface NotifyProvider {
  name: string;
  send(input: NotifyMessage): Promise<NotifyResult>;
}

/** Everything the mock "sends", so the UI and admin console can show it. */
export type SentMessage = NotifyMessage & { at: string; provider: string };

const globalRef = globalThis as unknown as { __swpOutbox?: SentMessage[] };

function outbox(): SentMessage[] {
  if (!globalRef.__swpOutbox) globalRef.__swpOutbox = [];
  return globalRef.__swpOutbox;
}

export function sentMessages(): SentMessage[] {
  return outbox().slice().reverse();
}

export function messagesTo(phone: string): SentMessage[] {
  return sentMessages().filter((m) => m.to === phone);
}

export const mockNotifyProvider: NotifyProvider = {
  name: "mock-whatsapp",
  async send(input) {
    outbox().push({ ...input, at: new Date().toISOString(), provider: "mock-whatsapp" });
    console.info(`[mock-whatsapp] ${input.template} -> ${input.to}\n${input.body ?? JSON.stringify(input.vars)}`);
    return { ok: true, id: `msg_${Date.now().toString(36)}` };
  },
};

// Swap for a real WhatsApp Business API client here — same shape, nothing else
// in the app changes.
export const notifyProvider: NotifyProvider = mockNotifyProvider;
