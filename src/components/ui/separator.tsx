import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const separatorVariants = cva('shrink-0', {
  variants: {
    variant: {
      default: 'bg-border',
      gradient: 'bg-gradient-to-r from-transparent via-border to-transparent',
      gradientBlue:
        'bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700',
      gradientPrimary: 'bg-gradient-to-r from-transparent via-primary/50 to-transparent',
      dashed: 'bg-transparent border-0 border-t-2 border-dashed border-border',
      dotted: 'bg-transparent border-0 border-t-2 border-dotted border-border',
    },
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'h-full w-px',
    },
  },
  compoundVariants: [
    {
      variant: 'gradient',
      orientation: 'vertical',
      className: 'bg-gradient-to-b from-transparent via-border to-transparent',
    },
    {
      variant: 'gradientBlue',
      orientation: 'vertical',
      className: 'bg-gradient-to-b from-transparent via-blue-300 to-transparent dark:via-blue-700',
    },
    {
      variant: 'gradientPrimary',
      orientation: 'vertical',
      className: 'bg-gradient-to-b from-transparent via-primary/50 to-transparent',
    },
    {
      variant: 'dashed',
      orientation: 'vertical',
      className: 'border-t-0 border-l-2 border-dashed',
    },
    {
      variant: 'dotted',
      orientation: 'vertical',
      className: 'border-t-0 border-l-2 border-dotted',
    },
  ],
  defaultVariants: {
    variant: 'default',
    orientation: 'horizontal',
  },
})

function Separator({
  variant,
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props & Omit<VariantProps<typeof separatorVariants>, 'orientation'>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        separatorVariants({ variant, orientation }),
        'shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
