import { createFileRoute } from "@tanstack/react-router";
import { AsyncV2 } from "#/components/v2/async";
import { ContentBuilder } from "#/components/v2/content-builder";
import { ContentManagement } from "#/components/v2/content-management";
import { CounterV2 } from "#/components/v2/counter";

export const Route = createFileRoute("/v2")({ component: V2 });

function V2() {
	return (
		<div className="p-8 flex flex-col gap-4 items-start">
			<CounterV2.Container>
				<CounterV2.Controls>
					<CounterV2.Increment />
					<CounterV2.Reset />
					<CounterV2.Decrement />
				</CounterV2.Controls>
				<CounterV2.Preview />
			</CounterV2.Container>

			<div className="flex flex-col gap-4 items-start">
				<ContentManagement />
				<ContentBuilder />
			</div>

			<AsyncV2.Container>
				<AsyncV2.Execute />
				<AsyncV2.Handler />
				<AsyncV2.Preview />
			</AsyncV2.Container>
		</div>
	);
}
