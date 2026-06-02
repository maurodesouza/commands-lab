import { useSyncExternalStore } from "react";
import { TransitionStoreV1 } from "#/lib/command/v1/transitions-store";

export function useTransitionV1(key: unknown[]) {
	return useSyncExternalStore(
		(callback) => TransitionStoreV1.getInstance().subscribe(callback),

		() => TransitionStoreV1.getInstance().isExecuting(key),
	);
}
