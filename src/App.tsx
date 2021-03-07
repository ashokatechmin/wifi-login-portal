import React, { useState } from 'react'
import useWifiAPI from './Utils/useWifiAPI'
import ProgressButton from './Components/ProgressButton'
import Switch from './Components/Switch'
import generateColor from './Utils/generateColor'
import useAlert from './Components/useAlert'
import cat from './Images/cat'
import {ReactComponent as Reload} from './Images/Reload.svg'
import './App.css'

export default () => {
  const alerts = useAlert()
  const {
    lastUsedUsername,
    lastUsedPassword,
    savePassword,
    autoLogin,
    autoLoginState,
    currentAction,
    wifiSwitchState,
    connectedInternet,
    unexpectedlyOffline,
    checkConnectedInternet,
    startSwitchingWifis,
    logout,
    login,
    setSavePassword,
    setAutoLogin
  } = useWifiAPI()

  const [username, setUsername] = useState(lastUsedUsername)
  const [password, setPassword] = useState(lastUsedPassword)

  const showError = (error: Error) => {
    alerts.error(<div dangerouslySetInnerHTML={{ __html: error.message }}/>)
  }

  return (
    <div className='App flex-col'>
      {alerts.alert}
      <div className='login-card vertical-margin'>
        <div className='title'>
          <img src={cat} />
          <div className='flex-col' style={{marginLeft: '1rem'}}>
            <div className='heading'>Messcat</div>
            <div className='footnote'>Wifi Portal for Ashoka</div>
          </div>
        </div>
        <div className='note' style={{alignSelf: 'center'}}>
          <div className='flex-row'>
          Internet: <span className={connectedInternet}>&nbsp;{connectedInternet}</span>
          {
            connectedInternet !== 'checking' && (
              <div className='checker' onClick={checkConnectedInternet}>
                <Reload />
              </div>
            )
          }
          </div>
          {
            unexpectedlyOffline && (
              <>
              <br/>
              <div className='unexpectedly-offline'>
                Looks like you're offline when you should be online<br/>
                1. Check your email/password and try again<br/>
                2. You might be logged onto some other wifi (guest, student, staff). 
                So you'll have to logout from there and then login here. 
                You can do all that from this portal itself.
              </div>
              </>
            )
          }
        </div>
        <div className='flex-col vertical-margin'>
          <input 
            className='text-input'
            value={username} 
            placeholder='Ashoka Email...' 
            onChange={e => setUsername(e.target.value)}/>
          <input 
            value={password} 
            className='text-input'
            type='password' 
            placeholder='Password...' 
            onChange={e => setPassword(e.target.value)}/>
                    
          <div className='flex-col overall-margin'>
           
            <div className='flex-col'>
              <div className='flex-space'>
                <Switch id='auto-login' checked={autoLogin} onChange={() => setAutoLogin(!autoLogin)}/>
                <span className='footnote'>
                  Auto Login
                </span>
              </div>
              {
                autoLogin && (
                  <span className='footnote' style={{color: 'var(--color-primary)', paddingTop: '0.2rem', alignSelf: 'flex-end'}}>
                    {autoLoginState.message}
                  </span>
                )
              }
            </div>

            <div className='flex-space'>
              <Switch id='save-password' checked={savePassword} onChange={() => setSavePassword(!savePassword)}/>
              <span className='footnote'>
                Remember Me
              </span>
            </div>

            <ProgressButton 
              disabled={currentAction === 'logging-in'}
              onTaskError={showError}
              onClick={async() => {
                await login(username!, password!)
                alerts.show(
                  <>
                  Logged in successfully!<br/>
                  <span className='small-note'>Assuming you provided the right username/password 😌</span>
                  </>,
                  2500
                )
              }}>
              Login
            </ProgressButton>

            <ProgressButton 
              disabled={currentAction === 'logging-out'}
              onTaskError={showError}
              onClick={async () => {
                await logout(username!)
                alerts.show('Logged out successfully!', 2000)
              }} 
              data-color='secondary'>
              Logout
            </ProgressButton>

            <button 
              disabled={wifiSwitchState.state !== 'idle' && wifiSwitchState.state !== 'waiting-for-disconnect'}
              onClick={startSwitchingWifis} 
              className='wifi-switch-button'
              style={{ backgroundColor: generateColor(wifiSwitchState.state) }}>
              {wifiSwitchState.message || 'I want to switch wifis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
