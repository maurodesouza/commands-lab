import type { Action, ScopedAction } from "./types";

export interface ActionsV2 {
	counter: {
		increment: Action;
		decrement: Action;
		reset: Action;
	};

	content: {
		show: ScopedAction<string>;
	};

	async: {
		execute: Action;
	};
}
