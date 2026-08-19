import { LanguageDescription } from '@codemirror/language'
import type { Extension } from '@codemirror/state'

/**
 * Resolve a language name, alias, or file extension to a CodeMirror extension.
 *
 * Backed by `@codemirror/language-data`: a ~70 KB registry describing 143
 * languages whose grammars each sit behind their own dynamic import. Showing a
 * JSON blob therefore never downloads the Rust parser — only the registry plus
 * the one grammar in play.
 *
 * Unknown languages resolve to `null` rather than throwing: the block still
 * renders, just as plain text. That matters for viewers pointed at arbitrary
 * user files, where "we don't have a grammar for .foo" must not be an error.
 */
export async function loadLanguage(lang?: string, filename?: string): Promise<Extension | null> {
  if (!lang && !filename) return null

  const { languages } = await import('@codemirror/language-data')

  let description: LanguageDescription | null = null
  if (lang) {
    const name = lang.trim().replace(/^\./, '')
    description =
      LanguageDescription.matchLanguageName(languages, name, true) ??
      // `matchFilename` is how extensions ("tsx", "yml") get resolved — it
      // wants something filename-shaped, so synthesise one.
      LanguageDescription.matchFilename(languages, `file.${name}`)
  }
  if (!description && filename) {
    description = LanguageDescription.matchFilename(languages, filename)
  }
  if (!description) return null

  try {
    const support = await description.load()
    return support.extension
  } catch {
    // A grammar that fails to load degrades to plain text, same as an
    // unknown language — never let it take the whole block down.
    return null
  }
}
