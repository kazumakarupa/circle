import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Home } from '../lib/types'
import HomeCard from '../components/HomeCard'
import { PREFECTURES } from '../lib/constants'

type Filters = {
  q: string
  prefecture: string
  propertyType: '' | 'house' | 'apartment'
  accommodationType: '' | 'entire' | 'private_room'
  residenceType: '' | 'primary' | 'secondary'
  minBedrooms: number
  maxGp: number
  petsWelcome: boolean
  childrenWelcome: boolean
}

const initial: Filters = {
  q: '',
  prefecture: '',
  propertyType: '',
  accommodationType: '',
  residenceType: '',
  minBedrooms: 0,
  maxGp: 300,
  petsWelcome: false,
  childrenWelcome: false,
}

export default function Search() {
  const [homes, setHomes] = useState<Home[]>([])
  const [loading, setLoading] = useState(true)
  const [f, setF] = useState<Filters>(initial)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    supabase
      .from('homes')
      .select('*')
      .eq('status', 'online')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setHomes(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = useMemo(() => {
    return homes.filter((h) => {
      if (f.q && ![h.title, h.description, h.city, h.prefecture].some((s) => s?.includes(f.q))) return false
      if (f.prefecture && h.prefecture !== f.prefecture) return false
      if (f.propertyType && h.property_type !== f.propertyType) return false
      if (f.accommodationType && h.accommodation_type !== f.accommodationType) return false
      if (f.residenceType && h.residence_type !== f.residenceType) return false
      if (h.bedrooms < f.minBedrooms) return false
      if (h.gp_per_night > f.maxGp) return false
      if (f.petsWelcome && !h.pets_welcome) return false
      if (f.childrenWelcome && !h.children_welcome) return false
      return true
    })
  }, [homes, f])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
          placeholder="キーワード(地名・タイトル)"
          className="flex-1 min-w-52 rounded-full border border-stone-300 px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <select
          value={f.prefecture}
          onChange={(e) => setF({ ...f, prefecture: e.target.value })}
          className="rounded-full border border-stone-300 px-4 py-2.5 bg-white"
        >
          <option value="">都道府県: すべて</option>
          {PREFECTURES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="rounded-full border border-stone-300 px-4 py-2.5 font-medium hover:bg-stone-50 cursor-pointer"
        >
          絞り込み {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
          <div>
            <div className="font-bold mb-2">住宅タイプ</div>
            {[
              ['', 'すべて'],
              ['house', '一戸建て'],
              ['apartment', 'マンション・アパート'],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 py-0.5">
                <input type="radio" name="pt" checked={f.propertyType === v} onChange={() => setF({ ...f, propertyType: v as Filters['propertyType'] })} />
                {l}
              </label>
            ))}
          </div>
          <div>
            <div className="font-bold mb-2">貸し方</div>
            {[
              ['', 'すべて'],
              ['entire', 'まるごと一軒'],
              ['private_room', '個室'],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 py-0.5">
                <input type="radio" name="at" checked={f.accommodationType === v} onChange={() => setF({ ...f, accommodationType: v as Filters['accommodationType'] })} />
                {l}
              </label>
            ))}
          </div>
          <div>
            <div className="font-bold mb-2">住居区分</div>
            {[
              ['', 'すべて'],
              ['primary', '主たる住まい'],
              ['secondary', 'セカンドハウス・別荘'],
            ].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 py-0.5">
                <input type="radio" name="rt" checked={f.residenceType === v} onChange={() => setF({ ...f, residenceType: v as Filters['residenceType'] })} />
                {l}
              </label>
            ))}
          </div>
          <div>
            <div className="font-bold mb-2">寝室数(以上)</div>
            <select value={f.minBedrooms} onChange={(e) => setF({ ...f, minBedrooms: Number(e.target.value) })} className="rounded-lg border border-stone-300 px-3 py-2 bg-white w-full">
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n === 0 ? '指定なし' : `${n}室以上`}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-bold mb-2">GP/泊(上限): {f.maxGp} GP</div>
            <input type="range" min={50} max={300} step={10} value={f.maxGp} onChange={(e) => setF({ ...f, maxGp: Number(e.target.value) })} className="w-full accent-brand-700" />
          </div>
          <div>
            <div className="font-bold mb-2">条件</div>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={f.petsWelcome} onChange={(e) => setF({ ...f, petsWelcome: e.target.checked })} />
              ペット歓迎
            </label>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={f.childrenWelcome} onChange={(e) => setF({ ...f, childrenWelcome: e.target.checked })} />
              子ども歓迎
            </label>
            <button onClick={() => setF(initial)} className="mt-2 text-brand-700 hover:underline cursor-pointer">
              条件をリセット
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-stone-500">
        {loading ? '読み込み中…' : `${filtered.length} 件のおうちが見つかりました`}
      </p>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((h) => (
          <HomeCard key={h.id} home={h} />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="py-20 text-center text-stone-500">
          条件に合うおうちが見つかりませんでした。条件をゆるめてみてください。
        </div>
      )}
    </div>
  )
}
