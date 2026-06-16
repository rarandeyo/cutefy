# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## Tech Stack

- **Next.js 16** (App Router) / React 19 / Tailwind CSS v4
- **UI**: HeroUI v3 beta + Lucide icons + tailwind-variants
- **認証**: better-auth (Spotify OAuth)
- **Spotify API**: @spotify/web-api-ts-sdk（プレイリスト/トラック取得）+ OAuth トークン取得は REST 直呼び
- **DB / ORM**: Drizzle ORM + Cloudflare D1（`cutefy-db`）/ マイグレーションは drizzle-kit + wrangler
- **状態 / 環境変数**: nuqs（URL state）+ @t3-oss/env-nextjs + zod（env バリデーション）
- **デプロイ**: Cloudflare Workers（@opennextjs/cloudflare + wrangler）
- **型チェック**: tsgo (TypeScript Go native compiler)
- **Linter/Formatter**: oxlint / oxfmt
- **AST Lint**: ast-grep（`sgconfig.yml` / `pnpm ast-grep` / `pnpm ast-grep:test`）
- **Pre-commit**: lefthook で lint(fix) / format / ast-grep / typecheck を並列実行（lint・format は stage_fixed 有効）

## Coding Rules

- コードを書く・変更する前に、必ず `/coding-conventions` スキルを読み込むこと
