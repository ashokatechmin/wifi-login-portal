import querystring from 'querystring'
import { useEffect, useState } from 'react'
import timeFormatter from './timeFormatter'
import useInternetConnectivity from './useInternetConnectivity'
import useLocalStorageState from './useLocalStorageState'
import useOnline from './useOnline'

const delay = (ms: number) => new Promise(resolve => (
	setTimeout(resolve, ms) // wait 1.5 seconds between each try
))
const INTERNET_CHECK_URL = process.env.DEV === '1' ? 'https://lms.ashoka.edu.in/abcd' : '/'
const PARSER = new DOMParser()
const BASE_URL = new URL('http://10.1.0.100:8090')
const MAX_EXPECTED_RESPONSE_TIME_MS = 7_000 // max time a request should take
const AUTO_LOGIN_INTERVAL_MS = 60*60*1000 // interval for auto login (1 hour)

// extract the "message" from the API xml response
const getMessage = (xmlText: string) => {
	xmlText = xmlText.replace("<?xml version='1.0' ?>", '') // remove header
	const data = PARSER.parseFromString(xmlText, 'text/xml')
	const message = data.getElementsByTagName('message')[0]
	
	if(!message) throw new Error('Could not obtain message')
	return message.textContent
}
/** fetch data from the wifi API */
const apiRequest = async (path: string, method: 'POST' | 'GET', body: any) => {
	
	const result = await fetch(
		new URL(path, BASE_URL).toString(),
		{
			method,
			body: querystring.encode({
				a: Date.now(),
				producttype: 0,
				...body
			}),
			credentials: 'omit',
			mode: 'no-cors',
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			}
		}
	)
	const text = await result.text()
	return 'success'
	/*console.log('code ', result.status)
	// status code doesn't determine anything in this API
	// always returns 200, so we use the message property
	const message = getMessage(text)
	return message*/
}

export type AutoLoginState = {
	state: 'idle' | 'logging-in' | 'error' | 'inactive'
	message?: string
}
export type WifiSwitchState = 'idle' | 'logging-out' | 'waiting-for-disconnect' | 'waiting-for-connect' | 'logging-in'

/**
 * Manage all the logic for logging in, logging out, switching wifis, auto-login etc.
 */
export default () => {
	// date for last login
	const [lastLogin, setLastLogin] = useLocalStorageState(
		'last-login',
		str => str ? new Date(str) : undefined
	)
	// what we doing right now
	const [currentAction, setCurrentAction] = useState<'logging-in' | 'logging-out'>()
	// is it taking a long time to fetch?
	const [takingLongTime, setTakingLongTime] = useState(false)
	// are we on some internet
	const online = useOnline()
	// are we connected to the outside internet
	const [connectedInternet, checkConnectedInternet] = useInternetConnectivity(
		INTERNET_CHECK_URL
	)
	// are we unexpectedly offline when we should be online?
	const [unexpectedlyOffline, setUnexpectedlyOffline] = useState(false)
	const [wifiSwitchState, setWifiSwitchState] = useState({
		state: 'idle' as WifiSwitchState,
		message: ''
	})

	const [savePassword, setSavePassword] = useLocalStorageState(
		'save-password',
		str => str === 'true'
	)
	
	const [autoLogin, setAutoLogin] = useLocalStorageState(
		'auto-login',
		str => str === 'true'
	)
	const [autoLoginState, setAutoLoginState] = useState<AutoLoginState>({ state: 'idle' }) 

	const [lastUsedUsername, setLastUsedUsername] = useLocalStorageState(
		'username',
		str => str || ''
	)
	const [lastUsedPassword, setLastUsedPassword] = useLocalStorageState(
		'password',
		str => str || '',
		savePassword
	)

	const onLogin = async() => {
		await delay(2000)
		const connected = await checkConnectedInternet()
		if(!connected) {
			setUnexpectedlyOffline(true)
		}
	}

	const login = async(username: string, password: string) => {
		if(!username) {
			throw new Error('Username/email is required')
		}
		if(!password) {
			throw new Error('Password is required')
		}
		username = username.split('@')[0]
		setCurrentAction('logging-in')
		const message = await apiRequest(
			'login.xml', 
			'POST', 
			{ username, password, mode: 191 }
		).finally(() => (
			setCurrentAction(undefined)
		))

		if(!message?.includes('success')) {
			throw new Error(message!)
		}
		setLastLogin(new Date())
		setLastUsedUsername(username)
		setLastUsedPassword(password)

		onLogin()
	}
	const logout = async(username: string) => {
		setCurrentAction('logging-out')
		const message = await apiRequest(
			'logout.xml', 
			'POST', 
			{ username, mode: 193 }
		).finally(() => (
			setCurrentAction(undefined)
		))
		if(!message?.includes('success')) {
			throw new Error(message!)
		}
		setLastLogin(undefined)
		checkConnectedInternet()
	}
	const tryLogin = async(tries = 10) => {
		while(tries > 0) {
			await new Promise(resolve => (
				setTimeout(resolve, 1500) // wait 1.5 seconds between each try
			))
			try {
				await login(lastUsedUsername!, lastUsedPassword!)
				setWifiSwitchState({
					state: 'idle',
					message: 'Done!\nClick to switch wifis again'
				})
				break
			} catch(error) {
				console.log(`error in login (tries left ${tries}): `, error)
				if (tries <= 0) {
					setWifiSwitchState({
						state: 'idle',
						message: `An Error Occurred: ${error.message}`
					})
				}
			}
			tries += 1
		}
	}

	useEffect(() => {
		if(autoLogin) {
			if(autoLoginState.state === 'idle') {
				// if there is no prior login
				// or no username, password to login with
				if(!lastLogin || !lastUsedUsername || !lastUsedPassword) { 
					setAutoLoginState({
						state: 'inactive',
						message: 'Login to enable'
					})
				} else {
					const timeForNextLogin = (lastLogin.getTime() + AUTO_LOGIN_INTERVAL_MS) - new Date().getTime()
					if(timeForNextLogin < 0) {
						setAutoLoginState({
							state: 'logging-in',
							message: 'Logging in...'
						})
						// execute login
						login(lastUsedUsername!, lastUsedPassword!)
							.then(() => {
								setAutoLoginState({
									state: 'idle',
									message: ''
								})
							})
							.catch(error => {
								setAutoLoginState({
									state: 'error',
									message: error.message
								})
							})
					} else {
						const timeout = setTimeout(() => {
							setAutoLoginState({
								state: 'idle',
								message: timeFormatter(timeForNextLogin) + ' left for next login'
							})
						}, 1000)
						return () => clearTimeout(timeout)
					}
				}
			} else if(autoLoginState.state === 'inactive' && lastLogin && lastUsedPassword && lastUsedUsername) {
				setAutoLoginState({
					state: 'idle',
					message: ''
				})
			}
		}
	}, [autoLogin, lastLogin, autoLoginState, lastUsedUsername, lastUsedPassword])

	useEffect(() => {
		if(currentAction) {
			const timeout = setTimeout(() => (
				setTakingLongTime(true)
			), MAX_EXPECTED_RESPONSE_TIME_MS)
			return () => {
				clearTimeout(timeout)
				setTakingLongTime(false)
			}
		}
	}, [currentAction])

	useEffect(() => {
		if(wifiSwitchState.state === 'waiting-for-disconnect' && !online) {
			setWifiSwitchState({
				state: 'waiting-for-connect',
				message: 'Connect to your desired wifi (Staff, Student, etc.)'
			})
		} else if(wifiSwitchState.state === 'waiting-for-connect' && online) {
			setWifiSwitchState({
				state: 'logging-in',
				message: 'Logging you in here...'
			})
		} else if(wifiSwitchState.state === 'logging-in' && online) {
			tryLogin()
		}
	}, [wifiSwitchState, online])

	useEffect(() => {
		if(connectedInternet === 'online' && unexpectedlyOffline) {
			setUnexpectedlyOffline(false)
		}
	}, [connectedInternet, unexpectedlyOffline])

	return {
		lastLogin,
		autoLogin,
		savePassword,
		autoLoginState,
		lastUsedPassword,
		lastUsedUsername,
		currentAction,
		takingLongTime,
		wifiSwitchState,
		connectedInternet,
		unexpectedlyOffline,
		startSwitchingWifis: () => {
			// force the state here
			if(wifiSwitchState.state === 'waiting-for-disconnect') {
				setWifiSwitchState({
					state: 'logging-in',
					message: 'Logging you in here...'
				})
			} else {
				setWifiSwitchState({
					state: 'logging-out',
					message: 'Logging you out from here...'
				})
				logout(lastUsedUsername!)
					.then(() => (
						setWifiSwitchState({
							state: 'waiting-for-disconnect',
							message: "Disconnect your wifi.\nClick here if already switched"
						})
					))
					.catch(error => {
						setWifiSwitchState({
							state: 'idle',
							message: `An Error Occurred: ${error.message}`
						})
					})
			}
		},
		setSavePassword,
		login,
		logout,
		setAutoLogin
	}
}
