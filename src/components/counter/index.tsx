import { useCallback, useEffect, useState } from "react"
import { twc } from "react-twc"
import { actions, command } from "#/lib/command"

const Container = twc.div`w-auto inline-flex flex-col gap-2`

const Controls = twc.div`flex gap-2 items-center`

const Button = twc.button`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600`

function Increment() {
    return (
        <Button type="button" onClick={() => actions.counter.increment()}>Increment</Button>
    )
}

function Decrement() {
    return (
        <Button type="button" onClick={() => actions.counter.decrement()}>Decrement</Button>
    )
}

function Reset() {
    return (
        <Button type="button" onClick={() => actions.counter.reset()}>Reset</Button>
    )
}

function Preview() {
    const [counter, setCounter] = useState(0)

    const increment = useCallback(async () => {
        setCounter(c => c + 1)
        return [true, undefined] as [boolean, undefined]
    }, [])

    const decrement = useCallback(async () => {
        setCounter(c => c - 1)
        return [true, undefined] as [boolean, undefined]
    }, [])

    const reset = useCallback(async () => {
        setCounter(0)
        return [true, undefined] as [boolean, undefined]
    }, [])

    useEffect(() => {
        const dispose1 = command.handle("counter.increment", increment)
        const dispose2 = command.handle("counter.decrement", decrement)
        const dispose3 = command.handle("counter.reset", reset)

        return () => {
            dispose1()
            dispose2()
            dispose3()
        }
    }, [increment, decrement, reset])

    return (
        <span className="w-full grid place-items-center">{counter}</span>
    )
}

export const Counter = {
    Container,
    Controls,
    Increment,
    Decrement,
    Reset,
    Preview,
}
