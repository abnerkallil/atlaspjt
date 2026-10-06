# ATLAS — SISTEMA DE COMPONENTES (guia de uso)

Documenta o que **já existe** no repositório. Não define componentes novos.

## 1. Camadas

| Camada | Onde mora | Para que serve |
| --- | --- | --- |
| Tokens de cor e raio | `app/globals.css` (`:root`) | Paleta e raio do Atlas |
| Tipografia | `app/layout.tsx` | Fontes `DM Sans` (`--font-atlas-sans`) e `Geist Mono` (`--font-geist-mono`) |
| Classes de página | `app/globals.css` (classes globais, ex.: `.page-heading`, `.metric-card`, `.task-row`) | Layout e visual das telas (Hoje, Estudar, Notas) |
| Primitivos shadcn (~60) | `components/ui/*.tsx` | Blocos de interface reutilizáveis (base-nova sobre `@base-ui/react`) |
| Utilitário `cn()` | `lib/utils.ts` | Junta classes (`clsx` + `tailwind-merge`) |
| Hook `useIsMobile` | `hooks/use-mobile.ts` | Detecta viewport estreito |
| Componentes de domínio | `components/notes-*.tsx` | Atlas Notes |
| Configuração shadcn | `components.json` | Estilo `base-nova`, ícones `lucide`, aliases `@/components`, `@/lib`, `@/hooks` |

Ícones: `lucide-react`. Gráficos: `recharts` via `components/ui/chart.tsx`.

## 2. Tokens disponíveis (`app/globals.css`)

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink` | `#1d1e27` | Texto principal |
| `--muted` | `#6a6878` | Texto secundário |
| `--blue` / `--blue-light` | `#2463eb` / `#5f8ff7` | Cor de ação, progresso, item ativo |
| `--navy` / `--navy-2` | `#f7f7fb` / `#ffffff` | Fundo da página / superfície |
| `--panel` / `--panel-soft` | `#ffffff` / `#f4f1ff` | Cartões |
| `--line` | `#dedce7` | Bordas |
| `--gold` | `#a97816` | Domínio / destaque dourado |
| `--violet` | `#7c3aed` | Retenção / revisão |
| `--green` | `#128864` | Sucesso / concluído |
| `--amber` | `#b65f12` | Atenção / quiz |
| `--radius` | `0.75rem` | Raio base |

Uso: `color: var(--ink)` em CSS, ou `text-[color:var(--ink)]` em Tailwind.

Cores de apoio usadas diretamente nas classes (fundos suaves de cada tom): azul `#eaf2ff`, violeta `#f2ecff`, âmbar `#fff1df`, verde `#e5f8f1`, dourado `#fff3d6`.

**Atenção — tokens semânticos do shadcn.** Os primitivos de `components/ui/` usam classes como `bg-primary`, `text-muted-foreground`, `border-border`, `ring-ring`, `bg-destructive`. Esses tokens (`--primary`, `--background`, `--muted-foreground`, …) **não estão definidos** em `app/globals.css` nem no pacote `shadcn/tailwind.css` importado. Consequência prática: um primitivo usado sem sobrescrita de classe pode renderizar sem cor de fundo/texto esperada. O padrão adotado no projeto é sobrescrever via `className` ou classe global (ex.: `<Button className="primary-button">`). Ao usar um primitivo novo numa tela, confira o resultado visual no navegador.

## 3. Tipografia

Família única de interface: `DM Sans` (via `--font-atlas-sans`), aplicada em `html`. Escala usada nas telas:

- Título de página (`h1`): `clamp(32px, 4vw, 48px)`, `letter-spacing: -.045em`.
- Título de seção (`h2`): 25px. Título de cartão: 16–18px.
- Corpo: 13–15px. Texto auxiliar: 11–12px.
- Eyebrow (rótulo em caixa alta): classe `.eyebrow` / `.card-kicker` (11px, `letter-spacing: .11em`).
- Mono: `--font-geist-mono` (código, ex.: editor de notas).

## 4. Primitivos por categoria (`components/ui/`)

Importe sempre de `@/components/ui/<arquivo>`.

**Ação e navegação**
- `button` — `Button` (`variant`: default, outline, secondary, ghost, destructive, link; `size`: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg). `button-group`, `toggle`, `toggle-group`.
- `tabs` (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`), `breadcrumb`, `pagination`, `navigation-menu`, `menubar`, `sidebar`.

**Cartões e conteúdo**
- `card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `CardAction`), `item` (linha de lista), `accordion`, `collapsible`, `table`, `separator`, `scroll-area`, `aspect-ratio`, `carousel`, `resizable`.

**Estados, alertas e indicadores**
- `alert` (`Alert`, `AlertTitle`, `AlertDescription`), `badge`, `progress` (`Progress`, `ProgressTrack`, `ProgressIndicator`, `ProgressLabel`, `ProgressValue`), `skeleton`, `spinner`, `empty` (estado vazio), `toast` (`ToastProvider`, `Toaster`), `marker`, `kbd`, `avatar`.
- `chart` — `ChartContainer`, `ChartTooltip`, `ChartLegend` sobre `recharts`.

**Modais e painéis sobrepostos**
- `dialog`, `alert-dialog`, `sheet` (painel lateral), `drawer`, `popover`, `hover-card`, `tooltip` (exige `TooltipProvider`), `dropdown-menu`, `context-menu`, `command` (paleta de comandos).

**Formulários**
- `input`, `textarea`, `label`, `field` (`Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldSet`), `input-group`, `input-otp`, `checkbox`, `radio-group`, `switch`, `slider`, `select`, `native-select`, `combobox`, `calendar`.

**Mensagens e anexos**
- `message`, `message-scroller`, `bubble` (conversas); `attachment` (anexos, usado em Notas).

**Utilitário**
- `direction` (suporte RTL).

## 5. Como usar

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

<Card className={cn('rounded-2xl', isActive && 'border-[color:var(--blue)]')}>
  <CardHeader><CardTitle>Regime de competência</CardTitle></CardHeader>
  <CardContent>
    <Button variant="outline" size="sm">Abrir</Button>
  </CardContent>
</Card>
```

Regras práticas:

1. Prefira um primitivo existente a criar um controle novo.
2. Junte classes com `cn()`; não concatene strings à mão.
3. Cores do Atlas: use os tokens da seção 2, não valores soltos, quando o tom já existe.
4. Componentes com estado (`'use client'`) precisam da diretiva no topo do arquivo que os usa.
5. Novos primitivos shadcn entram por `pnpm dlx shadcn add <nome>` (config em `components.json`) e ficam em `components/ui/`. Não edite a lógica interna de um primitivo para atender uma tela; use `className`.
6. Texto de interface em português (pt-BR); `<html lang="pt-BR">`.

## 6. Padrões de tela já usados

Blocos visuais recorrentes, definidos como classes globais em `app/globals.css`:

| Padrão | Classes |
| --- | --- |
| Cabeçalho de página | `.page-heading`, `.eyebrow` |
| Cartão de destaque | `.continue-card`, `.atlas-observed-card` |
| Indicadores | `.metrics-section`, `.metric-card` (`gold`, `violet`, `green`) |
| Lista de tarefas | `.task-list`, `.task-row`, `.task-icon`, `.task-label` (tons `blue`, `violet`, `amber`, `green`) |
| Barra de progresso | `.progress-track` > `span` com `width` em % |
| Estudo | `.study-view`, `.lesson-card`, `.study-side-card`, `.module-card` (`complete`, `current`, `locked`) |
| Sessão de estudo | `.ss-session`, `.ss-material`, `.ss-steps`, `.ss-notes`, `.ss-library`, `.ss-close`; cabeçalho em modo de foco (`.atlas-shell.focus-mode`) |
| Cabeçalho e navegação | `.site-header`, `.main-nav`, `.top-ribbon` |
| Painel lateral / modal | `.assistant-drawer`, `.drawer-backdrop`, `.start-modal`, `.modal-backdrop` |
| Notas | `.notes-*`, `.note-*` |

Responsividade: pontos de quebra em `900px` e `620px` (fim de `globals.css`); largura útil da página `min(1220px, 100% - 48px)`.
