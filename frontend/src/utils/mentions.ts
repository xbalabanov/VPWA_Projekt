// src/utils/mentions.ts
// Rozpoznanie @nickname v texte správy (UC 6). Čisté funkcie bez Vue a store,
// používa ich messages store (kto je adresát) aj MessageItem (čo zvýrazniť).

// Jeden kúsok textu správy: buď obyčajný text, alebo zmienka @nickname.
export interface ContentPart {
  text: string; // text kúska; pri zmienke vrátane '@'
  nickName?: string; // len pri zmienke: nickName bez '@'
}

// Povolené znaky nicku -  pismena, cisla, _ . - a nesmie koncit bodkov, ani pomlckou
// aby sa pri "ahoj @jana." nebrala bodka na konci vety ako sucast nicku
// jeden zdroj pre registraciu, aj zmienky, aby sa nemohli rozist
const NICK_NAME = '[A-Za-z0-9_.-]*[A-Za-z0-9_]';

// cely vstup je platny nick (RegisterPage)
export const NICK_NAME_PATTERN = new RegExp(`^${NICK_NAME}$`);

// @nick kdekolvek v texte spravy
const MENTION_PATTERN = new RegExp(`@${NICK_NAME}`, 'g');

// Rozdelí text na kúsky; spojením všetkých `text` vznikne pôvodný text.
export function splitMentions(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let lastEnd = 0; // kde skončil predošlý kúsok

  for (const match of content.matchAll(MENTION_PATTERN)) {
    const start = match.index;
    const mention = match[0]; // napr. "@jana"

    // Obyčajný text medzi predošlou zmienkou a touto.
    if (start > lastEnd)
      parts.push({
        text: content.slice(lastEnd, start),
      });

    parts.push({
      text: mention,
      nickName: mention.slice(1),
    });
    lastEnd = start + mention.length;
  }

  // Zvyšok textu za poslednou zmienkou.
  if (lastEnd < content.length)
    parts.push({
      text: content.slice(lastEnd),
    });

  return parts;
}

// Len zmienené nickName, napr. "@ed Ahoj @jana" -> ["ed", "jana"].
export function extractNickNames(content: string): string[] {
  return splitMentions(content).flatMap((part) => (part.nickName ? [part.nickName] : []));
}
