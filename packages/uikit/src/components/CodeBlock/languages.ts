interface Language {
  id: string
  aliases?: string[]
  extensions?: string[]
  filenames?: string[]
}
/** Unknown languages remain readable as plain text. */
export function codeLanguage(
  languages: readonly Language[],
  lang?: string,
  filename?: string
): string {
  const name = lang?.trim().replace(/^\./, '').toLowerCase()
  const alias =
    name &&
    languages.find(
      (item) =>
        item.id.toLowerCase() === name ||
        item.aliases?.some((alias) => alias.toLowerCase() === name) ||
        item.extensions?.some((ext) => ext.toLowerCase() === `.${name}`)
    )
  if (alias) return alias.id
  const file = filename?.split(/[\\/]/).pop()?.toLowerCase()
  const match =
    file &&
    languages.find(
      (item) =>
        item.filenames?.some((name) => name.toLowerCase() === file) ||
        item.extensions?.some((ext) => file.endsWith(ext.toLowerCase()))
    )
  return match ? match.id : 'plaintext'
}
