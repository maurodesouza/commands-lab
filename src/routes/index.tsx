import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 flex flex-col gap-4 items-start">
			<h1 className="text-2xl font-bold">Welcome</h1>
			<Link
				to="/v1"
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				Go to V1
			</Link>
			<Link
				to="/v2"
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				Go to V2
			</Link>
		</div>
	);
}
