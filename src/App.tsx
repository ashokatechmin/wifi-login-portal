import React, { useState } from 'react';
import useWifiAPI from './Utils/useWifiAPI';
import ProgressButton from './Components/ProgressButton';
import Switch from './Components/Switch';
import timeFormatter from './Utils/timeFormatter';
import './App.css'

export default () => {

  const {
    lastUsedUsername,
    lastUsedPassword,
    savePassword,
    autoLogin,
    autoLoginState,
    lastLogin,
    logout,
    login,
    setSavePassword,
    setAutoLogin
  } = useWifiAPI()

  const [username, setUsername] = useState(lastUsedUsername)
  const [password, setPassword] = useState(lastUsedPassword)
  
  return (
    <div className='App flex-col'>
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

          { lastLogin && (
              <span className='footnote' style={{alignSelf: 'center'}}>
                Last logged in { timeFormatter(Date.now() - lastLogin.getTime()) } ago
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

            <ProgressButton onClick={() => login(username!, password!)}>
              Login
            </ProgressButton>

            <ProgressButton onClick={() => logout(username!)} data-color='secondary'>
              Logout
            </ProgressButton>
          </div>
        </div>
      </div>
    </div>
  )
}
