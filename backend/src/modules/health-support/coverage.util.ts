/**
 * Target % (targetCoveragePercent): policy goal for the campaign (0–100), e.g. HPV coverage
 * in the target region/districts by the end date — set by programme leads.
 *
 * Current % (currentCoveragePercent): reported progress toward that goal.
 * - If eligiblePopulation > 0 and vaccinatedCount is set: computed as
 *   min(100, round((vaccinatedCount / eligiblePopulation) * 100)).
 * - Otherwise: use the manually entered currentCoveragePercent (0–100).
 */
export type CoverageInput = {
  vaccinatedCount?: number | null;
  eligiblePopulation?: number | null;
  currentCoveragePercent?: number | null;
};

export function computeCurrentCoveragePercent(input: CoverageInput): number {
  const e = input.eligiblePopulation;
  const v = input.vaccinatedCount;
  if (e != null && e > 0 && v != null && v >= 0) {
    return Math.min(100, Math.round((v / e) * 100));
  }
  const manual = input.currentCoveragePercent;
  if (manual != null && !Number.isNaN(Number(manual))) {
    return Math.min(100, Math.max(0, Math.round(Number(manual))));
  }
  return 0;
}
