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

export interface Actions {
  // Define your actions here
  // Example:
  // counter: {
  //   increment: Action;
  //   decrement: Action;
  //   reset: Action;
  // };
  //
  // pipeline: {
  //   nodes: {
  //     add: ScopedAction<Node>;
  //   };
  // };
}
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

### 8. src/lib/command/index.ts
```typescript
import type { DeepKeys } from "#/types/helpers";
import { CommandBus } from "./command-bus";
import { InstanceRegistry } from "./instance-registry";
import { TransitionStore } from "./transitions-store";
import type {
  ActionPath,
  ActionPayload,
  ActionReturn,
  Actions,
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
