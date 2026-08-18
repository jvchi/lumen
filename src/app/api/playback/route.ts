import { NextResponse } from "next/server";
import { getTitle } from "@/lib/tmdb";
import { createPlaybackDescriptor } from "@/lib/playback";
import { logPipeline, requestId } from "@/lib/log";
import type { Title, TitleType } from "@/lib/types";

export async function GET(request: Request) {
  const id = requestId();
  const params = new URL(request.url).searchParams;
  const tmdbId = params.get("tmdbId");
  const type = (params.get("type") as TitleType) || "movie";
  const season = params.get("season");
  const episode = params.get("episode");
  const provider = params.get("provider") || undefined;

  if (!tmdbId || !/^\d+$/.test(tmdbId) || (type !== "movie" && type !== "tv")) {
    return NextResponse.json({ error: "Valid tmdbId and type=movie|tv are required.", requestId: id }, { status: 400 });
  }

  const selection = type === "tv" ? { season: Number(season), episode: Number(episode) } : undefined;
  if (
    type === "tv" &&
    (!selection || !Number.isInteger(selection.season) || !Number.isInteger(selection.episode) || selection.season < 0 || selection.episode < 1)
  ) {
    return NextResponse.json({ error: "TV playback requires valid season and episode values.", requestId: id }, { status: 400 });
  }

  try {
    logPipeline(id, "playback.start", { tmdbId, type, selection, provider });
    let title: Title;
    try {
      title = await getTitle(Number(tmdbId), type);
    } catch {
      title = {
        id: Number(tmdbId),
        type,
        title: `${type === "movie" ? "Movie" : "TV Show"} #${tmdbId}`,
        originalTitle: "",
        overview: "Metadata fallback mode active (add TMDB_API_KEY to .env.local for full TMDB metadata).",
        posterUrl: null,
        backdropUrl: null,
        releaseDate: null,
        year: null,
        runtimeMinutes: null,
        genres: [],
        rating: null,
        voteCount: 0,
        imdbId: null,
        seasons: [],
        cast: [],
        watchProviders: [],
      };
    }
    const playback = createPlaybackDescriptor(title, selection, provider);
    logPipeline(id, "playback.success", { provider: playback.provider });
    return NextResponse.json({ requestId: id, metadata: title, playback });
  } catch (error) {
    logPipeline(id, "playback.failure", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Playback URL generation failed.", requestId: id }, { status: 500 });
  }
}
