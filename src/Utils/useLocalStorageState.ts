import { useEffect, useState } from "react";

export default function<T extends { toString: () => string }>(
	key: string, parse: (localStorage: string | null) => T | undefined, enabled: boolean = true
) {
	const [state, setState] = useState(parse(localStorage.getItem(key)))

	useEffect(() => {
		if(state && enabled) localStorage.setItem(key, state.toString())
		else localStorage.removeItem(key)
	}, [state, enabled])

	return [state, setState] as const
}