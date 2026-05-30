import { createFileRoute } from '@tanstack/react-router'
import { Check, CreditCard, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import * as z from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authClient } from '@/lib/auth-client'
import { cn, createUrl } from '@/lib/utils'

const searchParams = z.object({
  error: z.enum(['provisioning_failed', 'cancelled', 'unknown_error']).optional(),
})

export const Route = createFileRoute('/auth/sign-up/payment')({
  validateSearch: searchParams,
  component: RouteComponent,
})

const plans = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '60',
    period: 'month',
    description: 'Flexible monthly billing',
    features: ['Full access to all features', 'Cancel anytime', 'Monthly billing'],
    popular: false,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '600',
    period: 'year',
    description: 'Best value - save 17%',
    features: [
      'Full access to all features',
      'Two months of discount',
      'Priority support',
      'Annual billing',
    ],
    popular: true,
  },
] as const

function RouteComponent() {
  const { error: searchError } = Route.useSearch()

  useEffect(() => {
    switch (searchError) {
      case 'provisioning_failed':
        toast.error(
          'Payment succeeded but account setup failed. Please try again or contact support.',
        )
        break
      case 'unknown_error':
        toast.error('An unknown error occurred. Please try again or contact support.')
        break
    }
  }, [searchError])

  const handleSubscribe = async (planId: 'monthly' | 'yearly') => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return

    const toastId = toast.loading(`Redirecting to secure checkout...`)

    const { error } = await authClient.subscription.upgrade({
      plan: planId,
      successUrl: createUrl('/auth/callback/payment'),
      cancelUrl: createUrl('/auth/sign-up/payment', { error: 'cancelled' }),
    })

    if (error) {
      toast.error(error.message || 'Failed to start checkout. Please try again.', {
        id: toastId,
      })
      return
    }

    // Success - Stripe handles the redirect, but toast will show briefly
    toast.success('Redirecting to Stripe...', { id: toastId })
  }

  return (
    <div className="mx-auto flex min-h-screen w-screen max-w-4xl flex-col items-center justify-center gap-6 px-4 pt-16">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground">
          Select a billing option. You can change or cancel anytime.
        </p>
      </div>

      <div className="grid w-full gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative',
              plan.popular ? 'overflow-visible border-primary shadow-lg' : '',
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 z-50 -translate-x-1/2 " variant="default">
                <Zap className="mr-1 h-3 w-3" />
                Best Value
              </Badge>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-6">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">+ VAT where applicable</p>
              </div>

              <Separator />

              <ul className="space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-auto w-full"
                size="lg"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.id)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Subscribe {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Secure payment powered by <span className="font-medium text-foreground">Stripe</span>. Your
        card details are never stored on our servers.
      </p>
    </div>
  )
}
