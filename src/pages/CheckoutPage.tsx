import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrangeButton } from '../components/ui/Buttons.tsx'
import { GothicHeading } from '../components/ui/GothicHeading.tsx'
import { LoadingScreen } from '../components/ui/LoadingScreen.tsx'
import { IconCart, IconTrash } from '../components/ui/Icons.tsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.tsx'
import { rbpField, rbpPanel } from '../components/ui/panels.ts'
import { cartLineImage, useCart } from '../features/cart/CartProvider.tsx'
import { useAuth } from '../features/auth/AuthProvider.tsx'
import { supabase } from '../lib/supabase.ts'
import { useCheckout } from '../hooks/useCheckout.ts'
import { asset } from '../lib/assets.ts'
import type { CartLine } from '../data/types.ts'
import { formatPhpLabel } from '../lib/format.ts'
import { describeSelection, imageForDesign, optionGroupsFor, type ChoiceGroup, type StoreDesign } from '../lib/productChoices.ts'
import { friendlyError } from '../lib/friendlyError.ts'
import { publicMediaUrl } from '../lib/media.ts'
import { emptyPaymentQrs, paymentMethodLabel, paymentQrsFromExtra, type PaymentQrs } from '../lib/paymentQr.ts'

function chosenOptions(line: CartLine, groups: ChoiceGroup[]) {
  const selected: Record<string, string> = { ...(line.options ?? {}) }
  delete selected.version
  const parts = (line.sizeLabel ?? '').split(/[,/]/).map((part) => part.trim())
  for (const group of groups) {
    if (selected[group.key] && group.values.includes(selected[group.key])) continue
    if (group.key === 'color' && line.color && group.values.includes(line.color)) selected.color = line.color
    else if (group.key === 'material' && line.material && group.values.includes(line.material)) selected.material = line.material
    else selected[group.key] = group.values.find((value) => parts.includes(value)) || group.values[0]
  }
  return selected
}

function sizeGroupOf(groups: ChoiceGroup[]) {
  return groups.find((group) => group.key === 'length') ?? groups.find((group) => group.key === 'size')
}

function checkedSizes(line: CartLine, group: ChoiceGroup) {
  const saved = (line.sizes ?? []).filter((size) => group.values.includes(size))
  if (saved.length) return saved
  const parts = (line.sizeLabel ?? '').split(/[,/]/).map((part) => part.trim())
  const found = group.values.filter((value) => parts.includes(value))
  if (found.length) return found
  const single = line.options?.[group.key]
  if (single && group.values.includes(single)) return [single]
  return [group.values[0]]
}

function CartChoices({ line, onChange }: { line: CartLine; onChange: (lineId: string, patch: Partial<CartLine>) => void }) {
  const [groups, setGroups] = useState<ChoiceGroup[]>([])
  const [rows, setRows] = useState<Awaited<ReturnType<typeof optionGroupsFor>>['rows']>([])
  const [designs, setDesigns] = useState<StoreDesign[]>([])
  const [productImage, setProductImage] = useState(line.imagePath)

  useEffect(() => {
    let active = true
    void optionGroupsFor(line.productId).then((result) => {
      if (!active) return
      setGroups(result.groups)
      setRows(result.rows)
      setDesigns(result.designs)
    })
    if (supabase) {
      void supabase.from('products').select('image_path').eq('id', line.productId).maybeSingle().then(({ data }) => {
        if (active && data?.image_path) setProductImage(data.image_path as string)
      })
    }
    return () => {
      active = false
    }
  }, [line.productId])

  useEffect(() => {
    const picture = imageForDesign(designs, line.options?.design ?? '')
    if (picture && picture !== line.imagePath) onChange(line.lineId, { imagePath: picture })
  }, [designs, line, onChange])

  if (!groups.length && !designs.length) {
    return (
      <>
        {line.material && <p className="text-[11px] text-white/55">Material: {line.material}</p>}
        {line.sizeLabel && <p className="text-[11px] text-white/55">Size: {line.sizeLabel}</p>}
        {line.color && <p className="text-[11px] text-white/55">Color: {line.color}</p>}
      </>
    )
  }

  const selected = chosenOptions(line, groups)
  const sizeGroup = sizeGroupOf(groups)
  const sizes = sizeGroup ? checkedSizes(line, sizeGroup) : []
  const apply = (nextSelected: Record<string, string>, nextSizes: string[], quantity?: number) => {
    const described = describeSelection(nextSelected, rows)
    const ordered = sizeGroup ? sizeGroup.values.filter((value) => nextSizes.includes(value)) : []
    const sizeText = ordered.join(', ')
    const sizeLabel = sizeGroup
      ? [sizeText, nextSelected.gauge].filter(Boolean).join(' / ') || described.sizeLabel
      : described.sizeLabel
    const variantKey = [
      sizeGroup ? `${sizeGroup.key}:${ordered.join('+')}` : '',
      ...Object.entries(nextSelected).filter(([key]) => key !== sizeGroup?.key).map(([key, value]) => `${key}:${value}`),
    ].filter(Boolean).join('|')
    onChange(line.lineId, {
      options: { ...described.options, ...(sizeGroup ? { [sizeGroup.key]: ordered[0] ?? '' } : {}) },
      ...(sizeGroup ? { sizes: ordered } : {}),
      ...(quantity === undefined ? {} : { quantity }),
      variantKey,
      material: described.material || line.material,
      sizeLabel,
      color: described.color,
      priceCents: described.priceCents ?? line.priceCents,
      variantLabel: sizeLabel,
      imagePath: imageForDesign(designs, nextSelected.design ?? '') || productImage || line.imagePath,
    })
  }
  const chooseSizes = (next: string[]) => {
    if (!sizeGroup) return
    const list = next.length ? next : [sizeGroup.values[0]]
    apply({ ...selected, [sizeGroup.key]: list[0] }, list, list.length)
  }
  return (
    <div className="mt-1 space-y-1.5">
      {sizeGroup && (
        <fieldset className="text-[11px] text-white/55">
          <legend>{sizeGroup.name}</legend>
          <label className="mt-1 flex items-center gap-1.5 text-[12px] text-white">
            <input
              type="checkbox"
              className="accent-[#FF7900]"
              checked={sizes.length === sizeGroup.values.length}
              onChange={() => chooseSizes(sizes.length === sizeGroup.values.length ? [sizes[0] ?? sizeGroup.values[0]] : [...sizeGroup.values])}
            />
            All sizes
          </label>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {sizeGroup.values.map((value) => (
              <label key={value} className="flex items-center gap-1.5 text-[12px] text-white">
                <input
                  type="checkbox"
                  className="accent-[#FF7900]"
                  checked={sizes.includes(value)}
                  onChange={() => chooseSizes(sizes.includes(value) ? sizes.filter((size) => size !== value) : [...sizeGroup.values])}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {designs.length > 0 && (
        <fieldset className="text-[11px] text-white/55">
          <legend>Design</legend>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {designs.map((design) => (
              <label key={design.name} className="flex items-center gap-1.5 text-[12px] text-white">
                <input
                  type="radio"
                  name={`${line.cartId ?? line.lineId}-design`}
                  className="accent-[#FF7900]"
                  checked={(selected.design || designs[0]?.name) === design.name}
                  onChange={() => apply({ ...selected, design: design.name }, sizes)}
                />
                {design.image ? <img src={publicMediaUrl(design.image)} alt="" className="h-8 w-8 rounded object-cover" /> : null}
                {design.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {groups.filter((group) => group.key !== sizeGroup?.key && group.key !== 'version').map((group) => (
        <fieldset key={group.key} className="text-[11px] text-white/55">
          <legend>{group.name}</legend>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {group.values.map((value) => (
              <label key={value} className="flex items-center gap-1.5 text-[12px] text-white">
                <input
                  type="radio"
                  name={`${line.cartId ?? line.lineId}-${group.key}`}
                  className="accent-[#FF7900]"
                  checked={(selected[group.key] ?? group.values[0]) === value}
                  onChange={() => apply({ ...selected, [group.key]: value }, sizes)}
                />
                {value}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  )
}

export function CheckoutPage() {
  const { user, profile } = useAuth()
  const { lines, updateQuantity, updateLine, removeLine, clearCart, itemCount } = useCart()
  const {
    form,
    updateForm,
    step,
    subtotalCents,
    shippingCents,
    discountCents,
    appliedDiscount,
    discountInput,
    setDiscountInput,
    applyDiscountCode,
    clearDiscount,
    discountMessage,
    discountLoading,
    totalCents,
    submitOrder,
    submitting,
    orderId,
    error,
  } = useCheckout(lines)
  const [paymentQrs, setPaymentQrs] = useState<PaymentQrs>(emptyPaymentQrs)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [referenceLast4, setReferenceLast4] = useState('')

  useEffect(() => {
    if (!supabase) return
    void supabase
      .from('content_sections')
      .select('extra')
      .eq('page', 'site')
      .eq('section_key', 'payment')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPaymentQrs(paymentQrsFromExtra(data.extra))
      })
  }, [])

  const handleSubmit = async () => {
    if (lines.length === 0) return
    const result = await submitOrder({ file: proofFile, referenceLast4 })
    if (result.ok) clearCart()
  }

  if (step === 3 && orderId) {
    return (
      <div className="w-full bg-black px-6 py-16 text-center">
        <GothicHeading className="text-5xl">Order Submitted</GothicHeading>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white">
          Reference: <span className="text-rbp-accent">{orderId}</span>
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-rbp-muted">
          Your order is saved. The studio confirms the payment screenshot and reference number. It is not checked automatically.
        </p>
        {error && <p className="mx-auto mt-3 max-w-xl text-sm text-red-400">{friendlyError(error)}</p>}
        <PaymentQr method={paymentMethodLabel(form.paymentMethod)} path={form.paymentMethod === 'bpi' ? paymentQrs.bpi : paymentQrs.gcash} />
        {appliedDiscount && (
          <p className="mx-auto mt-4 max-w-xl text-sm text-rbp-muted">
            Discount code <span className="text-rbp-accent">{appliedDiscount.code}</span> ({appliedDiscount.percent}% off subtotal)
          </p>
        )}
        {user && (
          <Link
            to={
              profile?.role === 'reseller'
                ? `/reseller/orders/${orderId}`
                : `/account/orders/${orderId}`
            }
            className="mt-8 block text-rbp-accent"
          >
            View this order in your account
          </Link>
        )}
        <Link to="/collections" className="mt-4 inline-block text-rbp-accent-gold">
          Continue Shopping →
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-black">
      {submitting ? <LoadingScreen label="Placing your order" full /> : null}
      <section className="relative grid min-h-[180px] lg:grid-cols-[minmax(0,46%)_1fr]">
        <div className="flex flex-col justify-center bg-black px-6 py-8 lg:px-12">
          <GothicHeading as="h1" className="text-[2.6rem] leading-none text-rbp-accent sm:text-[3.4rem]">
            Shopping Cart & Checkout
          </GothicHeading>
          <p className="font-secondary mt-3 text-[12px] font-medium uppercase tracking-[0.22em] text-white/75">
            Review your items and complete your order
          </p>
        </div>
        <div className="relative min-h-[160px]">
          <img src={asset('banners/checkout-jewelry-banner.jpg')} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
        </div>
        <div className="header-glow absolute bottom-0 left-0" />
      </section>

      <section className="mx-auto grid w-full max-w-[1280px] gap-4 px-3 py-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:px-4">
        <div className={`${rbpPanel} p-4 lg:p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rbp-accent">
              <IconCart size={26} />
              <h2 className="font-display text-[1.8rem] leading-none text-rbp-accent">Your Cart</h2>
              <span className="text-[13px] text-white/70">({itemCount} Items)</span>
            </div>
            <Link to="/collections" className="text-[13px] font-medium text-rbp-accent-gold">
              Continue Shopping →
            </Link>
          </div>

          <div className="grid grid-cols-[1.6fr_70px_110px_70px_24px] border-b border-white/10 px-1 pb-2 text-[12px] font-semibold text-white/80">
            <span>Product</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Total</span>
            <span />
          </div>

          {lines.length === 0 ? (
            <div className="py-10 text-center text-sm text-rbp-muted">
              Your cart is empty.
              <div>
                <Link to="/collections" className="mt-3 inline-block text-rbp-accent-gold">
                  Browse collections →
                </Link>
              </div>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.cartId ?? line.lineId}
                className="grid grid-cols-[1.6fr_70px_110px_70px_24px] items-start gap-2 border-b border-white/10 py-3 text-[13px]"
              >
                <div className="flex min-w-0 gap-3">
                  <img src={cartLineImage(line)} alt="" className="h-[64px] w-[72px] rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{line.name}</p>
                    <CartChoices line={line} onChange={updateLine} />
                  </div>
                </div>
                <span>{formatPhpLabel(line.priceCents)}</span>
                <QuantityStepper size="sm" value={line.quantity} onChange={(q) => updateQuantity(line.lineId, q)} />
                <span>{formatPhpLabel(line.priceCents * line.quantity)}</span>
                <button type="button" aria-label="Remove" className="text-rbp-accent" onClick={() => removeLine(line.lineId)}>
                  <IconTrash />
                </button>
              </div>
            ))
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-white">
                <span className="text-rbp-accent">▣</span> Shipping Options
              </p>
              {(
                [
                  ['standard', 'Standard Shipping (3–5 Business Days)', 10000],
                  ['express', 'Express Shipping (1–2 Business Days)', 20000],
                ] as const
              ).map(([id, label, cents]) => (
                <label key={id} className="mb-2 flex cursor-pointer items-center gap-2 text-[13px] text-white/85">
                  <input
                    type="radio"
                    name="ship"
                    checked={form.shippingMethod === id}
                    onChange={() => updateForm({ shippingMethod: id })}
                    className="accent-rbp-accent"
                  />
                  <span className="flex-1">{label}</span>
                  <span>{formatPhpLabel(cents)}</span>
                </label>
              ))}
            </div>
            <div className="rounded-rbp border border-rbp-border bg-black p-4 text-[13px]">
              <p className="text-center text-[16px] font-bold">Order Summary</p>
              <div className="mt-3 space-y-2 border-b border-white/10 pb-3">
                <label className="block text-[11px] uppercase tracking-[0.12em] text-white/60">
                  Reseller / discount code
                  <div className="mt-1 flex gap-2">
                    <input
                      className={`${rbpField} h-9 flex-1 text-[13px]`}
                      value={discountInput}
                      placeholder="e.g. RBP15"
                      onChange={(e) => setDiscountInput(e.target.value)}
                      onBlur={() => void applyDiscountCode()}
                    />
                    <OrangeButton
                      type="button"
                      className="h-9 shrink-0 px-3 text-[12px]"
                      disabled={discountLoading || !discountInput.trim()}
                      onClick={() => void applyDiscountCode()}
                    >
                      {discountLoading ? '…' : 'Apply'}
                    </OrangeButton>
                  </div>
                </label>
                {discountMessage && <p className="text-[12px] text-rbp-cream">{discountMessage}</p>}
                {appliedDiscount && (
                  <button type="button" className="text-[12px] text-rbp-accent-gold" onClick={clearDiscount}>
                    Remove code
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-1 text-white/75">
                <div className="flex justify-between">
                  <span>Subtotal ({itemCount} Items)</span>
                  <span className="text-white">{formatPhpLabel(subtotalCents)}</span>
                </div>
                {discountCents > 0 && (
                  <div className="flex justify-between text-rbp-accent-gold">
                    <span>Discount ({appliedDiscount?.percent}%)</span>
                    <span>-{formatPhpLabel(discountCents)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-white">{formatPhpLabel(shippingCents)}</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-[18px] font-bold">
                <span>Total</span>
                <span className="text-rbp-accent">{formatPhpLabel(totalCents)}</span>
              </div>
            </div>
          </div>
        </div>

        <CheckoutFormPanel
          form={form}
          updateForm={updateForm}
          step={step}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
          cartEmpty={lines.length === 0}
          paymentQrs={paymentQrs}
          proofFile={proofFile}
          onProofFile={setProofFile}
          referenceLast4={referenceLast4}
          onReferenceLast4={setReferenceLast4}
        />
      </section>
    </div>
  )
}

function CheckoutFormPanel({
  form,
  updateForm,
  step,
  onSubmit,
  submitting,
  error,
  cartEmpty,
  paymentQrs,
  proofFile,
  onProofFile,
  referenceLast4,
  onReferenceLast4,
}: {
  form: ReturnType<typeof useCheckout>['form']
  updateForm: ReturnType<typeof useCheckout>['updateForm']
  step: number
  onSubmit: () => void
  submitting: boolean
  error: string | null
  cartEmpty: boolean
  paymentQrs: PaymentQrs
  proofFile: File | null
  onProofFile: (file: File | null) => void
  referenceLast4: string
  onReferenceLast4: (value: string) => void
}) {
  const payments = [
    { id: 'gcash' as const, label: 'GCash' },
    { id: 'bpi' as const, label: 'BPI' },
  ]
  const selected = payments.find((method) => method.id === form.paymentMethod) ?? payments[0]
  const qrPath = selected.id === 'bpi' ? paymentQrs.bpi : paymentQrs.gcash
  const proofPreview = useMemo(() => (proofFile ? URL.createObjectURL(proofFile) : ''), [proofFile])
  useEffect(() => () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview)
  }, [proofPreview])

  return (
    <div className={`${rbpPanel} p-4 lg:p-5`}>
      <div className="mb-5 flex items-center gap-2 text-[12px]">
        {['Information', 'Payment', 'Confirmation'].map((label, i) => {
          const active = step === i + 1
          const done = step > i + 1
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  active || done ? 'bg-rbp-accent text-black' : 'border border-white/30 text-white/60'
                }`}
              >
                {i + 1}
              </span>
              <span className={active ? 'text-white' : 'text-white/50'}>{label}</span>
              {i < 2 && <span className="mx-1 hidden h-px flex-1 bg-white/20 sm:block" />}
            </div>
          )
        })}
      </div>

      <p className="mb-2 text-[15px] font-bold">Customer Information</p>
      <Field label="Full Name *">
        <input className={rbpField} value={form.fullName} placeholder="Enter your full name" onChange={(e) => updateForm({ fullName: e.target.value })} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email Address *">
          <input className={rbpField} type="email" value={form.email} placeholder="Enter your email" onChange={(e) => updateForm({ email: e.target.value })} />
        </Field>
        <Field label="Phone Number *">
          <input className={rbpField} value={form.phone} placeholder="+63 9XX XXX XXXX" onChange={(e) => updateForm({ phone: e.target.value })} />
        </Field>
      </div>

      <p className="mb-2 mt-4 text-[15px] font-bold">Shipping Address</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Province *">
          <input className={rbpField} value={form.province} placeholder="Select Province" onChange={(e) => updateForm({ province: e.target.value })} />
        </Field>
        <Field label="City / Municipality *">
          <input className={rbpField} value={form.city} placeholder="Select City / Municipality" onChange={(e) => updateForm({ city: e.target.value })} />
        </Field>
        <Field label="Barangay *">
          <input className={rbpField} value={form.barangay} placeholder="Enter Barangay" onChange={(e) => updateForm({ barangay: e.target.value })} />
        </Field>
        <Field label="Postal Code *">
          <input className={rbpField} value={form.postalCode} placeholder="Enter Postal Code" onChange={(e) => updateForm({ postalCode: e.target.value })} />
        </Field>
      </div>
      <Field label="Complete Address *">
        <textarea
          className={rbpField}
          rows={2}
          value={form.address}
          placeholder="House No., Street, Subdivision, Landmark"
          onChange={(e) => updateForm({ address: e.target.value })}
        />
      </Field>

      <p className="mb-2 mt-2 text-[15px] font-bold">Payment Method</p>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {payments.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => updateForm({ paymentMethod: p.id })}
            className={`rounded-md border px-2 py-3 text-[13px] font-semibold ${
              form.paymentMethod === p.id
                ? 'border-rbp-accent bg-[#140c00] text-white shadow-[0_0_12px_rgba(255,122,0,0.25)]'
                : 'border-rbp-border bg-black text-white/80'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <PaymentQr method={selected.label} path={qrPath} />
      <Field label="Payment screenshot *">
        <input
          className={`${rbpField} file:mr-3 file:rounded file:border-0 file:bg-rbp-accent file:px-2 file:py-1 file:text-xs file:font-semibold file:text-black`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => onProofFile(event.target.files?.[0] ?? null)}
        />
      </Field>
      {proofFile && (
        <img src={proofPreview} alt="Payment screenshot preview" className="mb-3 max-h-40 rounded-md border border-rbp-border object-contain" />
      )}
      <Field label="Last 4 digits of the reference number *">
        <input
          className={rbpField}
          inputMode="numeric"
          maxLength={4}
          value={referenceLast4}
          placeholder="1234"
          onChange={(event) => onReferenceLast4(event.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </Field>

      {error && <p className="mb-2 text-sm text-red-400">{friendlyError(error)}</p>}
      <OrangeButton type="button" className="h-11 w-full font-semibold text-black" disabled={submitting || cartEmpty} onClick={onSubmit}>
        {submitting ? 'Processing…' : 'Proceed to Checkout →'}
      </OrangeButton>
    </div>
  )
}

function PaymentQr({ method, path }: { method: string; path: string }) {
  if (!path) {
    return <p className="mb-4 text-sm text-white/70">A {method} QR is not available yet.</p>
  }
  return (
    <div className="mb-4 rounded-md border border-rbp-border bg-black p-4 text-center">
      <p className="text-sm text-white">Scan this {method} QR and send the order total.</p>
      <img src={publicMediaUrl(path)} alt={`${method} QR code`} className="mx-auto mt-3 w-full max-w-[220px] rounded-md bg-white p-2" />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[12px] text-white/80">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}
