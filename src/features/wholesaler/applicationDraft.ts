const DRAFT_KEY = 'rbp_wholesaler_application_draft_v1'

export type WholesalerApplicationDraft = {
  email: string
  province: string
  city: string
  barangay: string
  postalCode: string
  address: string
  phone: string
}

export function saveWholesalerApplicationDraft(draft: WholesalerApplicationDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* ignore quota errors */
  }
}

export function readWholesalerApplicationDraft(): WholesalerApplicationDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as WholesalerApplicationDraft
  } catch {
    return null
  }
}

export function clearWholesalerApplicationDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}