import {h} from '../lib/h.js'
import './DatePicker.less';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NBSP = '\u00a0'; // unicode for entity &nbsp;

function genId() {
	return Math.random().toString(36).substr(2, 9);
}

function pad(d) {
	return ('0' + d).substr(-2);
}

function formatDate(dt, formatStr = 'YYYY-MM-DD') {
	if (!(dt && dt instanceof Date)) return '';
	const yyyy = dt.getFullYear();
	const mm = pad(dt.getMonth() + 1);
	const dd = pad(dt.getDate());
	const mon = MONTH_NAMES[dt.getMonth() + 1];
	return formatStr.replace('YYYY', yyyy).replace('MMM', mon).replace('MM', mm).replace('DD', dd);
}

function compareDates(a, b) {
	const s1 = formatDate(a);
	const s2 = formatDate(b);
	return (s1 > s2) ? 1 : (s1 < s2) ? -1 : 0;
}

function isSameDate(a, b) {
	// return compareDates(a, b) === 0;
	return (a.getFullYear() === b.getFullYear()) && (a.getMonth() === b.getMonth()) && (a.getDate() === b.getDate());
}

// console.log('compare GT', compareDates(new Date(2016, 7, 30), new Date(2016, 7, 28)));
// console.log('compare LT', compareDates(new Date(2016, 7, 30), new Date(2016, 8, 28)));
// console.log('compare EQ', compareDates(new Date(2016, 7, 21), new Date(2016, 7, 21)));


// console.log('compare GT', compareDates(new Date(2016, 7, 30), new Date(2016, 7, 28)));
// console.log('compare LT', compareDates(new Date(2016, 7, 30), new Date(2016, 8, 28)));
// console.log('compare EQ', compareDates(new Date(2016, 7, 21), new Date(2016, 7, 21)));


function buildState(props, state) {
	const dt = props.value ? props.value : new Date();
	const year = dt.getFullYear();
	const month = dt.getMonth() + 1;
	return {
		show: false,
		year,
		month
	};
}

export class DatePicker extends React.Component {
	constructor(props) {
		super(props);
		this.state = buildState(props);
		this.rootRef = React.createRef();
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.onInputFocus = this.onInputFocus.bind(this);
		this.onClear = this.onClear.bind(this);
	}

	componentDidMount() {
	}

	// Do NOT blindly call setState. It should be conditional. Otherwise, we will endup in infinite loop
	// Read more: https://reactjs.org/docs/react-component.html
	componentDidUpdate(prevProps, prevState, snapshot) {
		if (prevProps.value === this.props.value) return;
		if (prevProps.value && this.props.value && isSameDate(this.props.value, prevProps.value)) return;
		console.log('componentDidUpdate', this.props.id, formatDate(prevProps.value), formatDate(this.props.value));
		const state = buildState(this.props, this.state);
		this.setState(state);
	}

	// componentWillReceiveProps lifecycle is deprecated
	// use componentDidUpdate lifecyle to conditionally update the state from props changes (check above)
	__componentWillReceiveProps(nextProps) {
		console.log('componentWillReceiveProps', nextProps.id, nextProps.value);
		if (this.props.value === nextProps.value) return;
		if (this.props.value && nextProps.value && isSameDate(this.props.value, nextProps.value)) return;
		const state = buildState(nextProps, this.state);
		this.setState(state);
	}

	show() {
		if (this.props.value) {
			const dt = this.props.value;
			const year = dt.getFullYear();
			const month = dt.getMonth() + 1;
			this.setState({
				year,
				month
			});
		}
		document.addEventListener('click', this.onDocumentClick);
		this.setState({show: true});
	}

	hide() {
		document.removeEventListener('click', this.onDocumentClick);
		this.setState({show: false});
	}

	onDocumentClick(e) {
		const $root = this.rootRef.current;
		if ($root && !$root.contains(e.target)) {
			this.hide();
		}
	}

	onInputFocus() {
		this.show();
	}

	onClear() {
		this.props.onChange(null, this.props.id);
	}

	move(year, month) {
		this.setState({year, month});
	};

	choose(day) {
		if (!day) return
		const dt = new Date(this.state.year, this.state.month - 1, day);
		this.hide();
		this.props.onChange(dt, this.props.id);
	}

	chooser(val) {
		return e => this.choose(val);
	};

	formatValue() {
		if (!this.props.value) return '';
		return formatDate(this.props.value, this.props.displayFormat);
	};

	renderTable(year, month) {
		const grid = [];
		const mon = month - 1;
		let i, j, k, d;
		for (i = 0; i < 6; i += 1) {
			for (j = 0; j < 7; j += 1) {
				k = i * 7 + j;
				grid[k] = NBSP;
			}
		}

		const firstDate = new Date(year, mon, 1);
		const firstDay = firstDate.getDay();
		let lday = 32;
		let lastDate;
		do {
			lday -= 1;
			lastDate = new Date(year, mon, lday);
		} while (lastDate.getMonth() !== mon)

		for (d = 1, k = firstDay; d <= lastDate.getDate(); d += 1, k += 1) {
			grid[k] = d;
		}
		// console.log('grid', year, month, grid);

		const selDate = this.props.value ? this.props.value.getDate() : 0;
		const rows = [];
		for (i = 0; i < 6; i += 1) {
			const cols = [];
			for (j = 0; j < 7; j += 1) {
				k = i * 7 + j;
				const val = grid[k];
				const css = [];
				if (val !== NBSP) {
					let dt = new Date(this.state.year, this.state.month - 1, val);
					css.push('enabled');
					if (this.props.value && isSameDate(dt, this.props.value)) css.push('selected');
				}
				cols[j] = h('td', {key: 'c' + j, className: css.join(' '), onClick: this.chooser(val)}, val);
			}
			rows.push(
				h('tr', {key: 'r' + i}, cols)
			);
		}

		return h('table', {className: 'date-picker__calendar'},
			h('thead', null,
				h('tr', null,
					h('th', null, 'S'),
					h('th', null, 'M'),
					h('th', null, 'T'),
					h('th', null, 'W'),
					h('th', null, 'T'),
					h('th', null, 'F'),
					h('th', null, 'S')
				)
			),
			h('tbody', {onClick: this.onDayClick}, rows)
		);
	}


	render() {
		const {show, year, month} = this.state;
		const {id, value, clearable, className, placeholder, zIndex} = this.props;

		const calHide = show ? '' : 'hide';
		const clear = clearable && value ? h('span', {className: 'date-picker__input-icox', onClick: this.onClear}, '\u2715') : null;

		return h('div', {id, ref: this.rootRef, className: 'date-picker ' + className, style: {zIndex}},
			h('div', {className: 'date-picker__input'},
				h('input', {className: 'date-picker__input-txt', type: 'text', value: this.formatValue(),
					placeholder: placeholder, onFocus: this.onInputFocus}),
				clear
			),
			h('div', {className: ['date-picker__panel ', calHide].join(' ') },
				h('div', {className: 'date-picker__nav'},
					h('span', {className: 'date-picker__nav-ico fa fa-angle-double-left',
						onClick: e => this.move(year - 1, month)}),
					h('span', {className: 'date-picker__nav-ico fa fa-angle-left',
						onClick: e => this.move(year, month - 1)}),
					h('span', {className: 'date-picker__nav-mnyr'}, MONTH_NAMES[month], ' ', year),
					h('span', {className: 'date-picker__nav-ico fa fa-angle-right',
						onClick: e => this.move(year, month + 1)}),
					h('span', {className: 'date-picker__nav-ico fa fa-angle-double-right',
						onClick: e => this.move(year + 1, month)})
				),
				this.renderTable(year, month)
			)
		);
	}
};

DatePicker.defaultProps = {
	value: null, // null | Date object
	className: '',
	displayFormat: 'DD-MM-YYYY', // options: YYYY=FullYear, MMM=MonthName, MM=Month, DD=Day
	placeholder: 'Select...',
	zIndex: 1,
	clearable: true,
	onChange: function(){}       // (value, id)
};
