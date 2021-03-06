import React, { useState } from 'react'
import useWifiAPI from './Utils/useWifiAPI'
import ProgressButton from './Components/ProgressButton'
import Switch from './Components/Switch'
import timeFormatter from './Utils/timeFormatter'
import generateColor from './Utils/generateColor'
import useAlert from './Components/useAlert'
import './App.css'

export default () => {
  const alerts = useAlert()
  const {
    lastUsedUsername,
    lastUsedPassword,
    savePassword,
    autoLogin,
    autoLoginState,
    lastLogin,
    currentAction,
    takingLongTime,
    wifiSwitchState,
    startSwitchingWifis,
    logout,
    login,
    setSavePassword,
    setAutoLogin
  } = useWifiAPI()

  const [username, setUsername] = useState(lastUsedUsername)
  const [password, setPassword] = useState(lastUsedPassword)

  return (
    <div className='App flex-col'>
      {alerts.alert}
      <div className='login-card vertical-margin'>
        <div className='title'>
          <img src={require('./Images/cat.jpg').default} />
          <div className='flex-col' style={{marginLeft: '1rem'}}>
            <div className='heading'>Messcat</div>
            <div className='footnote'>Wifi Portal for Ashoka</div>
          </div>
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

          { lastLogin && !currentAction && (
              <span className='footnote' style={{alignSelf: 'center'}}>
                Last logged in { timeFormatter(Date.now() - lastLogin.getTime()) } ago
              </span>
            ) 
          }
          {
            !!currentAction && takingLongTime && (
              <span className='error-note'>
                Hmmm, it's taking a long time to log {currentAction === 'logging-in' ? 'in' : 'out'}.<br/>
                Try <a href='/'>refreshing the page</a>, if that does not work<br/>
                email IT by clicking <a href='mailto:it.helpdesk@ashoka.edu.in'>here</a>
              </span>
            )
          }
          
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
              onTaskError={err => alerts.error(`An Error Occurred: ${err.message}`)}
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
              onTaskError={err => alerts.error(`An Error Occurred: ${err.message}`)}
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
