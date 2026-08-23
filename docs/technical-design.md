# REPP --- Technical Design

## 1. Objetivo deste documento

Este documento descreve como os requisitos definidos em
`product-spec.md` serão implementados tecnicamente.

O REPP seguirá inicialmente uma arquitetura monolítica modular
utilizando Next.js, mantendo frontend e backend no mesmo projeto.

A arquitetura deverá priorizar simplicidade, separação de
responsabilidades, TypeScript strict, baixo acoplamento, facilidade de
evolução, abordagem mobile-first, compatibilidade futura com PWA e
ausência de abstrações prematuras.

## 2. Stack técnica

-   Next.js
-   React
-   TypeScript
-   Next.js App Router
-   PostgreSQL hospedado no Neon
-   Drizzle ORM
-   Zod
-   Tailwind CSS
-   shadcn/ui quando apropriado
-   Vercel
-   Git/GitHub

## 3. Visão geral da arquitetura

O REPP será inicialmente uma aplicação web full-stack dentro de um único
projeto Next.js.

``` text
Browser
   |
   v
Next.js / Vercel
   |
   +-- React UI
   +-- Server-side application logic
   +-- Domain / business rules
   +-- Data access
   |
   v
Drizzle ORM
   |
   v
PostgreSQL / Neon
```

O frontend nunca deverá acessar diretamente o PostgreSQL. O acesso aos
dados deverá ocorrer através de código executado no servidor.

## 4. Organização de responsabilidades

### 4.1 Presentation Layer

Responsável por páginas, componentes React, formulários, navegação,
feedback visual e estados específicos da interface.

### 4.2 Application Layer

Responsável por coordenar casos de uso como:

-   `createMusic`
-   `updateMusic`
-   `createConcert`
-   `duplicateConcert`
-   `addMusicToSetlist`
-   `removeMusicFromSetlist`
-   `reorderSetlist`
-   `generateContract`

### 4.3 Domain Layer

Responsável pelas regras de negócio.

Exemplos:

-   uma `Music` pertence ao acervo de um `Customer`;
-   um `Concert` pertence a um `Project`;
-   cada `Concert` possui um único setlist;
-   a ordem das músicas do setlist deve ser preservada;
-   `paymentStatus` deve aceitar somente estados válidos;
-   duplicação de `Concert` deve seguir regras explícitas.

As regras de negócio não deverão depender de componentes React.

### 4.4 Data Access Layer

Responsável pela persistência usando PostgreSQL, Neon, Drizzle ORM e
migrations.

## 5. Estrutura inicial de diretórios

A estrutura poderá evoluir durante o desenvolvimento.

``` text
app/
components/
features/
db/
lib/
types/
docs/
```

Novos diretórios deverão ser criados conforme as funcionalidades forem
implementadas, evitando estruturas vazias antecipadamente.

### 5.1 `app/`

Rotas, layouts, páginas, loading states, error boundaries e integração
das páginas com os casos de uso.

### 5.2 `components/`

Componentes React reutilizáveis.

### 5.3 `features/`

Módulos organizados por funcionalidade.

Exemplo:

``` text
features/
└── music/
    ├── actions/
    ├── services/
    ├── schemas/
    ├── queries/
    └── types/
```

Essas subpastas só deverão ser criadas quando houver código que
justifique sua existência.

### 5.4 `db/`

Conexão com Neon, schemas Drizzle, migrations e infraestrutura de
persistência.

### 5.5 `lib/`

Código técnico compartilhado que não pertença claramente a uma feature.

## 6. Modelo de domínio inicial

### 6.1 Customer

Relacionamentos principais:

``` text
Customer
   +-- 1:N --> Project
   +-- 1:N --> Music
   +-- 1:N --> Contractor
   +-- 1:N --> AccompanyingMusician
```

### 6.2 Project

Representa um projeto artístico.

``` text
Customer
   |
   +-- Project
          |
          +-- 1:N --> Concert
```

Uma `Music` poderá estar associada a múltiplos `Project`, caracterizando
relação N:N.

### 6.3 Music

Dados principais:

-   `id`
-   `customerId`
-   `title`
-   `artist`
-   `lyrics`
-   `originalKey`
-   `preferredKey`
-   `skillLevel`
-   `genre`
-   `note`
-   `sheetMusicFile`
-   `spotifyLink`

### 6.4 Concert

Dados principais:

-   `id`
-   `projectId`
-   `presentationDate`
-   `startTime`
-   `finishTime`
-   `durationInHours`
-   `totalBreakTime`
-   `contractorId`
-   `agreedFee`
-   `travelCost`
-   `paymentStatus`

Cada `Concert` possui exatamente um setlist lógico.

### 6.5 Setlist e SetlistItem

Como cada `Concert` possui somente um setlist, não é necessário assumir
inicialmente uma entidade independente `Setlist` com identidade própria.

As músicas deverão ser representadas por itens que preservem a ordem:

``` text
Concert
   |
   | possui um setlist lógico
   v
SetlistItem
   |
   v
Music
```

`SetlistItem` deverá possuir pelo menos:

-   `id`
-   `concertId`
-   `musicId`
-   `position`

Isso permite ordenar e reorganizar músicas, localizar a próxima música e
reutilizar uma `Music` em diferentes `Concerts`.

### 6.6 Contractor

Representa a pessoa ou organização responsável pela contratação.

`Contractor` poderá estar associado a múltiplos `Concerts`.

### 6.7 AccompanyingMusician

Representa músicos acompanhantes cadastrados pelo `Customer`.

`Concert` e `AccompanyingMusician` possuirão relação N:N.

A relação entre `AccompanyingMusician` e `Music` também poderá ser N:N
para representar músicas conhecidas pelo músico.

### 6.8 Contract

Um `Contract` deverá estar relacionado a um `Concert`.

``` text
Concert
   |
   | 1:0..1
   v
Contract
```

Editar `contractText` não deverá alterar automaticamente os dados
originais do `Concert`.

## 7. Relações principais do banco

``` text
Customer
   |
   +------ Project
   |          |
   |          +------ Concert
   |                     |
   |                     +------ SetlistItem ------ Music
   |                     +------ Contract
   |                     +------ ConcertMusician ------ AccompanyingMusician
   |
   +------ Music
   +------ Contractor
   +------ AccompanyingMusician

Project
   |
   +------ ProjectMusic ------ Music
```

## 8. Validação

Zod deverá validar dados nas fronteiras de entrada.

``` text
Form
   |
   v
Zod validation
   |
   v
Application logic
   |
   v
Domain rules
   |
   v
Persistence
```

Validação de formato e regra de negócio não deverão ser tratadas como a
mesma responsabilidade.

## 9. Server Actions e Route Handlers

Server Actions poderão ser utilizadas para operações originadas
diretamente pela interface Next.js.

Route Handlers deverão ser utilizados quando houver necessidade real de
uma interface HTTP explícita.

Não criar uma REST API completa apenas por convenção se ainda não houver
consumidor externo.

## 10. Autenticação e autorização

Toda operação protegida deverá identificar o `Customer` autenticado.

Consultas e alterações deverão respeitar o proprietário do recurso.

Não confiar em `customerId` enviado pelo navegador como prova de
propriedade.

```{=html}
<!-- DECISÃO PENDENTE:
Definir a solução de autenticação antes da implementação.
Não adicionar biblioteca de autenticação sem aprovação.
-->
```
## 11. Duplicação de Concert

A duplicação deverá ser um caso de uso explícito:

`duplicateConcert(concertId)`

A operação deverá validar propriedade, copiar somente os dados
permitidos e duplicar os `SetlistItems` quando aplicável.

Quando envolver múltiplas inserções relacionadas, deverá ocorrer de
forma transacional.

```{=html}
<!-- DECISÃO PENDENTE:
Definir quais campos serão copiados, especialmente data, horários, contractor,
agreedFee, travelCost, paymentStatus, músicos acompanhantes e contrato.
O Contract não deverá ser duplicado automaticamente sem regra explícita.
-->
```
## 12. Estratégia financeira futura

O MVP não possuirá módulo financeiro completo.

`Concert` deverá manter dados que permitam essa evolução:

-   `agreedFee`;
-   `travelCost`;
-   `paymentStatus`;
-   `presentationDate`.

Totais por período deverão inicialmente ser calculados e não persistidos
como campos derivados.

## 13. Arquivos e PDFs

`sheetMusicFile` e PDFs de contratos não deverão ser armazenados
diretamente como grandes blobs no PostgreSQL sem decisão técnica
específica.

O banco poderá armazenar referências e metadados de arquivos mantidos em
serviço apropriado.

```{=html}
<!-- DECISÃO PENDENTE:
Definir estratégia de armazenamento quando a funcionalidade for implementada.
-->
```
## 14. Geração de contratos

A geração deverá separar:

1.  dados estruturados do `Concert`;
2.  dados do `Contractor`;
3.  template;
4.  `contractText`;
5.  geração do PDF.

``` text
Concert + Contractor
        |
        v
Contract Template
        |
        v
contractText
        |
        v
edição
        |
        v
PDF
```

## 15. Mobile-first

A interface deverá ser projetada inicialmente para smartphones.

Prioridades:

-   controles adequados ao toque;
-   evitar ações dependentes de hover;
-   poucos cliques/toques;
-   listas legíveis;
-   navegação simples;
-   letras adequadas para leitura durante apresentações;
-   responsividade para telas maiores.

## 16. Preparação para PWA

PWA não será requisito de implementação do MVP inicial.

A arquitetura deverá evitar decisões que dificultem sua introdução
posterior.

``` text
Web mobile-first
       |
       v
Manifest + instalação
       |
       v
Service Worker
       |
       v
cache selecionado
       |
       v
funcionalidades offline
```

Setlists e letras são candidatos prioritários para suporte offline
futuro.

## 17. Estratégia de desenvolvimento

As funcionalidades deverão ser implementadas verticalmente.

Exemplo para `Music`:

``` text
Database schema
      |
      v
validation
      |
      v
application logic
      |
      v
UI
      |
      v
tests
```

Evitar implementar antecipadamente toda a infraestrutura de todas as
entidades.

## 18. Qualidade e validação

Para mudanças significativas:

1.  compreender o requisito;
2.  inspecionar o código existente;
3.  identificar ambiguidades;
4.  apresentar plano curto;
5.  implementar somente o escopo aprovado;
6.  executar lint;
7.  executar build;
8.  executar testes relevantes;
9.  resumir arquivos alterados e decisões tomadas.

O código deverá manter TypeScript strict.

SOLID e orientação a objetos deverão ser utilizados quando melhorarem
efetivamente a separação de responsabilidades e a manutenção, evitando
abstrações desnecessárias.

## 19. Decisões técnicas pendentes

Antes ou durante a implementação das respectivas features, deverão ser
definidos:

-   solução de autenticação;
-   estratégia de armazenamento de partituras e PDFs;
-   valores definitivos de `skillLevel`;
-   valores definitivos de `genre`;
-   valores definitivos de `paymentStatus`;
-   regra para músicas duplicadas no acervo;
-   possibilidade de repetir uma `Music` no mesmo setlist;
-   campos copiados ao duplicar um `Concert`;
-   estratégia de geração de PDF;
-   detalhes do template de contrato;
-   estratégia futura de cache/offline para PWA.
