import type { DispatchConfig, Handler } from "./command-bus";
import { CommandBusV1 } from "./command-bus";
import { TransitionStoreV1 } from "./transitions-store";

type Action<TPayload = void> = [TPayload] extends [void]
	? (payload?: TPayload, config?: DispatchConfig) => void
	: (payload: TPayload, config?: DispatchConfig) => void;

export interface ActionsV1 {
	counter: {
		increment: Action;
		decrement: Action;
		reset: Action;
	};

	content: {
		show: Action<string>;
	};

	async: {
		execute: Action;
	};
}

export class CommandV1 {
	private $scope?: string;

	private $commandBus: CommandBusV1;
	private $transitions: TransitionStoreV1;

	constructor(scope?: string) {
		this.$scope = scope;

		this.$transitions = TransitionStoreV1.getInstance();
		this.$commandBus = new CommandBusV1(this.$transitions);
	}

	handle<TPayload = unknown, TResult = unknown>(
		command: string,
		handler: Handler<TPayload, TResult>,
	) {
		return this.$commandBus.handle<TPayload, TResult>(
			this.buildKey(command),
			handler,
		);
	}

	dispatch<TPayload = unknown>(
		command: string,
		payload?: TPayload,
		config?: DispatchConfig,
	) {
		return this.$commandBus.dispatch<TPayload>(
			this.buildKey(command),
			payload,
			config,
		);
	}

	getActionsProxy(argPath?: string[]): ActionsV1 {
		const path = argPath ?? (this.$scope ? [this.$scope] : []);
		const self = this;

		return new Proxy(() => {}, {
			get(_target, prop: string) {
				return self.getActionsProxy([...path, prop]);
			},

			apply(_target, _thisArg, args: [unknown, DispatchConfig?]) {
				const commandName = path.join(".");
				return self.$commandBus.dispatch(commandName, args[0], args[1]);
			},
		}) as unknown as ActionsV1;
	}

	private buildKey(command: string) {
		return this.$scope ? `${this.$scope}.${command}` : command;
	}

	static scope(scope?: string) {
		const prefix = "$$scope";
		const id = scope ?? Math.random().toString(36).substring(2, 15);
		const key = `${prefix}:${id}`;

		return new CommandV1(key);
	}
}

export const commandV1 = new CommandV1();

export const actionsV1 = commandV1.getActionsProxy();
