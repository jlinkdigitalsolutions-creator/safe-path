import * as repo from "./audit.repository.js";

export async function list(page: number, pageSize: number) {
  const p = Math.max(1, page);
  const ps = Math.min(200, Math.max(1, pageSize));
  return repo.listLogs({ page: p, pageSize: ps });
}
