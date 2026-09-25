export const universityDomains: Record<string, string> = {
  "lucaciu.ro": "Colegiul National Vasile Lucaciu",
  "unibuc.ro": "Universitatea din București",
  "ubbcluj.ro": "Universitatea Babeș-Bolyai din Cluj-Napoca",
  "upb.ro": "Universitatea Politehnica din București",
  "uvt.ro": "Universitatea de Vest din Timișoara",
  "ase.ro": "Academia de Studii Economice din București",
  "usamvcluj.ro": "Universitatea de Științe Agricole și Medicină Veterinară din Cluj-Napoca",
  "umft.ro": "Universitatea de Medicină și Farmacie Iuliu Hațieganu din Cluj-Napoca",
  "ubb.ro": "Universitatea Babeș-Bolyai din Cluj-Napoca",
  "univ-ovidius.ro": "Universitatea Ovidius din Constanța",
  "e-uvt.ro": "Universitatea de Vest din Timișoara",
  "uaic.ro": "Universitatea Alexandru Ioan Cuza din Iași",
  "umfcd.ro": "Universitatea de Medicină și Farmacie Carol Davila din București",
  "upt.ro": "Universitatea Politehnica Timișoara",
  "utcn.ro": "Universitatea Tehnică din Cluj-Napoca",
  "unitbv.ro": "Universitatea Transilvania din Brașov",
  "stud.ubbcluj.ro": "Universitatea Babeș-Bolyai din Cluj-Napoca",
};

// Domains here skip manual review outside production, so local/dev signups
// (e.g. a personal gmail.com) don't sit pending forever - never applied in
// prod, where an unrecognized domain always falls back to manual review
// instead of being silently trusted. Configurable via env because the
// domain someone wants to test with varies by machine.
const DEV_AUTO_VERIFY_DOMAINS = (
  process.env.DEV_AUTO_VERIFY_DOMAINS?.split(",") ?? ["gmail.com"]
)
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

// A recognized university domain is auto-verified immediately; anything
// else is still allowed to sign up (see auth.service.ts) but starts
// unverified and waits for an admin to approve it - so testing from a new
// school doesn't require hardcoding its domain here first.
export const isAutoVerifiedDomain = (domain: string | undefined): boolean => {
  if (!domain) return false;
  if (domain in universityDomains) return true;
  return process.env.NODE_ENV !== "production" && DEV_AUTO_VERIFY_DOMAINS.includes(domain);
};
