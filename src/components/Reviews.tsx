import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Review } from '../lib/types'

export function Stars({ value, size = 'text-base' }: { value: number; size?: string }) {
  return (
    <span className={`text-amber-500 ${size}`} aria-label={`5点満点中${value}点`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n}>{n <= Math.round(value) ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 text-stone-600">{label}</span>
      <div>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-xl cursor-pointer ${n <= value ? 'text-amber-500' : 'text-stone-300 hover:text-amber-300'}`}
            aria-label={`${n}点`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewForm({ exchangeId, onDone }: { exchangeId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5)
  const [cleanliness, setCleanliness] = useState(5)
  const [communication, setCommunication] = useState(5)
  const [accuracy, setAccuracy] = useState(5)
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.rpc('submit_review', {
      _exchange_id: exchangeId,
      _rating: rating,
      _cleanliness: cleanliness,
      _communication: communication,
      _accuracy: accuracy,
      _body: body.trim(),
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    onDone()
  }

  return (
    <form onSubmit={submit} className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
      <h4 className="font-bold text-sm">レビューを書く</h4>
      <StarInput label="総合評価" value={rating} onChange={setRating} />
      <StarInput label="清潔さ" value={cleanliness} onChange={setCleanliness} />
      <StarInput label="コミュニケーション" value={communication} onChange={setCommunication} />
      <StarInput label="掲載内容との一致" value={accuracy} onChange={setAccuracy} />
      <textarea
        required
        rows={3}
        maxLength={2000}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="滞在の感想・相手の印象など(公開されます)"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
      />
      <p className="text-xs text-stone-400 leading-relaxed">
        レビューは相手には見えない状態で保存され、双方が投稿した時点(または交換終了から40日後)に同時公開されます。投稿後の編集はできません。
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="px-5 py-2 rounded-full bg-brand-700 text-white text-sm font-bold hover:bg-brand-800 disabled:opacity-50 cursor-pointer">
        投稿する
      </button>
    </form>
  )
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border border-stone-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-black">
          {review.reviewer?.display_name?.[0] ?? '?'}
        </div>
        <div>
          <div className="text-sm font-bold">
            {review.reviewer?.display_name}
            <span className="ml-2 text-xs font-normal text-stone-400">
              {review.reviewer_role === 'guest' ? 'ゲストとして滞在' : 'ホストとして受け入れ'}
            </span>
          </div>
          <Stars value={review.rating} size="text-sm" />
        </div>
        <span className="ml-auto text-xs text-stone-400">
          {new Date(review.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })}
        </span>
      </div>
      <p className="mt-3 text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{review.body}</p>
      {(review.cleanliness || review.communication || review.accuracy) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          {review.cleanliness && <span>清潔さ {review.cleanliness}</span>}
          {review.communication && <span>コミュニケーション {review.communication}</span>}
          {review.accuracy && <span>掲載との一致 {review.accuracy}</span>}
        </div>
      )}
      {review.reply && (
        <div className="mt-3 ml-4 border-l-2 border-stone-200 pl-3 text-sm text-stone-600">
          <span className="text-xs font-bold text-stone-400 block">ホストからの返信</span>
          {review.reply}
        </div>
      )}
    </div>
  )
}
