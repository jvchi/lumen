import { afterEach, describe, expect, it } from "vitest";
import { buildProviderUrl, getAllPlaybackDescriptors, getAvailableProviders, getProvider } from "./providers";

afterEach(() => {
  delete process.env.VIDSRC_EMBED_URL_TEMPLATE;
});

describe("stream provider aggregator & ad-bypass pipeline", () => {
  it("provides available multi-source streaming providers", () => {
    const providers = getAvailableProviders();
    expect(providers.length).toBeGreaterThanOrEqual(10);
    const providerIds = providers.map((p) => p.id);
    expect(providerIds).toContain("vidsrc-pm");
    expect(providerIds).toContain("embed-su");
    expect(providerIds).toContain("autoembed-co");
    expect(providerIds).toContain("2embed");
    expect(providerIds).toContain("vidsrc-to");
    expect(providerIds).toContain("vidsrc-me");
  });

  it("builds movie URLs for aggregated providers", () => {
    const title = { id: 550, imdbId: "tt0137523" };
    expect(buildProviderUrl("vidsrc-pm", title)).toBe("https://vidsrc.pm/embed/movie/550");
    expect(buildProviderUrl("embed-su", title)).toBe("https://embed.su/embed/movie/550");
    expect(buildProviderUrl("autoembed-co", title)).toBe("https://autoembed.co/movie/tmdb/550");
    expect(buildProviderUrl("2embed", title)).toBe("https://www.2embed.cc/embed/550");
  });

  it("builds TV show URLs with season and episode", () => {
    const title = { id: 1399, imdbId: "tt0903747" };
    const episode = { season: 1, episode: 1 };
    expect(buildProviderUrl("vidsrc-pm", title, episode)).toBe("https://vidsrc.pm/embed/tv/1399/1/1");
    expect(buildProviderUrl("embed-su", title, episode)).toBe("https://embed.su/embed/tv/1399/1/1");
    expect(buildProviderUrl("autoembed-co", title, episode)).toBe("https://autoembed.co/tv/tmdb/1399-1-1");
  });

  it("includes custom configured provider if process.env.VIDSRC_EMBED_URL_TEMPLATE is set", () => {
    process.env.VIDSRC_EMBED_URL_TEMPLATE = "https://custom.test/embed/{tmdbId}";
    const providers = getAvailableProviders();
    expect(providers[0].id).toBe("vidsrc-configured");
    expect(providers[0].movieTemplate).toBe("https://custom.test/embed/{tmdbId}");
  });

  it("generates descriptors for all available stream providers", () => {
    const descriptors = getAllPlaybackDescriptors({ id: 550, imdbId: "tt0137523" });
    expect(descriptors.length).toBeGreaterThanOrEqual(10);
    expect(descriptors[0].url).toBeTruthy();
  });
});
