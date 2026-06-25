import { useState } from 'react'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@dreamlake/uikit'

export const BasicSpec = () => {
  const [value, setValue] = useState<string | undefined>(undefined)
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Pick a region…" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Americas</SelectLabel>
          <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
          <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="eu-west-1">EU West (Ireland)</SelectItem>
          <SelectItem value="eu-central-1">EU Central (Frankfurt)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
