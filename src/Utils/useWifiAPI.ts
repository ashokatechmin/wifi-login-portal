import querystring from 'querystring'
import { useEffect, useState } from 'react'
import timeFormatter from './timeFormatter'
import useLocalStorageState from './useLocalStorageState'

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
	console.log(result)
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

export default () => {
	const [lastLogin, setLastLogin] = useLocalStorageState(
		'last-login',
		str => str ? new Date(str) : undefined
	)

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

	const login = async(username: string, password: string) => {
		if(!username) {
			throw new Error('Username/email is required')
		}
		if(!password) {
			throw new Error('Password is required')
		}
		username = username.split('@')[0]
		const message = await apiRequest(
			'login.xml', 
			'POST', 
			{ username, password, mode: 191 }
		)
		if(!message?.includes('success')) {
			throw new Error(message!)
		}
		setLastLogin(new Date())
		setLastUsedUsername(username)
		setLastUsedPassword(password)
	}
	const logout = async(username: string) => {
		const message = await apiRequest(
			'logout.xml', 
			'POST', 
			{ username, mode: 193 }
		)
		if(!message?.includes('success')) {
			throw new Error(message!)
		}
		setLastLogin(undefined)
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

	return {
		lastLogin,
		autoLogin,
		savePassword,
		autoLoginState,
		lastUsedPassword,
		lastUsedUsername,
		setSavePassword,
		login,
		logout,
		setAutoLogin
	}
}
