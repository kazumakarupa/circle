import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

export function VerifiedBadges({ profile, className = '' }: { profile: Profile | null; className?: string }) {
  if (!profile) return null
  return (
    <ul className={`space-y-1 text-sm ${className}`}>
      <li className="flex items-center gap-1.5 text-emerald-700">
        <BadgeCheck /> メールアドレス認証済み
      </li>
      {profile.phone_verified ? (
        <li className="flex items-center gap-1.5 text-emerald-700">
          <BadgeCheck /> 電話番号認証済み
        </li>
      ) : (
        <li className="flex items-center gap-1.5 text-stone-400">
          <span className="inline-block w-4 text-center">–</span> 電話番号は未認証
        </li>
      )}
    </ul>
  )
}

function BadgeCheck() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12 2l2.4 2.4 3.3-.5.5 3.3L21 12l-2.8 1.8-.5 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.5-3.3L3 12l2.8-1.8.5-3.3 3.3.5L12 2zm-1.2 13.2l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z" />
    </svg>
  )
}

const CATEGORIES: [string, string][] = [
  ['inappropriate_listing', '掲載内容が不適切・虚偽'],
  ['scam', '詐欺・金銭要求の疑い'],
  ['harassment', '迷惑行為・ハラスメント'],
  ['other', 'その他'],
]

export function ReportButton({
  targetUserId,
  homeId,
  label = '⚑ 通報する',
}: {
  targetUserId?: string
  homeId?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('inappropriate_listing')
  const [body, setBody] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    const { data: s } = await supabase.auth.getSession()
    if (!s.session) { setState('error'); return }
    const { error } = await supabase.from('reports').insert({
      reporter_id: s.session.user.id,
      target_user_id: targetUserId ?? null,
      home_id: homeId ?? null,
      category,
      body: body.trim(),
    })
    setState(error ? 'error' : 'done')
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-stone-400 hover:text-red-600 hover:underline cursor-pointer">
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            {state === 'done' ? (
              <>
                <h3 className="font-bold text-lg">通報を受け付けました</h3>
                <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                  ご報告ありがとうございます。運営が内容を確認し、必要な対応を行います。
                </p>
                <button onClick={() => setOpen(false)} className="mt-4 px-5 py-2 rounded-full bg-stone-800 text-white text-sm font-bold cursor-pointer">
                  閉じる
                </button>
              </>
            ) : (
              <form onSubmit={submit}>
                <h3 className="font-bold text-lg">通報する</h3>
                <p className="mt-1 text-xs text-stone-500">通報内容は運営のみが確認します。相手には通知されません。</p>
                <div className="mt-4 space-y-1.5">
                  {CATEGORIES.map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="report-cat" checked={category === v} onChange={() => setCategory(v)} />
                      {l}
                    </label>
                  ))}
                </div>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="状況をできるだけ具体的に(任意)"
                  className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
                {state === 'error' && <p className="mt-2 text-sm text-red-600">送信に失敗しました。ログイン状態を確認してください。</p>}
                <div className="mt-4 flex gap-2 justify-end">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-full border border-stone-300 text-sm cursor-pointer">
                    キャンセル
                  </button>
                  <button disabled={state === 'busy'} className="px-5 py-2 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                    通報を送信
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
