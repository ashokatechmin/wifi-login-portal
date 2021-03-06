import { useEffect, useState } from "react";

export default () => {
	const [online, setOnline] = useState(true) // assume online

	useEffect(() => {
		const setOnlineTrue = () => setOnline(true)
		const setOnlineFalse = () => setOnline(false)
		window.addEventListener('offline', setOnlineFalse)
		window.addEventListener('online', setOnlineTrue)

		return () => {
			window.removeEventListener('offline', setOnlineFalse)
			window.removeEventListener('online', setOnlineTrue)
		}
	}, [setOnline])

	return [online, setOnline] as const
}