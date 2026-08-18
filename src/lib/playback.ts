import type { EpisodeSelection, PlaybackDescriptor, Title } from "./types";
import { buildProviderUrl, getAvailableProviders, getProvider } from "./providers";

export function buildEmbedUrl(title: Pick<Title, "id" | "imdbId">, episode?: EpisodeSelection) {
  const template = process.env.VIDSRC_EMBED_URL_TEMPLATE;
  if (!template) {
    return buildProviderUrl(getProvider(), title, episode);
  }
  if (episode === undefined && /\{season\}|\{episode\}/.test(template)) throw new Error("TV embed template requires season and episode.");
  return template.replaceAll("{tmdbId}", String(title.id)).replaceAll("{imdbId}", title.imdbId ?? "").replaceAll("{season}", String(episode?.season ?? "")).replaceAll("{episode}", String(episode?.episode ?? ""));
}

export function createPlaybackDescriptor(
  title: Pick<Title, "id" | "imdbId">,
  episode?: EpisodeSelection,
  providerId?: string
): PlaybackDescriptor {
  const availableProviders = getAvailableProviders();

  const selectedProvider = getProvider(providerId);
  const url = buildProviderUrl(selectedProvider, title, episode);

  return {
    provider: selectedProvider.id,
    mode: "embed",
    url,
    titleId: title.id,
    ...(episode ? { episode } : {}),
    availableProviders,
  };
}
