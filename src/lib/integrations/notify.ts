/**
 * WhatsApp / push notification boundary. Job alerts to workers and booking
 * updates to households go through here.
 */
export interface NotifyProvider {
  name: string;
  send(input: { to: string; template: string; vars: Record<string, string> }): Promise<{ ok: boolean }>;
}

export const mockNotifyProvider: NotifyProvider = {
  name: "mock-whatsapp",
  async send({ to, template, vars }) {
    console.info(`[mock-whatsapp] ${template} -> ${to}`, vars);
    return { ok: true };
  },
};

export const notifyProvider: NotifyProvider = mockNotifyProvider;
