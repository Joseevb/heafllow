import { Activity } from 'react'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  SelectContent,
  SelectItem,
  Select as BaseSelect,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { useFieldContext, useFormContext } from '@/hooks/form-context'

type BaseProps = {
  label: string
  description?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

type TextProps = BaseProps & React.ComponentProps<'input'>

type TextAreaProps = BaseProps & React.ComponentProps<'textarea'>

type SelectProps = BaseProps & {
  options: Array<{ value: string; label: string }>
  action?: (item: { value: string; label: string }) => void
}

export function TextField({
  label,
  type = 'text',
  description,
  placeholder,
  ...props
}: Readonly<TextProps>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        type={type}
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder || ''}
        autoComplete="on"
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function TextArea({ label, description, placeholder, ...props }: Readonly<TextAreaProps>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder || ''}
        autoComplete="on"
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function Select({
  label,
  description,
  options,
  placeholder,
  action,
  ...props
}: Readonly<SelectProps>) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

  const handleValueChange = (value: string | null) => {
    if (!value) return

    field.handleChange(value)

    const selectedItem = options.find((item) => item.value === value)

    if (selectedItem && action) {
      action(selectedItem)
    }
  }

  return (
    <Field orientation="responsive" data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
      <BaseSelect
        name={field.name}
        value={field.state.value}
        onValueChange={(value) =>
          action ? handleValueChange(value) : field.handleChange(value ?? '')
        }
        {...props}
      >
        <SelectTrigger id={field.name} aria-invalid={isInvalid} className="w-full min-w-30">
          <SelectValue placeholder={placeholder}>
            {(value: string) => options.find((o) => o.value === value)?.label ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="center">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </BaseSelect>
    </Field>
  )
}

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting}>
          <Activity mode={isSubmitting ? 'visible' : 'hidden'}>
            <Spinner />
          </Activity>
          {label}
        </Button>
      )}
    </form.Subscribe>
  )
}
