import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Conversation, Exchange, Message } from '../lib/types'
import { STATUS_COLOR, STATUS_LABEL, fmtDate, nightsBetween } from '../lib/constants'
import { ReportButton } from '../components/Trust'

export default function Messages() {
  const { conversationId } = useParams()
  const { session, refreshBalance } = useAuth()
  const [convs, setConvs] = useState<Conversation[]>([])
  const [msgs, setMsgs] = useState<Message[]>([])
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [pairBlocked, setPairBlocked] = useState(false)
  const [blockedByMe, setBlockedByMe] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const uid = session?.user.id
  const active = convs.find((c) => c.id === conversationId)
  const otherId = active ? (active.guest_id === uid ? active.host_id : active.guest_id) : null

  const loadConvs = useCallback(async () => {
    if (!uid) return
    const { data } = await supabase
      .from('conversations')
      .select('*, home:homes(*), guest:profiles!conversations_guest_id_fkey(*), host:profiles!conversations_host_id_fkey(*)')
      .order('created_at', { ascending: false })
    setConvs((data as Conversation[]) ?? [])
  }, [uid])

  const loadThread = useCallback(async () => {
    if (!conversationId) return
    const [{ data: m }, { data: ex }] = await Promise.all([
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at'),
      supabase.from('exchanges').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }),
    ])
    setMsgs(m ?? [])
    setExchanges((ex as Exchange[]) ?? [])
  }, [conversationId])

  const loadBlockState = useCallback(async () => {
    if (!uid || !otherId) { setPairBlocked(false); setBlockedByMe(false); return }
    const [{ data: pair }, { data: mine }] = await Promise.all([
      supabase.rpc('is_blocked_pair', { _a: uid, _b: otherId }),
      supabase.from('blocks').select('blocked_id').eq('blocker_id', uid).eq('blocked_id', otherId).maybeSingle(),
    ])
    setPairBlocked(!!pair)
    setBlockedByMe(!!mine)
  }, [uid, otherId])

  useEffect(() => { loadConvs() }, [loadConvs])
  useEffect(() => { loadThread() }, [loadThread])
  useEffect(() => { loadBlockState() }, [loadBlockState])
  useEffect(() => { bottomRef.current?.scrollIntoView() }, [msgs.length])

  if (!session) return <div className="py-20 text-center text-stone-500">ログインが必要です。</div>

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !conversationId || !uid) return
    const { error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: uid, body: body.trim() })
    if (!error) { setBody(''); loadThread() }
  }

  async function doAction(fn: 'pre_approve_exchange' | 'finalize_exchange' | 'cancel_exchange', exId: string) {
    setError('')
    const { error } = await supabase.rpc(fn, { _exchange_id: exId })
    if (error) setError(error.message)
    await loadThread()
    refreshBalance()
  }

  async function toggleBlock() {
    if (!uid || !otherId) return
    if (blockedByMe) {
      await supabase.from('blocks').delete().eq('blocker_id', uid).eq('blocked_id', otherId)
    } else {
      if (!confirm('このユーザーをブロックしますか?ブロック中は新しいメッセージや交換リクエストのやり取りができなくなります。')) return
      await supabase.from('blocks').insert({ blocker_id: uid, blocked_id: otherId })
    }
    loadBlockState()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[320px_1fr] gap-6 min-h-[70vh]">
      {/* conversation list */}
      <aside className={`${conversationId ? 'hidden lg:block' : ''}`}>
        <h1 className="font-black text-xl mb-4">メッセージ</h1>
        <div className="space-y-2">
          {convs.length === 0 && (
            <p className="text-sm text-stone-500">
              まだメッセージはありません。<Link to="/search" className="text-brand-700 hover:underline">家をさがして</Link>リクエストを送ってみましょう。
            </p>
          )}
          {convs.map((c) => {
            const other = c.guest_id === uid ? c.host : c.guest
            return (
              <Link
                key={c.id}
                to={`/messages/${c.id}`}
                className={`block rounded-xl border px-4 py-3 hover:bg-stone-50 ${c.id === conversationId ? 'border-brand-500 bg-brand-50' : 'border-stone-200'}`}
              >
                <div className="font-bold text-sm">{other?.display_name}</div>
                <div className="text-xs text-stone-500 truncate">{c.home?.title}</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  {c.guest_id === uid ? 'あなたがゲスト' : 'あなたがホスト'}
                </div>
              </Link>
            )
          })}
        </div>
      </aside>

      {/* thread */}
      <section className="flex flex-col rounded-2xl border border-stone-200 overflow-hidden">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm p-10">
            左のリストから会話を選択してください
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center gap-3">
              <div>
                <div className="font-bold text-sm">{(active.guest_id === uid ? active.host : active.guest)?.display_name}</div>
                <Link to={`/homes/${active.home_id}`} className="text-xs text-brand-700 hover:underline">{active.home?.title}</Link>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <ReportButton targetUserId={otherId ?? undefined} homeId={active.home_id} />
                <button onClick={toggleBlock} className="text-xs text-stone-400 hover:text-red-600 hover:underline cursor-pointer">
                  {blockedByMe ? '🚫 ブロック解除' : '🚫 ブロック'}
                </button>
              </div>
            </div>

            {pairBlocked && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
                {blockedByMe
                  ? 'このユーザーをブロック中です。新しいメッセージや交換リクエストは送れません。'
                  : 'この相手とは現在やり取りできません。'}
              </div>
            )}

            {/* exchange panel */}
            {exchanges.length > 0 && (
              <div className="px-5 py-3 border-b border-stone-200 space-y-2 bg-white">
                {exchanges.map((ex) => {
                  const isHost = ex.host_id === uid
                  const isGuest = ex.guest_id === uid
                  const nights = nightsBetween(ex.start_date, ex.end_date)
                  return (
                    <div key={ex.id} className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLOR[ex.status]}`}>
                          {STATUS_LABEL[ex.status]}
                        </span>
                        <span className="font-bold">{fmtDate(ex.start_date)} 〜 {fmtDate(ex.end_date)}</span>
                        <span className="text-stone-500">{nights}泊・{ex.guests_count}名</span>
                        <span className="text-stone-500">
                          {ex.exchange_type === 'gp' ? `${ex.gp_amount} GP` : '相互交換'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ex.status === 'requested' && isHost && (
                          <ActionBtn onClick={() => doAction('pre_approve_exchange', ex.id)} primary>事前承認する</ActionBtn>
                        )}
                        {ex.status === 'requested' && isGuest && (
                          <span className="text-xs text-stone-500 py-1.5">ホストの事前承認を待っています…</span>
                        )}
                        {ex.status === 'pre_approved' && isGuest && (
                          <ActionBtn onClick={() => doAction('finalize_exchange', ex.id)} primary>
                            最終確定する{ex.exchange_type === 'gp' ? `(${ex.gp_amount} GPを支払う)` : ''}
                          </ActionBtn>
                        )}
                        {ex.status === 'pre_approved' && isHost && (
                          <span className="text-xs text-stone-500 py-1.5">ゲストの最終確定を待っています…</span>
                        )}
                        {ex.status === 'finalized' && (
                          <span className="text-xs text-emerald-700 py-1.5 font-medium">交換が確定しました🎉 詳細を調整しましょう</span>
                        )}
                        {['requested', 'pre_approved', 'finalized'].includes(ex.status) && (
                          <ActionBtn onClick={() => doAction('cancel_exchange', ex.id)}>キャンセル</ActionBtn>
                        )}
                      </div>
                    </div>
                  )
                })}
                {error && <p className="text-xs text-red-600">{error}</p>}
              </div>
            )}

            {/* messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-white min-h-64 max-h-[50vh]">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    m.sender_id === uid ? 'bg-brand-700 text-white rounded-br-sm' : 'bg-stone-100 rounded-bl-sm'
                  }`}>
                    {m.body}
                    <div className={`text-[10px] mt-1 ${m.sender_id === uid ? 'text-white/60' : 'text-stone-400'}`}>
                      {new Date(m.created_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {pairBlocked ? (
              <div className="p-4 border-t border-stone-200 text-center text-sm text-stone-400 bg-stone-50">
                ブロック中のためメッセージを送信できません
              </div>
            ) : (
              <form onSubmit={send} className="p-3 border-t border-stone-200 flex gap-2 bg-white">
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="メッセージを入力…"
                  className="flex-1 rounded-full border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button className="px-5 py-2.5 rounded-full bg-brand-700 text-white font-bold text-sm hover:bg-brand-800 cursor-pointer">
                  送信
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function ActionBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
        primary ? 'bg-brand-700 text-white hover:bg-brand-800' : 'border border-stone-300 text-stone-600 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  )
}
