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

const DEFAULT_FOOTBALL_MATCHES: SportsEvent[] = [
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

function looksLikeLeagueMatch(event: SportsEvent, league?: string) {
  if (!league) return true;
  const normalized = league.toLowerCase();
  return event.league.toLowerCase().includes(normalized) || event.league.toLowerCase() === normalized;
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

function transformSportsDbEvent(item: Record<string, string | null | undefined>, index: number): SportsEvent {
  const homeScore = item.intHomeScore ? Number(item.intHomeScore) : null;
  const awayScore = item.intAwayScore ? Number(item.intAwayScore) : null;
  const status = (item.strStatus?.toLowerCase() === "live"
    ? "live"
    : item.strStatus?.toLowerCase() === "finished" || item.strStatus?.toLowerCase() === "final"
      ? "final"
      : "upcoming") as SportsScore["status"];

  const title = item.strEvent || `${item.strHomeTeam || "Home"} vs ${item.strAwayTeam || "Away"}`;
  return {
    id: item.idEvent || `sports-${index + 1}`,
    title,
    league: item.strLeague || "Football",
    homeTeam: item.strHomeTeam || "Home Team",
    awayTeam: item.strAwayTeam || "Away Team",
    date: item.dateEvent || null,
    score: {
      home: homeScore,
      away: awayScore,
      status,
      minute: item.strProgress || null,
      kickoffTime: item.strTime || null,
    },
    thumbnailUrl: item.strThumb || null,
    embedUrl: item.strVideo ? item.strVideo.replace("watch?v=", "embed/") : null,
    highlightsUrl: item.strVideo || null,
    source: "TheSportsDB",
  };
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

  if (normalizedQuery) {
    const remoteQuery = normalizedQuery;
    try {
      const response = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=${encodeURIComponent(remoteQuery)}`, {
        next: { revalidate: 300 },
      });
      if (response.ok) {
        const data = (await response.json()) as { event?: Array<Record<string, string | null | undefined>> };
        const remoteEvents = Array.isArray(data.event) ? data.event.map((item, index) => transformSportsDbEvent(item, index)) : [];
        const filteredRemoteEvents = remoteEvents.filter((event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery));
        if (filteredRemoteEvents.length > 0) {
          return filteredRemoteEvents;
        }
      }
    } catch {
      // Fall back to the local catalog when network access is unavailable.
    }
  }

  const filtered = DEFAULT_FOOTBALL_MATCHES.filter((event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery));
  if (filtered.length > 0) return filtered;

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

export function getSportsEventCatalog() {
  return DEFAULT_FOOTBALL_MATCHES;
}

export function findSportsEvent(eventId: string, query?: string, leagueId?: string): SportsEvent | undefined {
  const exactMatch = DEFAULT_FOOTBALL_MATCHES.find((event) => event.id === eventId);
  if (exactMatch) return exactMatch;

  const normalizedQuery = normalizeQuery(query);
  const league = getSportsLeague(leagueId);
  const leagueQuery = league?.query ?? league?.name ?? leagueId;
  return DEFAULT_FOOTBALL_MATCHES.find((event) => looksLikeLeagueMatch(event, leagueQuery) && matchesQuery(event, normalizedQuery));
}
