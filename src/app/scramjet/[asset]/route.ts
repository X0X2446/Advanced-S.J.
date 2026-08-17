import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";

export const dynamic = "force-static";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    asset: string;
  }>;
};

const assetContentTypes = new Map<string, string>([
  ["scramjet.all.js", "application/javascript; charset=utf-8"],
  ["scramjet.bundle.js", "application/javascript; charset=utf-8"],
  ["scramjet.sync.js", "application/javascript; charset=utf-8"],
  ["scramjet.all.js.map", "application/json; charset=utf-8"],
  ["scramjet.bundle.js.map", "application/json; charset=utf-8"],
  ["scramjet.sync.js.map", "application/json; charset=utf-8"],
  ["scramjet.wasm.wasm", "application/wasm"],
]);

export async function GET(_request: Request, { params }: RouteContext) {
  const { asset } = await params;
  const contentType = assetContentTypes.get(asset);

  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(join(scramjetPath, asset));

    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": asset.endsWith(".map")
          ? "public, max-age=3600"
          : "public, max-age=31536000, immutable",
        "Content-Type": contentType,
        "Cross-Origin-Resource-Policy": "same-origin",
        "Service-Worker-Allowed": "/scramjet/",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
