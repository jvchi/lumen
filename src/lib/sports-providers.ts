import type { SportsEvent, SportsLeague, SportsPlaybackDescriptor, SportsProvider, SportsScore } from "./types";

export const SPORTS_LEAGUES: SportsLeague[] = [
  { id: "premier-league", name: "Premier League", query: "Premier League" },
  { id: "champions-league", name: "Champions League", query: "UEFA Champions League" },
  { id: "la-liga", name: "La Liga", query: "La Liga" },
  { id: "serie-a", name: "Serie A", query: "Serie A" },
];

export const SPORTS_PROVIDERS: SportsProvider[] = [
  {
    id: "scorebat",
    name: "ScoreBat Football Highlights",
    urlTemplate: "https://www.scorebat.com/embed/g/{eventId}/",
    isDefault: true,
  },
  {
    id: "thesportsdb",
    name: "TheSportsDB Highlights",
    urlTemplate: "https://www.youtube.com/embed/{eventId}",
  },
  {
    id: "autoembed-sports",
    name: "AutoEmbed Sports",
    urlTemplate: "https://player.autoembed.cc/embed/sports/{eventId}",
  },
  {
    id: "2embed-sports",
    name: "2Embed Sports",
    urlTemplate: "https://www.2embed.cc/embedsports/{eventId}",
  },
  {
    id: "smashystream-sports",
    name: "SmashyStream Sports",
    urlTemplate: "https://embed.smashystream.com/playere.php?sport=football&event={eventId}",
  },
  {
    id: "streamed-su",
    name: "FootyLive / Streamed",
    urlTemplate: "https://streamed.su/watch/{eventId}",
  },
];

export const DEFAULT_FOOTBALL_MATCHES: SportsEvent[] = [
  {
    id: "139901",
    title: "Arsenal vs Chelsea",
    league: "Premier League",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    date: "2026-08-20",
    score: {
      home: 2,
      away: 1,
      status: "live",
      minute: "73'",
      kickoffTime: "19:30",
    },
    thumbnailUrl: "https://www.thesportsdb.com/images/media/event/thumb/xsxvvv1550920786.jpg",
    embedUrl: "https://www.scorebat.com/embed/g/139901/",
    highlightsUrl: "https://www.scorebat.com/arsenal-vs-chelsea-live-stream/",
    source: "ScoreBat",
  },
  {
    id: "139902",
    title: "Real Madrid vs FC Barcelona",
    league: "La Liga",
    homeTeam: "Real Madrid",
    awayTeam: "FC Barcelona",
    date: "2026-08-22",
    score: {
      home: 1,
      away: 1,
      status: "live",
      minute: "61'",
      kickoffTime: "20:00",
    },
    thumbnailUrl: "https://www.thesportsdb.com/images/media/event/thumb/wpsvwu1550920790.jpg",
    embedUrl: "https://www.scorebat.com/embed/g/139902/",
    highlightsUrl: "https://www.scorebat.com/real-madrid-vs-barcelona-live-stream/",
    source: "ScoreBat",
  },
  {
    id: "139903",
    title: "Manchester City vs Liverpool",
    league: "Premier League",
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    date: "2026-08-24",
    score: {
      home: 0,
      away: 0,
      status: "upcoming",
      minute: null,
      kickoffTime: "17:30",
    },
    thumbnailUrl: "https://www.thesportsdb.com/images/media/event/thumb/vpwvpw1550920795.jpg",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    highlightsUrl: "https://www.thesportsdb.com/",
    source: "TheSportsDB",
  },
  {
    id: "139904",
    title: "Bayern Munich vs Borussia Dortmund",
    league: "Bundesliga",
    homeTeam: "Bayern Munich",
    awayTeam: "Borussia Dortmund",
    date: "2026-08-25",
    score: {
      home: 3,
      away: 2,
      status: "final",
      minute: null,
      kickoffTime: "18:00",
    },
    thumbnailUrl: "https://www.thesportsdb.com/images/media/event/thumb/utvvqu1550920800.jpg",
    embedUrl: "https://player.autoembed.cc/embed/sports/139904",
    highlightsUrl: "https://player.autoembed.cc/embed/sports/139904",
    source: "AutoEmbed Sports",
  },
  {
    id: "139905",
    title: "Paris Saint-Germain vs Inter Milan",
    league: "UEFA Champions League",
    homeTeam: "Paris Saint-Germain",
    awayTeam: "Inter Milan",
    date: "2026-08-28",
    score: {
      home: 0,
      away: 0,
      status: "upcoming",
      minute: null,
      kickoffTime: "21:00",
    },
    thumbnailUrl: "https://www.thesportsdb.com/images/media/event/thumb/qwerty1550920810.jpg",
    embedUrl: "https://www.2embed.cc/embedsports/139905",
    highlightsUrl: "https://www.2embed.cc/embedsports/139905",
    source: "2Embed Sports",
  },
];

let MATCH_CACHE: SportsEvent[] = [];
let MATCH_CACHE_TIME = 0;
const CACHE_TTL_MS = 25_000;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeQuery(query?: string) {
  return query?.trim().replace(/\s+/g, " ") ?? "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferLeague(title: string, sources?: Array<{ source: string; id: string }>): string {
  const t = title.toLowerCase();
  const sourceStr = (sources || []).map((s) => s.id.toLowerCase()).join(" ");

  if (
    sourceStr.includes("premier-league") ||
    sourceStr.includes("premier_league") ||
    t.includes("arsenal") ||
    t.includes("chelsea") ||
    t.includes("liverpool") ||
    t.includes("manchester") ||
    t.includes("tottenham") ||
    t.includes("newcastle") ||
    t.includes("aston villa") ||
    t.includes("everton") ||
    t.includes("brighton") ||
    t.includes("west ham") ||
    t.includes("wolves")
  ) {
    return "Premier League";
  }

  if (
    sourceStr.includes("laliga") ||
    sourceStr.includes("la-liga") ||
    sourceStr.includes("la_liga") ||
    t.includes("madrid") ||
    t.includes("barcelona") ||
    t.includes("atletico") ||
    t.includes("sevilla") ||
    t.includes("valencia") ||
    t.includes("athletic club") ||
    t.includes("villarreal") ||
    t.includes("betis") ||
    t.includes("sociedad")
  ) {
    return "La Liga";
  }

  if (
    sourceStr.includes("serie-a") ||
    sourceStr.includes("serie_a") ||
    t.includes("juventus") ||
    t.includes("milan") ||
    t.includes("inter") ||
    t.includes("roma") ||
    t.includes("lazio") ||
    t.includes("napoli") ||
    t.includes("atalanta") ||
    t.includes("fiorentina")
  ) {
    return "Serie A";
  }

  if (
    sourceStr.includes("bundesliga") ||
    t.includes("bayern") ||
    t.includes("dortmund") ||
    t.includes("leverkusen") ||
    t.includes("leipzig") ||
    t.includes("frankfurt") ||
    t.includes("stuttgart")
  ) {
    return "Bundesliga";
  }

  if (
    sourceStr.includes("champions-league") ||
    sourceStr.includes("uefa") ||
    t.includes("champions league") ||
    t.includes("ucl")
  ) {
    return "UEFA Champions League";
  }

  return "Football";
}

function looksLikeLeagueMatch(event: SportsEvent, leagueQuery?: string) {
  if (!leagueQuery) return true;
  const normalized = leagueQuery.toLowerCase();
  const eventLeague = event.league.toLowerCase();
  return (
    eventLeague.includes(normalized) ||
    normalized.includes(eventLeague) ||
    (normalized.includes("premier") && eventLeague.includes("premier")) ||
    (normalized.includes("champions") && eventLeague.includes("champions")) ||
    (normalized.includes("la liga") && eventLeague.includes("la liga")) ||
    (normalized.includes("serie a") && eventLeague.includes("serie a"))
  );
}

function matchesQuery(event: SportsEvent, query: string) {
  const normalized = query.toLowerCase();
  if (!normalized) return true;
  return (
    event.title.toLowerCase().includes(normalized) ||
    event.league.toLowerCase().includes(normalized) ||
    event.homeTeam.toLowerCase().includes(normalized) ||
    event.awayTeam.toLowerCase().includes(normalized)
  );
}

type RawStreamedMatch = {
  id: string;
  title: string;
  category: string;
  date: number;
  poster?: string;
  popular?: boolean;
  teams?: {
    home?: { name?: string; badge?: string };
    away?: { name?: string; badge?: string };
  };
  sources?: Array<{ source: string; id: string }>;
};

async function fetchUpstreamMatches(): Promise<SportsEvent[]> {
  const now = Date.now();
  if (MATCH_CACHE.length > 0 && now - MATCH_CACHE_TIME < CACHE_TTL_MS) {
    return MATCH_CACHE;
  }

  try {
    const [matchesRes, liveRes] = await Promise.all([
      fetch("https://streamed.pk/api/matches/football", {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        next: { revalidate: 30 },
      }),
      fetch("https://streamed.pk/api/matches/live", {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        next: { revalidate: 15 },
      }).catch(() => null),
    ]);

    if (!matchesRes.ok) throw new Error(`Upstream returned ${matchesRes.status}`);
    const rawMatches = (await matchesRes.json()) as RawStreamedMatch[];
    const liveIds = new Set<string>();

    if (liveRes && liveRes.ok) {
      const rawLive = (await liveRes.json()) as RawStreamedMatch[];
      for (const m of rawLive) liveIds.add(m.id);
    }

    const events: SportsEvent[] = rawMatches.map((m) => {
      const isLive = liveIds.has(m.id) || (now >= m.date && now - m.date < 115 * 60 * 1000);
      const isUpcoming = m.date > now;
      const status: SportsScore["status"] = isLive ? "live" : isUpcoming ? "upcoming" : "final";
      const minute = isLive
        ? `${Math.max(1, Math.min(90, Math.floor((now - m.date) / 60000)))}'`
        : null;
      const kickoffTime = new Date(m.date).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const homeTeam = m.teams?.home?.name || m.title.split(" vs ")[0] || "Home Team";
      const awayTeam = m.teams?.away?.name || m.title.split(" vs ")[1] || "Away Team";
      const homeBadge = m.teams?.home?.badge ? `https://streamed.pk/api/images/proxy/${m.teams.home.badge}.webp` : null;
      const awayBadge = m.teams?.away?.badge ? `https://streamed.pk/api/images/proxy/${m.teams.away.badge}.webp` : null;
      const league = inferLeague(m.title, m.sources);

      return {
        id: m.id,
        title: m.title,
        league,
        homeTeam,
        awayTeam,
        date: new Date(m.date).toISOString().slice(0, 10),
        score: {
          home: null,
          away: null,
          status,
          minute,
          kickoffTime,
        },
        thumbnailUrl: m.poster ? `https://streamed.pk${m.poster}` : null,
        homeBadge,
        awayBadge,
        embedUrl: `https://streamed.su/watch/${m.id}`,
        highlightsUrl: `https://streamed.su/watch/${m.id}`,
        source: "Streamed / FootyLive",
        sources: m.sources,
        streamCount: m.sources?.length || 0,
      };
    });

    MATCH_CACHE = events;
    MATCH_CACHE_TIME = now;
    return events;
  } catch {
    return MATCH_CACHE.length > 0 ? MATCH_CACHE : [];
  }
}

function synthesizeSportsEvent(query: string, league?: string): SportsEvent {
  const title = league ? `${query} - ${league}` : `${query} Football Match`;
  return {
    id: `match-${slugify(query || league || "live-football")}`,
    title,
    league: league || "Live Match Feed",
    homeTeam: query || "Featured Match",
    awayTeam: "Opponent",
    date: todayIso(),
    score: {
      home: 0,
      away: 0,
      status: "live",
      minute: "45'",
      kickoffTime: null,
    },
    thumbnailUrl: null,
    embedUrl: null,
    highlightsUrl: null,
    source: "Sports Stream Aggregator",
  };
}

export function getAvailableSportsProviders(): SportsProvider[] {
  return SPORTS_PROVIDERS;
}

export function getSportsProvider(providerId?: string): SportsProvider {
  const providers = getAvailableSportsProviders();
  if (providerId) {
    const found = providers.find((provider) => provider.id === providerId || provider.name.toLowerCase() === providerId.toLowerCase());
    if (found) return found;
  }
  return providers.find((provider) => provider.isDefault) ?? providers[0];
}

export function getSportsLeague(leagueId?: string): SportsLeague | undefined {
  if (!leagueId) return undefined;
  const normalized = leagueId.toLowerCase();
  return SPORTS_LEAGUES.find((league) => league.id === normalized || league.name.toLowerCase() === normalized);
}

export function buildSportsEmbedUrl(providerId: string, eventId: string, eventTitle?: string): string {
  const provider = getSportsProvider(providerId);
  const cleanId = encodeURIComponent(eventId);
  const cleanSlug = eventTitle ? encodeURIComponent(slugify(eventTitle)) : cleanId;

  return provider.urlTemplate
    .replaceAll("{eventId}", cleanId)
    .replaceAll("{slug}", cleanSlug);
}

export async function searchSportsEvents(query?: string, leagueId?: string): Promise<SportsEvent[]> {
  const normalizedQuery = normalizeQuery(query);
  const league = getSportsLeague(leagueId);
  const leagueQuery = league?.query ?? league?.name ?? leagueId;

  const upstreamEvents = await fetchUpstreamMatches();
  const allEvents = upstreamEvents.length > 0 ? upstreamEvents : DEFAULT_FOOTBALL_MATCHES;

  let filtered = allEvents.filter(
    (event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery)
  );

  // If upstream had no matches for the specific query/league, try default fixtures
  if (filtered.length === 0 && upstreamEvents.length > 0) {
    filtered = DEFAULT_FOOTBALL_MATCHES.filter(
      (event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery)
    );
  }

  if (filtered.length > 0) {
    // Sort live matches to top, then upcoming matches
    return filtered.slice().sort((a, b) => {
      if (a.score.status === "live" && b.score.status !== "live") return -1;
      if (b.score.status === "live" && a.score.status !== "live") return 1;
      return 0;
    });
  }

  return [synthesizeSportsEvent(normalizedQuery || leagueQuery || "Football", leagueQuery)];
}

export async function fetchSportsFeed(query?: string, leagueId?: string): Promise<SportsEvent[]> {
  return searchSportsEvents(query, leagueId);
}

export function createSportsPlaybackDescriptor(
  eventId: string,
  eventTitle: string,
  providerId?: string
): SportsPlaybackDescriptor {
  const availableProviders = getAvailableSportsProviders();
  const provider = getSportsProvider(providerId);
  const url = buildSportsEmbedUrl(provider.id, eventId, eventTitle);

  return {
    provider: provider.id,
    mode: "embed",
    url,
    eventId,
    eventTitle,
    availableProviders,
  };
}

export type LiveStreamOption = {
  id: string;
  streamNo: number;
  language: string;
  hd: boolean;
  embedUrl: string;
  source: string;
};

export async function fetchLiveStreamsForEvent(sources: Array<{ source: string; id: string }>): Promise<LiveStreamOption[]> {
  const allStreams: LiveStreamOption[] = [];
  const prioritySources = ["admin", "delta", "golf", "echo"];
  const sortedSources = sources.slice().sort((a, b) => prioritySources.indexOf(a.source) - prioritySources.indexOf(b.source));

  await Promise.all(
    sortedSources.map(async (s) => {
      try {
        const response = await fetch(`https://streamed.pk/api/stream/${s.source}/${s.id}`, {
          headers: { "User-Agent": "Mozilla/5.0", Referer: "https://streamed.pk/" },
          next: { revalidate: 20 },
        });
        if (response.ok) {
          const streams = (await response.json()) as LiveStreamOption[];
          if (Array.isArray(streams)) {
            for (const item of streams) {
              if (item.embedUrl) allStreams.push({ ...item, source: s.source });
            }
          }
        }
      } catch {
        // Skip failed stream endpoints gracefully
      }
    })
  );

  return allStreams;
}

export async function resolveSportsPlayback(
  eventId: string,
  eventTitle: string,
  preferredProvider?: string
): Promise<SportsPlaybackDescriptor> {
  const standardProviders = getAvailableSportsProviders();

  // If caller specifically requested a legacy static provider (e.g. ScoreBat, AutoEmbed)
  const isLegacy = standardProviders.some((p) => p.id === preferredProvider && p.id !== "streamed-su");
  if (isLegacy && preferredProvider) {
    return createSportsPlaybackDescriptor(eventId, eventTitle, preferredProvider);
  }

  // Find the event
  const event = findSportsEvent(eventId);
  if (event?.sources && event.sources.length > 0) {
    const liveStreams = await fetchLiveStreamsForEvent(event.sources);

    if (liveStreams.length > 0) {
      const dynamicProviders: SportsProvider[] = liveStreams.map((s, idx) => ({
        id: `stream-${idx}`,
        name: `${s.language || "English"} [${s.source.toUpperCase()}] ${s.hd ? "⚡ HD" : "SD"}`,
        urlTemplate: `/api/sports/stream-embed?url=${encodeURIComponent(s.embedUrl)}`,
        isDefault: idx === 0,
      }));

      // Find the chosen stream or pick the first HD stream
      let chosenIdx = 0;
      if (preferredProvider && preferredProvider.startsWith("stream-")) {
        const parsedIdx = Number(preferredProvider.replace("stream-", ""));
        if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < liveStreams.length) {
          chosenIdx = parsedIdx;
        }
      } else {
        const hdIdx = liveStreams.findIndex((s) => s.hd);
        if (hdIdx >= 0) chosenIdx = hdIdx;
      }

      const activeStream = liveStreams[chosenIdx] || liveStreams[0];
      const shieldedUrl = `/api/sports/stream-embed?url=${encodeURIComponent(activeStream.embedUrl)}`;

      return {
        provider: `stream-${chosenIdx}`,
        mode: "embed",
        url: shieldedUrl,
        eventId,
        eventTitle,
        availableProviders: dynamicProviders.concat(standardProviders),
        streams: liveStreams,
      };
    }
  }

  // Fallback to default descriptor
  return createSportsPlaybackDescriptor(eventId, eventTitle, preferredProvider || "scorebat");
}

export function getSportsEventCatalog() {
  return DEFAULT_FOOTBALL_MATCHES;
}

export function findSportsEvent(eventId: string, query?: string, leagueId?: string): SportsEvent | undefined {
  const cachedMatch = MATCH_CACHE.find((event) => event.id === eventId);
  if (cachedMatch) return cachedMatch;

  const exactMatch = DEFAULT_FOOTBALL_MATCHES.find((event) => event.id === eventId);
  if (exactMatch) return exactMatch;

  const normalizedQuery = normalizeQuery(query);
  const league = getSportsLeague(leagueId);
  const leagueQuery = league?.query ?? league?.name ?? leagueId;
  return (
    MATCH_CACHE.find((event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery)) ||
    DEFAULT_FOOTBALL_MATCHES.find((event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery))
  );
}
