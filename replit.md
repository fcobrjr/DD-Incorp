# ToolTracker Pro

## Overview
Sistema de gerenciamento de ferramentas baseado no padrão ToolTrackerPro2. Fullstack com Express + React + PostgreSQL + Drizzle ORM.

## Project Structure
```
/client          # Frontend React
  /src
    /components  # Componentes UI (ShadCN/UI)
    /pages       # Páginas da aplicação
    /hooks       # Custom hooks
    /lib         # Utilitários (queryClient, utils)
  index.html     # Entry point HTML
/server          # Backend Express
  index.ts       # Servidor principal
  db.ts          # Conexão com banco de dados
  vite.ts        # Configuração do Vite para desenvolvimento
  routes.ts      # Rotas da API
  storage.ts     # Layer de storage
/shared          # Código compartilhado
  schema.ts      # Schema Drizzle (PostgreSQL)
/migrations      # Migrações do banco de dados
/uploads         # Arquivos de upload
/attached_assets # Assets anexados
```

## Development
- **Start**: `npm run dev` - Inicia servidor Express + Vite HMR na porta 5000
- **Build**: `npm run build` - Compila para produção
- **Start Production**: `npm run start` - Inicia servidor de produção
- **DB Push**: `npm run db:push` - Sincroniza schema com banco de dados

## Configuration
- Express serve API e cliente na mesma porta (5000)
- Vite configurado com HMR e allowedHosts para Replit
- Drizzle ORM com PostgreSQL (Neon)
- TanStack Query para data fetching
- ShadCN/UI + Tailwind CSS para estilização
- Wouter para rotas do cliente

## Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## Deployment
- Build: `npm run build`
- Run: `npm run start`
- Target: Autoscale
