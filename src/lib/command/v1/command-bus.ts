import { dev } from "#/utils/dev";
import type { TransitionKeyV1, TransitionStoreV1 } from "./transitions-store";

type Return<T> = [T, undefined] | [undefined, Error];

export type Handler<TPayload = unknown, TResult = unknown> = (
	payload: TPayload,
) => Promise<Return<TResult>>;

export type Dispose = () => void;

export type SequenceConfig = {
	transition?: TransitionKeyV1;
};

export type DispatchConfig = {
	transition?: TransitionKeyV1;
};

export class CommandBusV1 {
	private handlers: Map<string, Handler> = new Map();

	constructor(private readonly transition: TransitionStoreV1) {}

	handle<TPayload = unknown, TResult = unknown>(
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

	async dispatch<TResult = unknown>(
		command: string,
		payload?: unknown,
		config?: DispatchConfig,
	): Promise<Return<TResult>> {
		dev.run(() => console.info(`[command dispatched]: ${command}`, payload));

		const transitionKey = config?.transition ? config.transition : [command];
		this.transition.start(transitionKey);

		const handler = this.handlers.get(command);
		if (!handler) {
			const message = `[command]: no handler registered for ${command}`;
			dev.run(() => console.error(message));
			return [undefined, new Error(message)];
		}

		try {
			return (await handler(payload)) as Return<TResult>;
		} finally {
			this.transition.done(transitionKey);
		}
	}

	dispose(command: string): void {
		this.handlers.delete(command);
	}
}
