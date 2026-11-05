import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { lazyWithReload } from './utils/lazyWithReload'
import HomePage from './pages/HomePage'

// HomePage is the main landing route and is bundled eagerly; the rest are lazy.
const HvorLangTidPage = lazyWithReload(() => import('./pages/HvorLangTidPage'))
const DodsalderPage = lazyWithReload(() => import('./pages/DodsalderPage'))
const LivsstilPage = lazyWithReload(() => import('./pages/LivsstilPage'))
const DanmarkPage = lazyWithReload(() => import('./pages/DanmarkPage'))
const PensionsalderPage = lazyWithReload(() => import('./pages/PensionsalderPage'))
const NotFoundPage = lazyWithReload(() => import('./pages/NotFoundPage'))

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Indlæser...</p>
    </div>
  </div>
)

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/hvor-lang-tid-har-jeg-tilbage" element={<HvorLangTidPage />} />
            <Route path="/dodsalder-calculator" element={<DodsalderPage />} />
            <Route path="/livsstil-og-levetid" element={<LivsstilPage />} />
            <Route path="/levetid-beregner-danmark" element={<DanmarkPage />} />
            <Route path="/pensionsalder" element={<PensionsalderPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

export default App
