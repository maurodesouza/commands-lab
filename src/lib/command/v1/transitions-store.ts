type Transition = {
	abort: () => void;
};

export type TransitionKeyV1 = unknown | unknown[];

export type TransitionConfigV1 = {
	transition: TransitionKeyV1;
};

export class TransitionStoreV1 {
	private static instance: TransitionStoreV1;

	private observers = new Set<() => void>();
	transitions: Map<string, Transition> = new Map();

	private constructor() {}

	start(key: TransitionKeyV1) {
		const serializedKey = TransitionStoreV1.serializeKey(key);

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

	abort(key: TransitionKeyV1) {
		const serializedKey = TransitionStoreV1.serializeKey(key);
		const transition = this.transitions.get(serializedKey);

		if (transition) transition.abort();
	}

	done(key: TransitionKeyV1) {
		const serializedKey = TransitionStoreV1.serializeKey(key);
		this.transitions.delete(serializedKey);
		this.notify();
	}

	subscribe(observer: () => void) {
		this.observers.add(observer);

		return () => {
			this.observers.delete(observer);
		};
	}

	isExecuting(key: TransitionKeyV1) {
		const serializedKey = TransitionStoreV1.serializeKey(key);
		return !!this.transitions.get(serializedKey);
	}

	private notify() {
		for (const observer of this.observers) observer();
	}

	static serializeKey(key: TransitionKeyV1) {
		return JSON.stringify(key);
	}

	static getInstance() {
		if (!TransitionStoreV1.instance) {
			TransitionStoreV1.instance = new TransitionStoreV1();
		}

		return TransitionStoreV1.instance;
	}
}
