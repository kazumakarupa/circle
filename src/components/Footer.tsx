import { Link } from 'react-router-dom'
import { Logo } from './Header'

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
        <div>
          <Logo className="text-2xl" />
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            日本発のホームエクスチェンジ。
            <br />
            家を交換して、暮らすように旅する。
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-bold text-stone-700 mb-3">circleについて</h3>
          <ul className="space-y-2 text-stone-500">
            <li><Link to="/guide" className="hover:text-brand-700 hover:underline">しくみ・料金・よくある質問</Link></li>
            <li><Link to="/safety" className="hover:text-brand-700 hover:underline">安心への取り組み</Link></li>
            <li><Link to="/search" className="hover:text-brand-700 hover:underline">家をさがす</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h3 className="font-bold text-stone-700 mb-3">はじめる</h3>
          <ul className="space-y-2 text-stone-500">
            <li><Link to="/signup" className="hover:text-brand-700 hover:underline">無料登録(100GPプレゼント)</Link></li>
            <li><Link to="/homes/new" className="hover:text-brand-700 hover:underline">自宅を掲載する(+500GP)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
        © 2026 circle — 現在はテスト運営中の先行メンバー期間です
      </div>
    </footer>
  )
}
