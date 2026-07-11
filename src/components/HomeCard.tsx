import { Link } from 'react-router-dom'
import type { Home } from '../lib/types'

export default function HomeCard({ home }: { home: Home }) {
  return (
    <Link
      to={`/homes/${home.id}`}
      className="group block rounded-2xl overflow-hidden border border-stone-200 bg-white hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
        {home.photos[0] ? (
          <img
            src={home.photos[0]}
            alt={home.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">写真なし</div>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-stone-500 mb-1">
          {home.prefecture} {home.city}
        </div>
        <h3 className="font-bold leading-snug line-clamp-2 min-h-[2.6em]">{home.title}</h3>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-stone-500">
            寝室{home.bedrooms}・ベッド{home.beds}・{home.max_guests}名まで
          </span>
          <span className="font-bold text-gp">{home.gp_per_night} GP/泊</span>
        </div>
      </div>
    </Link>
  )
}
