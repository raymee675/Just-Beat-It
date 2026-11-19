# Post-release site update and SEO

Date: 2026-11-19  
Status: Implemented and source-validated on `release/post-launch-2026-11-19`; branch publication only, no main deployment.

## Objective

Update the official site copy now that the 2026-11-19 Steam launch date has arrived: state that Just Beat It is available on Steam, replace the Japanese and English team name with the exact lowercase `ark art games`, and improve accurate discovery by Google and other search engines. Work stays on the requested branch; do not push to or deploy `main`.

## Findings and constraints

- Current branch point is local `main` at `8bbb7b5`, which is one commit ahead of `origin/main`. Preserve that existing commit in the new branch.
- The site is static HTML/CSS/JS, served from `/Just-Beat-It/`; no build or npm commands are used. `CLAUDE.md` says not to include game downloads, personal names, school or event names. The existing Steam store link is configured in `assets/js/config.js`.
- Upcoming-release copy is in `index.html` metadata, hero Steam button, and section 04. `assets/js/main.js` also contains an upcoming-release ticker. Team name appears in `config.js`, HTML fallbacks, and JavaScript fallback; `README.md` intro also names the team.
- `robots.txt` currently allows all crawlers. On a GitHub Pages project site, a repo-level `/Just-Beat-It/robots.txt` is not the host-root `/robots.txt` recognized by Google. A sitemap at the canonical project URL can still be linked from the page and declared in this project file as an advisory; submit it through Search Console/Bing after publication if those properties are available.

## Scope and ownership

**Implementation owner: primary agent.** Keep the related copy/metadata edits coordinated. Work stays on the release branch; do not deploy or merge it.

- `index.html`: bilingual available-now copy, exact brand fallbacks, title/description/Open Graph metadata, canonical URL, sitemap discovery link, and JSON-LD.
- `assets/js/config.js`: set both `team.ja` and `team.en` to exactly `ark art games`.
- `assets/js/main.js`: change release-date ticker text and the team-name fallback to match the new state/brand.
- `README.md`: update the intro name if it still describes the old team identity.
- `sitemap.xml`: add a static sitemap containing the single canonical home URL, `https://raymee675.github.io/Just-Beat-It/`.
- `robots.txt`: retain allow-all behavior and add the absolute sitemap URL as advisory for crawlers that honor a project-path robots file.
- Preserve existing noindex behavior for redirects and `404.html`; do not add them to the sitemap.

## Implementation and acceptance criteria

1. Replace upcoming language and date in Japanese and English metadata, hero CTA, section 04 title/body, and ticker with concise “available now” wording. Preserve the existing Steam store URL and avoid implying a downloadable build.
2. Use the exact lowercase `ark art games` in both config language values and in static/JavaScript fallback surfaces. Check that the team section, hero credit, footer and copyright all display it, including when JavaScript is unavailable.
3. Set a descriptive, current page title and bilingual description; keep canonical and Open Graph URLs on the official project URL, and synchronize Open Graph title/description with the visible release state.
4. Add one canonical URL to `sitemap.xml`; reference it from the document head and `robots.txt`. Do not add query-string language/style variants to the sitemap.
5. Add conservative JSON-LD for the `VideoGame` and its `Organization` creator using only verified name, canonical URL, Steam URL, and accurate descriptions. Do not invent pricing, ratings, availability dates, or platform facts. Structured data improves eligibility; it does not promise ranking or rich-result display.
6. Verify copy has no stale upcoming-date phrases; validate sitemap XML, JSON-LD syntax and canonical URL; inspect final diff. Keep all changes on the release branch and report that publication/search-engine submission remains post-merge work.

## Risks and boundaries

- Avoid duplicated or conflicting descriptions between visible copy, standard metadata and Open Graph tags.
- The repo-level robots file cannot control the host-root crawler policy for this project path; sitemap discovery/submission after deployment is the reliable follow-up.
- Search indexing and ranking are controlled by search engines. This branch can provide crawlable metadata and a sitemap, but cannot guarantee indexing or placement.

Validation completed: JavaScript syntax checks; config comparison preserving members/Steam/PV/contact; metadata and JSON-LD parsing; sitemap XML parsing; static HTML asset existence; unchanged notice/contact content; retained redirect/404 noindex; no stale upcoming-release copy or old team name in runtime files. Browser rendering and search-engine submission were not performed.
