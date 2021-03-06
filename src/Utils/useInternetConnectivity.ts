import { useEffect, useState } from "react"
import useOnline from "./useOnline"

const CONNECTIVITY_TIMEOUT_MS = 5_000
const CONNECTIVITY_TEST_MIN_GAP = 30_000

export default (url: string) => {
	const online = useOnline()
	const [state, setState] = useState<'offline' | 'checking' | 'online'>('offline')
	const [lastCheck, setLastCheck] = useState(new Date(0))

	const checkInternet = async() => {
		setState('checking')
		let result = false
		try {
			const controller = new AbortController()
			const timeout = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS)

			await fetch(url, {
				method: 'head',
				mode: 'no-cors',
				cache: 'no-cache',
				signal: controller.signal
			})
			clearTimeout(timeout)
			setState('online')
			result = true
		} catch(error) {
			setState('offline')
		}
		setLastCheck(new Date())
		return result
	}

	useEffect(() => {
		let doneOnce = false
		const check = () => {
			// only when focused
			if(
				state !== 'checking' && 
				!doneOnce && 
				(Date.now()-lastCheck.getTime()) >= CONNECTIVITY_TEST_MIN_GAP
			) {
				console.log('checking from focus event ', state)
				checkInternet()
				doneOnce = true
			}
		}
		window.addEventListener('focus', check)
		return () => window.removeEventListener('focus', check)
	}, [state, lastCheck, setState])

	useEffect(() => {
		if(online) {
			console.log('online, checking internet...')
			setTimeout(() => {
				checkInternet()
			}, 4000)
		}
		else setState('offline')

	}, [online])

	return [state, checkInternet] as const 
}