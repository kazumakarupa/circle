import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Home, LedgerEntry } from '../lib/types'
import { PREFECTURES } from '../lib/constants'

export default function Account() {
  const { session, profile, gpBalance, refreshProfile } = useAuth()
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [myHomes, setMyHomes] = useState<Home[]>([])
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [pref, setPref] = useState('')
  const [city, setCity] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.display_name)
    setBio(profile.bio ?? '')
    setPref(profile.prefecture ?? '')
    setCity(profile.city ?? '')
  }, [profile])

  useEffect(() => {
    if (!session) return
    supabase.from('gp_ledger').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setLedger(data ?? []))
    supabase.from('homes').select('*').eq('owner_id', session.user.id)
      .then(({ data }) => setMyHomes(data ?? []))
  }, [session])

  if (!session) return <div className="py-20 text-center text-stone-500">ログインが必要です。</div>

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaved(false)
    await supabase.from('profiles').update({
      display_name: name, bio, prefecture: pref, city, updated_at: new Date().toISOString(),
    }).eq('id', session!.user.id)
    await refreshProfile()
    setSaved(true)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black">マイページ</h1>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-3 text-center">
          <div className="text-2xl font-black text-gp">{gpBalance} GP</div>
          <div className="text-xs text-stone-500">GuestPoints残高</div>
        </div>
      </div>

      {/* my homes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">わたしの掲載</h2>
          <Link to="/homes/new" className="px-4 py-2 rounded-full bg-brand-700 text-white text-sm font-bold hover:bg-brand-800">
            + 自宅を掲載する
          </Link>
        </div>
        {myHomes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500 text-sm">
            まだ掲載がありません。自宅を掲載して <span className="font-bold text-gp">500GP</span> を受け取りましょう。
          </div>
        ) : (
          <div className="space-y-2">
            {myHomes.map((h) => (
              <div key={h.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 px-4 py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${h.status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-500'}`}>
                  {h.status === 'online' ? '公開中' : '下書き'}
                </span>
                <span className="font-bold text-sm">{h.title || '(無題)'}</span>
                <span className="text-xs text-stone-500">{h.gp_per_night} GP/泊</span>
                <div className="ml-auto flex gap-3 text-sm">
                  <Link to={`/homes/${h.id}`} className="text-stone-500 hover:underline">表示</Link>
                  <Link to={`/homes/${h.id}/edit`} className="text-brand-700 hover:underline">編集</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* profile */}
      <section>
        <h2 className="font-bold text-lg mb-3">プロフィール</h2>
        <form onSubmit={saveProfile} className="rounded-2xl border border-stone-200 p-6 grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-medium text-stone-600">ニックネーム</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inp} />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-600">都道府県</span>
            <select value={pref} onChange={(e) => setPref(e.target.value)} className={inp}>
              <option value="">選択してください</option>
              {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-600">市区町村</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inp} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-stone-600">自己紹介</span>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="家族構成・趣味・旅のスタイルなど" className={inp} />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button className="px-6 py-2.5 rounded-full bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 cursor-pointer">
              保存する
            </button>
            {saved && <span className="text-sm text-emerald-600">保存しました</span>}
          </div>
        </form>
      </section>

      {/* GP ledger */}
      <section>
        <h2 className="font-bold text-lg mb-3">GuestPoints履歴</h2>
        <div className="rounded-2xl border border-stone-200 divide-y divide-stone-100">
          {ledger.length === 0 && <div className="p-6 text-sm text-stone-500">履歴はまだありません。</div>}
          {ledger.map((l) => (
            <div key={l.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className={`font-black w-20 ${l.delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {l.delta >= 0 ? '+' : ''}{l.delta} GP
              </span>
              <span className="text-stone-700">{l.reason}</span>
              <span className="ml-auto text-xs text-stone-400">
                {new Date(l.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const inp =
  'mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'
