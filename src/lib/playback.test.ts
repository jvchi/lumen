import { afterEach, describe, expect, it } from "vitest";
import { buildEmbedUrl } from "./playback";

afterEach(() => {
  delete process.env.VIDSRC_EMBED_URL_TEMPLATE;
});

describe("configured embed adapter", () => {
  it("builds a movie URL from a TMDB id when template is set", () => {
    process.env.VIDSRC_EMBED_URL_TEMPLATE = "https://example.test/movie/{tmdbId}";
    expect(buildEmbedUrl({ id: 550, imdbId: "tt0137523" })).toBe("https://example.test/movie/550");
  });

  it("builds a TV episode URL when template is set", () => {
    process.env.VIDSRC_EMBED_URL_TEMPLATE = "https://example.test/tv/{tmdbId}/{season}/{episode}";
    expect(buildEmbedUrl({ id: 1399, imdbId: "tt0903747" }, { season: 1, episode: 2 })).toBe("https://example.test/tv/1399/1/2");
  });

  it("falls back to default stream provider when template is unset", () => {
    const url = buildEmbedUrl({ id: 550, imdbId: "tt0137523" });
    expect(url).toContain("550");
    expect(url).toBe("https://vidsrc.pm/embed/movie/550");
  });
});
