import { BrowserRouter, Route, Routes } from 'react-router'
import { ScrollToTop } from './components/ScrollToTop'
import { AdminPanel } from './pages/admin/AdminPanel'
import { ClientPanel } from './pages/cliente/ClientPanel'
import { ManagerPanel } from './pages/gestor/ManagerPanel'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { NotFound } from './pages/NotFound'
import { Register } from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/ingresar" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/cliente/*" element={<ClientPanel />} />
        <Route path="/gestor/*" element={<ManagerPanel />} />
        <Route path="/admin/*" element={<AdminPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
