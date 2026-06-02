# Commands Lab (experimental)

Centralized actions API lab exploring how to model all application actions behind a single `actions` object with nested domains and strong observability.

## Overview

This repository is a personal laboratory to experiment with a unified, framework-agnostic actions API that can be invoked from anywhere (React components, JS modules, stores, etc.). The goals are:

- **Single entrypoint**: call actions as `actions.domain.action()` or `actions.domain.subdomain.action()`.
- **Traceability**: know when an action starts/finishes and whether it’s running (transitions/executing state).
- **Result retrieval**: actions return `[result, error]` tuples, enabling ergonomic async calling.
- **Fast dispatch path**: support `actions.dispatch(command, payload, config?)` to plug into SSE/realtime easily.
- **Context support**: isolate multiple concurrent “contexts” (e.g., two pipeline editors) so actions for context A don’t affect B, while still allowing global calls from anywhere.

This is not a package or product. It’s a playground to evaluate API designs, ergonomics, and pitfalls.

## Versions

- **V1**: Proxy-based, scoped actions with a command bus and transition tracking. Solves centralized calls and basic traceability, but has clarity and scoping pitfalls.

<details>
  <summary>V1</summary>

#### Overview

The V1 prototype is under `src/lib/command/v1` and demonstrated by `src/components/v1` on the `/v1` route.

- **Core building blocks**
  - `CommandV1`, `CommandBusV1`: register handlers and dispatch commands.
  - `ActionsV1`: a Proxy that maps nested member access/calls to command names (e.g., `actionsV1.counter.increment()` → "counter.increment").
  - `TransitionStoreV1`: tracks in-flight executions so the UI can reflect loading states via `useTransitionV1`.
- **Examples**
  - Counter (`counter.increment`, `counter.decrement`, `counter.reset`).
  - Content (`content.show`).
  - Async demo with transitions and disabled UI while executing.

#### Issues

- **Hidden contexts**
  - Context IDs are internal to `CommandV1.scope()` and not discoverable or enumerable; you can’t tell which contexts exist.
- **Implicit scope in dispatch**
  - The Proxy composes command keys with the current scope. Calls that look global (e.g., `actions.content.show()`) may be scoped implicitly. In `src/components/v1/show-content`, TypeScript can suggest `actions.async.execute()`, but it won’t work from that context because the emitted command name is scope-prefixed.
- **Type/runtime mismatch**
  - The Proxy makes any nested property callable; TypeScript can suggest methods without a registered handler, leading to misleading affordances and runtime no-ops.
- **Unclear context ergonomics**
  - The API doesn’t make it obvious when you’re using a scoped vs global proxy, nor how to safely target multiple contexts from anywhere.
</details>

<details>
  <summary>V2</summary>
  <div align="center">
    <img src="https://media1.tenor.com/m/N9fIeXCcZpQAAAAC/brick-brick-by-brick.gif" alt="Green octopus cartoon building a brick wall">
  </div>
</details>