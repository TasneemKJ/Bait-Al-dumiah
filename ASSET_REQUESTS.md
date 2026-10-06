# Asset requests

Assets this repo needs but that should come from an artist or image pipeline, not code. Until they arrive, the listed stand-ins are used (all derived from existing project art, no placeholders).

| What | Where it is used | Size and format | Mood and references | Stand-in now |
|------|------------------|-----------------|---------------------|--------------|
| App icon (maskable) | `public/icon-192.png`, `public/icon-512.png`, `manifest.webmanifest`, `apple-touch-icon` | 192 and 512 px PNG, 20% safe zone for maskable, plus a 180 px apple icon | The cutaway house silhouette in rose (#b78398) on cream (#efe1d7) with a warm lit window; porcelain-soft edges, no text | Rasterised `favicon.svg` |
| Share card | `public/og-image.jpg` (Open Graph and Twitter) | 1200x630 JPEG under 250 KB | The real dollhouse at dusk, bilingual title lettering "Bait Al-dumiah · بيت الدمية" in the serif display style, cream frame with gold hairline | Plain render of the in-game house, no lettering |
| Store screenshots | Store listing, README | 1080x1920 and 1920x1080 PNG, 4 to 6 each | Kitchen tea pouring, studio sewing, moon chimes, night visitor, Arabic UI | None |

Notes: `og:image` is relative because the production URL is not recorded here; set an absolute URL once the domain is fixed.
