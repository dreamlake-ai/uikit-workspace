import {
  Menu,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@dreamlake/uikit";

/** Both surfaces consume input locally; the shared menu still dismisses. */
export function OutsideDismissSpec() {
  return (
    <div className="grid gap-4">
      <Menu trigger={() => <button type="button">Versions</button>}>
        <button type="button" className="block px-2 py-2">
          Version 2
        </button>
        <button type="button" className="block px-2 py-2">
          Version 1
        </button>
        <Select defaultValue="latest">
          <SelectTrigger aria-label="Version channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="stable">Stable</SelectItem>
          </SelectContent>
        </Select>
      </Menu>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="rounded border border-uikit-border p-3 text-left"
      >
        Editor surface — click here after opening Versions
      </button>
      <iframe
        title="Embedded preview dismissal example"
        className="h-24 w-full rounded border border-uikit-border"
        srcDoc={
          '<!doctype html><html><body style="font:14px system-ui;padding:12px"><button>Embedded preview — click here</button></body></html>'
        }
      />
    </div>
  );
}
