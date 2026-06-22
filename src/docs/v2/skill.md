---
name: setup-command-system
description: Install the Command System architecture in the project
allowed-tools:
  - write
  - read
---

# Setup Command System

Install the Command System architecture in the current project. This creates all necessary files and directory structure for a complete command-driven architecture.

## What this skill does

Creates a complete Command System implementation with:
- Type helpers for deep key paths and action type inference
- Command bus for handler registration and dispatch
- Transitions store for execution state tracking
- Instance registry for scoped command discovery
- Subject base class for observer pattern
- Main Command class with proxy-based actions API
- Type definitions for Actions, ScopedAction, and configuration

## Files to create

Create the following files in the project:

### 1. src/types/helpers.ts
```typescript
export type ActionPaths<T> = T extends (...args: any[]) => any
  ? never
  : {
      [K in keyof T & string]: T[K] extends (...args: any[]) => any
        ? K
        : `${K}.${ActionPaths<T[K]>}`;
    }[keyof T & string];

export type DeepKeyPaths<T> = T extends object
  ? {
      [K in keyof T & string]: K | `${K}.${DeepKeyPaths<T[K]>}`;
    }[keyof T & string]
  : never;

export type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K | DeepKeys<T[K]>;
    }[keyof T]
  : never;

export type PathValue<
  T,
  P extends string,
> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

export type PayloadFromAction<T> = T extends (
  payload: infer P,
  ...args: any[]
) => any
  ? P
  : never;

export type ReturnFromAction<T> = T extends (...args: any[]) => infer R
  ? Awaited<R>
  : never;
```

### 2. src/utils/dev/index.ts
```typescript
export const dev = {
  isDev: import.meta.env?.MODE === 'development' || process.env.NODE_ENV === 'development',

  run: (fn: () => void) => {
    if (dev.isDev) fn();
  }
};
```

### 3. src/lib/command/subject.ts
```typescript
export class Subject {
  private observers = new Set<() => void>();

  subscribe(observer: () => void) {
    this.observers.add(observer);

    return () => this.observers.delete(observer);
  }

  notify() {
    for (const observer of this.observers) observer();
  }
}
```

### 4. src/lib/command/types.ts
```typescript
import type {
  ActionPaths,
  PathValue,
  PayloadFromAction,
  ReturnFromAction,
} from "#/types/helpers";
import type { Actions } from "./global";

// #region Transitions
export type TransitionKey = unknown | unknown[];
// #endregion

// #region Command Bus
export type Handler<TPayload = unknown, TResult = void> = (
  payload: TPayload,
) => Promise<TResult>;

export type Dispose = () => void;

export type DispatchConfig = {
  transition?: TransitionKey;
};
// #endregion

// #region Instance Registry
export type Instance = {
  id: string;
  label?: string;
};
// #endregion

// #region Actions
export type Config = DispatchConfig & {
  instanceId: string;
};

export type Action<TPayload = undefined, TResult = void> = [TPayload] extends [
  undefined,
]
  ? (payload?: TPayload, config?: DispatchConfig) => Promise<TResult>
  : (payload: TPayload, config?: DispatchConfig) => Promise<TResult>;

export type ScopedAction<TPayload = undefined, TResult = void> = [
  TPayload,
] extends [undefined]
  ? (payload: undefined, config: Config) => Promise<TResult>
  : (payload: TPayload, config: Config) => Promise<TResult>;
// #endregion

// #region Aliases
export type ActionPath = ActionPaths<Actions>;

export type ActionValue<TCommand extends ActionPath> = PathValue<
  Actions,
  TCommand
>;

export type CommandMeta = { label: string };
// #endregion

// #region Derived
export type ActionPayload<TCommand extends ActionPath> = PayloadFromAction<
  ActionValue<TCommand>
>;

export type ActionReturn<TCommand extends ActionPath> = ReturnFromAction<
  ActionValue<TCommand>
>;

export type IsScopedCommand<TCommand extends ActionPath> =
  ActionValue<TCommand> extends (
    payload: any,
    config: Config,
  ) => Promise<any>
    ? true
    : false;

export type HandleConfig<TCommand extends ActionPath> =
  IsScopedCommand<TCommand> extends true
    ? { instanceId: string; meta?: CommandMeta }
    : { instanceId?: string; meta?: CommandMeta };

export type SecondArg<T> = T extends (a: any, b: infer B) => any ? B : never;

export type ScopedCommands = {
  [K in ActionPath]: SecondArg<ActionValue<K>> extends Config ? K : never;
}[ActionPath];

export type UnscopedCommands = Exclude<ActionPath, ScopedCommands>;
// #endregion
```

### 5. src/lib/command/command-bus.ts
```typescript
import { dev } from "#/utils/dev";
import type { TransitionStore } from "./transitions-store";
import type { DispatchConfig, Dispose, Handler } from "./types";

export class CommandBus {
  private handlers: Map<string, Handler> = new Map();

  constructor(private readonly transition: TransitionStore) {}

  handle<TPayload = unknown, TResult = void>(
    command: string,
    handler: Handler<TPayload, TResult>,
  ): Dispose {
    if (this.handlers.has(command)) {
      dev.run(() =>
        console.error(
          `[command]: already exist a handle registered for ${command}`,
        ),
      );
      return () => null;
    }

    this.handlers.set(command, handler as Handler);

    return () => this.dispose(command);
  }

  async dispatch<TResult = void>(
    command: string,
    payload?: unknown,
    config?: DispatchConfig,
  ): Promise<TResult | undefined> {
    dev.run(() => console.info(`[command dispatched]: ${command}`, payload));

    const handler = this.handlers.get(command);
    if (!handler) {
      const message = `[command]: no handler registered for ${command}`;
      dev.run(() => console.error(message));
      return;
    }

    const transitionKey = config?.transition ? config.transition : [command];
    this.transition.start(transitionKey);

    try {
      return (await handler(payload)) as TResult;
    } finally {
      this.transition.done(transitionKey);
    }
  }

  dispose(command: string): void {
    this.handlers.delete(command);
  }
}
```

### 6. src/lib/command/transitions-store.ts
```typescript
import { Subject } from "./subject";
import type { TransitionKey } from "./types";

export class TransitionStore extends Subject {
  private static instance: TransitionStore;

  private counts: Map<string, number> = new Map();

  private constructor() {
    super();
  }

  start(key: TransitionKey) {
    const serializedKey = TransitionStore.serializeKey(key);
    const count = this.counts.get(serializedKey) ?? 0;

    this.counts.set(serializedKey, count + 1);
    this.notify();
  }

  done(key: TransitionKey) {
    const serializedKey = TransitionStore.serializeKey(key);
    const count = (this.counts.get(serializedKey) ?? 0) - 1;

    if (count <= 0) this.counts.delete(serializedKey);
    else this.counts.set(serializedKey, count);

    this.notify();
  }

  isExecuting(key: TransitionKey) {
    const serializedKey = TransitionStore.serializeKey(key);
    return (this.counts.get(serializedKey) ?? 0) > 0;
  }

  static serializeKey(key: TransitionKey) {
    return JSON.stringify(key);
  }

  static getInstance() {
    if (!TransitionStore.instance) {
      TransitionStore.instance = new TransitionStore();
    }

    return TransitionStore.instance;
  }
}
```

### 7. src/lib/command/instance-registry.ts
```typescript
import { Subject } from "./subject";
import type { Instance } from "./types";

export class InstanceRegistry extends Subject {
  private static instance: InstanceRegistry;
  private domains: Map<string, Map<string, Instance>> = new Map();
  private instancesCache: Map<string, readonly Instance[]> = new Map();

  private constructor() {
    super();
  }

  add(domain: string, instance: Instance) {
    if (!this.domains.has(domain)) {
      this.domains.set(domain, new Map());
    }

    this.domains.get(domain)?.set(instance.id, instance);
    this.instancesCache.delete(domain);
    this.notify();
  }

  getInstances(domain: string): readonly Instance[] {
    const cached = this.instancesCache.get(domain);
    if (cached) return cached;

    const fresh = Array.from(this.domains.get(domain)?.values() ?? []);
    this.instancesCache.set(domain, fresh);
    return fresh;
  }

  remove(domain: string, instanceId: string) {
    if (!this.domains.has(domain)) return;

    this.domains.get(domain)?.delete(instanceId);
    this.instancesCache.delete(domain);
    this.notify();
  }

  static getInstance() {
    if (!InstanceRegistry.instance) {
      InstanceRegistry.instance = new InstanceRegistry();
    }

    return InstanceRegistry.instance;
  }
}
```

### 8. src/hooks/use-transition.ts
```typescript
import { useSyncExternalStore } from "react";
import { TransitionStore } from "@/lib/command/transitions-store";

export function useTransition(key: unknown[]) {
  return useSyncExternalStore(
    (callback) => TransitionStore.getInstance().subscribe(callback),
    () => TransitionStore.getInstance().isExecuting(key),
  );
}
```

### 9. src/lib/command/index.ts
```typescript
import type { DeepKeys } from "#/types/helpers";
import { CommandBus } from "./command-bus";
import { InstanceRegistry } from "./instance-registry";
import { TransitionStore } from "./transitions-store";
import type { Actions } from "./global";
import type {
  ActionPath,
  ActionPayload,
  ActionReturn,
  CommandMeta,
  Config,
  Handler,
  ScopedCommands,
  UnscopedCommands,
} from "./types";

export type {
  Action,
  Actions,
  HandleConfig,
  IsScopedCommand,
  ScopedAction,
  UnscopedCommands,
} from "./types";

export class Command {
  private $commandBus: CommandBus;
  private $transitions: TransitionStore;
  private $instanceRegistry: InstanceRegistry;

  constructor() {
    this.$transitions = TransitionStore.getInstance();
    this.$commandBus = new CommandBus(this.$transitions);
    this.$instanceRegistry = InstanceRegistry.getInstance();
  }

  handle<TCommand extends ScopedCommands>(
    command: TCommand,
    handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
    config: {
      instanceId: string;
      meta?: CommandMeta;
    },
  ): () => void;
  handle<TCommand extends UnscopedCommands>(
    command: TCommand,
    handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
    config?: {
      meta?: CommandMeta;
    },
  ): () => void;
  handle<TCommand extends ActionPath>(
    command: TCommand,
    handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
    config?: {
      instanceId?: string;
      meta?: CommandMeta;
    },
  ) {
    const result = this.parseCommand(command, config?.instanceId);
    const { domain, key, instanceId } = result;

    if (domain && instanceId) {
      this.$instanceRegistry.add(domain, {
        id: instanceId,
        label: config?.meta?.label,
      });
    }

    const dispose = this.$commandBus.handle<
      ActionPayload<TCommand>,
      ActionReturn<TCommand>
    >(key, handler);

    return () => {
      if (domain && instanceId)
        this.$instanceRegistry.remove(domain, instanceId);
      dispose();
    };
  }

  dispatch<TCommand extends ActionPath>(
    command: TCommand,
    payload?: ActionPayload<TCommand>,
    config?: Config,
  ) {
    const result = this.parseCommand(command, config?.instanceId);
    return this.$commandBus.dispatch<ActionPayload<TCommand>>(
      result.key,
      payload,
      config,
    );
  }

  getActionsProxy(path: DeepKeys<Actions>[] = []): Actions {
    const self = this;

    return new Proxy(() => {}, {
      get(_target, prop: DeepKeys<Actions>) {
        return self.getActionsProxy([...path, prop]);
      },

      apply(_target, _thisArg, args: [ActionPayload<ActionPath>, Config?]) {
        const commandName = path.join(".") as ActionPath;
        return self.dispatch(commandName, args[0], args[1]);
      },
    }) as unknown as Actions;
  }

  private parseCommand(command: ActionPath, instanceId?: string) {
    const parts = command.split(".");
    const hasDomain = parts.length > 1;

    if (!hasDomain) {
      return { domain: undefined, instanceId, key: command };
    }

    const domain = parts[0];
    const path = parts.slice(1).join(".");
    const key = instanceId ? `${instanceId}:${domain}.${path}` : command;

    return { domain, instanceId, key };
  }
}

export const command = new Command();

export const actions = command.getActionsProxy();
```

### 10. src/lib/command/global.ts
```typescript
import type { Action, ScopedAction } from "./types";

export interface Actions {
  // Define your global actions here
  // Example:
  // counter: {
  //   increment: Action;
  //   decrement: Action;
  //   reset: Action;
  // };
  //
  // content: {
  //   show: ScopedAction<string>;
  // };
}
```

### 11. .devin/rules/command-architecture.md
```markdown
---
trigger: always_on
description: Use this rule when implementing command-driven architecture in the application.
---

# Command Architecture Rule

## Overview

This project uses a **command-based pattern** to centralize all application actions behind a single `actions` object with nested domains and strong observability. The system is framework-agnostic and can be invoked from anywhere (React components, JS modules, stores, etc.).

## Rule Scope

This is the official and only allowed pattern for command-driven communication in the project.

### Key Components

1. **Command System** (`/src/lib/command/`)
2. **Action Types** (`/src/lib/command/types.ts`)
3. **Global Actions** (`/src/lib/command/global.ts`)
4. **Command Bus** (`/src/lib/command/command-bus.ts`)
5. **Transitions Store** (`/src/lib/command/transitions-store.ts`)
6. **Instance Registry** (`/src/lib/command/instance-registry.ts`)

---

## 1. Defining Global Actions

Define global action types in `src/lib/command/global.ts`:

```typescript
// /src/lib/command/global.ts
import type { Action, ScopedAction } from "./types";

export interface Actions {
  counter: {
    increment: Action;
    decrement: Action;
    reset: Action;
  };

  content: {
    show: ScopedAction<string>;
  };
}
```

- **Action**: Global command, no instance required
- **ScopedAction**: Instance-scoped command, requires `instanceId` at registration and dispatch

---

## 2. Defining Feature-Specific Actions (Optional)

For better organization, you can define action types within feature folders using module augmentation:

```typescript
// /src/features/pipeline/types.ts
import type { ScopedAction } from "@/lib/command/types";

declare module "#/lib/command/global" {
  interface Actions {
    pipeline: {
      save: ScopedAction<PipelineData>;
      update: {
        name: ScopedAction<string>;
      };
    };
  }
}
```

This allows you to keep action types close to the feature implementation while maintaining type safety.

---

## 3. Instantiation

The command system is already instantiated in `src/lib/command/index.ts`:

```typescript
import { command, actions } from '@/lib/command';
```

---

## 4. Registering Handlers

### Unscoped Command

```typescript
const disposeIncrement = command.handle("counter.increment", async () => {
  // business logic
  return; // optional return value
});
```

### Scoped Command

```typescript
const disposeAdd = command.handle(
  "pipeline.nodes.add",
  async (node: Node) => {
    // `node` is strongly typed as Node
    return { success: true };
  },
  {
    instanceId: "pipeline-1",
    meta: { label: "Main pipeline" },
  },
);
```

### Cleanup

Always dispose handlers when unmounting:

```typescript
useEffect(() => {
  const dispose1 = command.handle("counter.increment", increment);
  const dispose2 = command.handle("counter.decrement", decrement);

  return () => {
    dispose1();
    dispose2();
  };
}, [increment, decrement]);
```

---

## 5. Dispatching Commands

### Unscoped Dispatch

```typescript
await actions.counter.increment();
await actions.counter.decrement();
await actions.counter.reset();
```

### Scoped Dispatch

```typescript
await actions.pipeline.nodes.add(
  { id: "n1", label: "Filter" },
  { instanceId: "pipeline-1" },
);
```

### Direct Dispatch

```typescript
await command.dispatch("counter.increment");
await command.dispatch("pipeline.nodes.add", payload, {
  instanceId: "pipeline-1",
});
```

---

## 6. Transitions

Track execution state for loading indicators:

### Using the React Hook (Recommended)

```typescript
import { useTransition } from '@/hooks/use-transition';

function CounterButton() {
  const isExecuting = useTransition(["counter.increment"]);

  return (
    <button onClick={() => actions.counter.increment()} disabled={isExecuting}>
      Increment
    </button>
  );
}
```

### Using the Store Directly

```typescript
import { TransitionStore } from '@/lib/command/transitions-store';

const transitions = TransitionStore.getInstance();

// Check if command is executing
const isExecuting = transitions.isExecuting("counter.increment");

// Custom transition key
await actions.counter.increment(undefined, {
  transition: ["custom-key"],
});

const isCustomExecuting = transitions.isExecuting(["custom-key"]);
```

---

## 7. Instance Registry

Discover registered instances for UI integration:

```typescript
import { InstanceRegistry } from '@/lib/command/instance-registry';

const registry = InstanceRegistry.getInstance();

// Get all instances for a domain
const pipelineInstances = registry.getInstances("pipeline");
// Returns: [{ id: "pipeline-1", label: "Main pipeline" }]
```

---

## Complete Example

```typescript
// Component with scoped command
function PipelineEditor({ pipelineId }: { pipelineId: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);

  const addNode = useCallback(async (node: Node) => {
    setNodes((prev) => [...prev, node]);
  }, []);

  useEffect(() => {
    const dispose = command.handle("pipeline.nodes.add", addNode, {
      instanceId: pipelineId,
      meta: { label: `Pipeline ${pipelineId}` },
    });

    return () => dispose();
  }, [pipelineId, addNode]);

  const handleAddNode = () => {
    actions.pipeline.nodes.add(
      { id: crypto.randomUUID(), label: "New Node" },
      { instanceId: pipelineId },
    );
  };

  return <button onClick={handleAddNode}>Add Node</button>;
}
```

---

## Checklist

* [ ] Define global action types in `src/lib/command/global.ts`
* [ ] Define feature-specific action types using module augmentation (if needed)
* [ ] Register handlers with proper cleanup
* [ ] Use `instanceId` for scoped commands
* [ ] Dispatch commands via `actions` proxy or `command.dispatch`
* [ ] Implement transitions for loading states
* [ ] Use instance registry for discovery (if needed)

---

## Best Practices

1. **Always cleanup handlers** - call dispose function on unmount
2. **Strong typing** - define payloads and returns in action types
3. **Global actions** - define in `src/lib/command/global.ts` for shared actions
4. **Feature-specific actions** - use module augmentation in feature folders for better organization
5. **Scoped commands** - use for domain-specific instances (editors, modals, etc.)
6. **Unscoped commands** - use for global actions (navigation, auth, etc.)
7. **Transitions** - track execution state for loading indicators
8. **Instance registry** - leverage for UI pickers and instance discovery
9. **Consistent naming** - use dotted paths (e.g., `domain.subdomain.action`)
```

## Instructions

Create all the files listed above in the project. Ensure the directory structure is correct and all imports use the appropriate path aliases (e.g., `#/types/helpers`, `#/utils/dev`, etc.).

After installation, you can:

```typescript
import { command, actions } from '@/lib/command';

// Register handlers
command.handle('counter.increment', async () => {
  // business logic
});

// Dispatch commands
await actions.counter.increment();
```

## Notes

- The implementation is framework-agnostic and works with any JavaScript/TypeScript project
- Strong typing ensures compile-time safety for command paths and payloads
- Supports both global (unscoped) and instance-scoped commands
- Includes transition tracking for loading states
- Instance registry enables UI integration for scoped commands
- Global actions are defined in `src/lib/command/global.ts`
- Feature-specific actions can be added using module augmentation in feature folders
