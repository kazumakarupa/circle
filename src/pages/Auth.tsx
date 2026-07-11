import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Header'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError('ログインに失敗しました: ' + error.message)
    else navigate('/search')
  }

  async function demoLogin() {
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@circle-swap.jp',
      password: 'circle2026',
    })
    setBusy(false)
    if (error) setError('デモログインに失敗しました: ' + error.message)
    else navigate('/search')
  }

  return (
    <AuthShell title="おかえりなさい">
      <form onSubmit={submit} className="space-y-4">
        <Field label="メールアドレス">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="パスワード">
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800 disabled:opacity-50 cursor-pointer">
          ログイン
        </button>
      </form>
      <button onClick={demoLogin} disabled={busy} className="mt-3 w-full py-3 rounded-full border border-brand-700 text-brand-700 font-bold hover:bg-brand-50 disabled:opacity-50 cursor-pointer">
        デモアカウントで試す
      </button>
      <p className="mt-6 text-sm text-center text-stone-500">
        アカウントをお持ちでない方は{' '}
        <Link to="/signup" className="text-brand-700 font-medium hover:underline">無料登録</Link>
      </p>
    </AuthShell>
  )
}

export function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })
    setBusy(false)
    if (error) {
      setError('登録に失敗しました: ' + error.message)
      return
    }
    if (data.session) navigate('/account')
    else setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="確認メールを送信しました">
        <p className="text-stone-600 leading-relaxed">
          {email} 宛に確認メールをお送りしました。メール内のリンクをクリックすると登録が完了し、
          <span className="font-bold text-gp">100GP</span> がプレゼントされます。
        </p>
        <Link to="/login" className="mt-6 block text-center w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800">
          ログイン画面へ
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="circle をはじめよう">
      <p className="text-sm text-stone-500 -mt-4 mb-6">登録するだけで 100GP プレゼント</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="ニックネーム">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="例: かずま" />
        </Field>
        <Field label="メールアドレス">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="パスワード(6文字以上)">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800 disabled:opacity-50 cursor-pointer">
          無料で登録する
        </button>
      </form>
      <p className="mt-6 text-sm text-center text-stone-500">
        すでにアカウントをお持ちの方は{' '}
        <Link to="/login" className="text-brand-700 font-medium hover:underline">ログイン</Link>
      </p>
    </AuthShell>
  )
}

function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-stone-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
        <div className="text-center mb-8">
          <Logo className="text-3xl" />
          <h1 className="mt-3 text-xl font-bold">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputCls =
  'w-full rounded-xl border border-stone-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500'

export { inputCls, Field }
