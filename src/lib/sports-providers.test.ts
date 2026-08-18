import { describe, expect, it } from "vitest";
import {
  buildSportsEmbedUrl,
  createSportsPlaybackDescriptor,
  fetchSportsFeed,
  getAvailableSportsProviders,
  getSportsProvider,
  searchSportsEvents,
} from "./sports-providers";

describe("sports provider aggregator", () => {
  it("provides available sports streaming providers", () => {
    const providers = getAvailableSportsProviders();
    expect(providers.length).toBeGreaterThanOrEqual(5);
    const ids = providers.map((p) => p.id);
    expect(ids).toContain("scorebat");
    expect(ids).toContain("thesportsdb");
    expect(ids).toContain("autoembed-sports");
    expect(ids).toContain("2embed-sports");
    expect(ids).toContain("streamed-su");
  });

  it("builds sports embed URLs for different providers", () => {
    expect(buildSportsEmbedUrl("scorebat", "139901", "Arsenal vs Chelsea")).toBe(
      "https://www.scorebat.com/embed/g/139901/"
    );
    expect(buildSportsEmbedUrl("autoembed-sports", "139901")).toBe(
      "https://player.autoembed.cc/embed/sports/139901"
    );
    expect(buildSportsEmbedUrl("2embed-sports", "139901")).toBe(
      "https://www.2embed.cc/embedsports/139901"
    );
  });

  it("fetches sports match feeds and fallbacks", async () => {
    const feed = await fetchSportsFeed();
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].title).toBeTruthy();
    expect(feed[0].league).toBeTruthy();
    expect(feed[0].score).toHaveProperty("status");
  });

  it("filters sports search results by query and league", async () => {
    const feed = await searchSportsEvents("Arsenal", "premier-league");
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.some((event) => event.title.toLowerCase().includes("arsenal"))).toBe(true);
    expect(feed.every((event) => event.league.toLowerCase().includes("premier"))).toBe(true);
  });

  it("creates sports playback descriptors", () => {
    const descriptor = createSportsPlaybackDescriptor("139901", "Arsenal vs Chelsea", "autoembed-sports");
    expect(descriptor.provider).toBe("autoembed-sports");
    expect(descriptor.url).toBe("https://player.autoembed.cc/embed/sports/139901");
    expect(descriptor.availableProviders?.length).toBeGreaterThan(0);
  });

  it("resolves provider names as aliases", () => {
    const provider = getSportsProvider("FootyLive / Streamed");
    expect(provider.id).toBe("streamed-su");
  });
});
