import { useSyncExternalStore } from "react";
import { TransitionStoreV2 } from "#/lib/command/v2/transitions-store";

export function useTransitionV2(key: unknown[]) {
	return useSyncExternalStore(
		(callback) => TransitionStoreV2.getInstance().subscribe(callback),

		() => TransitionStoreV2.getInstance().isExecuting(key),
	);
}
