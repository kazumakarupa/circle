import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Availability, Home, Profile, Review } from '../lib/types'
import { EXCHANGE_TYPE_LABEL, fmtDate, nightsBetween } from '../lib/constants'
import { ReviewCard, Stars } from '../components/Reviews'

export default function HomeDetail() {
  const { id } = useParams()
  const { session, gpBalance } = useAuth()
  const navigate = useNavigate()
  const [home, setHome] = useState<Home | null>(null)
  const [owner, setOwner] = useState<Profile | null>(null)
  const [avails, setAvails] = useState<Availability[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [notFound, setNotFound] = useState(false)

  // request form
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guests, setGuests] = useState(2)
  const [exType, setExType] = useState<'gp' | 'reciprocal'>('gp')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('homes').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { setNotFound(true); return }
      setHome(data)
      supabase.from('profiles').select('*').eq('id', data.owner_id).single().then(({ data: p }) => setOwner(p))
    })
    supabase.from('availabilities').select('*').eq('home_id', id).order('start_date').then(({ data }) => setAvails(data ?? []))
    supabase
      .from('reviews')
      .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
      .eq('home_id', id)
      .eq('reviewer_role', 'guest')
      .order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data as Review[]) ?? []))
  }, [id])

  if (notFound) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-500">このおうちは見つかりませんでした。</div>
  if (!home) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-stone-400">読み込み中…</div>

  const isOwner = session?.user.id === home.owner_id
  const nights = startDate && endDate ? nightsBetween(startDate, endDate) : 0
  const totalGp = nights * home.gp_per_night

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !home) return
    if (nights <= 0) { setError('日程を正しく選択してください'); return }
    setBusy(true)
    setError('')
    try {
      // 会話を取得または作成
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('home_id', home.id)
        .eq('guest_id', session.user.id)
        .maybeSingle()
      let convId = existing?.id
      if (!convId) {
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({ home_id: home.id, guest_id: session.user.id, host_id: home.owner_id })
          .select('id')
          .single()
        if (convErr) throw convErr
        convId = conv.id
      }
      // 交換リクエスト
      const { error: exErr } = await supabase.from('exchanges').insert({
        conversation_id: convId,
        home_id: home.id,
        host_id: home.owner_id,
        guest_id: session.user.id,
        start_date: startDate,
        end_date: endDate,
        guests_count: guests,
        exchange_type: exType,
        gp_amount: exType === 'gp' ? totalGp : 0,
      })
      if (exErr) throw exErr
      // メッセージ
      const body =
        msg.trim() ||
        `はじめまして!${fmtDate(startDate)}〜${fmtDate(endDate)}(${nights}泊・${guests}名)で滞在を希望しています。よろしくお願いします。`
      await supabase.from('messages').insert({ conversation_id: convId, sender_id: session.user.id, body })
      navigate(`/messages/${convId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'リクエストの送信に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-sm text-stone-500">
        {home.prefecture} › {home.city}
      </div>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-black leading-snug max-w-3xl">{home.title}</h1>
        <div className="text-right">
          <div className="text-2xl font-black text-gp">{home.gp_per_night}</div>
          <div className="text-xs text-stone-500">GP/泊</div>
        </div>
      </div>

      {/* photos */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-3xl overflow-hidden">
        {home.photos.slice(0, 3).map((p, i) => (
          <div key={i} className={`bg-stone-100 ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}>
            <img src={p} alt="" className="w-full h-full object-cover aspect-[4/3]" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          {/* facts */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-700 border-b border-stone-200 pb-6">
            <span>{home.property_type === 'house' ? '一戸建て' : 'マンション・アパート'}</span>
            <span>{home.accommodation_type === 'entire' ? 'まるごと一軒' : '個室'}</span>
            <span>{home.residence_type === 'primary' ? '主たる住まい' : 'セカンドハウス'}</span>
            <span>{home.max_guests}名まで</span>
            <span>寝室{home.bedrooms}</span>
            <span>ベッド{home.beds}</span>
            <span>バス{home.bathrooms}</span>
            {home.size_m2 && <span>{home.size_m2}m²</span>}
          </div>

          <Section title="この家について">
            <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{home.description}</p>
          </Section>

          {home.neighborhood && (
            <Section title="周辺エリア">
              <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{home.neighborhood}</p>
            </Section>
          )}

          <Section title="設備・アメニティ">
            <div className="flex flex-wrap gap-2">
              {home.amenities.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-800 text-sm">{a}</span>
              ))}
            </div>
          </Section>

          <Section title="ハウスルール">
            <ul className="text-sm text-stone-700 space-y-1">
              <li>{home.children_welcome ? '✅ 子ども歓迎' : '❌ 子どもの滞在不可'}</li>
              <li>{home.pets_welcome ? '✅ ペット歓迎' : '❌ ペット不可'}</li>
              <li>{home.smoking_allowed ? '✅ 喫煙可' : '❌ 禁煙'}</li>
              {home.rules_note && <li className="whitespace-pre-wrap pt-1">{home.rules_note}</li>}
            </ul>
          </Section>

          <Section title={`レビュー${reviews.length > 0 ? `(${reviews.length}件)` : ''}`}>
            {reviews.length === 0 ? (
              <p className="text-sm text-stone-500">まだレビューはありません。</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Stars value={reviews.reduce((s, r) => s + r.rating, 0) / reviews.length} />
                  <span className="font-bold">
                    {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-sm text-stone-500">/ 5.0(ゲストからの評価)</span>
                </div>
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </>
            )}
          </Section>

          <Section title="泊まれる日程">
            {avails.length === 0 && <p className="text-sm text-stone-500">現在、公開されている日程はありません。</p>}
            <div className="space-y-2">
              {avails.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 text-sm">
                  <span className="font-bold">{fmtDate(a.start_date)} 〜 {fmtDate(a.end_date)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    a.exchange_type === 'any' ? 'bg-emerald-100 text-emerald-800'
                    : a.exchange_type === 'reciprocal' ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-sky-800'
                  }`}>
                    {EXCHANGE_TYPE_LABEL[a.exchange_type]}
                  </span>
                  <span className="text-stone-500">最低{a.min_nights}泊</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-black text-lg">
                {owner?.display_name?.[0] ?? '?'}
              </div>
              <div>
                <div className="font-bold">{owner?.display_name}</div>
                <div className="text-xs text-stone-500">{owner?.prefecture} {owner?.city}</div>
              </div>
            </div>
            {owner?.bio && <p className="mt-3 text-sm text-stone-600 leading-relaxed">{owner.bio}</p>}
          </div>

          {isOwner ? (
            <Link to={`/homes/${home.id}/edit`} className="block text-center w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800">
              この掲載を編集する
            </Link>
          ) : session ? (
            <form onSubmit={sendRequest} className="rounded-2xl border border-stone-200 p-5 space-y-3">
              <h3 className="font-bold">交換をリクエストする</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-stone-500">
                  チェックイン
                  <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2 text-sm text-ink" />
                </label>
                <label className="text-xs text-stone-500">
                  チェックアウト
                  <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2 text-sm text-ink" />
                </label>
              </div>
              <label className="block text-xs text-stone-500">
                人数
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2 text-sm text-ink bg-white">
                  {Array.from({ length: home.max_guests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}名</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2">
                <TypeBtn active={exType === 'gp'} onClick={() => setExType('gp')} label="GPで泊まる" />
                <TypeBtn active={exType === 'reciprocal'} onClick={() => setExType('reciprocal')} label="相互交換" />
              </div>
              <textarea
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="ホストへのメッセージ(自己紹介・旅の目的など)"
                rows={3}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
              {exType === 'gp' && nights > 0 && (
                <div className="text-sm rounded-lg bg-amber-50 px-3 py-2">
                  {home.gp_per_night} GP × {nights}泊 = <span className="font-black text-gp">{totalGp} GP</span>
                  <div className="text-xs text-stone-500 mt-0.5">あなたの残高: {gpBalance} GP</div>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button disabled={busy} className="w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800 disabled:opacity-50 cursor-pointer">
                リクエストを送る
              </button>
              <p className="text-xs text-stone-400 leading-relaxed">
                リクエスト送信後、ホストが事前承認するとあなたが最終確定できます。GPは確定時にはじめて移動します。
              </p>
            </form>
          ) : (
            <Link to="/login" className="block text-center w-full py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800">
              ログインしてリクエスト
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-b border-stone-200">
      <h2 className="font-bold text-lg mb-3">{title}</h2>
      {children}
    </section>
  )
}

function TypeBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-full text-sm font-medium border cursor-pointer ${
        active ? 'bg-brand-700 text-white border-brand-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'
      }`}
    >
      {label}
    </button>
  )
}
