import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Home } from '../lib/types'
import HomeCard from '../components/HomeCard'
import { Logo } from '../components/Header'

const HERO =
  'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=2000&q=80'

export default function Landing() {
  const [homes, setHomes] = useState<Home[]>([])

  useEffect(() => {
    supabase
      .from('homes')
      .select('*')
      .eq('status', 'online')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => setHomes(data ?? []))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={HERO} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-28 sm:py-40 text-white">
          <h1 className="text-4xl sm:text-6xl font-black leading-tight">
            家を交換して、
            <br />
            暮らすように旅する。
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-xl">
            circle は日本発のホームエクスチェンジ・コミュニティ。
            宿泊費は0円、あるのは信頼とおたがいさまの気持ちだけ。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-full bg-brand-500 text-white font-bold hover:bg-brand-600"
            >
              無料ではじめる
            </Link>
            <Link
              to="/search"
              className="px-6 py-3 rounded-full bg-white/15 backdrop-blur text-white font-bold hover:bg-white/25"
            >
              家をさがしてみる
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/70">
            登録で100GP、自宅の掲載でさらに500GPプレゼント
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-black text-center">
          <Logo className="text-3xl sm:text-4xl" /> のしくみ
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-6">
          {[
            {
              n: '1',
              t: '自宅を掲載する',
              d: '写真と紹介文を登録して、泊まってほしい日をカレンダーに設定。掲載するだけで500GPがもらえます。',
            },
            {
              n: '2',
              t: '行きたい家に泊まる',
              d: 'おたがいの家を交換する「相互交換」と、ポイントで泊まる「GP交換」の2つの方式。日程が合わなくても大丈夫。',
            },
            {
              n: '3',
              t: 'ホストしてGPを貯める',
              d: '自宅にゲストを迎えるとGuestPoints(GP)を獲得。貯まったGPで全国どこへでも。',
            },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-stone-200 p-6">
              <div className="w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center font-black">
                {s.n}
              </div>
              <h3 className="mt-4 font-bold text-lg">{s.t}</h3>
              <p className="mt-2 text-stone-600 text-sm leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Latest homes */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-black">新着のおうち</h2>
          <Link to="/search" className="text-brand-700 font-medium text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homes.map((h) => (
            <HomeCard key={h.id} home={h} />
          ))}
        </div>
      </section>
    </div>
  )
}
