export default (ms: number) => {
	const s = ms/1000
	const m = s/60
	const h = m/60
	if(h >= 1) return Math.floor(h) + ' hours'
	else if(m >= 1) return Math.floor(m) + ' minutes'
	else if(s >= 10) return Math.floor(s) + ' seconds'
	else return 'a few moments'
}