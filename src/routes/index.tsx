import { createFileRoute } from '@tanstack/react-router'
import { Counter } from '#/components/counter'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <Counter.Container>
        <Counter.Controls>
          <Counter.Increment />
          <Counter.Reset />
          <Counter.Decrement />
        </Counter.Controls>
        <Counter.Preview />
      </Counter.Container>
    </div>
  )
}
