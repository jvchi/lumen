import { NextResponse } from "next/server";
import { searchTitles } from "@/lib/tmdb";
import { logPipeline, requestId } from "@/lib/log";
import type { Title } from "@/lib/types";

const DEMO_FALLBACK_TITLES: Title[] = [
  {
    id: 550,
    type: "movie",
    title: "Fight Club",
    originalTitle: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman build a global organization to help vent male aggression.",
    posterUrl: "https://image.tmdb.org/t/p/w780/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdropUrl: null,
    releaseDate: "1999-10-15",
    year: "1999",
    runtimeMinutes: 139,
    genres: ["Drama"],
    rating: 8.4,
    voteCount: 28000,
    imdbId: "tt0137523",
    seasons: [],
    cast: [],
    watchProviders: [],
  },
  {
    id: 1399,
    type: "tv",
    title: "Game of Thrones",
    originalTitle: "Game of Thrones",
    overview: "Seven noble families fight for control of the mythical land of Westeros.",
    posterUrl: "https://image.tmdb.org/t/p/w780/1XS1oqL89opfnbLl8WnZY1dYmY.jpg",
    backdropUrl: null,
    releaseDate: "2011-04-17",
    year: "2011",
    runtimeMinutes: 60,
    genres: ["Sci-Fi & Fantasy", "Drama"],
    rating: 8.4,
    voteCount: 23000,
    imdbId: "tt0903747",
    seasons: Array.from({ length: 8 }, (_, i) => ({ seasonNumber: i + 1, name: `Season ${i + 1}`, episodeCount: 10 })),
    cast: [],
    watchProviders: [],
  },
  {
    id: 550988,
    type: "movie",
    title: "Free Guy",
    originalTitle: "Free Guy",
    overview: "A bank teller discovers he is actually a background player in an open-world video game.",
    posterUrl: "https://image.tmdb.org/t/p/w780/xmbU4JT2wDYVGvyb2FGiMfiMu0q.jpg",
    backdropUrl: null,
    releaseDate: "2021-08-11",
    year: "2021",
    runtimeMinutes: 115,
    genres: ["Comedy", "Action", "Adventure"],
    rating: 7.6,
    voteCount: 8000,
    imdbId: "tt6264654",
    seasons: [],
    cast: [],
    watchProviders: [],
  },
];

export async function GET(request: Request) {
  const id = requestId();
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Search query must be at least 2 characters.", requestId: id }, { status: 400 });
  }

  try {
    logPipeline(id, "metadata.search.start", { query });
    let results: Title[] = [];
    try {
      results = await searchTitles(query);
    } catch {
      // Fallback search mode when TMDB credentials are missing in local dev
      if (/^\d+$/.test(query)) {
        const numId = Number(query);
        results = [
          {
            id: numId,
            type: "movie",
            title: `Title #${numId}`,
            originalTitle: "",
            overview: "Metadata fallback mode active (add TMDB_API_KEY to .env.local for full search results).",
            posterUrl: null,
            backdropUrl: null,
            releaseDate: null,
            year: null,
            runtimeMinutes: null,
            genres: [],
            rating: null,
            voteCount: 0,
            imdbId: null,
            seasons: [{ seasonNumber: 1, name: "Season 1", episodeCount: 10 }],
            cast: [],
            watchProviders: [],
          },
        ];
      } else {
        const lower = query.toLowerCase();
        results = DEMO_FALLBACK_TITLES.filter(
          (t) => t.title.toLowerCase().includes(lower) || t.genres.some((g) => g.toLowerCase().includes(lower))
        );
        if (results.length === 0) {
          results = DEMO_FALLBACK_TITLES;
        }
      }
    }

    logPipeline(id, "metadata.search.success", { count: results.length });
    return NextResponse.json({ requestId: id, results });
  } catch (error) {
    logPipeline(id, "metadata.search.failure", { error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Search failed.", requestId: id }, { status: 500 });
  }
}
