---
trigger: always_on
---

# Final Report Guidelines (User Communication)

Whenever completing a task and presenting the final response/report to the user, strictly follow this structure:

## 1. Visão Geral Funcional (~20% do relatório)
- Explique o que foi implementado em linguagem acessível (linguagem de negócio / funcional).
- Foque em como a funcionalidade funciona na prática para o usuário final e o que mudou na experiência de uso.

## 2. Visão Técnica e Didática (~80% do relatório) — Para Desenvolvedor Java / Spring Boot
- **Público-alvo**: O usuário é um **Desenvolvedor Java Backend (REST API / Spring Boot)** que está aprendendo e evoluindo este projeto em **TypeScript, Next.js e React**.
- Apresente um detalhamento técnico aprofundado das alterações, arquitetura e decisões de design.
- **Faça paralelos explícitos com o ecossistema Java / Spring Boot**:
  - **Server Actions (Next.js)** ↔ `@RestController` / `@PostMapping` / `@Service`
  - **Drizzle ORM** ↔ Spring Data JPA (`@Entity`, `JpaRepository`, Criteria / JPQL)
  - **Zod Schemas** ↔ Bean Validation (`jakarta.validation`, `@Valid`, `@NotBlank`)
  - **TypeScript Interfaces / Types / DTOs** ↔ Java Records, POJOs, DTOs, Generics
  - **Tipos Discriminados e `ActionResult<T>`** ↔ `ResponseEntity<T>`, `Optional<T>` ou pattern `Result<T, E>`
  - **React Hooks (`useMemo`, `useState`, `useCallback`)** ↔ Gerenciamento de estado em memória, cache (`@Cacheable`), memoização
  - **Promises & `async/await`** ↔ `CompletableFuture<T>` / Programação Assíncrona
  - **Imutabilidade em Arrays/Objetos (`[...array].sort()`)** ↔ Streams (`list.stream().sorted().toList()`)
- Explique nuances de TypeScript, tipagem estrita, manipulação assíncrona e boas práticas do ecossistema Next.js para acelerar o aprendizado do usuário neste projeto.
