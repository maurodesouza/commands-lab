import { createFileRoute } from "@tanstack/react-router";
import { AsyncV1 } from "#/components/v1/async";
import { CounterV1 } from "#/components/v1/counter";
import { ShowContentV1 } from "#/components/v1/show-content";

export const Route = createFileRoute("/v1")({ component: V1 });

function V1() {
	return (
		<div className="p-8 flex flex-col gap-4 items-start">
			<CounterV1.Container>
				<CounterV1.Controls>
					<CounterV1.Increment />
					<CounterV1.Reset />
					<CounterV1.Decrement />
				</CounterV1.Controls>
				<CounterV1.Preview />
			</CounterV1.Container>

			<div className="flex flex-col gap-4 items-start">
				<ShowContentV1.Provider>
					<ShowContentV1.Container>
						<ShowContentV1.Controls>
							<ShowContentV1.Show.Greeting />
							<ShowContentV1.Show.Farewell />
							<ShowContentV1.Show.Thanks />
							<ShowContentV1.Show.Congratulation />
						</ShowContentV1.Controls>
						<ShowContentV1.Preview />
					</ShowContentV1.Container>
				</ShowContentV1.Provider>

				<ShowContentV1.Provider>
					<ShowContentV1.Container>
						<ShowContentV1.Controls>
							<ShowContentV1.Show.Greeting />
							<ShowContentV1.Show.Farewell />
							<ShowContentV1.Show.Thanks />
							<ShowContentV1.Show.Congratulation />
						</ShowContentV1.Controls>
						<ShowContentV1.Preview />
					</ShowContentV1.Container>
				</ShowContentV1.Provider>

				<ShowContentV1.Provider>
					<ShowContentV1.Container>
						<ShowContentV1.Controls>
							<ShowContentV1.Show.Greeting />
							<ShowContentV1.Show.Farewell />
							<ShowContentV1.Show.Thanks />
							<ShowContentV1.Show.Congratulation />
						</ShowContentV1.Controls>
						<ShowContentV1.Preview />
					</ShowContentV1.Container>
				</ShowContentV1.Provider>
			</div>

			<AsyncV1.Container>
				<AsyncV1.Execute />
				<AsyncV1.Handler />
				<AsyncV1.Preview />
			</AsyncV1.Container>
		</div>
	);
}
