/**
 * Role-named colours, so a component can say what a colour is FOR.
 *
 * `@stacksjs/components` named palette shades directly — `bg-gray-100`,
 * `text-gray-600`, `ring-indigo-600` — with a `dark:` variant beside each. That
 * renders correctly and is impossible for a host app to redirect by meaning: you
 * can remap `gray`, but you cannot say "every border in the library comes from
 * `--stx-line`", because nothing distinguishes a gray that is a border from a
 * gray that is muted text (stacksjs/stx#1930).
 *
 * These tokens are added to the BASE theme rather than shipped as an opt-in
 * preset. That matters for one reason: a component that says `text-fg-muted`
 * must resolve in every app, or adopting the component library would silently
 * require a config change and render unstyled without it. Adding names is purely
 * additive — no existing utility changes, and no opacity modifier on an existing
 * palette colour turns into `color-mix()`.
 *
 * ## Where the values come from
 *
 * Each token names a shade in css's own palette rather than carrying a hex
 * value, and the light/dark pairs are the ones the component library already
 * used most — measured, not invented:
 *
 *     text-gray-900 dark:text-gray-100   ×70   ->  text-fg
 *     text-gray-500 dark:text-gray-400   ×24   ->  text-fg-soft
 *     border-gray-200 dark:border-gray-700 ×21 ->  border-line
 *
 * So migrating a component to a token is appearance-preserving wherever its
 * pairing was the dominant one, and the defaults stay in step with the palette
 * because they are resolved from it rather than copied.
 *
 * ## Why `neutral` and not `gray`
 *
 * The STEP each neutral role names was measured from the library; the FAMILY
 * is a house decision. `neutral` is achromatic (chroma 0 at every step) while
 * `gray` carries a blue tint (chroma 0.027–0.034 through the mid range), and
 * the two agree on lightness to within about 1% at every step. So the choice
 * is a pure saturation one and changes no contrast ratio.
 *
 * These were gray-backed, which left the library mixing both: 103 `neutral-*`
 * uses in components against gray-backed roles. Everything is `neutral` now -
 * the roles, and the 35 literal shades that could not move onto a role - so
 * there is one neutral in the library rather than two that differ only by a
 * tint nobody chose (stacksjs/stx#1993).
 *
 * Flipping this back is a one-line edit per role, and the rest of the
 * vocabulary is unaffected: the status hues are their own families.
 *
 * ## How dark mode works
 *
 * Each token resolves to `var(--stx-<name>, <light value>)`, and
 * {@link semanticTokenCSS} emits `:root` and `.dark` blocks that set the
 * variable. So `text-fg-muted` is one class that is correct in both modes, and
 * an app overrides a role by setting the variable — at runtime, with no rebuild.
 *
 * The fallback is deliberately the LIGHT value. If the variable block ever fails
 * to reach a page, light mode is still correct and dark mode falls back to the
 * light colour: degraded, but readable. The alternative — no fallback — would
 * render the token as an invalid colour and take the whole component's styling
 * with it.
 *
 * @module theme-tokens
 */

/** A role, and the palette shades that back it in each mode. */
export interface SemanticToken {
  /** Shade reference, e.g. `gray-900`. Resolved against the live palette. */
  light: string
  dark: string
  /** What the role means, for the generated docs and for anyone reading here. */
  description: string
}

/**
 * The role vocabulary.
 *
 * Five text roles rather than the usual three because the library genuinely
 * distinguishes five: 900, 700, 600, 500 and 400 all appear as body-ish text
 * with different dark partners. Collapsing them here would have been a redesign
 * rather than a migration.
 */
export const SEMANTIC_TOKENS: Record<string, SemanticToken> = {
  // Text
  'fg': { light: 'neutral-900', dark: 'neutral-100', description: 'Primary text' },
  'fg-strong': { light: 'neutral-700', dark: 'neutral-300', description: 'Labels, secondary headings' },
  'fg-muted': { light: 'neutral-600', dark: 'neutral-400', description: 'Supporting text' },
  'fg-soft': { light: 'neutral-500', dark: 'neutral-400', description: 'De-emphasised text' },
  /*
   * Recessive text, and ONLY that: a day outside the month on a calendar, an
   * offline presence dot. Not placeholders, which it used to claim.
   *
   * At neutral-400 on white it is 2.59:1 and at neutral-500 on a dark field
   * 2.20:1 - below 4.5:1 for text and below even the 3:1 graphics floor in two
   * of the three places it landed. It was carrying 25 uses, and 23 of them
   * needed to be read: every placeholder in the library, the breadcrumb
   * separator, the pagination ellipsis, the icon buttons inside the inputs.
   *
   * The value is right for something genuinely non-essential, which WCAG
   * exempts, so the role keeps it and the description stops inviting the other
   * use. The 23 moved to `fg-soft` (4.73:1 light, 5.83:1 on a dark panel),
   * which is where they belonged: a third role at those values would have been
   * a duplicate of it, and the split that matters is legible from recessive,
   * not placeholder from disabled (stacksjs/stx#1993).
   *
   * It is also the one `fg-*` role that gets DARKER in dark mode - the others
   * run 900/100, 700/300, 600/400, 500/400 - which is the shape of a rung that
   * sits below legibility on purpose.
   */
  'fg-subtle': { light: 'neutral-400', dark: 'neutral-500', description: 'Recessive, non-essential text' },

  // Surfaces
  'surface': { light: 'neutral-50', dark: 'neutral-800', description: 'Page and panel background' },
  'surface-raised': { light: 'neutral-100', dark: 'neutral-700', description: 'Cards, popovers' },
  'surface-sunken': { light: 'neutral-200', dark: 'neutral-700', description: 'Wells, track backgrounds' },

  /*
   * A white surface, which the vocabulary had no name for.
   *
   * `surface` is gray-50 and `surface-raised` is gray-100, so the 43 places
   * that paint `bg-white dark:bg-neutral-800` - every card, menu, dialog and
   * form control in the library - had no role to move to and stayed literal.
   * That is the single largest reason a themed app still saw stock colours
   * after the status hues were migrated (stacksjs/stx#1993).
   *
   * Two roles rather than one because the library draws a real distinction: a
   * panel sits at gray-800 in dark mode and a form control inside it at
   * gray-700, one step lighter, or the input disappears into the panel. 24
   * uses of the first, 16 of the second.
   *
   * `panel` is also the name the apps that asked for this already use for it.
   */
  'panel': { light: 'white', dark: 'neutral-800', description: 'Card, menu, dialog surface' },
  'field': { light: 'white', dark: 'neutral-700', description: 'Form control surface' },

  /*
   * The page, BEHIND the panels, which `surface` conflates with them.
   *
   * `surface` describes itself as "page and panel background" and sits at
   * neutral-800 in dark mode - the same value as `panel`. So an app that
   * painted its page with `surface` got a page indistinguishable from the cards
   * on it, and four components worked around it by hard-coding the step below:
   * both auth pages, the two-factor challenge and the subscription checkout all
   * chose `dark:bg-neutral-900`, and the checkout spelled out this exact pair
   * (stacksjs/stx#1993).
   *
   * A page one step darker than its panels is the ordinary arrangement, so it
   * gets a name rather than four hard-coded copies.
   */
  'page': { light: 'neutral-50', dark: 'neutral-900', description: 'Page background, behind panels' },

  /*
   * The content area under a chrome header - a table or list body - which is
   * the fourth rung and the one the ladder could not express.
   *
   * `<TableBody>` and `<VirtualTable>`'s body both paint `bg-white
   * dark:bg-neutral-900` beneath a head on `surface`, and neither `panel` nor
   * `page` can say it. The relation they encode is not "one step down" but
   * "the extreme end of the ladder in whichever direction the mode runs":
   *
   *            light          dark
   *   head     neutral-50     neutral-800     (surface - the chrome)
   *   body     white          neutral-900     (content - the paper)
   *
   * so the body is BRIGHTER than its header in light mode and DARKER in dark
   * mode, and in both the header is the surface with more presence. Putting the
   * body on `panel` would make it neutral-800 in dark - the same value as its
   * own header, since `surface` and `panel` share that step - which is the
   * collapse that hid four hovers before they became roles.
   *
   * It shares `page`'s dark value, and that is allowed here rather than
   * overlooked: a full-bleed table body sitting flush with the page is a
   * normal arrangement, and the rows are separated by `divide-line` rather than
   * by the surface behind them. The property that has to hold is that the body
   * differs from its HEADER and from the `panel` it may sit in, which the test
   * asserts (stacksjs/stx#1993).
   */
  'content': { light: 'white', dark: 'neutral-900', description: 'Content area under a chrome header - a table or list body' },

  /*
   * A hovered neutral surface, which was the one state every component had to
   * invent for itself (stacksjs/stx#1993).
   *
   * The coloured families each got a `-solid-hover` when the fills were
   * migrated, because a fill and its hover have to move together. The neutrals
   * did not, so thirteen interactive surfaces each picked their own pair and
   * four of them picked one that cannot be seen:
   *
   *   `bg-panel hover:bg-surface`          neutral-800 -> neutral-800 in dark
   *   `bg-surface-raised hover:bg-surface-sunken`  neutral-700 -> neutral-700
   *
   * Those are not subtle hovers, they are absent ones: `surface` and `panel`
   * share a dark value, and so do `surface-raised` and `surface-sunken`. A row
   * highlight that works in light mode and does nothing at all in dark is the
   * kind of defect that survives review, because the class is there and the
   * name reads correctly.
   *
   * So each neutral surface names its own hover, and every pair differs from
   * its base in BOTH modes - which is the property the test asserts, rather
   * than any particular shade. `surface-hover` also serves `panel` and a
   * transparent row, since neutral-100/neutral-700 is visible against white,
   * neutral-50, neutral-800 and neutral-900 alike; that is why there is no
   * separate `panel-hover`.
   */
  'surface-hover': { light: 'neutral-100', dark: 'neutral-700', description: 'Row or item highlight on a page or panel' },
  'surface-raised-hover': { light: 'neutral-200', dark: 'neutral-600', description: 'Raised surface, hovered' },
  'surface-sunken-hover': { light: 'neutral-300', dark: 'neutral-600', description: 'Sunken surface, hovered' },
  'field-hover': { light: 'neutral-50', dark: 'neutral-600', description: 'Form control surface, hovered' },

  /*
   * A hyperlink and its hover, which is not any of the roles that already
   * exist (stacksjs/stx#1993).
   *
   * `info`'s description used to claim links, and nothing in the library ever
   * used it for one - it is cyan, and every link is blue. `accent` is the
   * closest, but a link rests a step lighter than an accent action and its
   * hover has to move in opposite directions per mode: DARKER in light,
   * LIGHTER in dark, since the link is already the brightest thing in a dark
   * paragraph. No existing pair does that, and `accent-solid-hover` does the
   * reverse.
   *
   * Both values are what the library already paints, so `<Footer>`'s links
   * look identical and become themeable.
   */
  'link': { light: 'blue-500', dark: 'blue-400', description: 'Hyperlink' },
  'link-hover': { light: 'blue-600', dark: 'blue-300', description: 'Hyperlink, hovered' },

  /*
   * A surface that contrasts with the page in BOTH modes - a tooltip bubble, a
   * chip floating over code - which the vocabulary had no name for, so its
   * pieces drifted apart (stacksjs/stx#1993).
   *
   * Tooltip is the demonstration. The bubble was `bg-neutral-900
   * dark:bg-neutral-700` and the arrow that points out of it was
   * `border-t-gray-900 dark:border-t-gray-700` - the SAME colour by intent,
   * spelled as two independent literals in two different families, so the
   * triangle was blue-tinted against an achromatic bubble and the join showed
   * a seam. Five classes that must agree had nothing holding them together.
   */
  'inverse': { light: 'neutral-900', dark: 'neutral-700', description: 'Tooltip bubble, inverted surface' },
  'inverse-ink': { light: 'white', dark: 'white', description: 'Text on an inverted surface' },

  // Edges — borders, rings and dividers share a role
  'line': { light: 'neutral-200', dark: 'neutral-700', description: 'Default border, divider' },
  'line-strong': { light: 'neutral-300', dark: 'neutral-600', description: 'Input border, focus ring track' },

  /*
   * Status and emphasis.
   *
   * `accent` was indigo and is now blue, because the library had two competing
   * accents - 73 blue uses against 34 indigo, both meaning "primary" - and a
   * role vocabulary cannot have two. Blue won on count, so the painted
   * majority (Button's primary, the inputs, the focus states) keeps its
   * appearance and the indigo minority moves (stacksjs/stx#1993).
   *
   * `info` is cyan, and was briefly blue - identical to `accent` - which is a
   * vocabulary with two names you cannot tell apart. Worse, it hid a
   * misuse: every `info` in the library was a SELECTED or ACTIVE state (a
   * calendar's chosen day, a listbox's checkmark, the current page, a variant
   * literally named `primary`) that reached for `info` only because the hue
   * was blue while `accent` was indigo. Those are `accent` now, which left
   * `info` to the components that mean it - a Notification's informational
   * toast, a Badge's `info` chip - and both of those already painted cyan.
   */
  'accent': { light: 'blue-600', dark: 'blue-400', description: 'Primary action, selected state' },
  'info': { light: 'cyan-600', dark: 'cyan-400', description: 'Informational emphasis' },
  'danger': { light: 'red-600', dark: 'red-400', description: 'Errors, destructive actions' },
  'success': { light: 'green-600', dark: 'green-400', description: 'Confirmation' },
  /*
   * 600, like the other four. It was yellow-500, which disagreed with every
   * component that paints caution TEXT (`text-yellow-600`) and with the four
   * sibling roles. Changed rather than worked around because nothing used it
   * yet - zero uses in the library at the time - so there was no appearance to
   * preserve.
   */
  'warning': { light: 'yellow-600', dark: 'yellow-400', description: 'Caution' },

  /*
   * The same hues as a SOLID FILL, which is a different role and needs a
   * different dark value.
   *
   * Coloured text on a dark background has to get lighter to stay legible —
   * 600 → 400 — while a solid button background barely moves, 600 → 500, or it
   * stops reading as the same button. Folding the two together turned every
   * primary button noticeably paler in dark mode, which is how this pair got
   * separated: the migration reported it as a "normalization" and it was a
   * regression.
   */
  /*
   * 500 light / 600 dark, which is what the components actually paint:
   * `bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700` is
   * Button's primary, repeated across the painted half of the library.
   *
   * These were 600 light / 500 dark, on the reasoning that a solid fill should
   * not get paler in dark mode. The components disagree - they go one step
   * DARKER - and there were 11 uses of the old spelling against 73 of the
   * pattern above, so the table follows the library rather than the other way
   * round. The 11 shift by one shade; the 73 are unchanged.
   */
  'accent-solid': { light: 'blue-500', dark: 'blue-600', description: 'Primary button fill' },
  'info-solid': { light: 'cyan-500', dark: 'cyan-600', description: 'Informational fill' },
  'danger-solid': { light: 'red-500', dark: 'red-600', description: 'Destructive button fill' },
  'success-solid': { light: 'green-500', dark: 'green-600', description: 'Confirmation fill' },
  'warning-solid': { light: 'yellow-500', dark: 'yellow-600', description: 'Caution fill' },

  /*
   * The hover state of a solid fill, one step further in the same direction.
   *
   * A role rather than a `hover:` on the base token, because an app that
   * re-points --stx-accent-solid has to be able to re-point what it becomes on
   * hover too - and `hover:bg-accent-solid` would just repaint it the same
   * colour.
   */
  'accent-solid-hover': { light: 'blue-600', dark: 'blue-700', description: 'Primary button fill, hovered' },
  'info-solid-hover': { light: 'cyan-600', dark: 'cyan-700', description: 'Informational fill, hovered' },
  'danger-solid-hover': { light: 'red-600', dark: 'red-700', description: 'Destructive fill, hovered' },
  'success-solid-hover': { light: 'green-600', dark: 'green-700', description: 'Confirmation fill, hovered' },
  'warning-solid-hover': { light: 'yellow-600', dark: 'yellow-700', description: 'Caution fill, hovered' },

  /*
   * The text ON a solid fill.
   *
   * Components wrote `text-white` next to every solid background, which is
   * correct for the stock hues and wrong the moment an app points a fill at a
   * light colour - white on a themed yellow or lime is unreadable, and the
   * caller has no way to say so. A paired ink role moves with the fill.
   *
   * `warning-ink` is dark for exactly that reason: white on yellow-500 is
   * around 1.9:1, which fails at any text size.
   */
  'accent-ink': { light: 'white', dark: 'white', description: 'Text on a primary fill' },
  'info-ink': { light: 'neutral-900', dark: 'neutral-900', description: 'Text on an informational fill' },
  'danger-ink': { light: 'white', dark: 'white', description: 'Text on a destructive fill' },
  'success-ink': { light: 'neutral-900', dark: 'neutral-900', description: 'Text on a confirmation fill' },
  'warning-ink': { light: 'neutral-900', dark: 'neutral-900', description: 'Text on a caution fill' },
  /*
   * Three of the six inks are dark, and the reason is measured rather than
   * chosen. White on the light fill is, by WCAG:
   *
   *   yellow-500  1.90:1      cyan-500  2.36:1      green-500  2.22:1
   *
   * all far below the 3:1 floor for any text at any size, so a white label on
   * an informational or confirmation fill was unreadable - the same defect
   * `warning-ink` was already carrying a dark value for. neutral-900 on those
   * three reads 9.36, 7.58 and 8.06 in light mode and 6.11, 4.97 and 5.57 in
   * dark, so one value serves both modes.
   *
   * Neither `info-ink` nor `success-ink` had a single use in the library when
   * this changed, which is why it costs nothing on screen: the fills appear
   * only as spinner dots and progress bars, with no text on them. The fix is
   * for the app that reaches for the role next.
   *
   * accent, secondary and danger keep white and are NOT fixed here. They read
   * 3.76, 4.12 and 3.82 in light mode - above the 3:1 graphics floor, below
   * 4.5:1 for small text - and they are blue-500, purple-500 and red-500,
   * which is what every primary and destructive button in the library already
   * paints. Darkening them is a change to the house hues, not a migration, so
   * it is measured, pinned and reported rather than decided here
   * (stacksjs/stx#1993).
   */

  /*
   * A tinted fill and its text — a badge, a status chip, an inline callout.
   *
   * 100/800 in light and 900/200 in dark, which is the pattern Badge already
   * used for all seven of its variants and the only one in the library for
   * this shape. Two roles rather than one because the text has to move with
   * the tint: an app pointing --stx-accent-soft at something darker needs the
   * ink to follow or the chip becomes unreadable.
   */
  'accent-soft': { light: 'blue-100', dark: 'blue-900', description: 'Tinted primary fill' },
  'accent-soft-ink': { light: 'blue-800', dark: 'blue-200', description: 'Text on a tinted primary fill' },
  'info-soft': { light: 'cyan-100', dark: 'cyan-900', description: 'Tinted informational fill' },
  'info-soft-ink': { light: 'cyan-800', dark: 'cyan-200', description: 'Text on a tinted informational fill' },
  'danger-soft': { light: 'red-100', dark: 'red-900', description: 'Tinted destructive fill' },
  'danger-soft-ink': { light: 'red-800', dark: 'red-200', description: 'Text on a tinted destructive fill' },
  'success-soft': { light: 'green-100', dark: 'green-900', description: 'Tinted confirmation fill' },
  'success-soft-ink': { light: 'green-800', dark: 'green-200', description: 'Text on a tinted confirmation fill' },
  'warning-soft': { light: 'yellow-100', dark: 'yellow-900', description: 'Tinted caution fill' },
  'warning-soft-ink': { light: 'yellow-800', dark: 'yellow-200', description: 'Text on a tinted caution fill' },

  /*
   * `secondary`, which is not a status.
   *
   * Badge and Progress and Spinner all have a `secondary` variant painted
   * purple, and the five statuses are accent, info, danger, success and
   * warning - none of them is "secondary". So it was the one variant in an
   * otherwise role-driven map with no role, which is the worst case: it fails
   * SILENTLY in a themed app, staying purple while everything around it moves.
   *
   * A role rather than a documented exception, because "this one variant is a
   * fixed hue" is a thing nobody reads until their badge is the wrong colour.
   */
  'secondary': { light: 'purple-600', dark: 'purple-400', description: 'Secondary emphasis' },
  'secondary-solid': { light: 'purple-500', dark: 'purple-600', description: 'Secondary fill' },
  'secondary-solid-hover': { light: 'purple-600', dark: 'purple-700', description: 'Secondary fill, hovered' },
  'secondary-ink': { light: 'white', dark: 'white', description: 'Text on a secondary fill' },
  'secondary-soft': { light: 'purple-100', dark: 'purple-900', description: 'Tinted secondary fill' },
  'secondary-soft-ink': { light: 'purple-800', dark: 'purple-200', description: 'Text on a tinted secondary fill' },

  /*
   * A form control in its error state, which is four colours rather than one.
   *
   * The five inputs shared a byte-identical error string of raw shades -
   * `ring-red-300 dark:ring-red-600 text-red-900 dark:text-red-300
   * placeholder-red-300 dark:placeholder-red-500 focus:ring-red-500
   * dark:focus:ring-red-400` - and none of it matched an existing role. The
   * nearest were two steps away in both modes, so forcing it onto `danger` or
   * `danger-soft` would have turned a pale error outline into a strong one
   * (stacksjs/stx#1993).
   *
   * These mirror the RESTING branch name for name, which is already fully
   * tokenised, so the two read as the same four decisions in two states:
   *
   *     ring-line-strong       <->  ring-danger-line
   *     text-fg                <->  text-danger-fg
   *     placeholder-fg-subtle  <->  placeholder-danger-fg-subtle
   *     focus:ring-accent      <->  focus:ring-danger-focus
   *
   * Danger only, not one set per status. An error is the only field state the
   * library has; a warning or success field does not exist, so four more
   * families would be sixteen names measured from nothing. The pattern is
   * obvious if one ever arrives.
   *
   * `danger-focus` gets LIGHTER in dark mode, 500 -> 400, unlike the solid
   * fills: a focus ring has to stay visible against a dark field, which is the
   * same reason coloured text lightens and a button fill does not.
   */
  'danger-fg': { light: 'red-900', dark: 'red-300', description: 'Text in a field with an error' },
  /*
   * The error-state analogue of `fg-subtle`, and recessive in the same way:
   * red-300 on white is 1.92:1 and red-500 on a dark field 2.72:1, so it
   * cannot carry text either. It said "placeholder" and the five error
   * placeholders used it, which made the value in an invalid field harder to
   * read than the value in a valid one.
   *
   * They are `placeholder-danger` now - red-600 / red-400, 4.76:1 and 3.59:1 -
   * which stays clearly dimmer than the value text beside it (`danger-fg` at
   * 10.06 and 5.41) while being legible. The role keeps its value for
   * genuinely recessive error text, exactly as `fg-subtle` does
   * (stacksjs/stx#1993).
   */
  'danger-fg-subtle': { light: 'red-300', dark: 'red-500', description: 'Recessive text in a field with an error' },
  'danger-line': { light: 'red-300', dark: 'red-600', description: 'Border of a field with an error' },
  'danger-focus': { light: 'red-500', dark: 'red-400', description: 'Focus ring of a field with an error' },
}

/** The CSS custom property that backs a role. */
export function tokenVariable(name: string): string {
  return `--stx-${name}`
}

type Palette = Record<string, unknown>

/**
 * Resolve a `family-shade` reference against a css palette.
 *
 * Returns undefined rather than guessing when the family or shade is absent, so
 * a token backed by nothing is dropped instead of emitting `var(--stx-x, )`.
 */
function resolveShade(palette: Palette, reference: string): string | undefined {
  const split = reference.lastIndexOf('-')
  if (split === -1)
    return typeof palette[reference] === 'string' ? palette[reference] as string : undefined

  const family = palette[reference.slice(0, split)]
  if (!family || typeof family !== 'object')
    return undefined

  const value = (family as Record<string, unknown>)[reference.slice(split + 1)]
  return typeof value === 'string' ? value : undefined
}

/**
 * The palette entries to merge into `theme.colors`.
 *
 * Every entry is `var(--stx-<name>, <light value>)`, so the name works as an
 * ordinary utility (`bg-surface`, `text-fg-muted`, `ring-line-strong`) and an
 * app can move it by setting the variable.
 */
export function semanticColors(palette: Palette): Record<string, string> {
  const colors: Record<string, string> = {}

  for (const [name, token] of Object.entries(SEMANTIC_TOKENS)) {
    const light = resolveShade(palette, token.light)
    if (light === undefined)
      continue
    colors[name] = `var(${tokenVariable(name)}, ${light})`
  }

  return colors
}

/**
 * The `:root` / `.dark` block that gives each role its value per mode.
 *
 * Emitted ahead of the generated utilities so an app's own stylesheet — which
 * comes after — can override any of it without a specificity fight.
 *
 * `.dark` matches the class strategy the rest of stx uses (`dark:` variants
 * compile to `.dark .dark\:x`), so a token and a `dark:` utility on the same
 * page agree about what dark mode is.
 */
export function semanticTokenCSS(palette: Palette): string {
  const light: string[] = []
  const dark: string[] = []

  for (const [name, token] of Object.entries(SEMANTIC_TOKENS)) {
    const lightValue = resolveShade(palette, token.light)
    const darkValue = resolveShade(palette, token.dark)
    if (lightValue === undefined)
      continue
    light.push(`  ${tokenVariable(name)}: ${lightValue};`)
    if (darkValue !== undefined)
      dark.push(`  ${tokenVariable(name)}: ${darkValue};`)
  }

  if (light.length === 0)
    return ''

  return [
    '/* stx role tokens — override any of these to re-theme by meaning. */',
    ':root {',
    ...light,
    '}',
    '.dark {',
    ...dark,
    '}',
    '',
  ].join('\n')
}

/** Every variable a role token reads, for documentation and tooling. */
export function semanticTokenNames(): string[] {
  return Object.keys(SEMANTIC_TOKENS).map(tokenVariable)
}

/**
 * Shape roles — the radius a thing has because of what it IS.
 *
 * Colour was only half of what made the library unadoptable. An app whose
 * buttons are pills got `rounded-md`, and `className` is no escape hatch for a
 * radius for exactly the reason it was not one for a colour: `rounded-md` and
 * `rounded-full` are single-class selectors of equal specificity, so the winner
 * is whichever lands later in the generated stylesheet, which a call site
 * cannot control (stacksjs/stx#1993).
 *
 * Three roles, from what the library actually uses: `rounded-md` on controls
 * (54 uses), `rounded-lg` on panels (24), and `rounded-full` where something is
 * genuinely a pill (34, of which the circular ones - avatars, dots, spinners -
 * keep `rounded-full`, because a circle is not a theming decision).
 *
 * So `--stx-radius-control: 9999px` turns every button, input and select in the
 * library into a pill, and nothing else moves.
 */
export const SHAPE_TOKENS: Record<string, { value: string, description: string }> = {
  control: { value: '0.375rem', description: 'Buttons, inputs, selects — rounded-md' },
  panel: { value: '0.5rem', description: 'Cards, dialogs, menus — rounded-lg' },
  pill: { value: '9999px', description: 'Chips and badges, which are pill-shaped by intent' },
}

/** The CSS custom property that backs a shape role. */
export function shapeVariable(name: string): string {
  return `--stx-radius-${name}`
}

/**
 * The `theme.borderRadius` entries to merge in.
 *
 * Same shape as {@link semanticColors}: each is `var(--stx-radius-<name>,
 * <stock value>)`, so `rounded-control` is an ordinary utility - directional
 * variants like `rounded-t-control` included - and an app moves it by setting
 * the variable.
 */
export function shapeRadii(): Record<string, string> {
  const radii: Record<string, string> = {}
  for (const [name, token] of Object.entries(SHAPE_TOKENS))
    radii[name] = `var(${shapeVariable(name)}, ${token.value})`
  return radii
}

/**
 * The `:root` block for the shape roles.
 *
 * No `.dark` counterpart: a radius does not change with the colour scheme, and
 * emitting an empty dark block would invite someone to fill it in.
 */
export function shapeTokenCSS(): string {
  return [
    '/* stx shape tokens — a radius by what the thing is. */',
    ':root {',
    ...Object.entries(SHAPE_TOKENS).map(([name, token]) => `  ${shapeVariable(name)}: ${token.value};`),
    '}',
    '',
  ].join('\n')
}

/** Every variable a shape role reads, for documentation and tooling. */
export function shapeTokenNames(): string[] {
  return Object.keys(SHAPE_TOKENS).map(shapeVariable)
}
