type Transition = {
	abort: () => void;
};

export type TransitionKey = unknown | unknown[];

export type TransitionConfig = {
	transition: TransitionKey;
};

export class TransitionStore {
	private static instance: TransitionStore;

	private observers = new Set<() => void>();
	transitions: Map<string, Transition> = new Map();

	private constructor() {}

	start(key: TransitionKey) {
		const serializedKey = TransitionStore.serializeKey(key);

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

	abort(key: TransitionKey) {
		const serializedKey = TransitionStore.serializeKey(key);
		const transition = this.transitions.get(serializedKey);

		if (transition) transition.abort();
	}

	done(key: TransitionKey) {
		const serializedKey = TransitionStore.serializeKey(key);
		this.transitions.delete(serializedKey);
		this.notify();
	}

	subscribe(observer: () => void) {
		this.observers.add(observer);

		return () => {
			this.observers.delete(observer);
		};
	}

	isExecuting(key: TransitionKey) {
		const serializedKey = TransitionStore.serializeKey(key);
		return !!this.transitions.get(serializedKey);
	}

	private notify() {
		for (const observer of this.observers) observer();
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
