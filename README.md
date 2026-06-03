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

  #### Overview

  V2 introduces explicit per-instance scoping and stronger typing across the command system.

  - Explicit context via `instanceId` passed on registration (`handle`) and dispatch (for scoped commands)
  - Discoverable instances by domain through an `InstanceRegistry` (useful for UI pickers/lists)
  - Predictable transitions via a simple ref-count store (no abort/cancel semantics)
  - Same ergonomic, nested API through a Proxy-backed `actions` object

  Mental model: commands are named by dotted paths (e.g., `counter.increment`, `pipeline.nodes.add`). If a command is instance-scoped, you must register it with an `instanceId` and also dispatch with the same `instanceId` — the internal key becomes `${instanceId}:domain.path`.

  #### Examples

  Define the action surface (for docs’ examples):

  ```ts
  // Types are provided by the V2 module: Action and ScopedAction
  type Node = { id: string; label: string };

  export interface Actions {
    counter: {
      increment: Action;
      decrement: Action;
      reset: Action;
    };

    pipeline: {
      nodes: {
        add: ScopedAction<Node>;
      };
    };
  }
  ```

  Register handlers:

  ```ts
  // Unscoped command
  const disposeInc = command.handle("counter.increment", async () => {
    // business logic
  });

  // Scoped command — requires instanceId at registration
  const disposeAdd = command.handle(
    "pipeline.nodes.add",
    async (node) => {
      // `node` is strongly typed as Node
    },
    { instanceId: "pipeline-1", meta: { label: "Main pipeline" } },
  );

  // Type errors showcase
  command.handle(
    "pipeline.nodes.add",
    async (id: number) => {}, // TS Error: number is not assignable to Node
    { instanceId: "pipeline-1" },
  );

  command.handle("pipeline.nodes.add", async (node) => {});
  //                        ^ TS Error: instanceId is required for scoped commands
  ```

  Dispatching:

  ```ts
  // Unscoped
  await actions.counter.increment();

  // Scoped — requires instanceId at call site
  await actions.pipeline.nodes.add({ id: "n1", label: "Filter" }, {
    instanceId: "pipeline-1",
  });

  await actions.pipeline.nodes.add({ id: "n1", label: "Filter" });
  //                                 ^ TS Error: instanceId is required for scoped commands
  ```

  Notes:
  - This section omits instantiation for brevity; examples assume ready-to-use `command` and `actions`.
  - Strong typing for command paths and payloads is powered by utility types in `src/types/helpers.ts` and V2’s `types.ts`.

  #### V1 → V2: What changed

  - Scoping model
    - V1: implicit/hidden scope via `CommandV1.scope()` and proxy-composed keys
    - V2: explicit `instanceId` provided at registration and dispatch for scoped commands
  - Instance discovery
    - V1: no authoritative registry — contexts weren’t enumerable
    - V2: `InstanceRegistry` tracks instances per domain for UI integration
  - Transitions
    - V1: no cancellation (AbortController existed but unused); started transitions before handler lookup, risking leaked counts on unknown commands
    - V2: ref-counted keys for predictable “is executing” state, balanced start/done
  - Typing and DX
    - V1: Proxy could suggest callable paths without handlers; weaker guarantees
    - V2: strongly typed action paths/payloads; compiler enforces `instanceId` on scoped commands and payload types in `handle`/dispatch
  - Dispatch path
    - V2 ensures transition start only after a handler is found, preventing leaked counts for unknown commands

  #### Known issues / limitations

  - No async cancellation: you cannot cancel previous in-flight calls or enforce “keep latest” out of the box
  - Runtime contract: for scoped commands, the `instanceId` in `dispatch` must match the one in `handle` registration; otherwise it won’t resolve (key mismatch)
  - Potential future work: cancellation tokens, coalescing/dedup per transition key, policy layers (e.g., keep-latest)
</details>

<details>
  <summary>V3</summary>
  <div align="center">
    <img src="https://media1.tenor.com/m/N9fIeXCcZpQAAAAC/brick-brick-by-brick.gif" alt="Green octopus cartoon building a brick wall">
  </div>
</details>
