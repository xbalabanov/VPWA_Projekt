// src/utils/commandParser.ts
// Spoločné rozhranie príkazového riadka (UC 3, 4, 5, 10). Parser len rozpozná
// vstup, vykonanie príkazov rieši commandHandlers.ts (osoba A).

export type CommandName = 'join' | 'invite' | 'revoke' | 'kick' | 'cancel' | 'quit' | 'list';

export interface ParsedInput {
  kind: 'message' | 'command';
  command?: CommandName; // nastavené pre známy príkaz
  args: string[];
  text: string; // pôvodný (orezaný) text
  error?: string; // nepoznaný príkaz alebo zlý počet argumentov
}

interface CommandSpec {
  minArgs: number;
  maxArgs: number;
  usage: string;
}

// Prehľad príkazov podľa zadania.
const COMMANDS: Record<CommandName, CommandSpec> = {
  join: { minArgs: 1, maxArgs: 2, usage: '/join channelName [private]' },
  invite: { minArgs: 1, maxArgs: 1, usage: '/invite nickName' },
  revoke: { minArgs: 1, maxArgs: 1, usage: '/revoke nickName' },
  kick: { minArgs: 1, maxArgs: 1, usage: '/kick nickName' },
  cancel: { minArgs: 0, maxArgs: 0, usage: '/cancel' },
  quit: { minArgs: 0, maxArgs: 0, usage: '/quit' },
  list: { minArgs: 0, maxArgs: 0, usage: '/list' },
};

function isCommandName(value: string): value is CommandName {
  return Object.keys(COMMANDS).includes(value);
}

export function parseInput(raw: string): ParsedInput {
  const text = raw.trim();

  // Všetko, čo nezačína "/", je bežná správa.
  if (!text.startsWith('/')) {
    return { kind: 'message', args: [], text };
  }

  const [rawName = '', ...args] = text.slice(1).split(/\s+/);
  const name = rawName.toLowerCase();

  if (!isCommandName(name)) {
    return { kind: 'command', args, text, error: `Unknown command: /${rawName}` };
  }

  const spec = COMMANDS[name];
  const wrongCount = args.length < spec.minArgs || args.length > spec.maxArgs;
  // Druhý argument príkazu /join môže byť iba "private".
  const wrongFlag = name === 'join' && args.length === 2 && args[1]?.toLowerCase() !== 'private';

  if (wrongCount || wrongFlag) {
    return { kind: 'command', command: name, args, text, error: `Usage: ${spec.usage}` };
  }

  return { kind: 'command', command: name, args, text };
}
