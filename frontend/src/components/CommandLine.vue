<!-- Príkazový riadok: odoslanie správy alebo príkazu (UC 3).
     Vlastník: Maksym (B1).
     Príkazy rozpozná utils/commandParser.ts. -->
<template>
  <div class="command-line">
    <TypingIndicator />
    <ul v-if="suggestions.length" class="command-suggestions" role="listbox" aria-label="Návrhy">
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.key"
        class="command-suggestion"
        :class="{ 'command-suggestion--active': index === activeSuggestion }"
        role="option"
        :aria-selected="index === activeSuggestion"
        @mouseenter="activeSuggestion = index"
        @mousedown.prevent="pickSuggestion(index)"
      >
        <code>{{ suggestion.label }}</code>
      </li>
    </ul>
    <Transition name="command-note" mode="out-in">
      <div v-if="error" key="error" class="command-note command-note--error" role="alert">
        <q-icon name="error_outline" size="18px" />
        <span>{{ error }}</span>
      </div>
      <div v-else-if="hint" key="hint" class="command-note command-note--hint">
        <q-icon name="keyboard_command_key" size="16px" />
        <code>{{ hint }}</code>
      </div>
    </Transition>
    <!-- Box príkazového riadka: pole + lišta s nápovedou klávesov a tlačidlom odoslať. -->
    <div class="composer-box" :class="{ 'composer-box--error': error !== null }">
      <q-input
        v-model="text"
        class="command-input"
        borderless
        :placeholder="placeholder"
        aria-label="Správa alebo príkaz"
        @keydown="onKeydown"
      />
      <div class="composer-toolbar">
        <span class="composer-hint"><kbd>/</kbd> príkazy</span>
        <span class="composer-hint"><kbd>@</kbd> zmienka</span>
        <span class="composer-hint"><kbd>Tab</kbd> doplniť</span>
        <q-space />
        <span class="composer-hint composer-hint--send"><kbd>Enter</kbd> odoslať</span>
        <q-btn
          unelevated
          dense
          icon="arrow_upward"
          class="command-send"
          :class="{ 'command-send--ready': text.trim() !== '' }"
          aria-label="Odoslať"
          :loading="sending"
          @click="submit"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useChannelsStore } from '../stores/channels';
import { useMessagesStore } from '../stores/messages';
import { useUsersStore } from '../stores/users';
import { COMMAND_NAMES, commandUsage, parseInput, type CommandName } from '../utils/commandParser';
import { executeCommand } from '../utils/commandHandlers';
import TypingIndicator from './TypingIndicator.vue';

// Jeden návrh v zozname nad políčkom.
interface Suggestion {
  key: string; // unikátny kľúč pre v-for
  label: string; // čo sa zobrazí v zozname
  text: string; // celý nový obsah políčka po výbere
}

const MAX_SUGGESTIONS = 8;

export default defineComponent({
  name: 'CommandLine',
  components: { TypingIndicator },

  data() {
    return {
      text: '',
      error: null as string | null, // hláška pod políčkom (chyba parsera, servera...)
      sending: false, // práve čakáme na server
      activeSuggestion: 0, // ktorý návrh v zozname je vybraný (šípkami)
    };
  },

  computed: {
    ...mapStores(useChannelsStore, useMessagesStore, useUsersStore),

    // Placeholder pomenuje kanál, kam správa pôjde.
    placeholder(): string {
      const channel = this.channelsStore.activeChannel;
      return channel
        ? `Správa do #${channel.name}, alebo / pre príkazy`
        : 'Napíš /join nazovKanala';
    },

    // Syntax príkazu, ktorý práve píšeš, napr. "/invite nickName". null = nič nepíšeš.
    hint(): string | null {
      const parsed = parseInput(this.text);
      return parsed.command ? commandUsage(parsed.command) : null;
    },

    // Návrhy podľa toho, čo práve píšeš; prvý typ, ktorý sedí, vyhráva. [] = zoznam skrytý.
    suggestions(): Suggestion[] {
      const list =
        this.commandNameSuggestions() ??
        this.commandArgSuggestions() ??
        this.mentionSuggestions() ??
        [];
      return list.slice(0, MAX_SUGGESTIONS);
    },
  },

  watch: {
    // Keď používateľ začne písať, stará chyba už neplatí.
    text() {
      this.error = null;
      this.activeSuggestion = 0; // nový text = nový zoznam, výber od začiatku
      this.updateDraft();
    },

    // Pri prepnutí kanála už v starom nepíšem, v novom áno (ak je niečo v políčku).
    'channelsStore.activeChannelId'(newId: number | null, oldId: number | null) {
      if (oldId !== null) this.messagesStore.setDraft(oldId, '');
      if (newId !== null) this.updateDraft();
    },
  },

  methods: {
    // "/" + začiatok názvu príkazu, napr. "/in".
    commandNameSuggestions(): Suggestion[] | null {
      const match = /^\/(\S*)$/.exec(this.text);
      if (!match) return null;

      const typed = (match[1] ?? '').toLowerCase();
      if (COMMAND_NAMES.includes(typed as CommandName)) return []; // dopísaný, Enter odošle

      return COMMAND_NAMES.filter((name) => name.startsWith(typed)).map((name) => ({
        key: name,
        label: commandUsage(name),
        text: `/${name} `,
      }));
    },

    // Argument príkazu s nickName: "/invite ja", "/kick ", "/revoke pe".
    commandArgSuggestions(): Suggestion[] | null {
      const match = /^\/(invite|revoke|kick)\s+(\S*)$/i.exec(this.text);
      const channelId = this.channelsStore.activeChannelId;
      if (!match || channelId === null) return null;

      const command = (match[1] ?? '').toLowerCase();
      const members = this.channelsStore.membersOf(channelId);
      const myId = this.usersStore.currentUserId;

      // /invite -> ľudia, ktorí v kanáli ešte nie sú; /kick a /revoke -> členovia okrem mňa.
      const candidates =
        command === 'invite'
          ? this.usersStore.users.map((u) => u.id).filter((id) => !members.includes(id))
          : members.filter((id) => id !== myId);

      return this.nickSuggestions(candidates, match[2] ?? '', (nick) => `/${command} ${nick}`);
    },

    // Zmienka na konci textu: "ahoj @ja".
    mentionSuggestions(): Suggestion[] | null {
      const match = /(^|\s)@([A-Za-z0-9_.-]*)$/.exec(this.text);
      const channelId = this.channelsStore.activeChannelId;
      if (!match || channelId === null) return null;

      const typed = match[2] ?? '';
      const before = this.text.slice(0, this.text.length - typed.length - 1); // text pred "@"
      const myId = this.usersStore.currentUserId;
      const members = this.channelsStore.membersOf(channelId).filter((id) => id !== myId);

      return this.nickSuggestions(members, typed, (nick) => `${before}@${nick} `);
    },

    // Používatelia z `userIds`, ktorých nick začína `typed`, ako návrhy (podľa abecedy).
    nickSuggestions(
      userIds: number[],
      typed: string,
      toText: (nick: string) => string,
    ): Suggestion[] {
      const lower = typed.toLowerCase();
      const nicks = userIds
        .map((id) => this.usersStore.userById(id)?.nickName)
        .filter(
          (nick): nick is string => nick !== undefined && nick.toLowerCase().startsWith(lower),
        )
        .sort((a, b) => a.localeCompare(b));

      if (nicks.some((nick) => nick.toLowerCase() === lower)) return []; // dopísaný, Enter odošle
      return nicks.map((nick) => ({ key: nick, label: `@${nick}`, text: toText(nick) }));
    },

    // Klávesy v políčku: šípky/Tab/Enter ovládajú zoznam návrhov, inak Enter odošle.
    onKeydown(event: KeyboardEvent): void {
      if (event.isComposing) return; // písanie diakritiky cez IME, Enter ešte nie je "odoslať"

      const count = this.suggestions.length;
      if (count > 0) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); // inak by šípka posunula kurzor v texte
          const step = event.key === 'ArrowDown' ? 1 : -1;
          this.activeSuggestion = (this.activeSuggestion + step + count) % count;
          return;
        }
        if (event.key === 'Tab' || event.key === 'Enter') {
          event.preventDefault(); // Tab by inak preskočil na ďalší prvok stránky
          this.pickSuggestion(this.activeSuggestion);
          return;
        }
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        void this.submit();
      }
    },

    // Nahradí text políčka vybraným návrhom.
    pickSuggestion(index: number): void {
      const suggestion = this.suggestions[index];
      if (suggestion) this.text = suggestion.text;
    },

    async submit(): Promise<void> {
      if (this.sending) return; // poistka proti dvojitému Enteru

      const parsed = parseInput(this.text);
      if (!parsed.text) return; // prázdny vstup

      if (parsed.error) {
        this.error = parsed.error;
        return;
      }

      if (parsed.kind === 'command') {
        const error = executeCommand(parsed);
        if (error) this.error = error;
        else this.text = '';
        return;
      }

      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) {
        this.error = 'Najprv vyber kanál';
        return;
      }

      this.sending = true;
      try {
        const error = await this.messagesStore.sendMessage(channelId, parsed.text);
        if (error) this.error = error;
        else this.text = '';
      } finally {
        this.sending = false;
      }
    },

    // UC 11: rozpísaná správa je viditeľná ako "X is typing". Príkazy nie, tie sú len moje.
    updateDraft(): void {
      const channelId = this.channelsStore.activeChannelId;
      if (channelId === null) return;

      const isCommand = this.text.trimStart().startsWith('/');
      this.messagesStore.setDraft(channelId, isCommand ? '' : this.text);
    },
  },
});
</script>

<style scoped>
.command-line {
  padding: 4px 16px 14px;
}

/* Box: plocha s rámikom (bez tieňa); pri písaní rámik v akcente + jemný prstenec. */
.composer-box {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  transition:
    border-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
    box-shadow 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
.composer-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--accent) 15%, transparent);
}
/* Chyba: červený rámik, aj keď je políčko vo fokuse (pravidlo je až za :focus-within). */
.composer-box--error,
.composer-box--error:focus-within {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--danger) 15%, transparent);
}

.command-input {
  padding: 4px 14px 0;
}
.command-input :deep(.q-field__native) {
  color: var(--text);
  font-size: 0.9375rem;
}
.command-input :deep(.q-field__native::placeholder) {
  color: var(--text-subtle);
  opacity: 1;
}

/* Spodná lišta: nápoveda klávesov vľavo, odoslanie vpravo. */
.composer-toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 2px 8px 8px 14px;
}
.composer-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-subtle);
  font-size: 0.71875rem;
  white-space: nowrap;
}
.command-send {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--hover);
  color: var(--text-subtle);
  transition:
    background-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
    color 150ms cubic-bezier(0.25, 1, 0.5, 1);
}
/* Keď je čo poslať, tlačidlo dostane akcent. */
.command-send--ready {
  background: var(--accent);
  color: var(--on-accent);
}

/* Hláška nad políčkom: chyba (červená) alebo nápoveda syntaxe príkazu (šedá). */
.command-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8125rem;
}
.command-note--error {
  background: var(--danger-soft);
  color: var(--danger);
  font-weight: 500;
}
.command-note--hint {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
}
.command-note code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Zoznam návrhov príkazov nad políčkom. */
.command-suggestions {
  margin: 0 0 8px;
  padding: 4px;
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}
.command-suggestion {
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 0.8125rem;
  cursor: pointer;
}
.command-suggestion--active {
  background: var(--accent-soft);
  color: var(--text);
}
.command-suggestion code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Animácia objavenia/zmiznutia hlášky (<Transition name="command-note">).
   https://vuejs.org/guide/built-ins/transition.html */
.command-note-enter-active,
.command-note-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.command-note-enter-from,
.command-note-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
@media (prefers-reduced-motion: reduce) {
  .command-note-enter-active,
  .command-note-leave-active {
    transition: none;
  }
}
</style>
