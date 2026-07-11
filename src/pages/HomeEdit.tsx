import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Availability, Home } from '../lib/types'
import { AMENITIES, EXCHANGE_TYPE_LABEL, PREFECTURES, fmtDate } from '../lib/constants'

type Draft = Omit<Home, 'id' | 'owner_id' | 'gp_per_night' | 'created_at' | 'owner'>

const empty: Draft = {
  title: '',
  description: '',
  neighborhood: '',
  property_type: 'house',
  accommodation_type: 'entire',
  residence_type: 'primary',
  prefecture: '東京都',
  city: '',
  max_guests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  size_m2: null,
  amenities: ['WiFi'],
  children_welcome: true,
  pets_welcome: false,
  smoking_allowed: false,
  rules_note: '',
  photos: [],
  status: 'draft',
}

export default function HomeEdit() {
  const { id } = useParams() // undefined = 新規
  const { session, refreshBalance } = useAuth()
  const navigate = useNavigate()
  const [d, setD] = useState<Draft>(empty)
  const [homeId, setHomeId] = useState<string | undefined>(id)
  const [avails, setAvails] = useState<Availability[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  // 空き日程フォーム
  const [aStart, setAStart] = useState('')
  const [aEnd, setAEnd] = useState('')
  const [aType, setAType] = useState<'any' | 'reciprocal' | 'gp'>('any')
  const [aMin, setAMin] = useState(1)

  useEffect(() => {
    if (!id) return
    supabase.from('homes').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setD(data)
    })
    loadAvails(id)
  }, [id])

  async function loadAvails(hid: string) {
    const { data } = await supabase.from('availabilities').select('*').eq('home_id', hid).order('start_date')
    setAvails(data ?? [])
  }

  if (!session) return <div className="py-20 text-center text-stone-500">ログインが必要です。</div>

  async function save(status?: 'draft' | 'online') {
    if (!session) return
    setBusy(true)
    setError('')
    setSaved(false)
    const payload = { ...d, status: status ?? d.status, owner_id: session.user.id }
    let result
    if (homeId) {
      result = await supabase.from('homes').update(payload).eq('id', homeId).select('id').single()
    } else {
      result = await supabase.from('homes').insert(payload).select('id').single()
    }
    setBusy(false)
    if (result.error) {
      setError('保存に失敗しました: ' + result.error.message)
      return
    }
    setHomeId(result.data.id)
    setD({ ...d, status: payload.status })
    setSaved(true)
    refreshBalance() // 掲載ボーナス反映
    if (status === 'online') navigate(`/homes/${result.data.id}`)
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files || !session) return
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files).slice(0, 8)) {
      const path = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('home-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('home-photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setD((prev) => ({ ...prev, photos: [...prev.photos, ...urls] }))
    setUploading(false)
  }

  async function addAvail(e: React.FormEvent) {
    e.preventDefault()
    if (!homeId) { setError('先に下書きを保存してください'); return }
    const { error } = await supabase.from('availabilities').insert({
      home_id: homeId, start_date: aStart, end_date: aEnd, exchange_type: aType, min_nights: aMin,
    })
    if (error) { setError(error.message); return }
    setAStart(''); setAEnd('')
    loadAvails(homeId)
  }

  async function removeAvail(aid: string) {
    await supabase.from('availabilities').delete().eq('id', aid)
    if (homeId) loadAvails(homeId)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black">{id ? '掲載を編集' : '自宅を掲載する'}</h1>
      <p className="mt-1 text-sm text-stone-500">
        はじめて掲載を公開すると <span className="font-bold text-gp">500GP</span> がもらえます。
      </p>

      <div className="mt-8 space-y-8">
        <Block title="基本情報">
          <L label="タイトル">
            <input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="例: 京都・西陣の趣ある町家|坪庭と檜風呂" className={inp} />
          </L>
          <div className="grid sm:grid-cols-3 gap-4">
            <L label="住宅タイプ">
              <select value={d.property_type} onChange={(e) => setD({ ...d, property_type: e.target.value as Draft['property_type'] })} className={inp}>
                <option value="house">一戸建て</option>
                <option value="apartment">マンション・アパート</option>
              </select>
            </L>
            <L label="貸し方">
              <select value={d.accommodation_type} onChange={(e) => setD({ ...d, accommodation_type: e.target.value as Draft['accommodation_type'] })} className={inp}>
                <option value="entire">まるごと一軒</option>
                <option value="private_room">個室</option>
              </select>
            </L>
            <L label="住居区分">
              <select value={d.residence_type} onChange={(e) => setD({ ...d, residence_type: e.target.value as Draft['residence_type'] })} className={inp}>
                <option value="primary">主たる住まい</option>
                <option value="secondary">セカンドハウス</option>
              </select>
            </L>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <L label="都道府県">
              <select value={d.prefecture} onChange={(e) => setD({ ...d, prefecture: e.target.value })} className={inp}>
                {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </L>
            <L label="市区町村">
              <input value={d.city} onChange={(e) => setD({ ...d, city: e.target.value })} placeholder="例: 京都市上京区" className={inp} />
            </L>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Num label="最大人数" v={d.max_guests} set={(n) => setD({ ...d, max_guests: n })} min={1} max={20} />
            <Num label="寝室" v={d.bedrooms} set={(n) => setD({ ...d, bedrooms: n })} min={0} max={20} />
            <Num label="ベッド" v={d.beds} set={(n) => setD({ ...d, beds: n })} min={1} max={30} />
            <Num label="バス" v={d.bathrooms} set={(n) => setD({ ...d, bathrooms: n })} min={1} max={10} />
            <L label="広さ(m²)">
              <input type="number" value={d.size_m2 ?? ''} onChange={(e) => setD({ ...d, size_m2: e.target.value ? Number(e.target.value) : null })} className={inp} />
            </L>
          </div>
        </Block>

        <Block title="紹介文">
          <L label="この家について">
            <textarea rows={5} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="家の魅力・間取り・過ごし方など" className={inp} />
          </L>
          <L label="周辺エリアについて">
            <textarea rows={3} value={d.neighborhood} onChange={(e) => setD({ ...d, neighborhood: e.target.value })} placeholder="駅からの距離・おすすめのお店・観光地など" className={inp} />
          </L>
        </Block>

        <Block title="写真">
          <div className="flex flex-wrap gap-3">
            {d.photos.map((p, i) => (
              <div key={i} className="relative w-32 h-24 rounded-lg overflow-hidden bg-stone-100">
                <img src={p} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setD({ ...d, photos: d.photos.filter((_, j) => j !== i) })}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs cursor-pointer"
                >✕</button>
              </div>
            ))}
            <label className="w-32 h-24 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center text-sm text-stone-500 cursor-pointer hover:border-brand-500 hover:text-brand-700">
              {uploading ? 'アップ中…' : '+ 追加'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadPhotos(e.target.files)} />
            </label>
          </div>
        </Block>

        <Block title="設備・アメニティ">
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = d.amenities.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setD({ ...d, amenities: on ? d.amenities.filter((x) => x !== a) : [...d.amenities, a] })}
                  className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${on ? 'bg-brand-700 text-white border-brand-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}
                >
                  {a}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-stone-400 mt-2">※ ベッド数・人数・設備からGP/泊が自動で計算されます</p>
        </Block>

        <Block title="ハウスルール">
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.children_welcome} onChange={(e) => setD({ ...d, children_welcome: e.target.checked })} />子ども歓迎</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.pets_welcome} onChange={(e) => setD({ ...d, pets_welcome: e.target.checked })} />ペット歓迎</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={d.smoking_allowed} onChange={(e) => setD({ ...d, smoking_allowed: e.target.checked })} />喫煙可</label>
          </div>
          <L label="その他のルール・注意事項">
            <textarea rows={2} value={d.rules_note} onChange={(e) => setD({ ...d, rules_note: e.target.value })} placeholder="例: 観葉植物への水やりをお願いします" className={inp} />
          </L>
        </Block>

        <Block title="交換カレンダー(泊まってほしい日程)">
          {!homeId && <p className="text-sm text-stone-500 mb-3">日程を追加するには、先に下書きを保存してください。</p>}
          <div className="space-y-2 mb-4">
            {avails.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 px-4 py-2.5 text-sm">
                <span className="font-bold">{fmtDate(a.start_date)} 〜 {fmtDate(a.end_date)}</span>
                <span className="text-stone-500">{EXCHANGE_TYPE_LABEL[a.exchange_type]}・最低{a.min_nights}泊</span>
                <button onClick={() => removeAvail(a.id)} className="ml-auto text-red-500 hover:underline cursor-pointer">削除</button>
              </div>
            ))}
          </div>
          {homeId && (
            <form onSubmit={addAvail} className="grid sm:grid-cols-5 gap-3 items-end text-sm">
              <L label="開始日"><input type="date" required value={aStart} onChange={(e) => setAStart(e.target.value)} className={inp} /></L>
              <L label="終了日"><input type="date" required value={aEnd} onChange={(e) => setAEnd(e.target.value)} className={inp} /></L>
              <L label="交換方式">
                <select value={aType} onChange={(e) => setAType(e.target.value as typeof aType)} className={inp}>
                  <option value="any">どの方式でもOK</option>
                  <option value="reciprocal">相互交換のみ</option>
                  <option value="gp">GP交換のみ</option>
                </select>
              </L>
              <L label="最低泊数">
                <select value={aMin} onChange={(e) => setAMin(Number(e.target.value))} className={inp}>
                  {[1, 2, 3, 4, 5, 7].map((n) => <option key={n} value={n}>{n}泊</option>)}
                </select>
              </L>
              <button className="py-2.5 rounded-full bg-stone-800 text-white font-bold hover:bg-stone-900 cursor-pointer">追加</button>
            </form>
          )}
        </Block>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">保存しました。</p>}

        <div className="flex flex-wrap gap-3 pt-2 pb-16">
          <button onClick={() => save('draft')} disabled={busy} className="px-6 py-3 rounded-full border border-stone-300 font-bold hover:bg-stone-50 disabled:opacity-50 cursor-pointer">
            下書き保存
          </button>
          <button onClick={() => save('online')} disabled={busy || !d.title || !d.city} className="px-6 py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800 disabled:opacity-50 cursor-pointer">
            {d.status === 'online' ? '更新して公開' : '公開する(+500GP)'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 p-6">
      <h2 className="font-bold text-lg mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function Num({ label, v, set, min, max }: { label: string; v: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <L label={label}>
      <input type="number" min={min} max={max} value={v} onChange={(e) => set(Number(e.target.value))} className={inp} />
    </L>
  )
}

const inp =
  'w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white'
