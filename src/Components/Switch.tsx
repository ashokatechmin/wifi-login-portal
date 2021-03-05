import React, { HTMLProps } from 'react';
import './Switch.css';

export default (props: HTMLProps<'input'>) => (
  <div className='switch-parent'>
    {/*@ts-ignore*/}
    <input {...props} className='react-switch-checkbox' type='checkbox'/>
    <label htmlFor={props.id}> <span/> </label>
  </div>
)