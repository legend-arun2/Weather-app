# Weather Chat

A chat-style weather web app. Ask in plain English:

- "What's the weather in Paris?"
- "Next 24 hours in Tokyo"
- "What should I wear today in Oslo?"
- or tap **Use my location**.

You get current conditions, a 24-hour temperature and rain chart, and rule-based clothing advice
(based on feels-like temperature, rain chance, wind and UV). °C/°F toggle included.

Weather data comes from [Open-Meteo](https://open-meteo.com/), which needs **no API key**, so nothing secret ships to the browser.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (intent parsing, outfit rules, API mapping)
npm run build    # type-check + production build into dist/
```

## Deploy to GitHub Pages

1. Merge this branch into `main`.
2. In the repo go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The `Deploy to GitHub Pages` workflow builds and publishes to `https://<user>.github.io/Weather-app/`.

The base path is set by `VITE_BASE_PATH` (default `/Weather-app/`).

## Deploy to Vercel later

Import the repo in Vercel and set the environment variable `VITE_BASE_PATH=/`. No other changes are needed.

## About API keys and `.env`

`.env` keeps values out of git, but any `VITE_*` variable is **bundled into the public JavaScript**, so never put a secret there.
If you later add a keyed API or an AI feature, call it from a Vercel serverless function (`api/` folder) and store the key in
Vercel's environment variables instead. `.env.example` lists the non-secret settings.
