# TabbedContainer

A tab strip joined to one content frame. It generalizes the raised file-tab
geometry of Dockit's code-block tabs to arbitrary React content. Colors use
neutral UIKit surface, ink and hairline tokens in light and dark themes.

One shared starting point.</p>},
  {value:'right',label:'Spawn right',children:<p>A and the new view sit side by side.</p>},
  {value:'below',label:'Spawn below',children:<p>The new view sits below A.</p>}
]} />

```tsx
<TabbedContainer
  aria-label="Spawn alternatives"
  items={[
    { value: 'right', label: 'Spawn right', children: <RightExample /> },
    { value: 'below', label: 'Spawn below', children: <BelowExample /> },
  ]}
/>
```

Use `value` and `onValueChange` for controlled selection, or `defaultValue` for
uncontrolled selection. `keepMounted` defaults to true so inactive content keeps
its local state; hidden panels are inert and absent from keyboard navigation.
Set it false for disposable scenario branches. `className` styles the shell;
`contentClassName` styles its panels.

Arrow keys, Home and End select and focus tabs. Every tab and panel has linked
ARIA IDs. Long labels remain on one line in a horizontally scrollable strip.
The [layout controller examples](reference/components-layout-controller.md) use this container
to fork commands from one shared starting layout.
