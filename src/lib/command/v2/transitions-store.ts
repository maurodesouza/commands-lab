import { Subject } from "./subject";
import type { TransitionKeyV2 } from "./types";

export class TransitionStoreV2 extends Subject {
	private static instance: TransitionStoreV2;

	private counts: Map<string, number> = new Map();

	private constructor() {
		super();
	}

	start(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		const count = this.counts.get(serializedKey) ?? 0;

		this.counts.set(serializedKey, count + 1);
		this.notify();
	}

	done(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		const count = (this.counts.get(serializedKey) ?? 0) - 1;

		if (count <= 0) this.counts.delete(serializedKey);
		else this.counts.set(serializedKey, count);

		this.notify();
	}

	isExecuting(key: TransitionKeyV2) {
		const serializedKey = TransitionStoreV2.serializeKey(key);
		return (this.counts.get(serializedKey) ?? 0) > 0;
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
