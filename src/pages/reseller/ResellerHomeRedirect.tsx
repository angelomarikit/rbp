import { Navigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider.tsx'

export function ResellerHomeRedirect() {
  const { reseller } = useAuth()
  return <Navigate to={reseller?.status === 'approved' ? 'dashboard' : 'pending'} replace />
}