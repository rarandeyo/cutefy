# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # 開発サーバー起動 (Turbopack)
pnpm build        # プロダクションビルド
pnpm lint         # oxlint で lint
pnpm format       # oxfmt でフォーマット
pnpm check        # lint + format check + typecheck を一括実行
pnpm fix          # lint fix + format fix
pnpm typecheck    # tsgo --noEmit で型チェック
```

## Tech Stack

- **Next.js 16** (App Router) / React 19 / Tailwind CSS v4
- **UI**: HeroUI v3 beta + Lucide icons + tailwind-variants
- **認証**: better-auth (Spotify OAuth)
- **Spotify API**: @spotify/web-api-ts-sdk + REST API 直呼び
- **型チェック**: tsgo (TypeScript Go native compiler)
- **Linter/Formatter**: oxlint / oxfmt
- **Pre-commit**: lefthook (lint fix → format → typecheck を並列実行、stage_fixed 有効)

## Coding Rules

- コードを書く・変更する前に、必ず `/coding-conventions` スキルを読み込むこと
