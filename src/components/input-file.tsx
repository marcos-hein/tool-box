import { Input, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function InputFile({ id, ...rest }: InputProps) {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>Picture</Label>
      <Input id={id} type="file" {...rest} />
    </div>
  )
}
