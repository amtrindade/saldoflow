# Especificacao: Autenticacao para acesso aos dados financeiros

**Status:** Rascunho para avaliacao; metodo de login ainda nao escolhido  
**Fase:** Pesquisa e definicao de requisitos, sem implementacao  
**Data da pesquisa:** 2026-10-06

## 1. Pergunta e resposta curta

**A autenticacao deve vir antes da persistencia de dados reais? Sim, para a arquitetura avaliada.** Como a aplicacao React/Vite acessaria o Supabase diretamente pelo browser, cada acesso a dados privados precisa carregar uma identidade verificavel. As politicas RLS usam essa identidade para restringir linhas ao usuario correto.

Isso nao impede criar o esquema do banco ou testar migracoes localmente antes de Auth. Impede liberar consultas e gravacoes de dados reais sem uma identidade autenticada e politicas RLS testadas. Autenticacao e autorizacao sao coisas diferentes: fazer login nao protege tabelas por si so.

## 2. Objetivo

Comparar opcoes de autenticacao adequadas ao SaldoFlow, identificar seus custos operacionais e definir requisitos para selecionar uma opcao antes de conectar a base Supabase a dados financeiros reais.

## 3. Metodo e limites da pesquisa

Foram consultados exemplos de codigo e documentacao publica no GitHub, incluindo exemplos do proprio Supabase, Auth0 e Auth.js. Os resultados mostram abordagens implementadas em projetos reais; nao medem participacao de mercado, popularidade relativa ou preferencia de usuarios. Portanto, este documento usa a expressao **padrao observado nos exemplos**, nao ranking de mercado.

A pesquisa textual nao encontrou exemplos de passkeys nos arquivos consultados do repositorio Supabase; isso nao prova indisponibilidade do recurso nem baixa adocao. Passkeys ficam fora da comparacao principal desta primeira decisao.

## 4. Contexto do produto

- SaldoFlow e uma aplicacao financeira pessoal, hoje sem conta de usuario.
- A base proposta e Supabase/Postgres e a interface e React/Vite no browser.
- Os dados importados incluem historico de receitas, despesas, transferencias e cartao; devem ser tratados como privados.
- A aplicacao ainda e uma PoC. Nao existe decisao sobre cadastro publico, numero de usuarios ou compartilhamento de dados.

## 5. Evidencias observadas no GitHub

- Os exemplos de autenticacao do Supabase incluem `signInWithPassword` em [exemplo Next.js de login](https://github.com/supabase/supabase/blob/master/examples/auth/nextjs-full/app/login/actions.ts) e em [exemplo de gestao de usuarios](https://github.com/supabase/supabase/blob/master/examples/user-management/nextjs-user-management/app/login/actions.ts).
- O repositorio apresenta login sem senha via `signInWithOtp` em [provider de autenticacao Refine](https://github.com/supabase/supabase/blob/master/examples/user-management/refine-user-management/src/authProvider.ts) e em [servico Angular](https://github.com/supabase/supabase/blob/master/examples/user-management/angular-user-management/src/app/supabase.service.ts).
- O login OAuth aparece com `signInWithOAuth` nos [snippets de documentacao do Supabase](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/Docs/Snippets.ts).
- O exemplo React do Auth0 inicia login redirecionado ao provedor em [NavBar.jsx](https://github.com/auth0-samples/auth0-react-samples/blob/master/Sample-01/src/components/NavBar.jsx).
- A documentacao de tipos do Auth.js descreve contas de provedores OAuth/OIDC e de e-mail em [adapters.ts](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/adapters.ts).

Os arquivos exemplificam implementacoes, nao dizem qual metodo e mais usado entre os usuarios. Os links de GitHub podem mudar de branch ou caminho ao longo do tempo.

## 6. Opcoes consideradas

| Opcao | Experiencia | Esforco e dependencias | Avaliacao para esta app |
| --- | --- | --- | --- |
| E-mail e senha | Cadastro/login tradicional; exige senha e fluxo de recuperacao | Medio: formularios, validacao, confirmacao/recuperacao e entrega de e-mail conforme configuracao | Familiar e independente de conta Google; exige cuidar de senha e suporte a recuperacao. |
| Link ou codigo por e-mail (OTP) | A pessoa informa e-mail e confirma pelo link/codigo recebido | Medio: fluxo de retorno/redirect, expiracao, feedback e entrega confiavel de e-mail | Reduz gestao de senhas no produto; depende de acesso ao e-mail e de configuracao de envio adequada. |
| OAuth com Google | Redireciona para uma conta Google e retorna autenticado | Medio a alto: credenciais do provedor, URLs de retorno por ambiente, consentimento e tratamento de cancelamento | Pode reduzir friccao para quem ja usa Google; adiciona dependencia e configuracao externa. |
| Provedor externo (ex.: Auth0/Auth.js ou outro) | O provedor oferece ou orquestra um ou mais metodos | Alto para o escopo atual: configurar outro produto, sincronizar identidade/JWT com RLS e operar duas fronteiras de configuracao | Nao recomendado para a primeira entrega, salvo requisito de produto que Supabase Auth nao atenda. |

As tres primeiras opcoes podem ser oferecidas pelo Supabase Auth, mantendo uma fonte de identidade integrada as politicas Postgres. A escolha do metodo de login e separada da escolha do provedor de identidade.

## 7. Recomendacao para avaliacao

1. Adotar Supabase Auth como provedor inicial, pois a base planejada tambem e Supabase. Isso reduz componentes e simplifica o uso da identidade autenticada nas politicas RLS.
2. Escolher um unico metodo para a primeira versao, sem habilitar simultaneamente senha, OTP e OAuth antes de validar cadastro, recuperacao, redirects e suporte.
3. Manter **e-mail/senha** e **OTP por e-mail** como finalistas. A decisao entre os dois depende de preferencia de UX e do ambiente de entrega de e-mail; OAuth Google pode ser uma melhoria posterior.
4. Nao considerar o banco pronto para uso com dados reais ate que as politicas RLS e os testes de isolamento estejam aprovados.

**Escolha pendente do responsavel pelo produto:** [DECISAO NECESSARIA: preferir login tradicional com senha ou link/codigo sem senha? A aplicacao sera de uso individual fechado ou tera cadastro de varios usuarios?]

## 8. Escopo da autenticacao inicial

### Incluido

- Criar conta ou permitir entrada de um usuario previamente provisionado, conforme a decisao sobre cadastro.
- Iniciar sessao, encerrar sessao e restaurar sessao valida apos recarga.
- Exibir estados de carregamento, erro, sessao expirada e acesso nao autenticado.
- Proteger as telas/acoes que consultam ou alteram dados financeiros.
- Passar a identidade autenticada ao Supabase e aplicar isolamento RLS em cada tabela privada.
- Fluxo de recuperacao de acesso se o metodo escolhido usar senha, ou reenvio/expiracao de OTP conforme o metodo escolhido.

### Fora do escopo inicial

- Login por telefone/SMS, multiplos provedores simultaneos, organizacoes, convites, papeis administrativos, MFA obrigatorio e passkeys.
- Criar um sistema proprio de armazenamento de senhas ou um backend de identidade customizado.
- Compartilhar extratos entre usuarios.

## 9. Cenarios e requisitos

### Cenario 1: acesso valido (P1)

**Dado** que a pessoa possui uma conta permitida  
**Quando** conclui o metodo de autenticacao escolhido  
**Entao** a aplicacao inicia uma sessao e permite carregar apenas os dados pertencentes a essa identidade.

### Cenario 2: sem sessao ou sessao expirada (P1)

**Dado** que a pessoa nao esta autenticada ou sua sessao expirou  
**Quando** tenta abrir o dashboard persistido ou importar dados  
**Entao** a aplicacao solicita autenticacao e nao envia operacoes privadas anonimas.

### Cenario 3: isolamento (P1)

**Dado** dois usuarios diferentes e registros de ambos no banco  
**Quando** um tenta consultar ou alterar registros do outro  
**Entao** a operacao e negada ou nao retorna registros alheios, inclusive se for feita fora da interface.

### Cenario 4: cancelamento ou erro no provedor (P1)

**Dado** que a pessoa cancela o OAuth, usa um link expirado ou ocorre falha no envio/validacao  
**Quando** o fluxo termina sem autenticacao  
**Entao** a aplicacao apresenta uma mensagem clara, nao cria uma sessao parcial e permite tentar novamente.

### Requisitos funcionais

- **REQ-001:** A aplicacao deve implementar o metodo escolhido sem armazenar senhas em codigo, storage proprio ou logs da aplicacao.
- **REQ-002:** Operacoes de leitura e escrita de dados financeiros devem exigir sessao valida.
- **REQ-003:** Encerrar sessao deve remover o estado de autenticacao local e bloquear o acesso seguinte a dados protegidos.
- **REQ-004:** O sistema deve associar cada linha privada ao identificador de usuario autenticado e validar essa associacao no banco por RLS, nao apenas na interface.
- **REQ-005:** O metodo escolhido deve ter tratamento para falha, cancelamento, expiracao e retorno/redirect invalido.
- **REQ-006:** A politica de cadastro deve ser explicita: cadastro aberto, convite ou usuario previamente provisionado.
- **REQ-007:** Se for escolhido e-mail/senha, deve existir um caminho de recuperacao de acesso testado. Se for escolhido OTP, devem existir limites/feedback para reenvio e tratamento de token expirado ou utilizado.

### Requisitos nao funcionais

- **REQ-008:** A chave publica do Supabase pode ser configurada no frontend; nenhuma chave secreta ou `service_role` pode estar no bundle, variaveis Vite publicas ou repositorio.
- **REQ-009:** Toda tabela acessivel pela API que contem dados privados deve ter RLS ativada e grants minimos, com politica para cada operacao habilitada.
- **REQ-010:** Testes devem provar acesso permitido do dono e negar leitura/criacao/alteracao/exclusao por outro usuario e por visitante anonimo.
- **REQ-011:** Tokens, links de acesso e dados financeiros nao devem ser registrados em logs nem em mensagens de erro.
- **REQ-012:** A sessao deve ser restaurada de forma previsivel apos recarga e removida ao sair ou quando invalidada.

## 10. Criterios para selecionar o metodo

- A pessoa consegue autenticar e retornar ao app no navegador suportado, inclusive em ambiente de deploy.
- O fluxo de recuperacao ou reenvio e compreensivel e testavel.
- O metodo nao depende de segredos do provedor no frontend.
- O envio de e-mail e os dominios/redirects necessarios estao configurados antes do uso de producao.
- A identidade resultante pode ser aplicada de modo verificavel nas politicas RLS.
- O custo de suporte e de operacao e aceitavel para o publico alvo definido.

## 11. Complexidade e riscos

- **Supabase Auth + e-mail/senha:** complexidade media. O provedor gerencia credenciais; a app ainda precisa tratar cadastro, login, recuperacao e sessao.
- **Supabase Auth + OTP:** complexidade media. Evita senha no produto, mas aumenta a dependencia de email, redirects e qualidade de entrega.
- **OAuth Google:** complexidade media/alta. Alem da interface, exige configuracao de credenciais e URLs de retorno para cada ambiente, e pode falhar/cancelar fora do controle da app.
- **RLS e testes:** complexidade media/alta e obrigatoria para todas as opcoes; login nao substitui autorizacao por linha.
- **Provedor externo:** complexidade alta para esta PoC, devido a integracao de JWT/claims e manutencao de identidade separada do banco.

## 12. Criterios de pronto para iniciar persistencia real

- Metodo de autenticacao e politica de cadastro aprovados.
- Sessao, saida e recuperacao/reenvio implementados para o metodo escolhido.
- URLs de retorno e entrega de e-mail/provedor verificadas no ambiente de teste.
- Tabelas privadas com RLS, grants minimos e testes de isolamento passando.
- Nenhuma chave secreta no cliente e nenhum fluxo anonimo com acesso a dados financeiros.

## 13. Fontes

### GitHub: exemplos de implementacao

- [Supabase: login com senha em exemplo Next.js](https://github.com/supabase/supabase/blob/master/examples/auth/nextjs-full/app/login/actions.ts)
- [Supabase: login por OTP em exemplo Refine](https://github.com/supabase/supabase/blob/master/examples/user-management/refine-user-management/src/authProvider.ts)
- [Supabase: login OAuth nos snippets oficiais](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/Docs/Snippets.ts)
- [Auth0: inicio de login redirecionado em exemplo React](https://github.com/auth0-samples/auth0-react-samples/blob/master/Sample-01/src/components/NavBar.jsx)
- [Auth.js: tipos de contas OAuth/OIDC e e-mail](https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/adapters.ts)

### Documentacao do Supabase

- [React quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Senha por e-mail](https://supabase.com/docs/guides/auth/passwords)
- [Login sem senha por e-mail](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Login social com Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
