import type { SeedSource } from "../seed-source";

/** CISA Known Exploited Vulnerabilities Catalog. Terms checked on its own pages on 2026-11-22. */
export const CISA_KEV_SOURCE = {
  id: "src_cisa_kev",
  definition: {
    name: "CISA Known Exploited Vulnerabilities Catalog",
    hosts: ["www.cisa.gov"],
    docs_url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    licence: "CC0 1.0",
    attribution: null,
    terms:
      "CC0 1.0; any lawful use including commercial. Third-party links inside entries keep their own terms. No use of the CISA logo or DHS seal and no implied endorsement.",
    evidence_url: "https://www.cisa.gov/sites/default/files/licenses/kev/license.txt",
    tier: "green",
    policy_checked_at: "2026-11-22T00:00:00Z",
    rate_limit_per_min: 30,
    capabilities: {
      offerings: [
        {
          name: "Known exploited vulnerabilities (JSON)",
          description:
            "Catalog of vulnerabilities confirmed as exploited in the wild: CVE id, vendor, product, short description, date added, remediation due date and known ransomware use. Single file of about 2 MB with a catalog version and release date.",
          keywords: ["security", "vulnerabilities", "cve", "technology news", "exploits"],
          sample_url:
            "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
          format: "json",
        },
        {
          name: "Known exploited vulnerabilities (CSV)",
          description:
            "The same catalog as CSV, one row per CVE with vendor, product, date added and due date.",
          keywords: ["security", "vulnerabilities", "cve", "csv"],
          sample_url:
            "https://www.cisa.gov/sites/default/files/csv/known_exploited_vulnerabilities.csv",
          format: "csv",
        },
      ],
    },
  },
} satisfies SeedSource;
