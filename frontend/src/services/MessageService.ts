import { apiRequest } from './api.ts';
import type { MessageDto, MessagesPageDto, SendMessagePayload } from '../types/api';

const PAGE_SIZE = 20;

class MessageService {
  loadMessages(channelId: number, beforeId: number | null = null): Promise<MessagesPageDto> {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
    });

    if (beforeId !== null) {
      params.set('beforeId', String(beforeId));
    }

    return apiRequest<MessagesPageDto>(`/channels/${channelId}/messages?${params.toString()}`);
  }

  loadNewer(channelId: number, afterId: number): Promise<MessagesPageDto> {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      afterId: String(afterId),
    });

    return apiRequest<MessagesPageDto>(`/channels/${channelId}/messages?${params.toString()}`);
  }

  // Živý draft (UC11, B7); prázdny text = prestal som písať.
  sendTyping(channelId: number, text: string): Promise<unknown> {
    return apiRequest(`/channels/${channelId}/typing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
  }

  sendMessage(channelId: number, content: string): Promise<MessageDto> {
    const payload: SendMessagePayload = {
      content,
    };

    return apiRequest<MessageDto>(`/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }
}

export default new MessageService();
