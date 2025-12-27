# Common Area Planner

## Overview
A React + TypeScript application for planning and managing common areas, activities, teams, and scheduling. Built as a sibling project to ToolTrackerPro2, sharing the same architecture patterns:

- **Express backend** with Vite middleware integration
- **PostgreSQL database** with Drizzle ORM
- **Passport.js authentication** with session management
- **TanStack Query** for data fetching
- **wouter** for client-side routing
- **Tailwind CSS** for styling
- **Google Gemini API** for AI features

## Project Structure
```
client/                    # Frontend React application
  src/
    components/            # Reusable React components
      icons.tsx            # SVG icon components
      MainLayout.tsx       # Main app layout with sidebar
      PageHeader.tsx       # Page header component
      Sidebar.tsx          # Navigation sidebar
    context/               # React context definitions
      AppContext.tsx       # App-wide context for data
    data/                  # Sample data and utilities
    hooks/                 # Custom React hooks
      use-auth.tsx         # Authentication hook
      useLocalStorage.ts   # Local storage hook
    lib/                   # Utility functions
      queryClient.ts       # TanStack Query client
      protected-route.tsx  # Protected route component
      utils.ts             # General utilities
    pages/                 # Page components
      auth-page.tsx        # Login/Register page
      CommonAreas.tsx      # Common areas management
      Activities.tsx       # Activities management
      Team.tsx             # Team members management
      Planning.tsx         # Work plan creation/editing
      Schedule.tsx         # Activity scheduling
      ... (other pages)
    services/              # API service integrations
      geminiService.ts     # Gemini AI integration
    App.tsx                # Main app with routing
    main.tsx               # Entry point
    index.css              # Global styles
  index.html               # HTML template

server/                    # Backend Express server
  index.ts                 # Server entry point
  routes.ts                # API routes
  storage.ts               # Database storage layer (interface + implementation)
  auth.ts                  # Passport authentication setup
  db.ts                    # Database connection (Drizzle + Neon)
  vite.ts                  # Vite dev middleware

shared/                    # Shared between client and server
  types.ts                 # TypeScript type definitions (legacy)
  schema.ts                # Drizzle ORM database schema & types
```

## Architecture Pattern (Sibling to ToolTrackerPro2)
This project follows the exact same patterns as ToolTrackerPro2:

1. **Server structure**: index.ts, routes.ts, storage.ts, auth.ts, db.ts, vite.ts
2. **Client routing**: wouter with ProtectedRoute pattern
3. **Authentication**: Passport.js with local strategy
4. **Data fetching**: TanStack Query with queryClient
5. **State management**: AppContext for legacy local state, migrating to API
6. **Database**: Drizzle ORM with PostgreSQL (Neon-backed)
7. **Session storage**: PostgreSQL-backed sessions (connect-pg-simple)

## Development
- **Start**: `npm run dev` - Runs Express with Vite middleware on port 5000
- **Build**: `npm run build` - Creates production build
- **Preview**: `npm run preview` - Preview production build
- **DB Push**: `npm run db:push` - Push database schema changes

## Default Login
After first run, a default admin user is created:
- **Username**: admin
- **Password**: admin123
- Please change this password after first login!

## Configuration
- Express serves API and Vite dev server on single port (5000)
- Vite configured for port 5000 with all hosts allowed for Replit proxy
- Uses `@` alias for client imports, `@shared` for shared imports
- Environment variables:
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - Session encryption key
  - `GEMINI_API_KEY` - Google Gemini API key (optional)

## API Endpoints
All routes under `/api/`:

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `POST /api/logout` - Logout user
- `GET /api/user` - Get current user

### Common Areas
- `GET /api/common-areas` - List all
- `GET /api/common-areas/:id` - Get by ID
- `POST /api/common-areas` - Create
- `PUT /api/common-areas/:id` - Update
- `DELETE /api/common-areas/:id` - Delete

### Resources (Tools/Materials)
- `GET /api/resources?type=tool|material` - List by type
- `POST /api/resources` - Create
- `PUT /api/resources/:id` - Update
- `DELETE /api/resources/:id` - Delete

### Activities, Team Members, Work Plans, etc.
Similar CRUD patterns for all entities.

## Deployment
- Autoscale deployment with Express server
- Build command: `npm run build`
- Run command: `NODE_ENV=production node dist/index.js`

## Planning Modal (Plano de Trabalho)
Regras de atividades:
- **Imutabilidade de atividades**: Atividades existentes nunca são sobrescritas no planejamento
- **Fork de atividades**: Qualquer alteração em SLA, materiais ou ferramentas cria uma nova atividade
- **Detecção de mudanças**: Sistema detecta automaticamente alterações estruturais
- **Modal obrigatório**: Usuário deve salvar modificações como nova atividade antes de continuar
- **Regras de validação**: Nome não pode ser igual ao original, cria automaticamente nova atividade no cadastro

## Planning (Planejamento) Table & Cards
- **Filtros independentes**: Pesquisa, Cliente, Local, Sublocal, Ambiente, Linhas por página (15/30)
- **Colunas na tabela**: Cliente, Local, Sublocal, Ambiente, Atividade, Periodicidade, Ações
- **Cards com informações completas**: Mostram Cliente, Local, Sublocal, Ambiente para identificar o local
- **Visualizações**: Cards (grid) e Tabela
- **Funcionalidades**: Editar e deletar planos de trabalho
- **Tabela com altura ajustável**: Header fixo (sticky), rolagem vertical com barra, fórmula: `pageSize × 55 + 40`

## Schedule (Agenda)
- **Filtros em cascata**: Pesquisa, Cliente, Local, Sublocal, Ambiente (mesma lógica Planning)
- **Colunas de identificação**: Cliente, Local, Sublocal, Ambiente, Atividade, Data, Status, Ações
- **Visualizações**: Calendário (mês/semana/dia) e Tabela
- **Status de atividades**: Aguardando Programação, Não Iniciada, Em Execução, Concluída, Atrasada
- **Ações na tabela**: Visualizar (eye icon) e Deletar (trash icon)

## Filtros Avançados (Padrão Global)
Todas as páginas com filtros seguem o padrão do ToolTrackerPro2:
- **Título**: "Filtros Avançados" no topo do bloco
- **Layout**: Horizontal com grid responsivo
- **Campo de busca**: Primeiro campo, label "Nome", placeholder "Buscar por nome..."
- **Dropdowns**: Labels padronizados, opções "Todos os X" como padrão
- **Botão toggle**: "Filtros Avançados" / "Ocultar Filtros"

Páginas com filtros:
- **CommonAreas**: Nome, Cliente, Local, Sublocal, Ambiente (cascata)
- **Planning**: Nome, Cliente, Local, Sublocal, Ambiente (cascata) + Limpar filtros
- **Schedule**: Nome, Cliente, Local, Sublocal, Ambiente (cascata)
- **Team**: Nome, Setor, Status (Ativos/Inativos)

## Recent Changes
- 2025-12-27: Adicionado padrão de dimensionamento de tabela na página Planejamento (altura ajustável, header fixo, filtro linhas por página)
- 2025-12-27: Corrigido comportamento cascata dos filtros em Áreas Comuns - todos os filtros agora são independentes e livres
- 2025-12-27: Adicionada coluna de "Ações" na tabela de Atividades Planejadas do modal de visualização de Áreas Comuns (deletar atividade e adicionar nova)
- 2025-12-27: Modal de nova atividade no CommonAreas agora é idêntico ao da página Atividades (com Equipamentos, Materiais e InfoTooltip)
- 2025-12-27: Adicionada barra de rolagem na tabela de Áreas Comuns com todos os dados visíveis e header fixo
- 2025-12-27: Adicionado filtro "Linhas por página" (15, 30) na seção de Filtros Avançados de Áreas Comuns
- 2025-12-27: Removida toda a funcionalidade de Governança (páginas, rotas, API, menu, tipos)
- 2025-12-27: Setores de equipe atualizados: A&B, Recepção, Manutenção, Áreas Comuns, Outros
- 2025-12-23: Substituído filtros nativos por SearchableSelect com busca em CommonAreas, Planning e Schedule
- 2025-12-23: Adicionado coluna "Ações" na tabela de Schedule com botões de visualizar e deletar
- 2025-12-23: Aplicado padrão global "Filtros Avançados" em todas as páginas com filtros
- 2025-12-23: Adicionado informações de cliente, local, sublocal e ambiente aos cards de Planning
- 2025-12-23: Adicionado filtros cliente/local/sublocal/ambiente em Planning com colunas de localização
- 2025-12-23: Refatorado modal de Plano de Trabalho com detecção de alterações em atividades
- 2025-12-23: Adicionado filtros cliente/local/sublocal/ambiente em Schedule com colunas de localização
- 2025-12-19: Implementado Planejamento com SLA calculado dinamicamente e busca de atividades
- 2025-12-19: Estruturado Agendamento com visualizações de calendário e tabela
- 2025-12-19: Restructured to match ToolTrackerPro2 sibling architecture
- 2025-12-19: Added authentication with Passport.js
- 2025-12-19: Migrated to wouter routing with protected routes
- 2025-12-19: Added TanStack Query for data fetching
- 2025-12-19: Created full API routes for all entities
- 2025-12-19: Added PostgreSQL database with Drizzle ORM schema
