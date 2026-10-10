import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  Field,
  TextField,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@dreamlake/uikit";

export function ManagedFocusSpec() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("draft.txt");
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={trigger} onClick={() => setOpen(true)}>
        Open keyboard workflow
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Name the attachment"
        managedFocus
        initialFocus={1}
        returnFocus={trigger}
        footer={<Button onClick={() => setOpen(false)}>Done</Button>}
      >
        <Field label="File name" htmlFor="managed-dialog-file">
          <TextField id="managed-dialog-file" value={name} onChange={setName} />
        </Field>
        <Popover>
          <PopoverTrigger>Path help</PopoverTrigger>
          <PopoverContent>
            A new path keeps the existing file unchanged.
            <Button size="sm">Example action</Button>
          </PopoverContent>
        </Popover>
        <p>
          Tab stays in this dialog. Escape closes it and returns focus to its
          opener. Path help uses an existing nested UIKit portal.
        </p>
      </Dialog>
    </>
  );
}
