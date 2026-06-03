import type { DispatchConfig, Handler, Return } from "./command-bus";
import { CommandBusV2 } from "./command-bus";
import { InstanceRegistry } from "./instance-registry";
import { TransitionStoreV2 } from "./transitions-store";

type Config = DispatchConfig & {
	instanceId: string;
};

export type Action<TPayload = undefined> = [TPayload] extends [undefined]
	? (payload?: TPayload, config?: DispatchConfig) => Promise<Return>
	: (payload: TPayload, config?: DispatchConfig) => Promise<Return>;

export type ScopedAction<TPayload = undefined> = [TPayload] extends [undefined]
	? (payload: undefined, config: Config) => Promise<Return>
	: (payload: TPayload, config: Config) => Promise<Return>;

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
	private $instanceRegistry: InstanceRegistry;

	constructor() {
		this.$transitions = TransitionStoreV2.getInstance();
		this.$commandBus = new CommandBusV2(this.$transitions);
		this.$instanceRegistry = InstanceRegistry.getInstance();
	}

	/**
	 * Registers a handler for a command.
	 *
	 * Runtime contract: if a command is dispatched with an `instanceId`, the
	 * handler MUST be registered with the same `instanceId`. The registry uses
	 * `instanceId` to build the internal key (`${instanceId}:${domain}.${path}`);
	 * a mismatch between registration and dispatch keys results in a silent no-op.
	 * This is not enforced at the type level — passing `instanceId` is a runtime
	 * obligation determined by how the command is dispatched.
	 */
	handle<TPayload = unknown, TResult = unknown>(
		command: string,
		handler: Handler<TPayload, TResult>,
		config?: { instanceId: string; meta?: { label: string } },
	) {
		const result = this.parseCommand(command, config?.instanceId);
		const { domain, key, instanceId } = result;

		if (domain && instanceId) {
			this.$instanceRegistry.add(domain, {
				id: instanceId,
				label: config?.meta?.label,
			});
		}

		const dispose = this.$commandBus.handle<TPayload, TResult>(key, handler);

		return () => {
			if (domain && instanceId)
				this.$instanceRegistry.remove(domain, instanceId);
			dispose();
		};
	}

	dispatch<TPayload = unknown>(
		command: string,
		payload?: TPayload,
		config?: Config,
	) {
		const result = this.parseCommand(command, config?.instanceId);
		return this.$commandBus.dispatch<TPayload>(result.key, payload, config);
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

	private parseCommand(command: string, instanceId?: string) {
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

export const commandV2 = new CommandV2();

export const actionsV2 = commandV2.getActionsProxy();
