import React, { useEffect, useState } from 'react'
import './useAlert.css'

export default () => {
	const [content, setContent] = useState<React.ReactNode>()
    const [type, setType] = useState<'regular' | 'error'>('regular')
    const [visible, setVisible] = useState<'hide' | 'showing'>('hide')
    const [timeoutMs, setTimeoutMs] = useState<number>()
    
    const show = (content: React.ReactNode, timeoutMs: number | undefined, type: 'regular' | 'error' = 'regular') => { 
        setContent(content)
        setVisible('showing')
        setType(type) 
		setTimeoutMs(timeoutMs)
    }
    const hide = () => setVisible('hide')

	useEffect(() => {
		if(timeoutMs && visible === 'showing') {
			const timeout = setTimeout(() => setVisible('hide'), timeoutMs)
			return () => clearTimeout(timeout)
		}
	}, [timeoutMs, visible])

    return {
        show: (content: React.ReactNode, timeoutMs?: number) => show(content, timeoutMs, 'regular'),
        error: (content: React.ReactNode, timeoutMs?: number) => show(content, timeoutMs, 'error'),
        hide,
        alert: (
            <div className={`alert ${type} ${visible}`}>
                <button className='close' onClick={hide}>x</button>
				{ content }
			</div>
        )
    }
}