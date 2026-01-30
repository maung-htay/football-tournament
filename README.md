# ⚽ Football Tournament Manager

日本で友好試合を管理するためのフルスタックアプリケーション。
NextJS 14 + MongoDB Atlas を使用。

## 機能

### 管理者機能
- ✅ チーム登録・管理
- ✅ ランダムグループ抽選
- ✅ 試合自動生成（グループステージ総当たり）
- ✅ 試合手動追加（ノックアウトステージ用）
- ✅ スコア入力
- ✅ 順位自動計算（勝点、得失点差、総得点）

### ユーザー機能
- ✅ 試合一覧表示
- ✅ グループ順位表示
- ✅ リアルタイム更新

## セットアップ手順

### 1. MongoDB Atlas の設定

1. [MongoDB Atlas](https://www.mongodb.com/atlas) にアクセス
2. 無料アカウントを作成（または既存アカウントでログイン）
3. 新しいクラスターを作成（無料枠のM0を選択）
4. Database Access でユーザーを作成
   - Username と Password を設定
5. Network Access で IP アドレスを許可
   - 開発時は `0.0.0.0/0` で全て許可（本番では制限推奨）
6. Connect → Connect your application で接続文字列を取得

### 2. プロジェクトのセットアップ

```bash
# プロジェクトフォルダに移動
cd football-tournament

# 依存パッケージをインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env.local
```

### 3. 環境変数の設定

`.env.local` ファイルを編集:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/football-tournament?retryWrites=true&w=majority
```

### 4. 開発サーバー起動

```bash
npm run dev
```

ブラウザで開く:
- ユーザーページ: http://localhost:3000
- 管理者ページ: http://localhost:3000/admin

## 使い方

### 大会セットアップの流れ

1. **チーム登録** (`/admin/teams`)
   - 参加するチームを登録
   - チーム名と略称（5文字以内）を設定

2. **グループ抽選** (`/admin/groups`)
   - グループ数とチーム数を設定
   - 「抽選実行」でランダムにグループ分け

3. **試合生成** (`/admin/matches`)
   - 「自動生成」でグループステージの総当たり戦を作成
   - 会場と開始日を設定

4. **スコア入力** (`/admin/scores`)
   - 各試合の結果を入力
   - 入力すると順位が自動で更新される

## 技術スタック

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB Atlas
- **ODM**: Mongoose

## フォルダ構成

```
football-tournament/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── teams/
│   │   │   ├── groups/
│   │   │   └── matches/
│   │   ├── admin/         # 管理者ページ
│   │   │   ├── teams/
│   │   │   ├── groups/
│   │   │   ├── matches/
│   │   │   └── scores/
│   │   ├── page.tsx       # ユーザーページ
│   │   └── layout.tsx
│   ├── lib/
│   │   └── mongodb.ts     # DB接続
│   ├── models/            # Mongooseモデル
│   │   ├── Team.ts
│   │   ├── Group.ts
│   │   └── Match.ts
│   └── types/
│       └── index.ts       # TypeScript型定義
├── .env.example
├── package.json
└── README.md
```

## 順位決定ルール

1. 勝点（勝利: 3点、引分: 1点、敗北: 0点）
2. 得失点差
3. 総得点

## 今後の拡張予定

- [ ] ノックアウトステージ自動生成
- [ ] リアルタイム更新（WebSocket）
- [ ] 認証機能
- [ ] 複数大会管理
- [ ] 得点者記録
- [ ] チームロゴアップロード

## ライセンス

MIT
