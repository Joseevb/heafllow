import { createFormHook } from '@tanstack/react-form'

import { Select, SubscribeButton, TextArea, TextField } from '@/components/form-components'

import { fieldContext, formContext } from './form-context'

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    Select,
    TextArea,
  },
  formComponents: {
    SubscribeButton,
  },
  fieldContext,
  formContext,
})
