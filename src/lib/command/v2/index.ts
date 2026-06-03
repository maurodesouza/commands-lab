import type { DispatchConfig, Handler } from "./command-bus";
import { CommandBusV2 } from "./command-bus";
import { ScopeRegistry } from "./scope-registry";
import { TransitionStoreV2 } from "./transitions-store";

type Config = DispatchConfig & {
	target: string;
};

export type Action<TPayload = void> = [TPayload] extends [void]
	? (payload?: TPayload, config?: DispatchConfig) => void
	: (payload: TPayload, config?: DispatchConfig) => void;

export type ScopedAction<TPayload = void> = [TPayload] extends [void]
	? (payload: undefined, config: Config) => void
	: (payload: TPayload, config: Config) => void;

export interface ActionsV2 {
	counter: {
		increment: Action;
		decrement: Action;
		reset: Action;
	};

	content: {
		show: ScopedAction<string>;
	};

	async: {
		execute: Action;
	};
}

export class CommandV2 {
	private $commandBus: CommandBusV2;
	private $transitions: TransitionStoreV2;
	private $scopeRegistry: ScopeRegistry;

	constructor() {
		this.$transitions = TransitionStoreV2.getInstance();
		this.$commandBus = new CommandBusV2(this.$transitions);
		this.$scopeRegistry = ScopeRegistry.getInstance();
	}

	handle<TPayload = unknown, TResult = unknown>(
		command: string,
		handler: Handler<TPayload, TResult>,
		config?: { target: string; meta?: { label: string } },
	) {
		const result = this.parseCommand(command, config?.target);
		const { domain, key, target } = result;

		if (domain && target) {
			this.$scopeRegistry.add(domain, {
				id: target,
				label: config?.meta?.label,
			});
		}

		const dispose = this.$commandBus.handle<TPayload, TResult>(key, handler);

		return () => {
			if (domain && target) this.$scopeRegistry.remove(domain, target);
			dispose();
		};
	}

	dispatch<TPayload = unknown>(
		command: string,
		payload?: TPayload,
		config?: Config,
	) {
		const result = this.parseCommand(command, config?.target);
		return this.$commandBus.dispatch<TPayload>(result.key, payload, config);
	}

	registers(domain: string) {
		return this.$scopeRegistry.getInstances(domain);
	}

	getActionsProxy(path: string[] = []): ActionsV2 {
		const self = this;

		return new Proxy(() => {}, {
			get(_target, prop: string) {
				return self.getActionsProxy([...path, prop]);
			},

			apply(_target, _thisArg, args: [unknown, Config?]) {
				const commandName = path.join(".");
				return self.dispatch(commandName, args[0], args[1]);
			},
		}) as unknown as ActionsV2;
	}

	private parseCommand(command: string, target?: string) {
		const parts = command.split(".");
		const hasDomain = parts.length > 1;

		if (!hasDomain) {
			return { domain: undefined, path: command, target, key: command };
		}

		const domain = parts[0];
		const path = parts.slice(1).join(".");
		const key = target ? `${target}:${domain}.${path}` : command;

		return { domain, path, target, key };
	}
}

export const commandV2 = new CommandV2();

export const actionsV2 = commandV2.getActionsProxy();
