import { NextResponse } from "next/server";
import { logPipeline, requestId } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId();
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "url query parameter is required.", requestId: id }, { status: 400 });
  }

  // Validate that the target URL is from a recognized sports embed origin
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
    const allowedHosts = ["embed.st", "streamed.pk", "streamed.su", "scorebat.com", "player.autoembed.cc", "www.2embed.cc"];
    const isAllowed = allowedHosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`));
    if (!isAllowed) {
      return NextResponse.json({ error: "Unauthorized embed host.", requestId: id }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid target URL.", requestId: id }, { status: 400 });
  }

  try {
    logPipeline(id, "sports.stream-embed.fetch", { url: targetUrl });
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: `${parsedUrl.protocol}//${parsedUrl.host}/`,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!upstream.ok) {
      logPipeline(id, "sports.stream-embed.upstream-failed", { status: upstream.status });
      return new NextResponse(
        `<!DOCTYPE html><html><body style="margin:0;background:#000;color:#fff;display:grid;place-items:center;height:100vh;font-family:sans-serif;"><p>Stream source returned ${upstream.status}. Please try another stream provider.</p></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    let html = await upstream.text();

    // 1. Remove third-party ad network scripts
    html = html.replace(/<script[^>]*therocketlanguages[^>]*><\/script>/gi, "");
    html = html.replace(/<script[^>]*optimserve[^>]*><\/script>/gi, "");

    // 2. Remove inline ad iframe generator scripts (e.g., ad.html loop)
    html = html.replace(/<script[^>]*>(?:(?!<\/script>)[\s\S])*?ad\.html[\s\S]*?<\/script>/gi, "");

    // 3. Inject base href and Zero-Ad protection script into <head>
    const baseOrigin = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    const zeroAdGuard = `
<base href="${baseOrigin}">
<script>
  (function() {
    window.open = function() { console.warn("[Lumen Shield] Blocked popup window.open"); return null; };
    window.alert = function() {};
    window.confirm = function() { return false; };
    window.prompt = function() { return null; };
    document.addEventListener("click", function(e) {
      var node = e.target;
      while (node && node !== document.body) {
        if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
          e.preventDefault();
          e.stopPropagation();
          break;
        }
        node = node.parentElement;
      }
    }, true);
  })();
</script>
`;

    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${zeroAdGuard}`);
    } else {
      html = zeroAdGuard + html;
    }

    logPipeline(id, "sports.stream-embed.sanitized", { originalSize: html.length });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error) {
    logPipeline(id, "sports.stream-embed.error", { error: error instanceof Error ? error.message : "unknown" });
    return new NextResponse(
      `<!DOCTYPE html><html><body style="margin:0;background:#000;color:#fff;display:grid;place-items:center;height:100vh;font-family:sans-serif;"><p>Stream temporarily unavailable. Try another server.</p></body></html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
