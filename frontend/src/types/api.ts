// Úspešné odpovede backendu sú zabalené do objektu { data: ... }.
export interface ApiResponse<T> {
  data: T;
}

// Podoba správy prenášanej medzi backendom a frontendom.
export interface MessageDto {
  id: number;
  channelId: number;
  authorId: number;
  content: string;
  createdAt: string;
  mentionedUserIds: number[];
}

// Jedna stránka histórie správ.
export interface MessagesPageDto {
  messages: MessageDto[];
  nextBeforeId: number | null;
  hasMore: boolean;
}

// Pri odosielaní posielame iba obsah.
// Autora, ID a čas doplní server.
export interface SendMessagePayload {
  content: string;
}
