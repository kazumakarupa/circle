import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Guide() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black">circleのしくみ</h1>
      <p className="mt-3 text-stone-600 leading-relaxed">
        circleは、会員同士が自宅を貸し合う「ホームエクスチェンジ」のコミュニティです。
        泊まる側は宿泊費0円。ホストする側はGuestPoints(GP)を受け取り、そのGPで次の旅に出られます。
      </p>

      {/* 3 steps */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">はじめかた(3ステップ)</h2>
        <ol className="space-y-4">
          {[
            ['無料登録する', '登録するだけで100GPをプレゼント。プロフィールに自己紹介や家族構成を書くと、交換の成立率が上がります。'],
            ['自宅を掲載する', '写真・設備・ハウスルールを登録し、「泊まってほしい日程」をカレンダーに設定。はじめての公開で500GPがもらえます。'],
            ['リクエストを送る・受ける', '気になる家に日程と人数を添えてリクエスト。メッセージで条件を相談し、ホストの事前承認→ゲストの最終確定で交換成立です。'],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-2xl border border-stone-200 p-5">
              <span className="shrink-0 w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-black">{i + 1}</span>
              <div>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 text-sm text-stone-600 leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* exchange types */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">2つの交換方式</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-stone-200 p-5">
            <h3 className="font-bold">🔁 相互交換</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              おたがいの家を交換します。同じ期間に入れ替わっても、別々の時期にずらしてもOK。GPは使いません。
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 p-5">
            <h3 className="font-bold">🪙 GP交換(非相互)</h3>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              ホストの家に泊まり、GP(1泊あたりの設定額×泊数)を支払います。ホストはあなたの家に泊まらなくてよいので、
              「行き先・日程が合う相手」を探す必要がなく、交換がずっと成立しやすくなります。
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-brand-50 p-5 text-sm text-stone-700 leading-relaxed">
          <span className="font-bold">GPの貯めかた:</span> 無料登録(+100GP)/自宅のはじめての公開(+500GP)/ゲストを受け入れる(1泊あたりの設定GP×泊数)。
          GPが動くのは交換を<span className="font-bold">最終確定した時だけ</span>。キャンセルすれば自動で全額戻ります。
        </div>
      </section>

      {/* pricing */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">料金</h2>
        <div className="rounded-2xl border-2 border-brand-500 p-6">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-brand-700">無料</span>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 font-bold">先行メンバー期間</span>
          </div>
          <p className="mt-3 text-sm text-stone-600 leading-relaxed">
            現在circleはテスト運営中のため、登録・掲載・交換のすべてを無料でご利用いただけます。
            宿泊料のやり取りは会員間で一切ありません(これはずっと変わりません)。
            将来、年会費制の導入を予定していますが、先行メンバーには優待価格をご案内する予定です。
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-xl font-bold mb-4">よくある質問</h2>
        <div className="space-y-2">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link to="/signup" className="inline-block px-8 py-3 rounded-full bg-brand-700 text-white font-bold hover:bg-brand-800">
          無料ではじめる(100GPプレゼント)
        </Link>
        <p className="mt-3 text-sm text-stone-500">
          安全面の取り組みは <Link to="/safety" className="text-brand-700 hover:underline">こちら</Link>
        </p>
      </div>
    </div>
  )
}

const FAQS = [
  {
    q: '本当に宿泊費はかからないの?',
    a: 'かかりません。circleの会員同士で宿泊料をやり取りすることは規約で禁止しています。滞在にかかるのは相互交換なら0、GP交換ならGuestPointsのみです。交通費や滞在中の食費などはもちろんご自身の負担です。',
  },
  {
    q: '賃貸住宅でも掲載できる?',
    a: '掲載自体は可能ですが、賃貸借契約やマンションの管理規約で第三者の利用が制限されている場合があります。掲載前にご自身で契約内容をご確認ください(必要に応じて貸主の許可を得てください)。',
  },
  {
    q: '家全体を貸すのはハードルが高い…',
    a: '「個室」だけの掲載もできます。あなたが在宅のまま空き部屋にゲストを迎え、キッチンなどは共用するスタイルです。掲載時に「貸し方: 個室」を選んでください。',
  },
  {
    q: '日程や行き先が合う相手が見つかるか不安',
    a: 'そのためのGP交換です。相手があなたの街に来たくなくても、GPを支払って泊まれば交換が成立します。ホストして貯めたGPは全国どの家にも使えます。',
  },
  {
    q: 'GP/泊はどうやって決まる?',
    a: 'ベッド数・宿泊可能人数・設備(プール、庭、ワークスペースなど)から自動で計算されます。恣意的に高く設定することはできず、どの家も同じ基準です。',
  },
  {
    q: '鍵の受け渡しや清掃はどうするの?',
    a: '交換確定後にメッセージで直接相談して決めてください(キーボックス、対面、近隣の方への預けなど)。チェックアウト時は「来た時と同じ状態」に戻すのがコミュニティの基本マナーです。',
  },
  {
    q: 'キャンセルしたらGPはどうなる?',
    a: '確定済みの交換をキャンセルすると、支払われたGPは自動で全額ゲストに返還されます。ただし直前の正当な理由のないキャンセルの繰り返しは、アカウント停止の対象になります。',
  },
  {
    q: 'ペットや子ども連れでも大丈夫?',
    a: '各住宅のハウスルールで「子ども歓迎」「ペット歓迎」が確認できます。検索の絞り込み条件でも指定できます。',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-stone-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left font-bold text-sm cursor-pointer hover:bg-stone-50"
      >
        {q}
        <span className="text-stone-400">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="px-5 pb-4 text-sm text-stone-600 leading-relaxed">{a}</p>}
    </div>
  )
}
