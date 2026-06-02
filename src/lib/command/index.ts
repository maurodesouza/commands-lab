import type { DispatchConfig, Handler } from "./command-bus";
import { CommandBus } from "./command-bus";
import { TransitionStore } from "./transitions-store";

export interface Actions {
    counter: {
        increment: () => void;
        decrement: () => void;
        reset: () => void;
    };
}

export class Command {
    private $scope?: string;

    private $commandBus: CommandBus;
    private $transitions: TransitionStore;

    constructor(scope?: string) {
        this.$scope = scope;

        this.$transitions = TransitionStore.getInstance();
        this.$commandBus = new CommandBus(this.$transitions);
    }

    handle<TPayload = unknown, TResult = unknown>(command: string, handler: Handler<TPayload, TResult>) {
        return this.$commandBus.handle<TPayload, TResult>(this.buildKey(command), handler);
    }

    dispatch<TPayload = unknown>(command: string, payload?: TPayload, config?: DispatchConfig) {
        return this.$commandBus.dispatch<TPayload>(this.buildKey(command), payload, config);
    }

    getActionsProxy(argPath?: string[]): Actions {
        const path = argPath ?? (this.$scope ? [this.$scope] : []);
        const self = this

        return new Proxy(() => {}, {
            get(_target, prop: string) {
                return self.getActionsProxy([...path, prop]);
            },

            apply(_target, _thisArg, args: unknown[]) {
                const commandName = path.join(".");
                return self.$commandBus.dispatch(commandName, args[0], args[1] as DispatchConfig);
            },
        }) as unknown as Actions;
    }

    private buildKey(command: string) {
        return this.$scope ? `${this.$scope}.${command}` : command;
    }

    static scope(scope?: string) {
        const prefix = "$$scope"
        const id = scope ?? Math.random().toString(36).substring(2, 15)
        const key = `${prefix}:${id}`

        return new Command(key);
    }
}

export const command = new Command();

export const actions = command.getActionsProxy();
