/** Mirrors backend `CASE_STATUSES` — keep in sync with API. */
export const CASE_WORKFLOW_STATUSES = [
  "open",
  "in_progress",
  "forwarded",
  "resolved",
  "closed",
] as const;

export type CaseWorkflowStatus = (typeof CASE_WORKFLOW_STATUSES)[number];

export function formatCaseStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
