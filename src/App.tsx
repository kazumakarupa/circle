import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/Auth'
import Search from './pages/Search'
import HomeDetail from './pages/HomeDetail'
import HomeEdit from './pages/HomeEdit'
import Messages from './pages/Messages'
import Exchanges from './pages/Exchanges'
import Account from './pages/Account'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<Search />} />
          <Route path="/homes/new" element={<HomeEdit />} />
          <Route path="/homes/:id" element={<HomeDetail />} />
          <Route path="/homes/:id/edit" element={<HomeEdit />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
          <Route path="/exchanges" element={<Exchanges />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
