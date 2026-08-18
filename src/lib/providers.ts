import type { EpisodeSelection, PlaybackDescriptor, StreamProvider, Title } from "./types";

export const STREAM_PROVIDERS: StreamProvider[] = [
  {
    id: "vidsrc-pm",
    name: "VidSrc.pm",
    movieTemplate: "https://vidsrc.pm/embed/movie/{tmdbId}",
    tvTemplate: "https://vidsrc.pm/embed/tv/{tmdbId}/{season}/{episode}",
    isDefault: true,
  },
  {
    id: "embed-su",
    name: "Embed.su",
    movieTemplate: "https://embed.su/embed/movie/{tmdbId}",
    tvTemplate: "https://embed.su/embed/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "autoembed-co",
    name: "AutoEmbed.co",
    movieTemplate: "https://autoembed.co/movie/tmdb/{tmdbId}",
    tvTemplate: "https://autoembed.co/tv/tmdb/{tmdbId}-{season}-{episode}",
  },
  {
    id: "2embed",
    name: "2Embed",
    movieTemplate: "https://www.2embed.cc/embed/{tmdbId}",
    tvTemplate: "https://www.2embed.cc/embedtv/{tmdbId}&s={season}&e={episode}",
  },
  {
    id: "vidsrc-to",
    name: "VidSrc.to",
    movieTemplate: "https://vidsrc.to/embed/movie/{tmdbId}",
    tvTemplate: "https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "vidsrc-me",
    name: "VidSrc.me",
    movieTemplate: "https://vidsrc.me/embed/movie?tmdb={tmdbId}",
    tvTemplate: "https://vidsrc.me/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}",
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc.cc",
    movieTemplate: "https://vidsrc.cc/v2/embed/movie/{tmdbId}",
    tvTemplate: "https://vidsrc.cc/v2/embed/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "111movies",
    name: "111Movies",
    movieTemplate: "https://111movies.com/movie/{tmdbId}",
    tvTemplate: "https://111movies.com/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "videoeasy",
    name: "VideoEasy / AutoEmbed Player",
    movieTemplate: "https://player.autoembed.cc/embed/movie/{tmdbId}",
    tvTemplate: "https://player.autoembed.cc/embed/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "cinerc",
    name: "CineRC",
    movieTemplate: "https://cinerc.xyz/embed/movie/{tmdbId}",
    tvTemplate: "https://cinerc.xyz/embed/tv/{tmdbId}/{season}/{episode}",
  },
  {
    id: "smashystream",
    name: "SmashyStream",
    movieTemplate: "https://embed.smashystream.com/playere.php?tmdb={tmdbId}",
    tvTemplate: "https://embed.smashystream.com/playere.php?tmdb={tmdbId}&season={season}&episode={episode}",
  },
  {
    id: "vidbinge",
    name: "VidBinge",
    movieTemplate: "https://vidbinge.dev/embed/movie/{tmdbId}",
    tvTemplate: "https://vidbinge.dev/embed/tv/{tmdbId}/{season}/{episode}",
  },
];

export function getAvailableProviders(): StreamProvider[] {
  const configuredTemplate = process.env.VIDSRC_EMBED_URL_TEMPLATE?.trim();
  if (configuredTemplate) {
    const customProvider: StreamProvider = {
      id: "vidsrc-configured",
      name: "Configured Custom Embed",
      movieTemplate: configuredTemplate,
      tvTemplate: configuredTemplate,
      isDefault: true,
    };
    return [customProvider, ...STREAM_PROVIDERS.map((p) => ({ ...p, isDefault: false }))];
  }
  return STREAM_PROVIDERS;
}

export function getProvider(providerId?: string): StreamProvider {
  const providers = getAvailableProviders();
  if (providers.length === 0) {
    throw new Error("No authorized playback provider is configured. Set VIDSRC_EMBED_URL_TEMPLATE in .env.local.");
  }
  if (providerId) {
    const found = providers.find((p) => p.id === providerId || p.name.toLowerCase() === providerId.toLowerCase());
    if (found) return found;
  }
  return providers.find((p) => p.isDefault) ?? providers[0];
}

export function buildProviderUrl(
  provider: StreamProvider | string,
  title: Pick<Title, "id" | "imdbId">,
  episode?: EpisodeSelection
): string {
  const providerObj = typeof provider === "string" ? getProvider(provider) : provider;
  const template = episode ? providerObj.tvTemplate : providerObj.movieTemplate;

  if (episode === undefined && /\{season\}|\{episode\}/.test(template)) {
    throw new Error(`TV embed template for provider '${providerObj.name}' requires season and episode.`);
  }

  return template
    .replaceAll("{tmdbId}", String(title.id))
    .replaceAll("{imdbId}", title.imdbId ?? "")
    .replaceAll("{season}", String(episode?.season ?? ""))
    .replaceAll("{episode}", String(episode?.episode ?? ""));
}

export function getAllPlaybackDescriptors(
  title: Pick<Title, "id" | "imdbId">,
  episode?: EpisodeSelection
): PlaybackDescriptor[] {
  const providers = getAvailableProviders();
  return providers.map((provider) => ({
    provider: provider.id,
    mode: "embed",
    url: buildProviderUrl(provider, title, episode),
    titleId: title.id,
    ...(episode ? { episode } : {}),
  }));
}
