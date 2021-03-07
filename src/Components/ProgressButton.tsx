import React, { HTMLProps, useEffect, useState } from 'react';

const PROGRESS_BUTTON_MAX_MOD = 5
export default (props: HTMLProps<'button'> & { onTaskError: (error: Error) => void }) => {
  const [working, setWorking] = useState(false)
  const [currentMod, setCurrentMod] = useState(0)

  const {onClick, children, disabled} = props

  const trueProps = {
    ...props,
    onClick: async(e: any) => {
      setWorking(true)
      try {
        await onClick!(e)
      } catch(error) {
        props.onTaskError(error)
      } finally {
        setWorking(false)
      }
    },
    children: working ? [...Array(currentMod+1)].map(() => '.').join('') : children,
    disabled: working ? true : disabled,
    onTaskError: undefined
  }

  useEffect(() => {
    if(working) {
      const timeout = setTimeout(() => {
        setCurrentMod((currentMod + 1) % PROGRESS_BUTTON_MAX_MOD)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [working, currentMod])

  return (
    //@ts-ignore
    <button {...trueProps}/>
  )
}
