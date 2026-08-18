export type TitleType = "movie" | "tv";

export type Title = {
  id: number;
  type: TitleType;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null;
  year: string | null;
  runtimeMinutes: number | null;
  genres: string[];
  rating: number | null;
  voteCount: number;
  imdbId: string | null;
  seasons: { seasonNumber: number; name: string; episodeCount: number }[];
  cast: { id: number; name: string; character: string; profileUrl: string | null }[];
  watchProviders: { providerId: number; providerName: string; logoUrl: string | null; link: string | null }[];
};

export type EpisodeSelection = { season: number; episode: number };

export type StreamProvider = {
  id: string;
  name: string;
  movieTemplate: string;
  tvTemplate: string;
  isDefault?: boolean;
};

export type PlaybackDescriptor = {
  provider: string;
  mode: "embed" | "hls";
  url: string;
  titleId: number;
  episode?: EpisodeSelection;
  availableProviders?: StreamProvider[];
};

export type PipelineResult = {
  requestId: string;
  metadata: Title;
  playback: PlaybackDescriptor;
};

export type SportsProvider = {
  id: string;
  name: string;
  urlTemplate: string;
  isDefault?: boolean;
};

export type SportsLeague = {
  id: string;
  name: string;
  query: string;
};

export type SportsScore = {
  home: number | null;
  away: number | null;
  status: "live" | "upcoming" | "final";
  minute: string | null;
  kickoffTime: string | null;
};

export type SportsEvent = {
  id: string;
  title: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string | null;
  score: SportsScore;
  thumbnailUrl: string | null;
  embedUrl: string | null;
  highlightsUrl: string | null;
  source: string;
};

export type SportsPlaybackDescriptor = {
  provider: string;
  mode: "embed" | "hls";
  url: string;
  eventId: string;
  eventTitle: string;
  availableProviders?: SportsProvider[];
};
