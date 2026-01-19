import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthGuard } from './components/AuthGuard'
import { TokenRefreshManager } from './components/TokenRefreshManager'
import { ToastProvider } from './components/Toast'
import Login from './pages/Login'
import Home from './pages/Home'
import MyPage from './pages/sayfam/MyPage'
import TestPage from './pages/testpage/TestPage'
import botManager from './services/botManager'
import './App.css'

function App() {
  // Bot Manager'ı uygulama açılırken başlat
  useEffect(() => {
    botManager.initialize()
  }, [])

  return (
    <ToastProvider>
      <Router>
        {/* Otomatik token yenileme arka planda çalışır */}
        <TokenRefreshManager />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          }
        />
        <Route
          path="/mypage"
          element={
            <AuthGuard>
              <MyPage />
            </AuthGuard>
          }
        />
        <Route
          path="/testpage"
          element={
            <AuthGuard>
              <TestPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
