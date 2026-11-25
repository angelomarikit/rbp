import { Navigate, useLocation } from 'react-router-dom'

/** Keep old /reseller and /admin/reseller* URLs working after rebrand to wholesaler. */
export function LegacyWholesalerRedirect() {
  const { pathname, search, hash } = useLocation()
  const next = pathname
    .replace(/^\/reseller\b/, '/wholesaler')
    .replace(/^\/admin\/resellers\b/, '/admin/wholesalers')
    .replace(/^\/admin\/reseller-ranking\b/, '/admin/wholesaler-ranking')
  return <Navigate to={`${next}${search}${hash}`} replace />
}