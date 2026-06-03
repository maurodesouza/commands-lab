import type { DeepKeys } from "#/types/helpers";
import { CommandBusV2 } from "./command-bus";
import { InstanceRegistry } from "./instance-registry";
import { TransitionStoreV2 } from "./transitions-store";
import type {
	ActionPath,
	ActionPayload,
	ActionReturn,
	ActionsV2,
	CommandMeta,
	Config,
	Handler,
	ScopedCommands,
	UnscopedCommands,
} from "./types";

export type {
	Action,
	ActionsV2,
	HandleConfig,
	IsScopedCommand,
	ScopedAction,
	UnscopedCommands,
} from "./types";

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

	getActionsProxy(path: DeepKeys<ActionsV2>[] = []): ActionsV2 {
		const self = this;

		return new Proxy(() => {}, {
			get(_target, prop: DeepKeys<ActionsV2>) {
				return self.getActionsProxy([...path, prop]);
			},

			apply(_target, _thisArg, args: [ActionPayload<ActionPath>, Config?]) {
				const commandName = path.join(".") as ActionPath;
				return self.dispatch(commandName, args[0], args[1]);
			},
		}) as unknown as ActionsV2;
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

export const commandV2 = new CommandV2();

export const actionsV2 = commandV2.getActionsProxy();
