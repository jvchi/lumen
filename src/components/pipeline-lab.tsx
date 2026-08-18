"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { StreamProvider, Title } from "@/lib/types";

type Status = "waiting" | "loading" | "success" | "error";

export default function PipelineLab() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Title[]>([]);
  const [selected, setSelected] = useState<Title | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>("");
  const [availableProviders, setAvailableProviders] = useState<StreamProvider[]>([]);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [strictSandbox, setStrictSandbox] = useState(false);
  const [adShieldActive, setAdShieldActive] = useState(true);
  const [overlayActive, setOverlayActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [embedLoaded, setEmbedLoaded] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const rearmTimer = useRef<NodeJS.Timeout | null>(null);
  const [status, setStatus] = useState<Record<string, Status>>({
    metadata: "waiting",
    normalizer: "waiting",
    playback: "waiting",
    embed: "waiting",
  });

  // Global window.open and link target hijacking override to eliminate ad popups entirely
  useEffect(() => {
    if (!adShieldActive) return;

    const originalOpen = window.open;
    const dummyWindow = {
      focus: () => {},
      blur: () => {},
      close: () => {},
      closed: true,
      postMessage: () => {},
      document: { write: () => {}, close: () => {} },
    };

    // Override window.open
    window.open = function () {
      return dummyWindow as unknown as Window;
    };

    // Override anchor element .click() for target="_blank" ad triggers
    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.target === "_blank" || (this.href && !this.href.startsWith(window.location.origin))) {
        return;
      }
      return originalAnchorClick.apply(this);
    };

    return () => {
      window.open = originalOpen;
      HTMLAnchorElement.prototype.click = originalAnchorClick;
    };
  }, [adShieldActive]);

  useEffect(() => {
    async function loadProviders() {
      try {
        const response = await fetch("/api/providers");
        if (response.ok) {
          const body = await response.json();
          if (body.providers && Array.isArray(body.providers)) {
            setAvailableProviders(body.providers);
            const defaultProv = body.providers.find((p: StreamProvider) => p.isDefault);
            if (defaultProv) setActiveProvider(defaultProv.id);
          }
        }
      } catch {
        // Fallback handled gracefully
      }
    }
    loadProviders();
  }, []);

  async function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError("");
    setSelected(null);
    setPlaybackUrl(null);
    setEmbedLoaded(false);
    setEmbedFailed(false);
    setStatus({ metadata: "loading", normalizer: "waiting", playback: "waiting", embed: "waiting" });
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setResults(body.results);
      setStatus({ metadata: "success", normalizer: "success", playback: "waiting", embed: "waiting" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Search failed.");
      setStatus({ metadata: "error", normalizer: "waiting", playback: "waiting", embed: "waiting" });
    } finally {
      setLoading(false);
    }
  }

  async function choose(title: Title) {
    setError("");
    setSelected(title);
    setPlaybackUrl(null);
    setEmbedLoaded(false);
    setEmbedFailed(false);
    setOverlayActive(true);
    setStatus((current) => ({ ...current, normalizer: "loading", playback: "waiting", embed: "waiting" }));
    try {
      const response = await fetch(`/api/title/${title.id}?type=${title.type}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setSelected(body.title);
      setStatus((current) => ({ ...current, normalizer: "success" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Title lookup failed.");
      setStatus((current) => ({ ...current, normalizer: "error" }));
    }
  }

  async function play(providerId?: string) {
    if (!selected) return;
    const targetProvider = providerId || activeProvider;
    setError("");
    setPlaybackUrl(null);
    setEmbedLoaded(false);
    setEmbedFailed(false);
    setOverlayActive(true);
    setStatus((current) => ({ ...current, playback: "loading", embed: "waiting" }));
    const params = new URLSearchParams({ tmdbId: String(selected.id), type: selected.type });
    if (targetProvider) params.set("provider", targetProvider);
    if (selected.type === "tv") {
      params.set("season", String(season));
      params.set("episode", String(episode));
    }
    try {
      const response = await fetch(`/api/playback?${params}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setPlaybackUrl(body.playback.url);
      if (body.playback.availableProviders && body.playback.availableProviders.length > 0) {
        setAvailableProviders(body.playback.availableProviders);
      }
      setStatus((current) => ({ ...current, playback: "success" }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback generation failed.");
      setStatus((current) => ({ ...current, playback: "error" }));
    }
  }

  function handleProviderChange(providerId: string) {
    setActiveProvider(providerId);
    if (playbackUrl && selected) {
      play(providerId);
    }
  }

  function handleOverlayClick() {
    setOverlayActive(false);
    // Auto-rearm overlay after 2.5 seconds to block pause-click ad popups seamlessly
    if (rearmTimer.current) clearTimeout(rearmTimer.current);
    rearmTimer.current = setTimeout(() => {
      setOverlayActive(true);
    }, 2500);
  }

  return (
    <main>
      <h1>Lumen Streaming Pipeline POC</h1>
      <p>TMDB metadata to aggregated external embed streaming providers.</p>
      <form onSubmit={search}>
        <label htmlFor="search">Search titles</label>{" "}
        <input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Dune, Severance…" />{" "}
        <button type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <h2>Pipeline status</h2>
      <ul>
        <li>Metadata API: {status.metadata}</li>
        <li>Normalizer: {status.normalizer}</li>
        <li>Playback adapter: {status.playback}</li>
        <li>Embed surface: {status.embed}</li>
      </ul>
      <h2>Results</h2>
      <ul>
        {results.map((title) => (
          <li key={`${title.type}-${title.id}`}>
            <button type="button" onClick={() => choose(title)}>
              {title.title} ({title.type}, {title.year ?? "unknown year"})
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <section>
          <h2>{selected.title}</h2>
          <p>{selected.overview}</p>
          <p>{selected.year ?? ""} {selected.genres.length ? `· ${selected.genres.join(", ")}` : ""}</p>
          {selected.type === "tv" && (
            <p>
              <label>
                Season{" "}
                <select value={season} onChange={(event) => setSeason(Number(event.target.value))}>
                  {selected.seasons
                    .filter((item) => item.episodeCount > 0)
                    .map((item) => (
                      <option key={item.seasonNumber} value={item.seasonNumber}>
                        {item.seasonNumber} ({item.episodeCount} episodes)
                      </option>
                    ))}
                </select>
              </label>{" "}
              <label>
                Episode <input type="number" min="1" value={episode} onChange={(event) => setEpisode(Number(event.target.value))} />
              </label>
            </p>
          )}

          {availableProviders.length > 0 && (
            <p>
              <label>
                Streaming Source{" "}
                <select value={activeProvider} onChange={(e) => handleProviderChange(e.target.value)}>
                  {availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </p>
          )}

          <p>
            <label>
              <input type="checkbox" checked={adShieldActive} onChange={(e) => setAdShieldActive(e.target.checked)} />{" "}
              Ad & Popup Shield (Block `window.open` ad popups & pause click hijackers)
            </label>
            <br />
            <label style={{ fontSize: "0.9em", color: "#666" }}>
              <input type="checkbox" checked={strictSandbox} onChange={(e) => setStrictSandbox(e.target.checked)} />{" "}
              Strict HTML Iframe Sandbox (Note: Some providers like VidSrc detect & block HTML sandboxing)
            </label>
          </p>

          <button type="button" onClick={() => play()} disabled={availableProviders.length === 0}>
            {availableProviders.length === 0 ? "Configure a playback provider first" : "Generate playback URL"}
          </button>

          {playbackUrl && (
            <div className="playback-shell" style={{ position: "relative", marginTop: "1rem" }}>
              <p>Active Source: {availableProviders.find((p) => p.id === activeProvider)?.name || activeProvider}</p>
              <p>Embed status: {embedFailed ? "failed to load" : embedLoaded ? "loaded" : "loading"}</p>

              <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: "800px" }}>
                {adShieldActive && overlayActive && (
                  <div
                    onClick={handleOverlayClick}
                    title="Click to interact with video without opening ad popups"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      zIndex: 10,
                      cursor: "pointer",
                      background: "rgba(0,0,0,0.01)",
                    }}
                  />
                )}
                <iframe
                  title={`Playback for ${selected.title}`}
                  src={playbackUrl}
                  className="playback-frame"
                  style={{ width: "100%", height: "450px", border: "none" }}
                  loading="eager"
                  referrerPolicy="no-referrer"
                  sandbox={strictSandbox ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads" : undefined}
                  onLoad={() => {
                    setEmbedLoaded(true);
                    setEmbedFailed(false);
                    setStatus((current) => ({ ...current, embed: "success" }));
                  }}
                  onError={() => {
                    setEmbedFailed(true);
                    setStatus((current) => ({ ...current, embed: "error" }));
                  }}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                />
              </div>

              {embedFailed && <p role="alert">This streaming source could not be embedded. Choose another source and try again.</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
