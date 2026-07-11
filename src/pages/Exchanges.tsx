import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Exchange } from '../lib/types'
import { STATUS_COLOR, STATUS_LABEL, fmtDate, nightsBetween } from '../lib/constants'

export default function Exchanges() {
  const { session } = useAuth()
  const [list, setList] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    supabase
      .from('exchanges')
      .select('*, home:homes(*), guest:profiles!exchanges_guest_id_fkey(*), host:profiles!exchanges_host_id_fkey(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setList((data as Exchange[]) ?? [])
        setLoading(false)
      })
  }, [session])

  if (!session) return <div className="py-20 text-center text-stone-500">ログインが必要です。</div>

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
          return (
            <Link
              key={ex.id}
              to={`/messages/${ex.conversation_id}`}
              className="block rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[ex.status]}`}>
                  {STATUS_LABEL[ex.status]}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {isGuest ? 'ゲストとして滞在' : 'ホストとして受け入れ'}
                </span>
              </div>
              <div className="mt-2 font-bold">{ex.home?.title}</div>
              <div className="mt-1 text-sm text-stone-500">
                {fmtDate(ex.start_date)} 〜 {fmtDate(ex.end_date)}({nightsBetween(ex.start_date, ex.end_date)}泊・{ex.guests_count}名)
                ・相手: {other?.display_name}
                ・{ex.exchange_type === 'gp' ? `${ex.gp_amount} GP` : '相互交換'}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
