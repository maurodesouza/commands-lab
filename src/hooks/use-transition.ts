import { useSyncExternalStore } from "react";
import { TransitionStore } from "#/lib/command/transitions-store";

export function useTransition(key: unknown[]) {
	const transitionKey = JSON.stringify(key);

	return useSyncExternalStore(
		(callback) => TransitionStore.getInstance().subscribe(callback),

		() => TransitionStore.getInstance().isExecuting(transitionKey),
	);
}
