# Assets

Every third-party asset in the repository is listed here with its source and licence.

## Cover photos (`apps/web/public/covers/`)

Source: Unsplash, under the Unsplash License (free for commercial use, no attribution required).
Downloaded on 2026-11-21 at 960×600. To replace one, pick another free-licence photo, keep the
file name, and update the id below.

| File | Unsplash image id |
| --- | --- |
| `forest.jpg` | `photo-1773916543957-d370611ac764` |
| `sky.jpg` | `photo-1603437873662-dc1f44901825` |
| `rain.jpg` | `photo-1509635022432-0220ac12960b` |
| `hills.jpg` | `photo-1650647526661-5dee44d4b62a` |
| `water.jpg` | `photo-1761157845286-7663794fd91d` |
| `mountain.jpg` | `photo-1554629947-334ff61d85dc` |
| `field.jpg` | `photo-1779043152010-3591365838aa` |
| `city.jpg` | `photo-1768677432858-b9a8608dd849` |
| `hive.jpg` | `photo-1785762857363-b284f4f57bcb` |
| `coins.jpg` | `photo-1619718082268-5a1b74988497` |
| `bolt.jpg` | `photo-1473341304170-971dccb5ac1e` |
| `code.jpg` | `photo-1515879218367-8466d910aaa4` |
| `book.jpg` | `photo-1524995997946-a1c2e315a42f` |
| `map.jpg` | `photo-1619468129361-605ebea04b44` |
| `shop.jpg` | `photo-1583258292688-d0213dc5a3a8` |
| `desk.jpg` | `photo-1499750310107-5fef28a66643` |
| `token.jpg` | `photo-1518546305927-5a555bb7020d` |
| `news.jpg` | `photo-1631519952398-5b1d76b946e8` |
| `package.jpg` | `photo-1656543802898-41c8c46683a7` |
| `transit.jpg` | `photo-1606152535780-6b29396e2571` |
| `sunrise.jpg` | `photo-1470252649378-9c29740c9fa8` |
| `parking.jpg` | `photo-1772440223054-6613649ba1c6` |

## Interface components (`apps/web/src/components/ui/`)

Generated with the [shadcn/ui](https://ui.shadcn.com) CLI, then edited. shadcn/ui is under the MIT
License, whose notice the copies keep:

```
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Source data in test recordings

The recordings in `packages/recipes/src/golden/recordings/` and
`apps/gateway/src/catalog/recordings/` are copies of source responses under each source's terms;
the vulnerability catalog keeps only its first 25 rows.

| Recordings | Source | Licence | Credit |
| --- | --- | --- | --- |
| `dwd-station-report-index.json`, `frankfurt-station-report.json` | [Deutscher Wetterdienst Open Data Server](https://opendata.dwd.de/) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Source: Deutscher Wetterdienst |
| `topeka-latest-observation.json` | [National Weather Service API](https://www.weather.gov/documentation/services-web-api) | Public domain (U.S. Government work) | None required |
| `treasury-average-interest-rates.json` | [U.S. Treasury Fiscal Data API](https://fiscaldata.treasury.gov/api-documentation/) | Unrestricted (U.S. Treasury open data) | None required |
| `known-exploited-vulnerabilities.json` | [CISA Known Exploited Vulnerabilities Catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | None required |
| `nanterre-address.json` | [Géoplateforme geocoding (IGN), Base Adresse Nationale](https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/geocodage/) | [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) | Source: Base Adresse Nationale (BAN) via IGN Géoplateforme, recorded on 2026-11-22 |
