# circle 🟢

日本発のホームエクスチェンジ(家の交換)サービス MVP。
HomeExchange を参考に、**相互交換 + GuestPoints(GP)交換** のコアフローを実装しています。

## 主な機能

- **会員登録 / ログイン**(Supabase Auth・登録で 100GP)
- **住宅掲載**: タイプ・広さ・設備・ハウスルール・写真アップロード(初回公開で +500GP)
- **GP/泊 自動計算**: ベッド数・定員・設備から算出(DBトリガー)
- **交換カレンダー**: 期間ごとに交換方式(どれでも / 相互のみ / GPのみ)と最低泊数を設定
- **検索**: キーワード・都道府県・住宅タイプ・貸し方・住居区分・寝室数・GP上限・ペット/子ども歓迎
- **交換リクエスト → メッセージ → 事前承認(ホスト)→ 最終確定(ゲスト)** の2段階契約
- **GuestPoints台帳**: 確定時にGPが移動、キャンセルで返還(複式簿記型 ledger)
- **マイページ**: プロフィール編集・掲載管理・GP履歴

## 技術構成

| レイヤー | 技術 |
|---|---|
| フロントエンド | Vite + React + TypeScript + Tailwind CSS v4 |
| バックエンド | Supabase(Auth / Postgres / Storage / RLS / RPC) |
| ホスティング | Vercel(SPA) |

## 開発

```bash
npm install
npm run dev    # http://localhost:5173
npm run build  # 型チェック + 本番ビルド
```

環境変数(`.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...(publishable key)
```

## データベース

`supabase/migrations/` にスキーマ一式があります。
主要テーブル: `profiles` / `homes` / `availabilities` / `conversations` / `messages` / `exchanges` / `gp_ledger` / `favorites`

交換のステータス遷移:

```
requested → pre_approved → finalized → completed
                ↘ canceled(確定後キャンセルはGP自動返還)
```

ビジネスロジックは RLS + SECURITY DEFINER の RPC(`pre_approve_exchange` / `finalize_exchange` / `cancel_exchange`)で DB 側に実装しています。

## デモアカウント

- メール: `demo@circle-swap.jp` / パスワード: `circle2026`
- ホスト側の動作確認: `yuki@example.com` ほか(同じパスワード)
