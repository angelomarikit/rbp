const LOGO = '/assets/rbp/branding/rbp-logo-nav.png'

export function SuccessModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4" role="dialog" aria-modal="true" aria-labelledby="save-success-title">
      <div className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#161616] px-6 py-7 text-center shadow-2xl">
        <img src={LOGO} alt="" className="mx-auto h-16 w-16 object-contain" />
        <h2 id="save-success-title" className="mt-4 text-lg font-semibold text-white">Saved</h2>
        <p className="mt-2 text-sm leading-6 text-[#c8c8c8]">{message}</p>
        <button type="button" className="mt-5 rounded-lg bg-[#FF7900] px-5 py-2 text-sm font-semibold text-black" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}
