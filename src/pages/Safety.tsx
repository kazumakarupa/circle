import { Link } from 'react-router-dom'

export default function Safety() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black">安心への取り組み</h1>
      <p className="mt-3 text-stone-600 leading-relaxed">
        ホームエクスチェンジは「知らない人を家に迎える」サービスです。
        だからこそcircleは、信頼を確かめ合えるしくみづくりを最優先にしています。
        いま提供しているもの、これから提供するものを正直にお伝えします。
      </p>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">いま提供しているしくみ</h2>
        {[
          ['✉️ メールアドレス確認', 'すべての会員はメールアドレスの確認を経て登録されます。'],
          ['⭐ ダブルブラインドレビュー', '滞在後、ホストとゲストが互いを評価します。レビューは双方が投稿した時点(または交換終了40日後)に同時公開されるため、相手の評価を見てから内容を変える「報復レビュー」ができない設計です。投稿後の編集はできません。'],
          ['🤝 2段階の交換確定', '交換は「ホストの事前承認」→「ゲストの最終確定」の2段階。確定するまでGPは1ポイントも動きません。メッセージで十分に相談してから確定できます。'],
          ['🪙 GPの自動返還', '確定後にキャンセルが発生した場合、支払われたGPはシステムが自動で全額返還します。当事者間の「返した・返さない」のトラブルが起きません。'],
          ['📋 ハウスルールの明示', '子ども・ペット・喫煙の可否や注意事項を掲載ごとに明示。条件が合う相手だけとやり取りできます。'],
          ['🔒 個人情報の保護', '正確な住所や連絡先が公開されることはありません。公開されるのは市区町村までです。'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-stone-200 p-5">
            <h3 className="font-bold">{t}</h3>
            <p className="mt-1.5 text-sm text-stone-600 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">これから提供するしくみ(開発予定)</h2>
        {[
          ['📱 電話番号認証・本人確認バッジ', 'SMS認証、さらに身分証・住所確認による認証バッジを順次導入します。'],
          ['🚨 通報・ブロック機能', '不適切なユーザーや掲載を運営に通報できるしくみを用意します。'],
          ['🛡️ デポジット・保証制度', '万一の物損などに備える保証のしくみを、本格ローンチまでに設計します。'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-dashed border-stone-300 p-5 bg-stone-50">
            <h3 className="font-bold text-stone-700">{t}</h3>
            <p className="mt-1.5 text-sm text-stone-500 leading-relaxed">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-2xl bg-amber-50 border border-amber-200 p-6">
        <h2 className="font-bold">⚠️ 正直にお伝えしたいこと</h2>
        <p className="mt-2 text-sm text-stone-700 leading-relaxed">
          circleは現在テスト運営中の小さなコミュニティで、大手サービスのような損害補償や24時間サポートはまだ提供できていません。
          現段階では、<span className="font-bold">よく知っている相手や、メッセージで十分に信頼関係を築けた相手</span>との交換をおすすめします。
          トラブルや不安なことがあれば、フッターの連絡先からいつでも運営にご相談ください。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold mb-3">気持ちよく交換するための約束</h2>
        <ul className="space-y-2 text-sm text-stone-700 leading-relaxed list-disc pl-5">
          <li>プロフィールと掲載情報は正直に書く(実際と違う写真・情報の掲載は禁止です)</li>
          <li>会員間で宿泊料のやり取りをしない(circleの根本ルールです)</li>
          <li>返信はできるだけ早く。難しい時は「難しい」と伝える</li>
          <li>借りた家は「来た時と同じ状態」で返す</li>
          <li>正当な理由のない確定後のキャンセルをしない</li>
        </ul>
      </section>

      <div className="mt-12 text-center">
        <Link to="/guide" className="text-brand-700 hover:underline text-sm">しくみ・料金・よくある質問はこちら →</Link>
      </div>
    </div>
  )
}
