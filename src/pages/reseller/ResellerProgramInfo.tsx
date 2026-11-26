import { WHOLESALER_STANDARD_DISCOUNT_PERCENT } from '../../lib/wholesalerDiscount.ts'
import { rbpPanel } from '../../components/ui/panels.ts'

const steps = [
  {
    title: 'Apply',
    body: 'Create an account (or sign in) and submit your business address and contact details. The studio reviews every application.',
  },
  {
    title: 'Get approved',
    body: `Once approved, Romell assigns you a unique checkout code. Customers enter it at checkout for ${WHOLESALER_STANDARD_DISCOUNT_PERCENT}% off the jewelry subtotal (before shipping).`,
  },
  {
    title: 'Share your code',
    body: `Customers enter your code on the store checkout page. They save ${WHOLESALER_STANDARD_DISCOUNT_PERCENT}% on subtotal and the order is attributed to you.`,
  },
  {
    title: 'Track & grow',
    body: 'Use your wholesaler portal to see attributed sales, your own purchases, verified totals, and your place on the studio leaderboard.',
  },
]

const highlights = [
  'A separate wholesaler portal—not the same as a regular customer account',
  'Sales count toward rankings after the studio verifies payment on each order',
  `Approved partners receive ${WHOLESALER_STANDARD_DISCOUNT_PERCENT}% off jewelry subtotal at checkout (standard rate; studio confirms on approval)`,
  'Pending applications can sign in to check status; full portal access unlocks after approval',
]

export function ResellerProgramInfo() {
  return (
    <div className="space-y-8">
      <div className="max-w-xl space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-rbp-cream">Partner program</p>
        <h2 className="font-display text-[2.2rem] leading-[0.95] text-rbp-accent">Sell Romell jewelry with your own code</h2>
        <p className="text-sm leading-relaxed text-white/80">
          The wholesaler program is for partners who want to offer Romell Body Piercing jewelry to their clients or audience.
          You receive a branded discount code; every verified order that uses it is tracked in your dashboard.
        </p>
        <p className={`${rbpPanel} px-4 py-3 text-sm leading-relaxed text-white/85`}>
          <span className="font-semibold text-rbp-accent">{WHOLESALER_STANDARD_DISCOUNT_PERCENT}% wholesaler discount</span>
          {' — '}
          approved partners share a checkout code so clients save {WHOLESALER_STANDARD_DISCOUNT_PERCENT}% on jewelry subtotal
          (shipping is separate).
        </p>
      </div>

      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className={`flex gap-4 p-4 ${rbpPanel}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rbp-accent text-sm font-bold text-black">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className={`p-4 text-sm leading-relaxed text-white/80 ${rbpPanel}`}>
        <span className="block text-[11px] uppercase tracking-[0.16em] text-rbp-accent">Good to know</span>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </p>
    </div>
  )
}