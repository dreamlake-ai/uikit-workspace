import { FormLayout, Label, InputRoot, Switch } from '@dreamlake/uikit'

// FormLayout pairs a label with *any* control. With `asChild` it renders the
// single child — here a real `<label>` — instead of a wrapper div, so the
// label's click-to-focus association comes for free.
export const ControlsSpec = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: 300 }}>
    <FormLayout asChild>
      <label>
        <span className="text-uikit-12">Display name</span>
        <InputRoot placeholder="Ada Lovelace" />
      </label>
    </FormLayout>

    <FormLayout orientation="label-left" align="center">
      <Label>Enable telemetry</Label>
      <Switch defaultChecked />
    </FormLayout>

    <FormLayout orientation="label-left" align="center">
      <Label>Max steps</Label>
      <InputRoot type="number" defaultValue={1000} />
    </FormLayout>
  </div>
)
