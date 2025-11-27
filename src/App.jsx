import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { TokenRefreshManager } from './components/TokenRefreshManager'
import Login from './pages/Login'
import Home from './pages/Home'
import MyPage from './pages/sayfam/MyPage'
import './App.css'

function App() {
  return (
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
