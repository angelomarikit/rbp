import { useEffect, useCallback, useRef, useState } from 'react'
import type { CartLine, CheckoutForm } from '../data/types.ts'
import { useAuth } from '../features/auth/AuthProvider.tsx'
import { friendlyError } from '../lib/friendlyError.ts'
import { uploadPaymentProof } from '../lib/media.ts'
import { supabase, supabaseConfigured } from '../lib/supabase.ts'

const SHIPPING_CENTS = { standard: 10000, express: 20000 } as const

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function useCheckout(lines: CartLine[]) {
  const { user, profile } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitLock = useRef(false)

  const [form, setForm] = useState<CheckoutForm>({
    fullName: '',
    email: '',
    phone: '',
    province: '',
    city: '',
    barangay: '',
    postalCode: '',
    address: '',
    paymentMethod: 'gcash',
    shippingMethod: 'standard',
  })

  const subtotalCents = lines.reduce(
    (n, l) => n + l.priceCents * l.quantity,
    0,
  )
  const shippingCents = lines.length === 0 ? 0 : SHIPPING_CENTS[form.shippingMethod]
  const totalCents = subtotalCents + shippingCents

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || profile?.full_name || '',
      email: prev.email || user?.email || profile?.email || '',
      phone: prev.phone || profile?.phone || '',
    }))
  }, [profile, user])

  const updateForm = (patch: Partial<CheckoutForm>) => {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  const validate = useCallback(() => {
    if (lines.length === 0) return 'Your cart is empty.'
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!validateEmail(form.email.trim())) return 'A valid email address is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!form.province.trim()) return 'Province is required.'
    if (!form.city.trim()) return 'City / municipality is required.'
    if (!form.barangay.trim()) return 'Barangay is required.'
    if (!form.postalCode.trim()) return 'Postal code is required.'
    if (!form.address.trim()) return 'Complete address is required.'
    return null
  }, [form, lines.length])

  const submitOrder = async (proof: { file: File | null; referenceLast4: string }): Promise<{ ok: boolean; orderId?: string; proofSaved?: boolean }> => {
    setError(null)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return { ok: false }
    }
    if (!proof.file) {
      setError('Upload a screenshot of your payment.')
      return { ok: false }
    }
    const referenceLast4 = proof.referenceLast4.trim()
    if (!/^\d{4}$/.test(referenceLast4)) {
      setError('Enter the last 4 digits of the reference number.')
      return { ok: false }
    }

    if (!supabaseConfigured || !supabase) {
      setError('Checkout is not available right now. Please try again later.')
      return { ok: false }
    }

    if (submitLock.current) return { ok: false }
    submitLock.current = true
    setSubmitting(true)

    try {
      const items = lines.map((line) => ({
        product_id: line.productId,
        variant_key: line.variantKey ?? '',
        quantity: line.quantity,
        unit_price_cents: line.priceCents,
        product_name: [line.name, line.sizeLabel, line.color, line.material].filter(Boolean).join(' · '),
      }))

      const { data, error: rpcError } = await supabase.rpc('create_order_with_items', {
        p_subtotal_cents: subtotalCents,
        p_shipping_cents: shippingCents,
        p_total_cents: totalCents,
        p_payment_method: form.paymentMethod,
        p_shipping_address: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          province: form.province,
          city: form.city,
          barangay: form.barangay,
          postalCode: form.postalCode,
          address: form.address,
          shippingMethod: form.shippingMethod,
        },
        p_items: items,
      })

      if (rpcError) throw rpcError
      const id = data as string
      let proofSaved = true
      try {
        const path = await uploadPaymentProof(proof.file, id)
        const { error: proofError } = await supabase.rpc('attach_payment_proof', {
          p_order_id: id,
          p_storage_path: path,
          p_reference_last4: referenceLast4,
        })
        if (proofError) throw proofError
      } catch (proofFailure) {
        proofSaved = false
        setError(friendlyError(proofFailure, 'The order was saved, but the payment screenshot was not attached.'))
      }
      setOrderId(id)
      setStep(3)
      return { ok: true, orderId: id, proofSaved }
    } catch (e) {
      setError(friendlyError(e, 'The order could not be placed. Please try again.'))
      return { ok: false }
    } finally {
      setSubmitting(false)
      submitLock.current = false
    }
  }

  return {
    form,
    updateForm,
    step,
    setStep,
    subtotalCents,
    shippingCents,
    totalCents,
    submitOrder,
    submitting,
    orderId,
    error,
    supabaseConfigured,
  }
}