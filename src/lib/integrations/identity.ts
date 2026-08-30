/**
 * ID / background verification boundary. A real build would call an Aadhaar
 * offline-KYC vendor and a police-verification partner here; the shape of the
 * calls stays the same.
 */
export interface IdentityProvider {
  name: string;
  submitId(input: { workerId: string; docType: string; docNumber: string }): Promise<{
    ok: boolean;
    docNumberMasked: string;
    reference: string;
  }>;
  requestPoliceCheck(workerId: string): Promise<{ ok: boolean; reference: string; etaDays: number }>;
  scheduleSkillCheck(input: { workerId: string; trade: string }): Promise<{ ok: boolean; centre: string; slot: string }>;
  enrolInsurance(workerId: string): Promise<{ ok: boolean; policyNo: string; cover: number }>;
}

const mask = (n: string) => `XXXX XXXX ${n.replace(/\D/g, "").slice(-4).padStart(4, "0")}`;

export const mockIdentityProvider: IdentityProvider = {
  name: "mock-identity",
  async submitId({ docNumber }) {
    return { ok: true, docNumberMasked: mask(docNumber), reference: `KYC${Date.now().toString(36)}` };
  },
  async requestPoliceCheck() {
    return { ok: true, reference: `PVR${Date.now().toString(36)}`, etaDays: 5 };
  },
  async scheduleSkillCheck() {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return { ok: true, centre: "Jaipur Skill Centre, Mansarovar", slot: `${d.toISOString().slice(0, 10)} 11:00` };
  },
  async enrolInsurance() {
    return { ok: true, policyNo: `POL-JP-${Math.floor(20000 + Math.random() * 9999)}`, cover: 200000 };
  },
};

export const identityProvider: IdentityProvider = mockIdentityProvider;
