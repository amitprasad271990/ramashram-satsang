// Serves admin-uploaded files on this Mac (MEDIA_STORAGE=local), with Range
// support so long MP3s can be seeked. Going live, files come from the bucket.

import fs from "node:fs";
import { Readable } from "node:stream";
import { localPath, STORAGE } from "@/lib/storage";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { mp3: "audio/mpeg", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (STORAGE !== "local") return new Response("Not found", { status: 404 });
  const rel = (await params).path.join("/");
  let file: string;
  let size: number;
  try {
    file = localPath(`uploads/${rel}`);
    const st = await fs.promises.stat(file);
    if (!st.isFile()) throw new Error();
    size = st.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const type = TYPES[rel.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable", // file names are never reused
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const body = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new Response(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const body = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new Response(body, { headers: { ...headers, "Content-Length": String(size) } });
}
