# PreviewStack

Show what a folder or collection contains using a sharp representative cover, with
up to two translucent, softly blurred covers behind it. The layers have perspective
and pull apart visibly in three dimensions on hover or keyboard focus: the front
cover lifts while the rear covers fan left and right. They remain still with reduced motion.
Keep collection stacks above ordinary entries, in the host's existing grid.

## One action per collection

Wrap the stack and its title in one native link or button. Opening the collection
belongs to that wrapper; the stack is decorative, inert and pointer-transparent.
Its previews are hidden from assistive technology so duplicate image descriptions
do not repeat the collection name. Use noninteractive image or thumbnail nodes.
Keep menus outside the primary action. The stack does not fetch files, resolve
permissions, create an episode list or start playback.

```tsx
<a href={collectionUrl}>
  <PreviewStack
    previews={covers.map((cover) => (
      <img key={cover.id} src={cover.url} alt="" />
    ))}
  />
  <span>{collection.name}</span>
</a>
```

## Content and sizing

The first preview stays sharp and in front. At most three nonempty preview nodes
render. A single preview uses the full cover area without fabricated rear layers;
no previews render nothing. The host chooses a folder icon, loading state or retry
action when covers are unavailable. Resolve cover URLs through the same authorized
asset path as ordinary previews, and do not download a whole scene for a cover.

The stack fills its parent width with a 16:10 footprint, including space for its
rear layers at rest. The stack has no background panel. Leave overflow visible
around its host so the expanded covers can extend beyond that footprint. In a
`CollectionRowBody`, set
`classNames={{ icon: "uikit-collection-icon--preview-stack" }}` to remove the
thumbnail well's background and clipping; ordinary file thumbnails keep their well.
Keep the active collection above neighboring cards when its host establishes a
stacking context. Use the existing collection grid's sizing controls and scrolling;
do not put a second scroll area or a mini-grid inside the stack.

| Prop        | Type          | Purpose                                             |
| ----------- | ------------- | --------------------------------------------------- |
| `previews`  | `ReactNode[]` | Ordered cover nodes; first is front, maximum three. |
| `className` | `string`      | Additional classes on the presentation wrapper.     |
