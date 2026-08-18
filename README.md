# Lumen Streaming Pipeline POC

This is a local proof of concept for the pipeline:

`TMDB metadata → normalized title → configured external embed → playback surface`

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set either `TMDB_READ_ACCESS_TOKEN` or `TMDB_API_KEY`. Set `VIDSRC_EMBED_URL_TEMPLATE` to an embed URL template for a provider you control or are authorized to use. The app does not include third-party aggregator fallbacks because their pages can inject ads and redirects into an iframe. Supported placeholders are `{tmdbId}`, `{imdbId}`, `{season}`, and `{episode}`.

Examples of endpoint calls:

```text
/api/search?q=Severance
/api/title/1399?type=tv
/api/playback?tmdbId=1399&type=tv&season=1&episode=1
```

The app intentionally does not scrape or proxy hidden video URLs, bypass access controls, or discover unauthorized streams. TMDB attribution and API terms still apply.

## Verification

```bash
npm run typecheck
npm test
npm run build
```
