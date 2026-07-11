import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-logo font-black tracking-tight text-brand-700 ${className}`}>
      <svg viewBox="0 0 100 100" className="inline-block w-[1.1em] h-[1.1em] mr-1 -mt-1" aria-hidden>
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="14" />
      </svg>
      circle
    </span>
  )
}

export default function Header() {
  const { session, profile, gpBalance } = useAuth()
  const navigate = useNavigate()

  async function signOut() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link to="/" className="text-2xl shrink-0"><Logo /></Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <Link to="/search" className="px-3 py-2 rounded-full hover:bg-stone-100">家をさがす</Link>
          {session ? (
            <>
              <Link to="/messages" className="px-3 py-2 rounded-full hover:bg-stone-100">メッセージ</Link>
              <Link to="/exchanges" className="hidden sm:block px-3 py-2 rounded-full hover:bg-stone-100">交換</Link>
              <Link to="/account" className="px-3 py-2 rounded-full bg-amber-50 text-gp font-bold hover:bg-amber-100">
                {gpBalance} GP
              </Link>
              <Link to="/account" className="px-3 py-2 rounded-full hover:bg-stone-100">
                {profile?.display_name || 'アカウント'}
              </Link>
              <button onClick={signOut} className="px-3 py-2 rounded-full text-stone-500 hover:bg-stone-100 cursor-pointer">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 rounded-full hover:bg-stone-100">ログイン</Link>
              <Link to="/signup" className="px-4 py-2 rounded-full bg-brand-700 text-white hover:bg-brand-800">
                無料ではじめる
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
