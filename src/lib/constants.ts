export const AMENITIES = [
  'WiFi',
  'キッチン',
  '洗濯機',
  '乾燥機',
  'エアコン',
  '暖房',
  '食洗機',
  'テレビ',
  'ワークスペース',
  '駐車場',
  'エレベーター',
  '自転車',
  '庭',
  'バルコニー',
  'BBQ',
  'プール',
  'サウナ',
  '露天風呂',
  'ジャグジー',
  '暖炉',
  'ベビーベッド',
  'おもちゃ',
] as const

export const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
] as const

export const EXCHANGE_TYPE_LABEL: Record<string, string> = {
  any: 'どの交換方式でもOK',
  reciprocal: '相互交換のみ',
  gp: 'GP交換(非相互)のみ',
}

export const STATUS_LABEL: Record<string, string> = {
  requested: 'リクエスト中',
  pre_approved: '事前承認済み',
  finalized: '交換確定',
  canceled: 'キャンセル',
  completed: '完了',
}

export const STATUS_COLOR: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-800',
  pre_approved: 'bg-blue-100 text-blue-800',
  finalized: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-stone-200 text-stone-500',
  completed: 'bg-violet-100 text-violet-800',
}

export function nightsBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(0, Math.round(ms / 86400000))
}

export function fmtDate(d: string): string {
  const dt = new Date(d + (d.length === 10 ? 'T00:00:00' : ''))
  return dt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}
