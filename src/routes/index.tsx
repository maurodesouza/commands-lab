import { createFileRoute } from "@tanstack/react-router";
import { Counter } from "#/components/counter";
import { ShowContent } from "#/components/show-content";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 flex flex-col gap-4 items-start">
			<Counter.Container>
				<Counter.Controls>
					<Counter.Increment />
					<Counter.Reset />
					<Counter.Decrement />
				</Counter.Controls>
				<Counter.Preview />
			</Counter.Container>

			<div className="flex flex-col gap-4 items-start">
				<ShowContent.Provider>
					<ShowContent.Container>
						<ShowContent.Controls>
							<ShowContent.Show.Greeting />
							<ShowContent.Show.Farewell />
							<ShowContent.Show.Thanks />
							<ShowContent.Show.Congratulation />
						</ShowContent.Controls>
						<ShowContent.Preview />
					</ShowContent.Container>
				</ShowContent.Provider>

				<ShowContent.Provider>
					<ShowContent.Container>
						<ShowContent.Controls>
							<ShowContent.Show.Greeting />
							<ShowContent.Show.Farewell />
							<ShowContent.Show.Thanks />
							<ShowContent.Show.Congratulation />
						</ShowContent.Controls>
						<ShowContent.Preview />
					</ShowContent.Container>
				</ShowContent.Provider>

				<ShowContent.Provider>
					<ShowContent.Container>
						<ShowContent.Controls>
							<ShowContent.Show.Greeting />
							<ShowContent.Show.Farewell />
							<ShowContent.Show.Thanks />
							<ShowContent.Show.Congratulation />
						</ShowContent.Controls>
						<ShowContent.Preview />
					</ShowContent.Container>
				</ShowContent.Provider>
			</div>
		</div>
	);
}
