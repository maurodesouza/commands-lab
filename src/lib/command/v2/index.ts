import type {
	ActionPaths,
	DeepKeys,
	PathValue,
	PayloadFromAction,
	ReturnFromAction,
} from "#/types/helpers";
import type { DispatchConfig, Handler } from "./command-bus";
import { CommandBusV2 } from "./command-bus";
import { InstanceRegistry } from "./instance-registry";
import { TransitionStoreV2 } from "./transitions-store";

type Config = DispatchConfig & {
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

type Test = PathValue<ActionsV2, "content.show">;
export type TestPayload = PayloadFromAction<Test>;

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

type ActionPayload<TCommand extends ActionPaths<ActionsV2>> = PayloadFromAction<
	PathValue<ActionsV2, TCommand>
>;

type ActionReturn<TCommand extends ActionPaths<ActionsV2>> = ReturnFromAction<
	PathValue<ActionsV2, TCommand>
>;

export type IsScopedCommand<TCommand extends ActionPaths<ActionsV2>> =
	PathValue<ActionsV2, TCommand> extends (
		payload: any,
		config: Config,
	) => Promise<any>
		? true
		: false;

export type HandleConfig<TCommand extends ActionPaths<ActionsV2>> =
	IsScopedCommand<TCommand> extends true
		? { instanceId: string; meta?: { label: string } }
		: { instanceId?: string; meta?: { label: string } };

type SecondArg<T> = T extends (a: any, b: infer B) => any ? B : never;

type ScopedCommands = {
	[K in ActionPaths<ActionsV2>]: SecondArg<
		PathValue<ActionsV2, K>
	> extends Config
		? K
		: never;
}[ActionPaths<ActionsV2>];

export type UnscopedCommands = Exclude<ActionPaths<ActionsV2>, ScopedCommands>;

export type TestScoped = ScopedCommands;
export type TestUnscoped = UnscopedCommands;

export class CommandV2 {
	private $commandBus: CommandBusV2;
	private $transitions: TransitionStoreV2;
	private $instanceRegistry: InstanceRegistry;

	constructor() {
		this.$transitions = TransitionStoreV2.getInstance();
		this.$commandBus = new CommandBusV2(this.$transitions);
		this.$instanceRegistry = InstanceRegistry.getInstance();
	}

	handle<TCommand extends ScopedCommands>(
		command: TCommand,
		handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
		config: {
			instanceId: string;
			meta?: { label: string };
		},
	): () => void;
	handle<TCommand extends UnscopedCommands>(
		command: TCommand,
		handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
		config?: {
			meta?: { label: string };
		},
	): () => void;
	handle<TCommand extends ActionPaths<ActionsV2>>(
		command: TCommand,
		handler: Handler<ActionPayload<TCommand>, ActionReturn<TCommand>>,
		config?: {
			instanceId?: string;
			meta?: { label: string };
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

	dispatch<TCommand extends ActionPaths<ActionsV2>>(
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

	getActionsProxy(path: DeepKeys<ActionsV2>[] = []): ActionsV2 {
		const self = this;

		return new Proxy(() => {}, {
			get(_target, prop: DeepKeys<ActionsV2>) {
				return self.getActionsProxy([...path, prop]);
			},

			apply(
				_target,
				_thisArg,
				args: [ActionPayload<ActionPaths<ActionsV2>>, Config?],
			) {
				const commandName = path.join(".") as ActionPaths<ActionsV2>;
				return self.dispatch(commandName, args[0], args[1]);
			},
		}) as unknown as ActionsV2;
	}

	private parseCommand(command: ActionPaths<ActionsV2>, instanceId?: string) {
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
