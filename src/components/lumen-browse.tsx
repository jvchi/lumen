"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeft01Icon,
  InformationCircleIcon,
  Loading03Icon,
  Menu01Icon,
  Notification02Icon,
  PlayIcon,
  Search01Icon,
  ThumbsUpIcon,
  UserCircleIcon,
  VolumeHighIcon,
  VolumeMute01Icon,
} from "@hugeicons/core-free-icons";
import type { PlaybackDescriptor, StreamProvider, Title } from "@/lib/types";

type BrowseCard = { title: string; image: string; progress?: number; meta?: string[]; overview?: string };
type BrowseRail = { id: string; title: string; items: BrowseCard[]; ranked?: boolean };
type SearchPhase = "idle" | "loading" | "success" | "error";
type DetailPhase = "idle" | "loading" | "ready" | "error";
type PlaybackPhase = "idle" | "loading" | "ready" | "error";

const image = (file: string) => `/netflix/${file}`;

const primaryRail: BrowseCard[] = [
  ["Get Smart", "743b4a0ecba8475f.webp"], ["The Red Sea Diving Resort", "863fd19097df303f.webp"], ["Moneyball", "012f486e97cacce9.webp"],
  ["Self Made: Inspired by the Life of Madam C.J. Walker", "0ac3465fabb36027.webp"], ["The Queen's Gambit", "1fa790afd71908ec.webp"], ["Metal Lords", "e791a98a929c2c4e.webp"],
  ["The Cage", "8c83326d8ef58561.webp"], ["Alpha", "226bcd368125a60c.webp"], ["Nappily Ever After", "e1be467476a437d3.webp"],
  ["Next Gen Chef", "c42dbd79180d7e0e.webp"], ["Anne with an E", "9a6348990a940f01.webp"], ["The Fall Guy", "bc7aa99f41b219c3.webp"],
].map(([title, file]) => ({ title, image: image(file) }));

const picksRail: BrowseCard[] = [
  ["The Last House", "51609fe3fef6ba92.webp"], ["The Town", "b59e63314fdf51b9.webp"], ["Higher Learning", "bfccf9d3e11c54a8.webp"],
  ["Umthetho", "e2a1d51936d54785.webp"], ["Seal Team", "34480a672021e188.webp"], ["MOURINHO", "1e816995f4798164.webp"],
  ["John Q", "3ed103be2b71527c.webp"], ["The Man from U.N.C.L.E.", "3b83d881860473aa.webp"],
].map(([title, file]) => ({ title, image: image(file) }));

const topTen: BrowseCard[] = [
  ["Sniper: The Last Stand", "c71620a85a923cc1.webp"], ["Colours of Fire", "b2418d0cc4dc1e5d.webp"], ["The Last House", "df08c5193cb8a7ee.webp"],
  ["The Suicide Squad", "3ed103be2b71527c.webp"], ["Suicide Squad", "3b83d881860473aa.webp"], ["Abigail", "aadc5cfc8be95f1a.webp"],
  ["Nando Between Two Worlds", "716e34ca4126be2f.webp"], ["Night Swim", "89400af183488ea3.webp"],
].map(([title, file]) => ({ title, image: image(file) }));

const continueWatchingData: Array<[string, string, number]> = [
  ["Shameless (U.S.)", "6fd15145ae77280f.webp", 68], ["Million Dollar Secret", "131fd336e704e7cb.webp", 42], ["Snowpiercer", "f36953eb1f1a9f93.webp", 24],
  ["Tenet", "ddfe4de7a9b7472e.webp", 81], ["Elite", "1166657b4447d9f5.webp", 57], ["King of Thieves", "86f70d99617f9231.webp", 36],
];
const continueWatching: BrowseCard[] = continueWatchingData.map(([title, file, progress]) => ({ title, image: image(file), progress }));

const browseRails: BrowseRail[] = [
  { id: "chic", title: "Kinda Chic to Care So Much", items: primaryRail },
  { id: "picks", title: "Today's Top Picks for You", items: picksRail },
  { id: "top-ten", title: "Top 10 Movies in Nigeria Today", items: topTen, ranked: true },
  { id: "continue", title: "Continue Watching for Vero🌸🧌", items: continueWatching },
];

const fallbackBackdrop = "/netflix/986f17ff019aff7c.webp";

type LumenBrowseProps = {
  modeSwitcher?: ReactNode;
};

function IconButton({ label, children, active = false, onClick }: { label: string; children: ReactNode; active?: boolean; onClick?: () => void }) {
  return <button className={`icon-button${active ? " is-active" : ""}`} aria-label={label} type="button" onClick={onClick}>{children}</button>;
}

function TitleCard({ item, ranked, rank, onClick, onAction }: { item: BrowseCard; ranked?: boolean; rank: number; onClick: () => void; onAction: (message: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 });
  const openTimer = useRef<number | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  function positionPreview() {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(384, window.innerWidth - 32);
    setPreviewPosition({
      left: Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - width - 16)),
      top: Math.max(16, rect.top - 78),
    });
  }

  function openPreview() {
    if (openTimer.current) window.clearTimeout(openTimer.current);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    positionPreview();
    setHovered(true);
  }

  function scheduleOpen() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    if (hovered || openTimer.current) return;
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null;
      openPreview();
    }, 420);
  }

  function scheduleClose() {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (!hovered) return;
    closeTimer.current = window.setTimeout(() => setHovered(false), 140);
  }

  return (
    <article ref={cardRef} className={`title-card${ranked ? " ranked-card" : ""}`} onClick={(event) => { if (!(event.target as HTMLElement).closest(".preview-actions")) onClick(); }} onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose} onFocus={openPreview}>
      {ranked && <span className="rank-number">{rank}</span>}
      <button className="card-hit" type="button" onClick={onClick} aria-label={`Open ${item.title}`}>
        <span className="poster-wrap">
          <img src={item.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = fallbackBackdrop; }} />
          {item.progress !== undefined && <span className="progress-track" aria-label={`${item.progress}% watched`}><span style={{ width: `${item.progress}%` }} /></span>}
        </span>
      </button>
      {hovered && <div className="card-preview" style={{ left: previewPosition.left, top: previewPosition.top }} onMouseEnter={() => { if (closeTimer.current) window.clearTimeout(closeTimer.current); }} onMouseLeave={scheduleClose}>
        <img className="card-preview-image" src={item.image} alt={`Open ${item.title}`} onError={(event) => { event.currentTarget.src = fallbackBackdrop; }} />
        <div className="card-preview-body">
          <div className="preview-actions">
            <button className="preview-play" type="button" aria-label={`Play ${item.title}`} onClick={onClick}><HugeiconsIcon icon={PlayIcon} size={19} strokeWidth={2.3} /></button>
            <button type="button" aria-label={`Add ${item.title} to My List`} onClick={() => onAction(`${item.title} added to My List`)}><HugeiconsIcon icon={AddCircleIcon} size={22} strokeWidth={1.8} /></button>
            <button type="button" aria-label={`Like ${item.title}`} onClick={() => onAction(`${item.title} added to your likes`)}><HugeiconsIcon icon={ThumbsUpIcon} size={21} strokeWidth={1.8} /></button>
            <button className="preview-more" type="button" aria-label={`More info for ${item.title}`} onClick={onClick}><HugeiconsIcon icon={ChevronDownIcon} size={22} strokeWidth={1.9} /></button>
          </div>
          <strong>{item.title}</strong>
          {item.meta && <p>{item.meta.map((entry) => <span key={entry}>{entry}</span>)}</p>}
          {item.overview && <small>{item.overview}</small>}
        </div>
      </div>}
    </article>
  );
}

function PlayerSurface({ url, mode, title, providerName, onBack }: { url: string; mode: PlaybackDescriptor["mode"] | null; title: string; providerName: string; onBack: () => void }) {
  return <div className="player-surface"><div className="player-shell-bar"><button type="button" aria-label="Back to title details" onClick={onBack}><HugeiconsIcon icon={ArrowLeft01Icon} size={32} strokeWidth={1.7} /></button><div><strong>{title}</strong><span>{mode === "hls" ? "Lumen native playback" : providerName}</span></div></div>{mode === "hls" ? <video className="player-native" src={url} controls autoPlay playsInline /> : <iframe className="player-embed" title={`Playback for ${title}`} src={url} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />}</div>;
}

type TitleDetailsProps = {
  activeTitle: Title | null;
  activeArtwork: string;
  activeProgress?: number;
  detailPhase: DetailPhase;
  detailError: string;
  playbackPhase: PlaybackPhase;
  playbackError: string;
  providers: StreamProvider[];
  activeProvider: string;
  season: number;
  muted: boolean;
  onClose: () => void;
  onMute: () => void;
  onPlay: () => void;
  onToast: (message: string) => void;
  onProvider: (provider: StreamProvider) => void;
  onSeason: (season: number) => void;
};

function TitleDetails({ activeTitle, activeArtwork, activeProgress, detailPhase, detailError, playbackPhase, playbackError, providers, activeProvider, season, muted, onClose, onMute, onPlay, onToast, onProvider, onSeason }: TitleDetailsProps) {
  return <><button className="modal-close" type="button" aria-label="Close details" onClick={onClose}><HugeiconsIcon icon={Cancel01Icon} size={23} strokeWidth={2} /></button><img src={activeArtwork} alt="" /><div className="modal-gradient" /><button className="modal-audio" type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} onClick={onMute}><HugeiconsIcon icon={muted ? VolumeMute01Icon : VolumeHighIcon} size={24} strokeWidth={1.8} /></button><div className="modal-content">{detailPhase === "loading" && <div className="detail-loading"><HugeiconsIcon icon={Loading03Icon} size={28} strokeWidth={1.8} className="spin" /><span>Connecting to Lumen catalog…</span></div>}{detailPhase === "error" && <p className="inline-error">{detailError}</p>}{activeTitle && <><p className="eyebrow">Lumen catalog</p><h2>{activeTitle.title}</h2>{activeProgress !== undefined && <div className="detail-progress"><span style={{ width: `${activeProgress}%` }} /></div>}<div className="modal-actions"><button className="button button-light" type="button" disabled={detailPhase !== "ready" || playbackPhase === "loading"} onClick={onPlay}>{playbackPhase === "loading" ? <><HugeiconsIcon icon={Loading03Icon} size={22} className="spin" /> Connecting</> : <><HugeiconsIcon icon={PlayIcon} size={22} strokeWidth={2.3} /> {activeProgress ? "Resume" : "Play"}</>}</button><button className="circle-action" type="button" aria-label="Add to My List" onClick={() => onToast(`${activeTitle.title} added to My List`)}><HugeiconsIcon icon={AddCircleIcon} size={25} strokeWidth={1.9} /></button><button className="circle-action" type="button" aria-label={`Like ${activeTitle.title}`} onClick={() => onToast(`${activeTitle.title} added to your likes`)}><HugeiconsIcon icon={ThumbsUpIcon} size={23} strokeWidth={1.8} /></button></div><div className="detail-layout"><div><p className="modal-meta">{activeTitle.year ?? "Now"}<span>•</span>{activeTitle.runtimeMinutes ? `${Math.floor(activeTitle.runtimeMinutes / 60)}h ${activeTitle.runtimeMinutes % 60}m` : "Feature"}<span>•</span>{activeTitle.rating ? `${activeTitle.rating.toFixed(1)} rating` : "HD"}<span>•</span>{activeTitle.type === "tv" ? "Series" : "Movie"}</p><p className="detail-overview">{activeTitle.overview || "Pick up where you left off or add this title to your list for later."}</p></div><div className="detail-facts"><p><span>Cast:</span> {activeTitle.cast.slice(0, 3).map((person) => person.name).join(", ") || "Cast details loading"}</p><p><span>Genres:</span> {activeTitle.genres.join(", ") || "More like this"}</p></div></div>{activeTitle.type === "tv" && <div className="episode-fields"><strong className="episode-heading">Episodes</strong><label>Season<select value={season} onChange={(event) => onSeason(Number(event.target.value))}>{activeTitle.seasons.filter((item) => item.episodeCount > 0 && item.seasonNumber > 0).map((item) => <option key={item.seasonNumber} value={item.seasonNumber}>Season {item.seasonNumber}</option>)}</select></label></div>}{playbackError && <p className="inline-error">{playbackError}</p>}{providers.length > 0 && <div className="provider-switcher"><span>Lumen source</span>{providers.slice(0, 4).map((provider) => <button className={provider.id === activeProvider ? "active" : ""} type="button" key={provider.id} onClick={() => onProvider(provider)}>{provider.name}</button>)}</div>}</>}</div></>;
}

export default function LumenBrowse({ modeSwitcher }: LumenBrowseProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Title[]>([]);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTitle, setActiveTitle] = useState<Title | null>(null);
  const [activeArtwork, setActiveArtwork] = useState(fallbackBackdrop);
  const [activeProgress, setActiveProgress] = useState<number | undefined>();
  const [detailPhase, setDetailPhase] = useState<DetailPhase>("idle");
  const [detailError, setDetailError] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackDescriptor["mode"] | null>(null);
  const [playbackPhase, setPlaybackPhase] = useState<PlaybackPhase>("idle");
  const [playbackError, setPlaybackError] = useState("");
  const [providers, setProviders] = useState<StreamProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState("");
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!modalOpen && !searchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (modalOpen) setModalOpen(false);
        else setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, searchOpen]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!searchOpen || normalizedQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchPhase("loading");
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, { signal: controller.signal });
        const body = await response.json() as { results?: Title[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Search failed.");
        setSearchResults(body.results ?? []);
        setSearchPhase("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSearchResults([]);
        setSearchPhase("error");
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, searchOpen]);

  const visibleRails = useMemo(() => browseRails.map((rail) => ({ ...rail, title: activeNav === "Home" ? rail.title : `${activeNav} · ${rail.title}` })), [activeNav]);
  const effectiveSearchPhase: SearchPhase = !searchOpen || query.trim().length < 2 ? "idle" : searchPhase;
  const effectiveSearchResults = query.trim().length < 2 ? [] : searchResults;
  const searchCards: BrowseCard[] = effectiveSearchResults.map((result) => ({ title: result.title, image: result.backdropUrl ?? result.posterUrl ?? fallbackBackdrop, overview: result.overview, meta: [result.type === "tv" ? "Series" : "Movie", result.year ?? "", result.rating ? `${result.rating.toFixed(1)} rating` : ""].filter(Boolean) }));
  const isSearchPage = searchOpen && query.trim().length >= 2;

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }

  function resetPlayback() {
    setPlaybackUrl(null);
    setPlaybackMode(null);
    setPlaybackError("");
    setPlaybackPhase("idle");
  }

  async function getSearchResult(titleQuery: string) {
    const response = await fetch(`/api/search?q=${encodeURIComponent(titleQuery)}`);
    const body = await response.json() as { results?: Title[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Search failed.");
    const results = body.results ?? [];
    return results.find((result) => result.title.toLowerCase() === titleQuery.toLowerCase()) ?? results[0] ?? null;
  }

  async function openTitle(title: Title, artwork?: string, progress?: number) {
    setModalOpen(true);
    setActiveTitle(title);
    setActiveArtwork(artwork ?? title.backdropUrl ?? title.posterUrl ?? fallbackBackdrop);
    setActiveProgress(progress);
    setDetailPhase("loading");
    setDetailError("");
    resetPlayback();
    try {
      const response = await fetch(`/api/title/${title.id}?type=${title.type}`);
      const body = await response.json() as { title?: Title; error?: string };
      if (!response.ok || !body.title) throw new Error(body.error ?? "Title lookup failed.");
      setActiveTitle(body.title);
      setActiveArtwork(body.title.backdropUrl ?? body.title.posterUrl ?? artwork ?? fallbackBackdrop);
      setSeason(body.title.seasons.find((item) => item.episodeCount > 0 && item.seasonNumber > 0)?.seasonNumber ?? 1);
      setDetailPhase("ready");
    } catch (error) {
      setDetailPhase("error");
      setDetailError(error instanceof Error ? error.message : "Title lookup failed.");
    }
  }

  async function openBrowseCard(card: BrowseCard) {
    setModalOpen(true);
    setActiveTitle(null);
    setActiveArtwork(card.image);
    setDetailPhase("loading");
    setDetailError("");
    resetPlayback();
    try {
      const result = await getSearchResult(card.title);
      if (!result) throw new Error(`We could not find “${card.title}” in the catalog.`);
      await openTitle(result, card.image, card.progress);
    } catch (error) {
      setDetailPhase("error");
      setDetailError(error instanceof Error ? error.message : "Title lookup failed.");
    }
  }

  async function playTitle(providerId = activeProvider) {
    if (!activeTitle) return;
    setPlaybackPhase("loading");
    setPlaybackError("");
    const params = new URLSearchParams({ tmdbId: String(activeTitle.id), type: activeTitle.type });
    if (providerId) params.set("provider", providerId);
    if (activeTitle.type === "tv") {
      params.set("season", String(season));
      params.set("episode", String(episode));
    }
    try {
      const response = await fetch(`/api/playback?${params.toString()}`);
      const body = await response.json() as { playback?: PlaybackDescriptor; error?: string };
      if (!response.ok || !body.playback) throw new Error(body.error ?? "Playback generation failed.");
      setPlaybackUrl(body.playback.url);
      setPlaybackMode(body.playback.mode);
      setProviders(body.playback.availableProviders ?? []);
      if (!activeProvider) setActiveProvider(body.playback.provider);
      setPlaybackPhase("ready");
    } catch (error) {
      setPlaybackPhase("error");
      setPlaybackError(error instanceof Error ? error.message : "Playback generation failed.");
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setSearchResults([]);
  }

  function goHome() {
    setActiveNav("Home");
    setMenuOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setModalOpen(false);
    resetPlayback();
    closeSearch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const result = searchResults[0];
    if (result) {
      closeSearch();
      void openTitle(result);
    }
  }

  function scrollRail(id: string, direction: number) {
    railRefs.current[id]?.scrollBy({ left: direction * 420, behavior: "smooth" });
  }

  return (
    <main className="lumen-app">
      <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
        <div className="topbar-inner">
          {modeSwitcher}
          <button className="wordmark" type="button" onClick={goHome} aria-label="Lumen home">LUMEN</button>
          <nav className={`main-nav${menuOpen ? " is-open" : ""}`} aria-label="Primary navigation">
            {["Home", "Shows", "Movies", "Games", "New & Popular", "My List", "Browse by Languages"].map((item) => <button className={item === activeNav ? "active" : ""} key={item} type="button" onClick={() => { setMenuOpen(false); setActiveNav(item); if (item === "Home") window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item}</button>)}
          </nav>
          <div className="topbar-actions">
            <form className={`search-box${searchOpen ? " is-open" : ""}`} onSubmit={submitSearch} role="search">
              {searchOpen && <input ref={searchInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titles, people, genres" aria-label="Search the Lumen catalog" />}
              <IconButton label={searchOpen ? "Close search" : "Search"} active={searchOpen} onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}><HugeiconsIcon icon={searchOpen ? Cancel01Icon : Search01Icon} size={25} strokeWidth={1.9} /></IconButton>
            </form>
            <div className="popover-anchor"><IconButton label="Notifications" active={notificationsOpen} onClick={() => { setNotificationsOpen((current) => !current); setProfileOpen(false); }}><HugeiconsIcon icon={Notification02Icon} size={25} strokeWidth={1.8} /></IconButton><span className="notification-count">14</span>{notificationsOpen && <div className="popover notification-popover"><p className="eyebrow">Lumen alerts</p><strong>New picks are ready</strong><span>Your home feed has fresh titles to explore.</span><button type="button" onClick={() => setNotificationsOpen(false)}>Dismiss</button></div>}</div>
            <div className="popover-anchor profile-anchor"><button className="profile-trigger" type="button" aria-label="Open profile menu" onClick={() => { setProfileOpen((current) => !current); setNotificationsOpen(false); }}><img src="/netflix/894d575599c24b20.png" alt="Vero🌸🧌" /><HugeiconsIcon icon={ChevronDownIcon} size={16} strokeWidth={2} /></button>{profileOpen && <div className="popover profile-popover"><strong>Vero🌸🧌</strong><button type="button" onClick={() => showToast("Manage profiles is ready to open")}>Manage profiles</button><button type="button" onClick={() => showToast("Account settings is ready to open")}>Account</button><button type="button" onClick={() => showToast("Sign out is disabled in this local demo")}>Sign out</button></div>}</div>
            <IconButton label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen((current) => !current)}><HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={25} strokeWidth={1.9} /></IconButton>
          </div>
        </div>
      </header>

      {isSearchPage && <section className="search-page" aria-labelledby="search-page-title"><div className="search-suggestions"><span id="search-page-title">More to explore:</span>{effectiveSearchResults.slice(0, 10).map((result) => <button type="button" key={`${result.type}-${result.id}`} onClick={() => setQuery(result.title)}>{result.title}</button>)}</div>{effectiveSearchPhase === "loading" && <div className="search-status"><HugeiconsIcon icon={Loading03Icon} size={24} strokeWidth={1.8} className="spin" /> Searching the catalog…</div>}{effectiveSearchPhase === "error" && <div className="search-status search-error">Search is unavailable right now. Try again in a moment.</div>}{effectiveSearchPhase === "success" && effectiveSearchResults.length === 0 && <div className="search-status">No matches yet. Try a different title or genre.</div>}{effectiveSearchResults.length > 0 && <div className="search-grid">{searchCards.map((item, index) => <TitleCard item={item} rank={index + 1} key={`search-${item.title}-${index}`} onClick={() => void openBrowseCard(item)} onAction={showToast} />)}</div>}</section>}

      <section className={`hero${isSearchPage ? " is-search-hidden" : ""}`} aria-labelledby="featured-title">
        <img className="hero-image" src={fallbackBackdrop} alt="The Fall Guy" />
        <div className="hero-scrim" />
        <div className="hero-content"><img className="hero-logo" src="/netflix/2565244530d37d71.webp" alt="The Fall Guy" /><p className="hero-meta"><strong>Movie</strong><span>•</span><span>Action</span><span>•</span><span>2024</span><span>•</span><span>2h 6m</span><span>•</span><span>16+</span></p><p id="featured-title" className="hero-copy">A stuntman returns to work on his ex&apos;s new film and accidentally uncovers a deadly conspiracy.</p><div className="hero-actions"><button className="button button-light" type="button" onClick={() => void openBrowseCard({ title: "The Fall Guy", image: fallbackBackdrop })}><HugeiconsIcon icon={PlayIcon} size={23} strokeWidth={2.3} /> Play</button><button className="button button-glass" type="button" onClick={() => void openBrowseCard({ title: "The Fall Guy", image: fallbackBackdrop })}><HugeiconsIcon icon={InformationCircleIcon} size={22} strokeWidth={2.1} /> More Info</button></div></div>
        <div className="hero-badges" aria-label="Featured tags"><span><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={2.1} /> New for you</span><span><b>TOP<br />10</b> Trending in Nigeria</span></div>
        <button className="sound-toggle" type="button" aria-label={muted ? "Unmute preview" : "Mute preview"} onClick={() => setMuted((current) => !current)}><HugeiconsIcon icon={VolumeHighIcon} altIcon={VolumeMute01Icon} showAlt={muted} size={23} strokeWidth={1.8} /></button>
      </section>

      <div className={`browse-content${isSearchPage ? " is-search-hidden" : ""}`}><div className="section-intro"><div><p className="eyebrow">Your watch space</p><h1>{activeNav}</h1></div><p className="feed-note"><strong>Lumen</strong> · curated for Vero🌸🧌</p></div>{visibleRails.map((rail) => <section className={`content-rail${rail.ranked ? " is-ranked" : ""}`} key={rail.id} aria-labelledby={`${rail.id}-title`}><div className="rail-heading"><h2 id={`${rail.id}-title`}>{rail.title}</h2><div className="rail-controls"><button type="button" onClick={() => scrollRail(rail.id, -1)} aria-label={`Scroll ${rail.title} left`}><HugeiconsIcon icon={ChevronLeftIcon} size={22} strokeWidth={2} /></button><button type="button" onClick={() => scrollRail(rail.id, 1)} aria-label={`Scroll ${rail.title} right`}><HugeiconsIcon icon={ChevronRightIcon} size={22} strokeWidth={2} /></button></div></div><div className="rail-track" ref={(node) => { railRefs.current[rail.id] = node; }}>{rail.items.map((item, index) => <TitleCard item={item} ranked={rail.ranked} rank={index + 1} key={`${rail.id}-${item.title}`} onClick={() => void openBrowseCard(item)} onAction={showToast} />)}</div></section>)}</div>

      <footer className="footer"><div className="footer-social"><span>Built for your next watch</span><a href="https://www.facebook.com/Netflix/" aria-label="Lumen on Facebook">f</a><a href="https://www.instagram.com/Netflix" aria-label="Lumen on Instagram">◎</a><a href="https://www.youtube.com/channel/UCNG0bMYut0wL3C9BS5ffQXw" aria-label="Lumen on YouTube">▶</a></div><div className="footer-links">{["Audio Description", "Help Center", "Gift Cards", "Media Center", "Jobs", "Terms of Use", "Privacy", "Legal Notices", "Cookie Preferences", "Corporate Information", "Contact Us"].map((item) => <button type="button" key={item} onClick={() => showToast(`${item} is ready to open`)}>{item}</button>)}</div><p>© 2026 Lumen, Inc.</p></footer>
      <nav className="mobile-nav" aria-label="Mobile navigation"><button className={activeNav === "Home" ? "active" : ""} type="button" onClick={goHome}><HugeiconsIcon icon={UserCircleIcon} size={23} strokeWidth={1.8} /><span>Home</span></button><button type="button" onClick={() => setSearchOpen(true)}><HugeiconsIcon icon={Search01Icon} size={23} strokeWidth={1.8} /><span>Search</span></button><button className={activeNav === "My List" ? "active" : ""} type="button" onClick={() => setActiveNav("My List")}><HugeiconsIcon icon={AddCircleIcon} size={23} strokeWidth={1.8} /><span>My List</span></button></nav>
      {modalOpen && <div className="modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}><article className={`title-modal${playbackUrl ? " is-player" : ""}`} role="dialog" aria-modal="true" aria-label={activeTitle ? `${activeTitle.title} details` : "Loading title details"} onClick={(event) => event.stopPropagation()}>{playbackUrl ? <PlayerSurface url={playbackUrl} mode={playbackMode} title={activeTitle?.title ?? "title"} providerName={providers.find((provider) => provider.id === activeProvider)?.name ?? activeProvider} onBack={() => { setPlaybackUrl(null); setPlaybackMode(null); }} /> : <TitleDetails activeTitle={activeTitle} activeArtwork={activeArtwork} activeProgress={activeProgress} detailPhase={detailPhase} detailError={detailError} playbackPhase={playbackPhase} playbackError={playbackError} providers={providers} activeProvider={activeProvider} season={season} muted={muted} onClose={() => setModalOpen(false)} onMute={() => setMuted((value) => !value)} onPlay={() => void playTitle()} onToast={showToast} onProvider={(provider) => { setActiveProvider(provider.id); if (playbackUrl) void playTitle(provider.id); }} onSeason={setSeason} />}</article></div>}

      {toast && <div className="toast" role="status"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={21} strokeWidth={2} /> {toast}</div>}
    </main>
  );
}
