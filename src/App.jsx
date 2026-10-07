import { Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Navbar from './components/Navbar'
import PasscodeGate from './components/PasscodeGate'
import HomePage from './views/HomePage'
import UploadPage from './views/UploadPage'
import ResultPage from './views/ResultPage'
import GalleryPage from './views/GalleryPage'

export default function App() {
  return (
    <PasscodeGate>
      <AppProvider>
        <div className="min-h-screen bg-warm-50">
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </PasscodeGate>
  )
}
