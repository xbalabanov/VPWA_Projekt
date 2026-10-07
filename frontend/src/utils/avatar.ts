// src/utils/avatar.ts
// Každý používateľ má stálu farbu avatara, aby sa autori správ dali rýchlo rozlíšiť.
// Odtieň (0-359) sa odvodí z id; násobok 67 rozhodí susedné id ďaleko od seba.
export function avatarHue(userId: number): number {
  return (userId * 67) % 360;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
