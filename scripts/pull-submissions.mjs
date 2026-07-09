// Downloads every stored submission (raw .xls + stats .json) from the
// private Blob store into ./submissions-export/, preserving the
// day/device/submission folder structure. Local tool — never deployed.
//
// Usage: npm run pull-submissions
// Requires BLOB_READ_WRITE_TOKEN in .env.local (created by `vercel blob create-store`).

import { list, get } from "@vercel/blob";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

// minimal .env.local loader (no dotenv dependency)
try {
  const env = await readFile(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)="?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // fine — token may already be in the environment
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("BLOB_READ_WRITE_TOKEN not found. Run `vercel env pull` first.");
  process.exit(1);
}

const OUT = "submissions-export";
let cursor;
let count = 0;

do {
  const page = await list({ prefix: "submissions/", cursor, limit: 100 });
  for (const blob of page.blobs) {
    const res = await get(blob.pathname, { access: "private" });
    if (!res || res.statusCode !== 200 || !res.stream) continue;
    const dest = join(OUT, blob.pathname);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(
      dest,
      Buffer.from(await new Response(res.stream).arrayBuffer())
    );
    count++;
    console.log("↓", blob.pathname);
  }
  cursor = page.cursor;
} while (cursor);

console.log(`\nDone — ${count} files in ./${OUT}/`);
