# Make the new site design the default

Date: 2026-10-31  
Status: Implemented; source checks passed; deployment pending

## Objective and expected behavior

Publish the `claude/style-v3` visual design, including its final 12th-design fixes in `d74156f`, as the default at `https://raymee675.github.io/Just-Beat-It/`. A visitor opening the canonical URL without `?style=new` must see the new design in Japanese and English on desktop and mobile. Keep an explicit `?style=now` escape hatch only if it can be retained cleanly; it must not make the old design the no-query default.

Integrate the design with current `main` content. Keep the Windows-only release and its current download details, the pre-play safety/usage/privacy notice and Windows launch guidance, and the section 08 contact form. Do not publish Mac download cards, Mac launch instructions, or copy suggesting that a Mac build is available. Keep the official Pages root deployment behavior.

## Findings and constraints

- The working tree is clean at `main` / `origin/main`, commit `86e7993`. This repo is a static HTML/CSS/JS site served from the repository root by GitHub Pages; there is no build or npm workflow.
- The style branch is `origin/claude/style-v3`, ending at `d74156f`, with merge base `cc600cc`. The branch was developed before recent main updates. Its full tree differs from current main in 15 files; it includes the new style assets and accumulated redesign, but lacks the new contact section and has older Windows/Mac download copy and config. Do not replace current main with the branch snapshot or take its stale `config.js`/download content wholesale.
- In the branch, the initial inline script enables `data-style="new"` only for `?style=new` and loads the design fonts conditionally. `style-new.css` and several `main.js` paths depend on that attribute. The existing style picker appears only when a `style` query is present. Make no-query initialization choose the new design and ensure its fonts are loaded at that time. If preserving the picker, make its legacy choice explicit (`?style=now`).
- The redesign adds files including `assets/css/style-new.css`, hero/logo/poster images, and two PV videos. The videos are below the repository's 5 MB per-file guidance. `main.js` dynamically creates the mobile menu, warning panels, section decorations, and download-link copy UI; these depend on the matching HTML/CSS.
- Windows/Mac labels occur in the branch's hero facts, mobile download panel, English copy, ticker, and JS-injected OS icons. The stylesheet hides the original download warning block and its script builds a styled copy from warning details. Reconcile these with current main so the Windows guidance and the safety/usage/privacy notice remain visible and usable after the CSS hides or relocates content.
- Current main has a live Windows release configured in `assets/js/config.js`, plus a contact URL and section 08 in `index.html`. It also updated metadata, download notices, and asset query versions. Retain those current values/content. The redesign has seven-section assumptions in decoration labels; recheck numbering with contact section 08.
- `CLAUDE.md` allows direct main push and says to bump the `?v=` values in `index.html` and `404.html` when CSS/JS changes. Pages publishes `main` at `/`; preserve `.nojekyll` and the existing workflow.

## Files and modules in scope

- `index.html`: default style bootstrap and font link, cache keys, language/navigation/hero/download/how-to/credits/contact markup, and Windows-only copy.
- `assets/css/style-new.css`: new default style, including review of download notices and warning visibility, mobile layout, and eight-section decorations.
- `assets/js/main.js`: style picker/default behavior, responsive ordering, warning panel creation, copy-to-clipboard, section decorations/numbering, and Windows-only ticker/icon labels.
- `assets/css/site.css`: retain current main styles and any small shared-style adjustments required by the combined markup.
- `assets/js/config.js`: preserve current main's published Windows URL/details and contact form URL; do not restore branch Mac config or stale release data.
- New branch assets referenced by the default design, as required. Keep `404.html`'s cache token current per repository guidance.
- `README.md`/`CLAUDE.md` only if their published site or operating guidance becomes inaccurate; avoid unrelated edits.

## Implementation steps and ownership

1. **Integration owner — one implementation worker assigned by the primary agent.** Start from current `main` and integrate the style branch by its actual changes/merge history. Resolve overlapping files while retaining current main's Windows-only download, notice, contact section/config, and metadata. Do not overwrite files from the branch snapshot wholesale. Keep `index.html`, `main.js`, and the stylesheets under one owner's coordinated edit because their behavior is coupled.
2. Set the inline bootstrap so the canonical no-query URL selects the new style and loads the required display fonts before rendering. Preserve language selection. If retained, support `?style=now` as the explicit legacy view and keep the picker synchronized with the query.
3. Reconcile visible copy and responsive controls to Windows-only. Remove Mac-specific UI/instructions and availability claims from both Japanese and English; update hero facts, mobile panel labels/copy, ticker, generated icons, and config-dependent rendering. Keep the actual current Windows release URL/version/size/storage details.
4. Preserve section 08 in the header and page, style the contact form, and update any seven-section decoration/count labels or ordering that assumed contact was absent.
5. Keep the safety/usage/privacy notice and Windows launch warning usable in the new design. Where the new design hides the legacy warning markup, ensure its replacement carries the retained Windows steps, remains keyboard-accessible, and does not drop or duplicate the notices.
6. Refresh `?v=` values in `index.html` and `404.html` for changed CSS/JS, following the repository's date-token convention. Keep Pages root settings, workflow, and `.nojekyll` intact.
7. **Primary agent** reviews the integrated diff, performs the requested validation, and deploys the resulting `main` update using the repo's established direct-push workflow.

## Validation and acceptance criteria

- Source inspection confirms no-query root selects the new style, while `?lang=ja|en` continues to work; if retained, `?style=now` selects the legacy view and the switch reflects the active selection.
- The integrated source contains all current main content: Windows-only download details and guidance, current safety/usage/privacy notice, and contact section/form URL. There are no Mac download/launch affordances or claims that a Mac build is available.
- Navigation and section decorations correctly identify sections 00–08. Mobile ordering/menu, stage controls, download behavior, and the cloned warning content continue to be wired to matching markup.
- Changed JavaScript passes syntax checking; inspect the final diff and required `?v=` tokens. There is no repository build/test suite to run, and no new tests are required for this static content task.
- After the authorized main deployment, verify the GitHub Pages deployment status and fetch the canonical URL over HTTP to confirm the published `index.html` and new stylesheet are present without a query parameter. Browser-based visual QA is unavailable in the current Work settings, so report that limitation if it remains unavailable.

## Material risks / open decisions

- Merge conflicts are expected in `index.html`, `assets/js/main.js`, `assets/css/site.css`, and `assets/js/config.js`; current main is newer than the style branch. Resolve by keeping main's operational facts and grafting the visual design/behavior around them.
- The new style hides the original warning block and may rearrange or duplicate content. Confirm the retained warning and notices render once and remain accessible; do not infer this from source presence alone.
- Confirm the final choice on retaining the legacy style picker. Recommended behavior is new style by default, with `?style=now` available only if it remains low-cost and unambiguous.
