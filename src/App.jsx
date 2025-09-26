import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import HvorLangTidPage from './pages/HvorLangTidPage'
import DodsalderPage from './pages/DodsalderPage'
import LivsstilPage from './pages/LivsstilPage'
import DanmarkPage from './pages/DanmarkPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/hvor-lang-tid-har-jeg-tilbage" element={<HvorLangTidPage />} />
        <Route path="/dodsalder-calculator" element={<DodsalderPage />} />
        <Route path="/livsstil-og-levetid" element={<LivsstilPage />} />
        <Route path="/levetid-beregner-danmark" element={<DanmarkPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App