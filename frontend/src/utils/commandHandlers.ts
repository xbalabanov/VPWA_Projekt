// src/utils/commandHandlers.ts
// Vykonanie príkazov z CommandLine (UC 4, 5, 10). Parser rozpozná vstup,
// tu sa zavolajú akcie channel store. Pravidlá overuje server.
// Vracia (async) null pri úspechu, inak text chyby.
import { useChannelsStore } from '../stores/channels';
import type { ParsedInput } from './commandParser';

export async function executeCommand(parsed: ParsedInput): Promise<string | null> {
  if (parsed.error) return parsed.error;

  const channelsStore = useChannelsStore();
  const [arg = ''] = parsed.args;

  //join funguje aj bez aktívneho kanála (napr. hned po registracii)
  if (parsed.command === 'join') {
    const isPrivate = parsed.args[1]?.toLowerCase() === 'private';
    return channelsStore.joinChannel(arg, isPrivate);
  }

  //ostatne prikazy sa tykaju aktivneho kanalu
  const channelId = channelsStore.activeChannelId;
  if (channelId === null) return 'Najprv vyber kanál';

  switch (parsed.command) {
    case 'invite':
      return channelsStore.inviteUser(channelId, arg);
    case 'revoke':
      return channelsStore.revokeUser(channelId, arg);
    case 'kick':
      return channelsStore.kickUser(channelId, arg);
    case 'cancel':
      //member odide, ked je member zaroven admin --> kanal sa rusi (rozhodne server)
      return channelsStore.leaveChannel(channelId);
    case 'quit':
      //zrusit kanal vie iba admin (server vrati 403 inak)
      return channelsStore.deleteChannel(channelId);
    case 'list':
      return channelsStore.openMembersList(channelId);
    default:
      return 'Neznámy príkaz';
  }
}
