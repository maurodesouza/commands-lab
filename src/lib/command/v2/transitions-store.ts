import { Subject } from "./subject";

type Transition = {
	abort: () => void;
};

export type TransitionKeyV2 = unknown | unknown[];

export type TransitionConfigV2 = {
	transition: TransitionKeyV2;
};

export class TransitionStoreV2 extends Subject {
	private static instance: TransitionStoreV2;

	transitions: Map<string, Transition> = new Map();

	private constructor() {
		super();
	}

	start(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);

		if (this.transitions.has(serializedKey)) {
			this.abort(key);
		}

		const controller = new AbortController();

		this.transitions.set(serializedKey, {
			abort: () => controller.abort(),
		});

		this.notify();

		return {
			signal: controller.signal,
		};
	}

	abort(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		const transition = this.transitions.get(serializedKey);

		if (transition) transition.abort();
	}

	done(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		this.transitions.delete(serializedKey);
		this.notify();
	}

	isExecuting(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		return !!this.transitions.get(serializedKey);
	}

	static serializeKey(key: TransitionKeyV2) {
		return JSON.stringify(key);
	}

	static getInstance() {
		if (!TransitionStoreV2.instance) {
			TransitionStoreV2.instance = new TransitionStoreV2();
		}

		return TransitionStoreV2.instance;
	}
}
