# Product

## Register

product

## Users

General users of an IRC/Slack-style text chat, as defined by the VPWA assignment (see README.md). Anyone who registers with a name, nickName and email, joins public channels or is invited to private ones, and talks in them. They use it on desktop, tablet and phone (the prototype must be responsive), often alongside other work, switching between channels and coming back later to catch up on history.

The secondary audience is the course instructor evaluating the prototype: every use case (UC1 to UC11) must be visibly reachable and understandable without explanation.

## Product Purpose

A progressive web app for text communication in channels. The core loop: see your channels (invites highlighted on top), open one, read history, write messages or commands in a fixed command line, address people with @nickname, see who is online, DND or offline and who is typing.

Success: a user can find their channel, read and send in seconds, and every command and state (invite, admin, ban, mention, typing, presence) is clearly communicated by the interface.

## Brand Personality

Calm, precise, unobtrusive. Like Linear or Slack at their quietest: the messages are the content, the chrome stays out of the way. Confidence comes from typographic hierarchy and spacing, not decoration.

## Anti-references

- The default Quasar template look (stock blue toolbar, Material defaults left untouched).
- Gradient-heavy SaaS dashboards, glassmorphism, decorative shadows on everything.
- Discord-style loudness: saturated colors on every surface, gamer aesthetic.
- Cards wrapped around every message.

## Design Principles

1. **Messages first.** The conversation is the product; navigation, member lists and headers recede.
2. **State is legible at a glance.** Invites, mentions, presence, admin rights and typing are always visible without opening anything.
3. **The command line is the main control.** It is fixed, obvious and gives clear feedback on errors.
4. **Explainable simplicity.** Every visual decision must be simple enough for either team member to explain at the defense; no extra libraries without justification.
5. **Works everywhere.** Phone, tablet and desktop are first-class, in light and dark mode.

## Accessibility & Inclusion

WCAG 2.2 AA: text contrast at least 4.5:1 in both light and dark themes, visible keyboard focus, presence never communicated by color alone (also icon or label), respect `prefers-reduced-motion`. Light and dark themes with a user toggle.
