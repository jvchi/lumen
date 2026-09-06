"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { SportsEvent, SportsPlaybackDescriptor, SportsProvider } from "@/lib/types";
import {
  SPORTS_LEAGUES,
  buildSportsEmbedUrl,
  getAvailableSportsProviders,
} from "@/lib/sports-providers";

type SportsLabProps = {
  modeSwitcher?: ReactNode;
};

type FeedPhase = "idle" | "loading" | "success" | "error";
type PlaybackPhase = "idle" | "loading" | "ready" | "error";

export default function SportsLab({ modeSwitcher }: SportsLabProps) {
  const [query, setQuery] = useState("");
  const [leagueId, setLeagueId] = useState(SPORTS_LEAGUES[0]?.id ?? "premier-league");
  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [providers, setProviders] = useState<SportsProvider[]>(getAvailableSportsProviders());
  const [activeProvider, setActiveProvider] = useState(providers[0]?.id ?? "scorebat");
  const [selectedEvent, setSelectedEvent] = useState<SportsEvent | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [playbackMode, setPlaybackMode] = useState<SportsPlaybackDescriptor["mode"] | null>(null);
  const [feedPhase, setFeedPhase] = useState<FeedPhase>("loading");
  const [feedError, setFeedError] = useState("");
  const [playbackPhase, setPlaybackPhase] = useState<PlaybackPhase>("idle");
  const [playbackError, setPlaybackError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setFeedPhase("loading");
      setFeedError("");
      try {
        const params = new URLSearchParams();
        const trimmedQuery = query.trim();
        if (trimmedQuery) params.set("q", trimmedQuery);
        if (leagueId) params.set("league", leagueId);
        const response = await fetch(`/api/sports/feed?${params.toString()}`, { signal: controller.signal });
        const body = (await response.json()) as { events?: SportsEvent[]; providers?: SportsProvider[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Sports feed failed.");
        const nextProviders = body.providers ?? getAvailableSportsProviders();
        setEvents(body.events ?? []);
        setProviders(nextProviders);
        setActiveProvider((current) => (nextProviders.some((provider) => provider.id === current) ? current : nextProviders[0]?.id ?? ""));
        setFeedPhase("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setEvents([]);
        setFeedPhase("error");
        setFeedError(error instanceof Error ? error.message : "Sports feed failed.");
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [leagueId, query]);

  useEffect(() => {
    const originalOpen = window.open;
    window.open = function () {
      showToast("Popup blocked by Zero-Ad Shield");
      return null;
    };
    return () => {
      window.open = originalOpen;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }

  async function playEvent(event: SportsEvent, providerId = activeProvider) {
    setSelectedEvent(event);
    setPlaybackPhase("loading");
    setPlaybackError("");
    try {
      const params = new URLSearchParams({
        eventId: event.id,
        provider: providerId || activeProvider,
        eventTitle: event.title,
        league: leagueId,
        q: query.trim(),
      });
      const response = await fetch(`/api/sports/playback?${params.toString()}`);
      const body = (await response.json()) as { playback?: SportsPlaybackDescriptor; error?: string; event?: SportsEvent };
      if (!response.ok || !body.playback) throw new Error(body.error ?? "Sports playback failed.");
      setPlaybackUrl(body.playback.url);
      setPlaybackMode(body.playback.mode);
      setProviders(body.playback.availableProviders ?? providers);
      setActiveProvider(body.playback.provider);
      setPlaybackPhase("ready");
      if (body.event) setSelectedEvent(body.event);
    } catch (error) {
      setPlaybackPhase("error");
      setPlaybackError(error instanceof Error ? error.message : "Sports playback failed.");
    }
  }

  function clearPlayback() {
    setPlaybackUrl("");
    setPlaybackMode(null);
    setPlaybackPhase("idle");
    setPlaybackError("");
  }

  const selectedLeague = useMemo(
    () => SPORTS_LEAGUES.find((league) => league.id === leagueId) ?? SPORTS_LEAGUES[0],
    [leagueId]
  );

  return (
    <main>
      <header>
        {modeSwitcher}
        <p>Zero-ad popup shield active.</p>
        <h1>Lumen Sports</h1>
        <p>Live football streams, match highlights, and league-aware playback routing.</p>
      </header>

      <section aria-labelledby="sports-search-title">
        <h2 id="sports-search-title">Search and filter</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setQuery((current) => current.trim());
          }}
        >
          <label>
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Arsenal, Messi, Champions League"
              aria-label="Search football highlights"
            />
          </label>
          <div role="group" aria-label="Top leagues">
            {SPORTS_LEAGUES.map((league) => (
              <button key={league.id} type="button" aria-pressed={league.id === leagueId} onClick={() => setLeagueId(league.id)}>
                {league.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => showToast("Zero-ad popup shield is active for sports playback.")}>
            Shield status
          </button>
        </form>
      </section>

      <section aria-labelledby="sports-player-title">
        <h2 id="sports-player-title">Playback</h2>
        {selectedEvent ? <p>{selectedEvent.title}</p> : <p>Select a match to open the player.</p>}
        {playbackUrl ? (
          <div>
            {playbackMode === "hls" ? (
              <video src={playbackUrl} controls autoPlay playsInline />
            ) : (
              <iframe
                title={selectedEvent?.title ?? "Sports playback"}
                src={playbackUrl}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            )}
            <div role="group" aria-label="Sports providers">
              <span>Providers</span>
              {providers.slice(0, 6).map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  aria-pressed={provider.id === activeProvider}
                  onClick={() => {
                    setActiveProvider(provider.id);
                    if (selectedEvent) void playEvent(selectedEvent, provider.id);
                  }}
                >
                  {provider.name}
                </button>
              ))}
            </div>
            <button type="button" onClick={clearPlayback}>
              Close player
            </button>
          </div>
        ) : (
          <p>{feedPhase === "loading" ? "Loading sports feed..." : "Pick a match to resolve a playback URL."}</p>
        )}
        {feedError && <p>{feedError}</p>}
        {playbackError && <p>{playbackError}</p>}
        {playbackPhase === "loading" && <p>Resolving shielded sports playback...</p>}
      </section>

      <section aria-labelledby="sports-feed-title">
        <h2 id="sports-feed-title">Live feed</h2>
        <p>{selectedLeague ? `${selectedLeague.name} feed` : "Football feed"}</p>
        <div>
          {events.map((event) => (
            <article key={event.id}>
              <div>
                {event.homeBadge && <img src={event.homeBadge} alt="" width={24} height={24} style={{ objectFit: "contain" }} />}
                <h3>{event.title}</h3>
                {event.awayBadge && <img src={event.awayBadge} alt="" width={24} height={24} style={{ objectFit: "contain" }} />}
              </div>
              <p>
                {event.score.status === "live" ? "🔴 LIVE" : event.score.status === "upcoming" ? "⏰ UPCOMING" : "FINAL"} · {event.league}
              </p>
              <p>
                {event.score.minute ? `Minute: ${event.score.minute}` : ""}
                {event.score.kickoffTime ? ` · Kickoff: ${event.score.kickoffTime}` : ""}
                {event.streamCount ? ` · ${event.streamCount} streams` : ""}
              </p>
              <p>{event.source}</p>
              <div>
                <button type="button" onClick={() => void playEvent(event)}>
                  Watch Live
                </button>
                {event.embedUrl && (
                  <a href={buildSportsEmbedUrl(activeProvider || providers[0]?.id || "scorebat", event.id, event.title)} target="_blank" rel="noreferrer">
                    External link
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        {feedPhase === "success" && events.length === 0 && <p>No matches were returned for this search.</p>}
      </section>

      {toast && <div role="status">{toast}</div>}
    </main>
  );
}
