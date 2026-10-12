import { Navigate, Route, Routes } from 'react-router-dom'
import { Admin } from './pages/Admin'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'
import { SinConfigurar } from './pages/SinConfigurar'
import { supabaseConfigurado } from './lib/supabase'

function App() {
  if (!supabaseConfigurado) return <SinConfigurar />

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/login/admin" element={<Admin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App