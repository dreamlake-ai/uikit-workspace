# Media Transport

The playback controls every player shares, taken from the Video Annotator's
control bar so a scene, a file preview, an audio reader and the labeling view
all look and behave alike.

- **Glyphs:** `PlaySharp`, `PauseSharp`, `SkipBackSharp` and `SkipForwardSharp`
  are flat-cornered (lucide's play and skip shapes bake in rounded corners);
  the step buttons are lucide chevrons.
- **Buttons:** `TransportButton` is a quiet 30px square (36px for the main
  play/pause), 6px radius, 75% ink at rest, full ink over a 5% ink wash on
  hover, the kit's inset 2px accent ring on keyboard focus, 35% when disabled,
  accent when `active`.
- **Tooltips:** the label is both the kit tooltip (with its wedge) and the
  accessible name, so it names the shortcut: "Play (Space)".

## Player

Pair it with the kit `Slider` as the scrubber. `useMediaKeys` wires Space,
← / → and Home / End to one player, and only while focus is inside it, so two
players on a page never both respond and typing is never taken over.

## Compact

`compact` keeps play/pause at 30px for a toolbar; other `TransportButton`s sit
beside it in the same style.

## Props

### MediaTransport

| Prop                       | Type                             | Default              | Description                                         |
| -------------------------- | -------------------------------- | -------------------- | --------------------------------------------------- |
| `playing`                  | `boolean`                        | —                    | Shows Pause when true.                              |
| `onTogglePlay`             | `() => void`                     | —                    | Play / pause.                                       |
| `onStep`                   | `(direction: -1 \| 1) => void`   | —                    | Step back / forward. Omit to hide the step buttons. |
| `onSkip`                   | `(to: "start" \| "end") => void` | —                    | Jump to the ends. Omit to hide.                     |
| `stepLabel`                | `string`                         | `"frame"`            | Unit named in the step tooltips.                    |
| `playLabel` / `pauseLabel` | `string`                         | `"Play"` / `"Pause"` | Names for the main button.                          |
| `compact`                  | `boolean`                        | `false`              | 30px play button instead of 36px.                   |
| `disabled`                 | `boolean`                        | `false`              | Disables every button.                              |

### TransportButton

| Prop      | Type      | Default | Description                                        |
| --------- | --------- | ------- | -------------------------------------------------- |
| `label`   | `string`  | —       | Tooltip and accessible name; include the shortcut. |
| `primary` | `boolean` | `false` | 36px instead of 30px.                              |
| `active`  | `boolean` | `false` | Accent colour, for toggles.                        |

### useMediaKeys(ref, handlers)

`handlers` takes `onTogglePlay`, `onStep` and `onSkip`; each key is only
handled when its handler is given. Keys are ignored while typing in an input,
textarea or slider, and Space on a focused button is left to the button.
