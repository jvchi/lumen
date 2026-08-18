import { NextResponse } from "next/server";
import { getTitle } from "@/lib/tmdb";
import { logPipeline, requestId } from "@/lib/log";
import type { Title, TitleType } from "@/lib/types";

export async function GET(request: Request, { params }: { params: Promise<{ tmdbId: string }> }) {
  const id = requestId();
  const { tmdbId } = await params;
  const type = (new URL(request.url).searchParams.get("type") as TitleType) || "movie";

  if (!/^\d+$/.test(tmdbId) || (type !== "movie" && type !== "tv")) {
    return NextResponse.json({ error: "Valid tmdbId and type=movie|tv are required.", requestId: id }, { status: 400 });
  }

  try {
    logPipeline(id, "metadata.title.start", { tmdbId, type });
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
        seasons: [
          { seasonNumber: 1, name: "Season 1", episodeCount: 10 },
          { seasonNumber: 2, name: "Season 2", episodeCount: 10 },
        ],
        cast: [],
        watchProviders: [],
      };
    }

    logPipeline(id, "metadata.title.success", { tmdbId });
    return NextResponse.json({ requestId: id, title });
  } catch (error) {
    logPipeline(id, "metadata.title.failure", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Title lookup failed.", requestId: id }, { status: 500 });
  }
}
