import { NextResponse } from "next/server";
import { getAvailableSportsProviders, searchSportsEvents } from "@/lib/sports-providers";
import { logPipeline, requestId } from "@/lib/log";

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() || undefined;
  const league = params.get("league")?.trim() || undefined;

  try {
    logPipeline(id, "sports.feed.start", { query, league });
    const events = await searchSportsEvents(query, league);
    const providers = getAvailableSportsProviders();
    logPipeline(id, "sports.feed.success", { count: events.length, providers: providers.length });
    return NextResponse.json({ requestId: id, query: query ?? "", league: league ?? null, events, providers });
  } catch (error) {
    logPipeline(id, "sports.feed.failure", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sports feed failed.", requestId: id }, { status: 500 });
  }
}
