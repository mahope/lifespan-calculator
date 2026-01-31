import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'

// Lazy load pages for better initial load time
const HomePage = lazy(() => import('./pages/HomePage'))
const HvorLangTidPage = lazy(() => import('./pages/HvorLangTidPage'))
const DodsalderPage = lazy(() => import('./pages/DodsalderPage'))
const LivsstilPage = lazy(() => import('./pages/LivsstilPage'))
const DanmarkPage = lazy(() => import('./pages/DanmarkPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hvor-lang-tid-har-jeg-tilbage" element={<HvorLangTidPage />} />
          <Route path="/dodsalder-calculator" element={<DodsalderPage />} />
          <Route path="/livsstil-og-levetid" element={<LivsstilPage />} />
          <Route path="/levetid-beregner-danmark" element={<DanmarkPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
