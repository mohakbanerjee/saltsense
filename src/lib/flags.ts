/** Feature flags — hide unfinished bits in the demo. */
export type FeatureFlags = {
  /** Leaf photo / Gemini check (Phase 5). Requires GEMINI_API_KEY for live AI. */
  leafAi: boolean;
  /** Scripted 60s demo mode */
  runDemo: boolean;
  /** Arabic toggle on decision card */
  arabic: boolean;
  /** Cost page */
  costPage: boolean;
  /** SMS / WhatsApp summary */
  smsSummary: boolean;
};

export const FLAGS: FeatureFlags = {
  leafAi: true,
  runDemo: true,
  arabic: true,
  costPage: true,
  smsSummary: true,
};

export function isGeminiConfigured(): boolean {
  return Boolean(
    typeof process !== "undefined" && process.env.GEMINI_API_KEY?.trim(),
  );
}
