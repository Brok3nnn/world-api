# Design system

Simple, technical and colorful. A white workspace under a top header, one vivid cobalt-to-lilac
band for the main action, and a dense grid of cards that lead with a photo and a live value.
Very little prose: a picture, a number or an icon beats a sentence.

All tokens live in `apps/web/src/app/globals.css`. Never use raw hex values in components.
Component paths in this document are relative to `apps/web/src/`.

## Principles

1. **Show, don't tell.** Titles are 2–5 words. At most one short line of helper text under a
   title. No paragraphs in product UI.
2. **Plain words.** Write for non-technical builders: "API", "link", "format", "updates",
   "share your data". Technical detail (JSON, parameters, cURL) lives behind a "For developers"
   disclosure or a "Code" tab.
3. **One primary action per view.** Violet (`brand`) for it; `tint`, `secondary` or `outline` for
   the rest. Checked switches, checkboxes and radios are violet too.
4. **No charts, no motion for decoration.** Values are shown as numbers. Nothing scrolls, floats
   or animates on its own; motion is limited to hover/focus transitions and the live dot.
5. **Text never sits on photos.** Covers stay clean pictures; only small frosted pills (status,
   like) may overlay them. Titles and values go next to or under the image.
6. **Nothing truncates by accident.** Keep titles, captions and chip labels short enough to fit;
   check at 1440 px and 375 px.

## Color

### Palette (utilities such as `bg-cobalt-700`, `text-ink-500`)

| Scale | Use |
| --- | --- |
| `ink` 950–50 | Text (950 headings, 800 body, 500 muted), borders, neutral fills |
| `cobalt` 800–50 | The hero surface, illustration blues |
| `lilac` 400–50 | Glows, selected states (`bg-lilac-50`), tinted buttons |
| `violet` 700–100 | Primary actions, focus ring, accents, eyebrows |
| `coral` 500/300/100 | Likes, warm illustration accents |
| `mint` 600/400/100 | Live status, success |
| `amber` 600/400/100 | Warnings, degraded status |
| `cream` 200/100 | Illustration highlights |

### One light theme

There is no dark theme. `globals.css` scopes Tailwind's `dark:` variant to a `.dark` ancestor
(which nothing sets) and pins `color-scheme: light`, so the `dark:` classes inside vendored
`components/ui` files stay inert and a visitor's dark system setting cannot restyle single
controls. Do not write `dark:` classes in product code.

### Semantic tokens

`background`, `foreground`, `card`, `popover`, `primary` (ink), `secondary`, `muted`,
`accent` (lilac-50), `brand` (violet-600), `destructive`, `border`, `input`, `ring` (violet-500).

### Surfaces

| Utility | Description | Use |
| --- | --- | --- |
| `bg-hero` | Cobalt gradient with lilac glows in the lower corners | The home band only |
| `bg-deep` | Navy to cobalt with a violet glow | Promotional banners |
| `noise` | Film-grain overlay (adds a pseudo-element and its own stacking context) | Always with `bg-hero` or `bg-deep` |

Colored surfaces use white text (`text-white`, `text-white/85` for body), `glass` buttons for
secondary actions and the `inverse` button for the primary one.

## Typography

One typeface: **Inter**. Geist Mono only for code, URLs in code contexts and keyboard keys.

| Role | Style |
| --- | --- |
| Hero title | `font-heading text-5xl md:text-6xl` |
| Page title (`h1`) | `font-heading text-4xl md:text-5xl text-ink-950` |
| Section title (`h2`) | `font-heading text-2xl`, or `font-semibold text-lg` for list sections |
| Card title | `font-semibold` |
| Live values, stats | `font-heading tabular-nums` |
| Body | `text-ink-800`; secondary `text-muted-foreground text-sm`/`text-xs` |

`font-heading` is Inter at weight 600 with tight tracking. Never use uppercase tracked labels or
monospace for UI labels. `Eyebrow` is a short violet medium-weight label.

## Shape and depth

- Buttons, chips and inputs in toolbars: pills (`rounded-full`).
- Cards and tiles `rounded-2xl`, large panels and banners `rounded-3xl`.
- `shadow-card` at rest, `shadow-float` on hover and for the composer.

## Photos

Every API has a cover photo in `apps/web/public/covers/<id>.jpg` (960×600, landscape). `CoverId` in
`features/catalog/types.ts` lists them; `coverSrc()` builds the path; `CATEGORY_COVERS` gives a
fallback per category. Render them with `EndpointCover`. Only free-licence photos are allowed, and
every file must be recorded in [assets.md](assets.md). Never draw illustrations by hand.

## Layout

- App shell: sticky top header (brand, search field that opens the ⌘K palette, Explore /
  Community / My APIs / Docs, then the account controls), a quiet footer, and a bottom tab bar
  below `md`.
- Home: the `bg-hero` band with the title and the composer inside a `BracketFrame`, then one row
  of category pills, then the full catalog grid.
- Card grids: `grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`.
- Page container: `mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8` on
  every page, so content lines up with the header gutters. Never use a different max width or
  horizontal padding.
- Two-column detail layout: `grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem]` with a sticky
  right panel.

## Components

| Component | Location | Notes |
| --- | --- | --- |
| `Button` | `components/ui/button.tsx` | `brand` (primary), `tint`, `secondary`, `outline`, `ghost`, `default` (ink), `glass` and `inverse` (on colored surfaces), `link`, `destructive`. |
| `CopyButton`, `CopyField`, `CodeBlock` | `components/shared/` | Copy actions; `CopyButton` takes `text` for a labelled button. |
| `BracketFrame` | `components/shared/bracket-frame.tsx` | White corner brackets around the composer on the home band. One per screen. |
| `PrototypeNotice` | `components/layout/prototype-notice.tsx` | The amber bar above the header that marks every page as a prototype on sample data. |
| `Eyebrow`, `PageHeader`, `ContentSection` | `components/shared/` | Titles and sections. |
| `FormField` | `components/shared/form-field.tsx` | Label, control, hint and error for any form input. |
| `SectionNav` | `components/shared/section-nav.tsx` | In-page section links with icons that highlight the section being read (Settings, Docs). |
| `BrandMark` | `components/shared/brand-mark.tsx` | Neutral logo placeholder until branding exists. |
| `EndpointCard` | `features/catalog/components/` | Photo on top (status and like pills), title, price, live value, caption. Use for every grid of APIs. |
| `EndpointCover`, `EndpointValue`, `StatusPill`, `EndpointStatus`, `LikeButton` | `features/catalog/components/` | Building blocks; reuse them wherever APIs appear. |
| `CategoryTabs` | `features/marketplace/components/` | Category pills that link into Explore. |
| `PublisherAvatar`, `PublisherBadges` | `features/catalog/components/` | Gradient initials avatar (sizes `sm`–`xl`) and platform / verified badges. |
| `AccountMenu`, `AuthDialog`, `AuthGate` | `features/account/components/` | Header account controls (signed in: Create + avatar menu; signed out: Log in / Sign up), the email-first dialog, and the sign-in prompt for private pages. |
| `RequestComposer` | `features/builder/components/` | The "describe the data you need" box. |

Card links use the stretched-link pattern (`after:absolute after:inset-0` on the title link) so
nested controls such as the like button stay independently clickable (`relative z-10`). Never
put a stacking context (`isolate`, a `z-*` on a positioned wrapper, `transform`) between the card
and such a control: it traps the control under the link. `EndpointCover` is built without one for
this reason.

## Iconography

`lucide-react`. Every option card, stat tile, step and empty state gets an icon. 16 px in text,
20 px in tiles, `aria-hidden` when decorative. Category icons are defined once in
`features/catalog/constants.ts`.

## Voice

Short, plain, concrete. Sentence case. Numbers over adjectives ("1 credit per call", "updates
every 15 min").
