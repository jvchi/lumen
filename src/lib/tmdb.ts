import { z } from "zod";
import type { Title, TitleType } from "./types";

const BASE_URL = "https://api.themoviedb.org/3";
const imageBase = process.env.TMDB_IMAGE_BASE_URL ?? "https://image.tmdb.org/t/p/w780";
const resultSchema = z.object({ id: z.number(), media_type: z.enum(["movie", "tv", "person"]).optional(), title: z.string().optional(), name: z.string().optional(), original_title: z.string().optional(), original_name: z.string().optional(), overview: z.string().default(""), poster_path: z.string().nullable().optional(), backdrop_path: z.string().nullable().optional(), release_date: z.string().optional(), first_air_date: z.string().optional(), vote_average: z.number().optional(), vote_count: z.number().optional() });

function authHeaders() {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const headers: Record<string, string> = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (token || process.env.TMDB_API_KEY) return headers;
  throw new Error("TMDB credentials are not configured. Set TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY.");
}

async function tmdb<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams();
  if (process.env.TMDB_API_KEY && !process.env.TMDB_READ_ACCESS_TOKEN) query.set("api_key", process.env.TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) if (value !== undefined) query.set(key, String(value));
  const response = await fetch(`${BASE_URL}${path}?${query}`, { headers: authHeaders(), next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json() as Promise<T>;
}

const image = (path?: string | null) => (path ? `${imageBase}${path}` : null);

export function normalizeSearchResult(raw: z.infer<typeof resultSchema>): Title {
  const type: TitleType = raw.media_type === "tv" || raw.name ? "tv" : "movie";
  const releaseDate = raw.release_date || raw.first_air_date || null;
  return { id: raw.id, type, title: raw.title || raw.name || "Untitled", originalTitle: raw.original_title || raw.original_name || "", overview: raw.overview, posterUrl: image(raw.poster_path), backdropUrl: image(raw.backdrop_path), releaseDate, year: releaseDate?.slice(0, 4) ?? null, runtimeMinutes: null, genres: [], rating: raw.vote_average ?? null, voteCount: raw.vote_count ?? 0, imdbId: null, seasons: [], cast: [], watchProviders: [] };
}

export async function searchTitles(query: string) {
  const data = await tmdb<{ results: unknown[] }>("/search/multi", { query, include_adult: "false", language: "en-US", page: 1 });
  return data.results.flatMap((item) => { const parsed = resultSchema.safeParse(item); return parsed.success && parsed.data.media_type !== "person" ? [normalizeSearchResult(parsed.data)] : []; });
}

export async function getTitle(id: number, type: TitleType, region = process.env.TMDB_DEFAULT_REGION ?? "US"): Promise<Title> {
  const raw = await tmdb<unknown>(`/${type}/${id}`, { language: "en-US", append_to_response: "credits,watch/providers" });
  const parsed = resultSchema.extend({ runtime: z.number().nullable().optional(), episode_run_time: z.array(z.number()).optional(), genres: z.array(z.object({ name: z.string() })).default([]), seasons: z.array(z.object({ season_number: z.number(), name: z.string(), episode_count: z.number() })).default([]), external_ids: z.object({ imdb_id: z.string().nullable().optional() }).optional(), credits: z.object({ cast: z.array(z.object({ id: z.number(), name: z.string(), character: z.string().default(""), profile_path: z.string().nullable().optional() })).default([]) }).optional(), "watch/providers": z.object({ results: z.record(z.string(), z.object({ flatrate: z.array(z.object({ provider_id: z.number(), provider_name: z.string(), logo_path: z.string().nullable().optional() })).optional(), link: z.string().optional() }).optional()).default({}) }).optional() }).parse(raw);
  const releaseDate = parsed.release_date || parsed.first_air_date || null;
  const providers = parsed["watch/providers"]?.results?.[region]?.flatrate ?? [];
  return { id, type, title: parsed.title || parsed.name || "Untitled", originalTitle: parsed.original_title || parsed.original_name || "", overview: parsed.overview, posterUrl: image(parsed.poster_path), backdropUrl: image(parsed.backdrop_path), releaseDate, year: releaseDate?.slice(0, 4) ?? null, runtimeMinutes: parsed.runtime ?? parsed.episode_run_time?.[0] ?? null, genres: parsed.genres.map((genre) => genre.name), rating: parsed.vote_average ?? null, voteCount: parsed.vote_count ?? 0, imdbId: parsed.external_ids?.imdb_id ?? null, seasons: parsed.seasons.map((season) => ({ seasonNumber: season.season_number, name: season.name, episodeCount: season.episode_count })), cast: (parsed.credits?.cast ?? []).slice(0, 8).map((person) => ({ id: person.id, name: person.name, character: person.character, profileUrl: image(person.profile_path) })), watchProviders: providers.map((provider) => ({ providerId: provider.provider_id, providerName: provider.provider_name, logoUrl: image(provider.logo_path), link: parsed["watch/providers"]?.results?.[region]?.link ?? null })) };
}
