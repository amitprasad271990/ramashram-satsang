// Receives one uploaded file on this Mac (MEDIA_STORAGE=local).
// Going live, the browser uploads straight to the S3/R2 bucket instead.
//
// Checks: logged-in admin + a signed, short-lived address for exactly this
// file name and size (made by uploadTarget()).

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { localPath, STORAGE, verifyLocalUpload } from "@/lib/storage";
import { sessionDb } from "@/lib/supabase/session";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  if (STORAGE !== "local") return new Response("Not found", { status: 404 });

  const db = await sessionDb();
  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) return new Response("Forbidden", { status: 403 });

  const q = new URL(req.url).searchParams;
  const key = q.get("key") ?? "";
  const exp = Number(q.get("exp"));
  const size = Number(q.get("size"));
  if (!key.startsWith("uploads/") || !verifyLocalUpload(key, exp, size, q.get("sig") ?? "")) {
    return new Response("Upload link is not valid or has expired", { status: 403 });
  }
  if (!req.body) return new Response("No file", { status: 400 });

  const file = localPath(key);
  const tmp = `${file}.part`;
  await fsp.mkdir(path.dirname(file), { recursive: true });

  let received = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _enc, done) {
      received += chunk.length;
      done(received > size ? new Error("too big") : null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), limit, fs.createWriteStream(tmp));
    if (received !== size) throw new Error("size mismatch");
    await fsp.rename(tmp, file);
  } catch {
    await fsp.rm(tmp, { force: true });
    return new Response("Upload failed", { status: 400 });
  }
  return new Response(null, { status: 200 });
}
