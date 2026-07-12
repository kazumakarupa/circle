import { useState } from 'react'
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
  const [open, setOpen] = useState(false)

  async function signOut() {
    setOpen(false)
    await supabase.auth.signOut()
    navigate('/')
  }

  const linkCls = 'px-3 py-2 rounded-full hover:bg-stone-100 whitespace-nowrap'

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="text-2xl shrink-0" onClick={() => setOpen(false)}><Logo /></Link>

        {/* PC nav */}
        <nav className="ml-auto hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium">
          <Link to="/guide" className={linkCls}>しくみ</Link>
          <Link to="/search" className={linkCls}>家をさがす</Link>
          {session ? (
            <>
              <Link to="/messages" className={linkCls}>メッセージ</Link>
              <Link to="/exchanges" className={linkCls}>交換</Link>
              <Link to="/account" className="px-3 py-2 rounded-full bg-amber-50 text-gp font-bold hover:bg-amber-100 whitespace-nowrap">
                {gpBalance} GP
              </Link>
              <Link to="/account" className={linkCls}>{profile?.display_name || 'アカウント'}</Link>
              <button onClick={signOut} className="px-3 py-2 rounded-full text-stone-500 hover:bg-stone-100 cursor-pointer whitespace-nowrap">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkCls}>ログイン</Link>
              <Link to="/signup" className="px-4 py-2 rounded-full bg-brand-700 text-white hover:bg-brand-800 whitespace-nowrap">
                無料ではじめる
              </Link>
            </>
          )}
        </nav>

        {/* SP: GPバッジ + ハンバーガー */}
        <div className="ml-auto flex md:hidden items-center gap-2">
          {session && (
            <Link to="/account" onClick={() => setOpen(false)}
              className="px-3 py-1.5 rounded-full bg-amber-50 text-gp text-sm font-bold whitespace-nowrap">
              {gpBalance} GP
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            aria-label="メニュー"
            className="w-10 h-10 rounded-full hover:bg-stone-100 flex items-center justify-center text-xl cursor-pointer"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* SPメニュー */}
      {open && (
        <nav className="md:hidden border-t border-stone-100 bg-white px-4 py-2 flex flex-col text-sm font-medium">
          <MenuLink to="/guide" onClick={() => setOpen(false)}>しくみ・料金</MenuLink>
          <MenuLink to="/safety" onClick={() => setOpen(false)}>安心への取り組み</MenuLink>
          <MenuLink to="/search" onClick={() => setOpen(false)}>家をさがす</MenuLink>
          {session ? (
            <>
              <MenuLink to="/messages" onClick={() => setOpen(false)}>メッセージ</MenuLink>
              <MenuLink to="/exchanges" onClick={() => setOpen(false)}>交換の管理</MenuLink>
              <MenuLink to="/account" onClick={() => setOpen(false)}>
                マイページ({profile?.display_name || 'アカウント'})
              </MenuLink>
              <button onClick={signOut} className="text-left px-3 py-3 rounded-xl text-stone-500 hover:bg-stone-50 cursor-pointer">
                ログアウト
              </button>
            </>
          ) : (
            <>
              <MenuLink to="/login" onClick={() => setOpen(false)}>ログイン</MenuLink>
              <MenuLink to="/signup" onClick={() => setOpen(false)}>
                <span className="text-brand-700 font-bold">無料ではじめる</span>
              </MenuLink>
            </>
          )}
        </nav>
      )}
    </header>
  )
}

function MenuLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="px-3 py-3 rounded-xl hover:bg-stone-50">
      {children}
    </Link>
  )
}
