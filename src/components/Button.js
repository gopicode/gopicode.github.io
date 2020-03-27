import {h} from '../lib/h.js'
import './Button.css';

// Refer: http://exploringjs.com/es6/ch_destructuring.html for ...rest syntax
export function Button(propsAll) {
	const {children, ...props} = propsAll;
	props.className = 'btn';
	return h('button', props, children);
}
