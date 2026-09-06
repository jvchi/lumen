import { NextResponse } from "next/server";
import { findSportsEvent, resolveSportsPlayback } from "@/lib/sports-providers";
import { logPipeline, requestId } from "@/lib/log";
import type { SportsEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  const eventId = params.get("eventId")?.trim();
  const provider = params.get("provider")?.trim() || undefined;
  const eventTitle = params.get("eventTitle")?.trim() || undefined;
  const league = params.get("league")?.trim() || undefined;
  const query = params.get("q")?.trim() || undefined;

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required.", requestId: id }, { status: 400 });
  }

  try {
    logPipeline(id, "sports.playback.start", { eventId, provider, eventTitle, league, query });
    const initialTitle = eventTitle ?? `Match ${eventId}`;
    const playback = await resolveSportsPlayback(eventId, initialTitle, provider);
    const event = findSportsEvent(eventId, query, league, initialTitle);
    const resolvedTitle = event?.title ?? playback.eventTitle ?? initialTitle;
    const resolvedEvent: SportsEvent =
      event ?? {
        id: eventId,
        title: resolvedTitle,
        league: league ?? "Football",
        homeTeam: resolvedTitle,
        awayTeam: "Opponent",
        date: null,
        score: {
          home: null,
          away: null,
          status: "upcoming",
          minute: null,
          kickoffTime: null,
        },
        thumbnailUrl: null,
        embedUrl: playback.url,
        highlightsUrl: playback.url,
        source: "Sports Stream Aggregator",
      };

    logPipeline(id, "sports.playback.success", { provider: playback.provider, eventId });
    return NextResponse.json({ requestId: id, event: resolvedEvent, playback });
  } catch (error) {
    logPipeline(id, "sports.playback.failure", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Sports playback failed.", requestId: id }, { status: 500 });
  }
}
