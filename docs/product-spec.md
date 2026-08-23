# REPP --- Product Specification

## 1. Objetivo do produto

O REPP é uma aplicação web mobile-first destinada à administração de
repertórios musicais, projetos artísticos e apresentações de músicos e
cantores.

O aplicativo deverá centralizar as informações necessárias para que o
músico organize seu repertório e suas apresentações, permitindo
consultar músicas, letras, tonalidades, setlists, contratos, músicos
acompanhantes e demais informações relacionadas aos seus projetos
artísticos.

## 2. Problema que resolve

Músicos profissionais e amadores podem possuir um vasto repertório
musical, que precisa ser constantemente organizado e adaptado para
diferentes apresentações.

Além das próprias músicas e letras, uma apresentação envolve diversas
informações, como:

-   data e horário;
-   duração da apresentação;
-   local;
-   repertório específico da apresentação;
-   músicos acompanhantes;
-   contratante;
-   cachê;
-   contrato;
-   intervalos;
-   alimentação e consumação;
-   custos de deslocamento;
-   outras informações relacionadas ao evento.

Essas informações frequentemente ficam dispersas entre diferentes
aplicativos, documentos e meios de comunicação.

O REPP pretende centralizar essas informações e facilitar a
administração do repertório e das apresentações do músico.

## 3. Usuário principal

O REPP é destinado a músicos profissionais ou amadores, especialmente
cantores e cantoras que precisam administrar repertórios musicais,
projetos artísticos e apresentações.

## 4. Escopo do MVP

A primeira versão do REPP deverá ser uma aplicação web mobile-first.

O MVP deverá permitir:

-   cadastro e autenticação de usuários;
-   criação e gerenciamento de projetos artísticos;
-   criação automática de um projeto inicial baseado no nome artístico
    do usuário;
-   cadastro e gerenciamento de músicas;
-   visualização das letras das músicas;
-   criação e gerenciamento de apresentações;
-   duplicação de apresentações existentes;
-   criação de setlists para apresentações;
-   associação de músicas aos projetos artísticos;
-   associação de músicas aos setlists das apresentações;
-   cadastro e gerenciamento de músicos acompanhantes;
-   cadastro de contratantes;
-   armazenamento das principais informações de uma apresentação;
-   registro opcional do custo de deslocamento;
-   registro da situação do pagamento do cachê;
-   geração de contrato a partir das informações da apresentação;
-   visualização e edição do contrato;
-   geração do contrato em PDF.

### 4.1 Evolução pós-MVP

Em uma versão posterior ao MVP, o REPP poderá incorporar uma camada de
controle financeiro básico para o músico.

Essa evolução deverá aproveitar principalmente os dados já registrados
nas apresentações, permitindo:

-   listar apresentações (`gigs`) por período;
-   visualizar os cachês associados às apresentações;
-   somar cachês em determinado período;
-   utilizar custos de deslocamento como informação de custo;
-   acompanhar a situação de pagamento das apresentações;
-   apresentar visões financeiras simples sem transformar o MVP inicial
    em um sistema financeiro completo.

## 5. Funcionalidades

### 5.1 Autenticação e conta

O usuário poderá:

-   criar uma conta;
-   realizar login;
-   acessar seus próprios dados e projetos;
-   editar seus dados pessoais e artísticos.

### 5.2 Gerenciamento de projetos artísticos

O usuário poderá:

-   criar projetos artísticos;
-   visualizar seus projetos;
-   editar um projeto;
-   excluir um projeto;
-   expandir ou recolher um projeto diretamente na listagem;
-   visualizar as apresentações de um projeto sem sair da tela de
    projetos;
-   manter múltiplos projetos expandidos simultaneamente;
-   expandir todos os projetos de uma vez;
-   recolher todos os projetos de uma vez;
-   acessar diretamente uma apresentação exibida dentro de um projeto.

Ao criar sua conta, o usuário possuirá inicialmente um projeto padrão
com o mesmo nome de seu nome artístico.

### 5.3 Gerenciamento de músicas

O usuário poderá:

-   cadastrar uma música;
-   visualizar músicas cadastradas;
-   visualizar os detalhes de uma música;
-   editar uma música;
-   excluir uma música;
-   visualizar sua letra;
-   associar uma música a um ou mais projetos;
-   adicionar uma música a uma apresentação;
-   selecionar várias músicas e adicioná-las a uma apresentação;
-   pesquisar e filtrar músicas.

### 5.4 Filtros de músicas

A listagem de músicas deverá permitir filtros combináveis.

Inicialmente deverão ser considerados:

-   músico acompanhante;
-   gênero musical;
-   artista;
-   tonalidade original;
-   tonalidade preferida;
-   nível de domínio da música.

Os filtros poderão ser utilizados simultaneamente.

### 5.5 Gerenciamento de apresentações

Cada projeto poderá possuir apresentações (`Concerts`).

O usuário poderá:

-   criar uma apresentação;
-   visualizar apresentações diretamente na expansão de cada projeto;
-   acessar os detalhes de uma apresentação;
-   editar uma apresentação;
-   excluir uma apresentação;
-   duplicar uma apresentação diretamente na listagem, sem precisar
    acessá-la primeiro;
-   informar data e horários;
-   informar duração;
-   informar tempo total de intervalo;
-   informar local;
-   informar contratante;
-   informar cachê;
-   informar opcionalmente custo de deslocamento;
-   registrar a situação do pagamento;
-   associar músicos acompanhantes;
-   administrar o setlist da apresentação;
-   acessar as configurações da apresentação;
-   gerar um contrato relacionado à apresentação.

A duplicação deverá facilitar a criação de um novo `Concert` baseado em
uma apresentação existente.

```{=html}
<!-- SUGESTÃO:
Antes da implementação da duplicação, definir explicitamente quais dados serão copiados.
Uma opção segura é copiar setlist, músicos e configurações reutilizáveis, mas exigir
confirmação ou novo preenchimento de dados específicos do evento, como data.
-->
```
### 5.6 Gerenciamento do setlist

Cada apresentação possuirá um setlist contendo as músicas que serão
executadas naquela apresentação.

O usuário poderá:

-   adicionar músicas ao setlist;
-   remover músicas do setlist;
-   visualizar as músicas do setlist;
-   alterar a ordem das músicas;
-   acessar diretamente a letra de uma música;
-   avançar da letra atual para a próxima música do setlist.

```{=html}
<!-- SUGESTÃO:
A ordem das músicas deve ser persistida, pois ela será necessária para determinar
qual música será aberta quando o usuário selecionar "próxima música".
-->
```
### 5.7 Modo de apresentação de letras

Durante uma apresentação, o músico poderá abrir a letra de uma música
diretamente pelo setlist.

A visualização deverá ser otimizada para leitura durante apresentações,
priorizando:

-   leitura à distância;
-   boa legibilidade;
-   alto contraste;
-   utilização em tela cheia;
-   poucos elementos visuais desnecessários;
-   facilidade de operação com poucos toques.

A tela deverá permitir:

-   visualizar a letra;
-   visualizar o título da música;
-   visualizar a tonalidade preferida;
-   avançar para a próxima música do setlist;
-   sair da visualização da letra com uma única ação;
-   editar a letra da música.

### 5.8 Seleção de músicas para uma apresentação

Na página da apresentação deverá existir a opção `Adicionar música`.

Essa ação permitirá:

1.  criar uma nova música; ou
2.  selecionar músicas já cadastradas.

Ao selecionar músicas existentes, o sistema exibirá o acervo do usuário.

As músicas pertencentes ao projeto artístico da apresentação deverão
aparecer prioritariamente na listagem.

Cada música poderá ser adicionada à apresentação com uma única ação.

Também deverá existir a possibilidade de selecionar múltiplas músicas e
adicioná-las conjuntamente à apresentação.

### 5.9 Gerenciamento de músicos acompanhantes

O usuário poderá:

-   cadastrar um músico acompanhante;
-   editar seus dados;
-   excluir um músico acompanhante;
-   associar o músico a apresentações;
-   relacionar músicas ao repertório conhecido pelo músico acompanhante.

### 5.10 Gerenciamento de contratantes

O usuário poderá:

-   cadastrar contratantes;
-   editar contratantes;
-   consultar seus dados;
-   associar contratantes às apresentações.

O contratante poderá representar uma pessoa, estabelecimento, empresa ou
responsável por um evento.

### 5.11 Gerenciamento e geração de contratos

Uma apresentação poderá possuir um contrato associado.

O contrato poderá ser gerado a partir de um modelo padrão destinado à
contratação de apresentações musicais.

O modelo deverá utilizar informações existentes na apresentação e no
contratante, como:

-   contratante;
-   CPF ou CNPJ;
-   endereço;
-   data da apresentação;
-   horário;
-   duração;
-   cachê combinado;
-   alimentação incluída;
-   limite de consumação;
-   outras informações aplicáveis.

O usuário poderá:

-   gerar um contrato;
-   visualizar o contrato gerado;
-   editar seu conteúdo;
-   gerar uma versão em PDF;
-   baixar o PDF.

## 6. Entidades principais

### 6.1 Customer

Representa o usuário proprietário da conta.

Campos iniciais:

-   `id`
-   `fullName`
-   `stageName`
-   `cpf`
-   `email`
-   `phone`
-   `instagram`
-   `projects: List<Project>`

### 6.2 Project

Representa um projeto artístico do usuário.

Exemplos:

-   carreira solo;
-   banda;
-   duo;
-   outro projeto musical.

Campos iniciais:

-   `id`
-   `name`
-   `description`
-   `documentNumber` (CPF/CNPJ)
-   `concerts: List<Concert>`

```{=html}
<!-- SUGESTÃO:
"documentNumber" deixa a modelagem aberta para CPF ou CNPJ. Posteriormente
pode ser avaliado se tipo e número do documento devem ser modelados separadamente.
-->
```
### 6.3 Music

Representa uma música cadastrada no acervo do usuário.

Campos iniciais:

-   `id`
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
-   `projects: List<Project>`

`skillLevel` representa o nível de domínio do usuário sobre a música,
podendo também identificar músicas que ainda estão em estudo.

`genre` deverá representar gêneros como:

-   Rock;
-   MPB;
-   Jazz;
-   Bossa Nova;
-   Samba;
-   Blues;
-   Pop Internacional;
-   Pop Nacional;
-   Axé.

### 6.4 Concert

Representa uma apresentação pertencente a um projeto artístico.

Campos iniciais:

-   `id`
-   `setlist`
-   `presentationDate`
-   `durationInHours`
-   `startTime`
-   `finishTime`
-   `totalBreakTime`
-   `contractorId`
-   `agreedFee`
-   `travelCost` (opcional)
-   `paymentStatus`
-   `contractId`

O `setlist` representa a coleção ordenada de músicas que serão
executadas na apresentação.

`travelCost` representa o custo de deslocamento relacionado à
apresentação e poderá ser utilizado futuramente pela camada de controle
financeiro.

`paymentStatus` representa a situação do pagamento do cachê.

```{=html}
<!-- SUGESTÃO:
Valores iniciais possíveis para paymentStatus: PENDING, PARTIALLY_PAID, PAID e CANCELLED.
A lista definitiva deverá ser aprovada antes da implementação.
-->
```
### 6.5 Contract

Representa o contrato relacionado a uma apresentação.

Campos iniciais:

-   `id`
-   `contractorId`
-   `customerId`
-   `concertId`
-   `mealsIncluded`
-   `maximumConsumptionAmount`
-   `agreedFee`
-   `contractText`

O texto do contrato deverá ser editável antes da geração do PDF.

### 6.6 Contractor

Representa a pessoa ou organização responsável pela contratação da
apresentação.

Campos iniciais:

-   `id`
-   `contactPersonName`
-   `documentNumber`
-   `establishmentOrEventName`
-   `address`

### 6.7 AccompanyingMusician

Representa um músico que poderá acompanhar o usuário em apresentações.

Campos iniciais:

-   `id`
-   `name`
-   `cpf`
-   `phone`
-   `address`
-   músicas conhecidas pelo músico

```{=html}
<!-- SUGESTÃO:
A relação das músicas conhecidas pelo músico deverá ser modelada posteriormente,
em vez de definir antecipadamente sua implementação como List<Music>.
-->
```
## 7. Regras de negócio

### 7.1 Músicas

-   Toda música deverá pertencer ao acervo de um usuário.
-   O título e o artista/intérprete identificam conjuntamente uma música
    dentro do acervo do usuário.
-   Uma música poderá pertencer a múltiplos projetos.
-   Uma música poderá participar de múltiplas apresentações.
-   O nível de domínio deverá utilizar somente os valores definidos pelo
    sistema.

### 7.2 Projetos

-   Todo projeto deverá pertencer a um usuário.
-   Um usuário poderá possuir múltiplos projetos.
-   Ao criar uma nova conta, deverá ser criado um projeto padrão
    utilizando inicialmente o nome artístico do usuário.
-   Um projeto poderá possuir múltiplas apresentações.
-   A expansão ou recolhimento de um projeto na interface não deverá
    exigir navegação para outra página.
-   Múltiplos projetos poderão permanecer expandidos simultaneamente.

### 7.3 Apresentações e setlists

-   Toda apresentação deverá pertencer a um projeto.
-   Cada apresentação possuirá seu próprio setlist.
-   O setlist deverá preservar a ordem definida para as músicas.
-   A navegação "próxima música" deverá respeitar a ordem atual do
    setlist.
-   Uma apresentação poderá ser duplicada para servir como base para uma
    nova apresentação.
-   O custo de deslocamento será opcional.
-   O cachê combinado deverá permanecer disponível como dado próprio da
    apresentação para permitir consultas financeiras futuras.

```{=html}
<!-- SUGESTÃO:
Avaliar se uma mesma música poderá aparecer mais de uma vez dentro do mesmo setlist.
Isso precisa ser uma decisão explícita de negócio.

Também deverá ser definido quais dados de Concert serão copiados na operação de duplicação.
-->
```
### 7.4 Contratos

-   Um contrato deverá estar relacionado a uma apresentação.
-   O contrato deverá utilizar os dados da apresentação e do contratante
    para preencher seu modelo inicial.
-   O usuário poderá alterar o texto gerado antes de produzir o PDF.
-   Alterações realizadas no texto do contrato não deverão alterar
    automaticamente os dados originais da apresentação.

### 7.5 Preparação para controle financeiro futuro

-   O MVP não deverá implementar uma camada financeira completa.
-   O cachê deverá ser registrado na apresentação por meio de
    `agreedFee`.
-   O custo de deslocamento poderá ser registrado opcionalmente por meio
    de `travelCost`.
-   A situação do pagamento poderá ser registrada por meio de
    `paymentStatus`.
-   Totais financeiros por período deverão ser calculados a partir das
    apresentações, evitando armazenar valores derivados
    desnecessariamente.

```{=html}
<!-- SUGESTÃO:
Não armazenar inicialmente campos como monthlyRevenue ou profit em Concert,
pois esses valores podem ser calculados a partir dos dados das apresentações
e custos quando a funcionalidade financeira for desenvolvida.
-->
```
## 8. Telas

### 8.1 Login e primeiro acesso

Tela destinada ao cadastro e autenticação do usuário.

### 8.2 Tela principal

Após o login, a tela principal deverá apresentar duas áreas principais:

-   `Músicas`;
-   `Projetos`.

### 8.3 Tela de músicas

Deverá exibir as músicas cadastradas pelo usuário.

Cada item deverá destacar pelo menos:

-   título;
-   tonalidade preferida;
-   ação para adicionar a uma apresentação.

A tela deverá permitir:

-   pesquisar;
-   aplicar filtros;
-   selecionar músicas;
-   adicionar uma música a uma apresentação;
-   adicionar múltiplas músicas a uma apresentação.

### 8.4 Tela de projetos

Deverá exibir os projetos do usuário em uma lista expansível.

O título de cada projeto deverá funcionar como controle para expandir ou
recolher sua linha.

Quando expandido, o projeto deverá exibir imediatamente abaixo dele suas
apresentações.

Exemplo conceitual:

    ▼ Projeto A
       ├── Apresentação 1
       ├── Apresentação 2
       └── Apresentação 3

    ▶ Projeto B

    ▼ Projeto C
       ├── Apresentação 4
       └── Apresentação 5

A tela deverá permitir que vários projetos permaneçam expandidos ao
mesmo tempo, possibilitando ao usuário percorrer por rolagem as
apresentações de diferentes projetos.

Deverão existir ações para:

-   expandir todos os projetos;
-   recolher todos os projetos.

Cada projeto deverá possuir um menu de ações (`...`) contendo:

-   editar;
-   excluir.

As apresentações exibidas dentro de cada projeto deverão ser clicáveis e
levar diretamente à página da apresentação.

Cada apresentação deverá oferecer ações rápidas apropriadas, incluindo:

-   editar;
-   excluir;
-   duplicar.

A duplicação deverá estar disponível diretamente na listagem, sem exigir
que o usuário abra primeiro a apresentação.

### 8.5 Página da apresentação

Deverá exibir o setlist de forma adequada para utilização durante uma
apresentação.

Cada música deverá apresentar pelo menos:

-   título;
-   tonalidade;
-   botão para abrir a letra.

No cabeçalho deverá existir a ação `Adicionar música`.

Também deverá existir acesso às configurações da apresentação.

### 8.6 Tela de seleção de músicas

Deverá exibir as músicas disponíveis para inclusão na apresentação.

As músicas relacionadas ao projeto atual deverão aparecer
prioritariamente.

Cada música deverá possuir uma ação rápida para adicioná-la ao setlist.

Também deverá ser possível selecionar múltiplas músicas.

### 8.7 Tela de letra / modo apresentação

Deverá apresentar a letra da música com visualização otimizada para
utilização durante shows.

Deverá conter:

-   título;
-   tonalidade;
-   letra;
-   ação para avançar para a próxima música;
-   ação para sair;
-   ação para editar a letra.

### 8.8 Configurações da apresentação

Deverá exibir informações como:

-   data;
-   horários;
-   duração;
-   intervalo;
-   local;
-   músicos acompanhantes;
-   contratante;
-   cachê;
-   custo de deslocamento, quando informado;
-   situação do pagamento;
-   contrato.

Deverá possuir uma ação para gerar o contrato.

### 8.9 Tela de contrato

Deverá permitir:

-   visualizar o contrato gerado;
-   editar o texto;
-   gerar PDF;
-   baixar o documento.

## 9. Fluxos principais

### 9.1 Primeiro acesso

Cadastro → criação do Customer → criação automática do projeto padrão →
acesso à aplicação.

### 9.2 Cadastro de música

Músicas → Nova música → preenchimento das informações → salvar → música
disponível no acervo.

### 9.3 Criação de apresentação

Projetos → expandir projeto → Nova apresentação → preencher informações
→ salvar → apresentação exibida dentro do projeto.

### 9.4 Acesso a uma apresentação

Projetos → expandir um ou mais projetos → localizar apresentação →
selecionar apresentação → acessar diretamente a página da apresentação.

### 9.5 Duplicação de apresentação

Projetos → expandir projeto → localizar apresentação → ação Duplicar →
criar nova apresentação baseada na apresentação selecionada →
revisar/alterar os dados necessários → salvar.

### 9.6 Montagem do setlist

Apresentação → Adicionar música → Selecionar músicas → visualizar acervo
→ adicionar músicas → organizar ordem → setlist pronto.

### 9.7 Uso durante uma apresentação

Apresentação → visualizar setlist → selecionar música → abrir letra →
executar música → próxima música → letra seguinte.

### 9.8 Geração de contrato

Apresentação → Configurações → Gerar contrato → preencher modelo com
dados da apresentação → visualizar contrato → editar se necessário →
gerar PDF → baixar documento.

## 10. Requisitos não funcionais

-   A aplicação deverá utilizar abordagem mobile-first.
-   A primeira versão será uma aplicação web acessada através do
    navegador.
-   A interface deverá ser responsiva.
-   A utilização em smartphones deverá ser priorizada.
-   A interface utilizada durante apresentações deverá possuir boa
    legibilidade e exigir poucas interações.
-   A listagem expansível de projetos deverá permanecer simples e
    adequada à navegação por toque e rolagem em smartphones.
-   O projeto deverá permanecer preparado para evolução futura para PWA.
-   Recursos de cache e funcionamento offline poderão ser adicionados
    posteriormente, especialmente para letras e setlists.
-   A aplicação deverá manter os dados de diferentes usuários isolados.
-   Credenciais e informações sensíveis não deverão ser expostas no
    frontend.
