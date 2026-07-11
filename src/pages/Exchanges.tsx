import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Exchange, Review } from '../lib/types'
import { STATUS_COLOR, STATUS_LABEL, fmtDate, nightsBetween } from '../lib/constants'
import { ReviewForm, Stars } from '../components/Reviews'

export default function Exchanges() {
  const { session } = useAuth()
  const [list, setList] = useState<Exchange[]>([])
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    const [{ data: ex }, { data: rv }] = await Promise.all([
      supabase
        .from('exchanges')
        .select('*, home:homes(*), guest:profiles!exchanges_guest_id_fkey(*), host:profiles!exchanges_host_id_fkey(*)')
        .order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('reviewer_id', session.user.id),
    ])
    setList((ex as Exchange[]) ?? [])
    setMyReviews((rv as Review[]) ?? [])
    setLoading(false)
  }, [session])

  useEffect(() => { load() }, [load])

  if (!session) return <div className="py-20 text-center text-stone-500">ログインが必要です。</div>

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black">交換の管理</h1>
      <div className="mt-6 space-y-3">
        {loading && <p className="text-stone-400">読み込み中…</p>}
        {!loading && list.length === 0 && (
          <p className="text-stone-500">
            まだ交換はありません。<Link to="/search" className="text-brand-700 hover:underline">家をさがして</Link>リクエストを送ってみましょう。
          </p>
        )}
        {list.map((ex) => {
          const isGuest = ex.guest_id === session.user.id
          const other = isGuest ? ex.host : ex.guest
          const stayEnded = ex.end_date <= today
          const reviewable = (ex.status === 'completed' || (ex.status === 'finalized' && stayEnded))
          const myReview = myReviews.find((r) => r.exchange_id === ex.id)
          return (
            <div key={ex.id} className="rounded-2xl border border-stone-200 p-5 bg-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[ex.status]}`}>
                  {STATUS_LABEL[ex.status]}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {isGuest ? 'ゲストとして滞在' : 'ホストとして受け入れ'}
                </span>
              </div>
              <Link to={`/messages/${ex.conversation_id}`} className="mt-2 block font-bold hover:text-brand-700">
                {ex.home?.title}
              </Link>
              <div className="mt-1 text-sm text-stone-500">
                {fmtDate(ex.start_date)} 〜 {fmtDate(ex.end_date)}({nightsBetween(ex.start_date, ex.end_date)}泊・{ex.guests_count}名)
                ・相手: {other?.display_name}
                ・{ex.exchange_type === 'gp' ? `${ex.gp_amount} GP` : '相互交換'}
              </div>

              {reviewable && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  {myReview ? (
                    <div className="flex items-center gap-2 text-sm text-stone-600">
                      <span>あなたのレビュー:</span>
                      <Stars value={myReview.rating} size="text-sm" />
                      <span className="text-xs text-stone-400">
                        (双方の投稿、または交換終了40日後に公開されます)
                      </span>
                    </div>
                  ) : openForm === ex.id ? (
                    <ReviewForm exchangeId={ex.id} onDone={() => { setOpenForm(null); load() }} />
                  ) : (
                    <button
                      onClick={() => setOpenForm(ex.id)}
                      className="px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 cursor-pointer"
                    >
                      ★ レビューを書く
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
