// Rovnaké pravidlo nicku ako vo frontend/src/utils/mentions.ts.
// Povolené sú písmená, čísla, _, . a -.
// Nick sa musí končiť písmenom, číslicou alebo _.
const NICK_NAME = '[A-Za-z0-9_.-]*[A-Za-z0-9_]'

const MENTION_PATTERN = new RegExp(`@${NICK_NAME}`, 'g')

export function extractMentionedNickNames(content: string): string[] {
  const nickNames = new Set<string>()

  for (const match of content.matchAll(MENTION_PATTERN)) {
    // Odstránime @ a zjednotíme veľkosť písmen.
    const nickName = match[0].slice(1).toLowerCase()

    nickNames.add(nickName)
  }

  return [...nickNames]
}
