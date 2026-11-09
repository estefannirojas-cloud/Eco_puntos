import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireRole } from './auth/RequireRole'
import { ScrollToTop } from './components/ScrollToTop'
import { AdminPanel } from './pages/admin/AdminPanel'
import { ClientPanel } from './pages/cliente/ClientPanel'
import { CompleteProfile } from './pages/CompleteProfile'
import { ManagerPanel } from './pages/gestor/ManagerPanel'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Register } from './pages/Register'
import { VerifyLink } from './pages/VerifyLink'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ingresar" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/verificar" element={<VerifyLink />} />
          <Route path="/completar-perfil" element={<CompleteProfile />} />
          <Route path="/cliente/*" element={<RequireRole role="cliente"><ClientPanel /></RequireRole>} />
          <Route path="/gestor/*" element={<RequireRole role="gestor"><ManagerPanel /></RequireRole>} />
          <Route path="/admin/*" element={<RequireRole role="admin"><AdminPanel /></RequireRole>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
