// Jedno WebSocket pripojenie na prihláseného používateľa (A7).
// Zdieľajú ho osobný odber users/:id (channels store) aj odber správ aktívneho kanála (ChatPage).
// Server overí identitu zo session cookie, preto po odhlásení pripojenie zrušíme
// a ďalší používateľ dostane nové.
// https://github.com/RomainLanz/socket#use-the-browser-client
import { Socket } from '@rlanz/socket/client';
import { API_BASE_URL } from './api.ts';

let socket: Socket | null = null;

// Vráti spoločné pripojenie (vytvorí ho pri prvom použití) a začne sa pripájať.
// Po výpadku sa klient pripája sám a odbery obnoví; udalosť 'connect' príde po každom pripojení.
export function getSocket(): Socket {
  if (!socket) {
    socket = new Socket({ url: new URL(API_BASE_URL).origin });
  }
  void socket.connect().catch(() => undefined);
  return socket;
}

// Zavolá handler po každom (aj opätovnom) pripojení; ak už pripojení sme, hneď.
// Vráti funkciu, ktorá handler odhlási.
export function onSocketConnect(handler: () => void): () => void {
  const current = getSocket();
  const off = current.on('connect', handler);
  if (current.connected) handler();
  return off;
}

// Odhlásenie: zruší pripojenie aj všetky odbery.
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
