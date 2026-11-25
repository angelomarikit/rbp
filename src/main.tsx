import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.tsx'
import { SeoProvider } from './components/Seo.tsx'
import { SiteFont } from './components/SiteFont.tsx'
import { AuthProvider } from './features/auth/AuthProvider.tsx'
import { SiteBrandingProvider } from './features/site/SiteBrandingProvider.tsx'
import { CartProvider } from './features/cart/CartProvider.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SeoProvider>
        <SiteFont />
        <AuthProvider>
          <SiteBrandingProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </SiteBrandingProvider>
        </AuthProvider>
      </SeoProvider>
    </BrowserRouter>
  </StrictMode>,
)