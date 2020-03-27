import PropTypes from 'prop-types';
import './JsonEditRecur.less';

const TYPE_NULL = 'null';
const TYPE_ARRAY = 'array';
const TYPE_OBJECT = 'object';
const TYPE_BOOLEAN = 'boolean';
const TYPE_NUMBER = 'number';
const TYPE_STRING = 'string';
const TYPE_MARKER = '__mark';

class Mark {
	constructor(name) {
		this.name = name;
	}
	toString() {
		return String(this.name)
	}
}

const MARKS = {
	"colon": ":",
	"comma": ",",
	"quote": '"',
	"array": {beg: new Mark("["), end: new Mark("]")},
	"object": {beg: new Mark("{"), end: new Mark("}")}
}
const MARKS_LIST = [MARKS.array.beg, MARKS.array.end, MARKS.object.beg, MARKS.object.end];
const TYPE_LIST = [TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_OBJECT, TYPE_ARRAY, TYPE_NULL];

function getType(val) {
	if (val === null) return TYPE_NULL;
	if (Array.isArray(val)) return TYPE_ARRAY;
	if (MARKS_LIST.includes(val)) return TYPE_MARKER;
	return typeof(val);
}

function typecast(val, type) {
	val = val.trim()
	if (type === TYPE_NULL) return null;
	if (type === TYPE_BOOLEAN && val === "true") return true;
	if (type === TYPE_BOOLEAN && val === "false") return false;
	if (type === TYPE_BOOLEAN) return Boolean(val);
	if (type === TYPE_NUMBER) return Number(val);
	if (type === TYPE_OBJECT) return {};
	if (type === TYPE_ARRAY) return [];
	return String(val);
}


class JsonLine extends React.PureComponent {
	constructor(props) {
		super(props);
		this.reset = this.reset.bind(this);
		this.add = this.add.bind(this);
		this.edit = this.edit.bind(this);
		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.remove = this.remove.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyInput = this.onKeyInput.bind(this);
	}

	onKeyDown(e) {
		// console.log('key', e.key);
		if (e.key == "Escape") return this.reset(e);
	}

	onKeyInput(e) {
		if (e.target.name === 'value') {
			const $input = e.target;
			const $select = $input.form.elements.type;
			const val = $input.value.trim();
			if (/^[\d\.]+$/.test(val)) $select.value = TYPE_NUMBER;
			else if (/^(false|true)$/i.test(val)) $select.value = TYPE_BOOLEAN;
			else if (/^null$/i.test(val)) $select.value = TYPE_NULL;
			else if (/^\{\}$/i.test(val)) $select.value = TYPE_OBJECT;
			else if (/^\[\]$/i.test(val)) $select.value = TYPE_ARRAY;
			else $select.value = TYPE_STRING;
		}
	}

	reset(e, $line) {
		if (!$line) {
			$line = e.currentTarget.closest('.json-line');
		}
		const $struct = $line.closest('.json-struct');
		const $item = $line.querySelector('.json-item');
		const forms = Array.from($line.querySelectorAll('.frm'));
		$struct.classList.remove('wip');
		$item.classList.remove('hide');
		forms.forEach($form => $form.classList.add('hide'));
	}

	add(e) {
		const $el = e.currentTarget;
		const $line = $el.closest('.json-line');
		const $struct = $line.closest('.json-struct');
		const $form = $line.querySelector('.frm-create');
		$struct.classList.add('wip');
		$form.classList.remove('hide');
		$form.elements[0].focus();
		$form.elements[0].select();
	}

	edit(e) {
		const $el = e.currentTarget;
		const $line = $el.closest('.json-line');
		const $struct = $line.closest('.json-struct');
		const $item = $line.querySelector('.json-item');
		const $form = $line.querySelector('.frm-update');
		$struct.classList.add('wip');
		$item.classList.add('hide');
		$form.classList.remove('hide');
		$form.elements[0].focus();
		$form.elements[0].select();
	}

	create(e) {
		e.preventDefault();
		const $form = e.currentTarget;
		const $line = $form.closest('.json-line');
		this.reset(null, $line);

		const $inputType = $form.elements.type;
		const newType = $inputType ? $inputType.value.trim() : TYPE_STRING;
		// console.log('eee newType', newType);

		const $inputValue = $form.elements.value;
		const newValue = $inputValue ? typecast($inputValue.value.trim(), newType) : null;

		const $inputName = $form.elements.name;
		const newName = $inputName ? $inputName.value.trim() : null;

		if (!(newName || newValue)) return;
		const trace = ['create', newValue];
		this.props.create(newName, newValue, trace);
	}

	update(e) {
		e.preventDefault();
		const $form = e.currentTarget;
		const $line = $form.closest('.json-line');
		this.reset(null, $line);

		const $inputType = $form.elements.type;
		const newType = $inputType ? $inputType.value.trim() : TYPE_STRING;

		const $inputValue = $form.elements.value;
		const newValue = $inputValue ? typecast($inputValue.value.trim(), newType) : null;

		const $inputName = $form.elements.name;
		const newName = $inputName ? $inputName.value.trim() : null;

		const {name, index} = this.props;
		if (!(newName || index || newValue)) return;
		const trace = ['update', newValue];
		this.props.update(newName || index, newValue, name || index, trace);
	}

	remove(e) {
		e.preventDefault();
		const {name, index} = this.props;
		const trace = ['remove'];
		this.props.remove(name || index, trace);
	}

	render() {
		const {ctype, name, val, comma, create, update, remove, toggle, expanded, isMarker} = this.props;
		const vtype = getType(val);
		const isNull = val === undefined || val === null;
		const quote = getType(val) === TYPE_STRING ? MARKS.quote : '';
		return (
			<div className="json-line">
				{create && <form className="frm frm-create hide" onSubmit={this.create} onKeyDown={this.onKeyDown} onInput={this.onKeyInput}>
					{ctype == TYPE_OBJECT && <input className="txt" type="text" name="name" defaultValue="" />}
					<input className="txt" type="text" name="value" defaultValue="" />
					<select name="type">
						{TYPE_LIST.map(t => <option value={t}>{t}</option>)}
					</select>
					<button className="btn btn-create" type="submit">create</button>
					<button className="btn btn-cancel" type="button" onClick={this.reset}>cancel</button>
				</form>}
				<div className="json-item">
					{name && <span>
						<span className="json-name" onClick={this.edit}>{name}{MARKS.colon}</span>
					</span>}
					<span className="json-val" onClick={this.edit}>{isNull ? "null" : (quote + val + quote)}</span>
					{toggle && <button className="btn btn-hover btn-arrow" onClick={toggle}>{expanded ? '\u2193' : '\u2192'}</button>}
					{remove && <button className="btn btn-hover btn-del" onClick={this.remove}>remove</button>}
					{create && <button className="btn btn-hover btn-add" onClick={this.add}>add</button>}
				</div>
				{update && <form className="frm frm-update hide" onSubmit={this.update} onKeyDown={this.onKeyDown} onInput={this.onKeyInput}>
					{name && <span>
						<input className="txt" type="text" name="name" defaultValue={name} />{MARKS.colon}
					</span>}
					{!isMarker && <input className="txt" type="text" name="value" defaultValue={val} />}
					{!isMarker && <select name="type">
						{TYPE_LIST.map(t => <option value={t} selected={vtype === t}>{t}</option>)}
					</select>}
					{comma && <span className="json-comma">{MARKS.comma}</span>}
					<button className="btn btn-update" type="submit">update</button>
					<button className="btn btn-cancel" type="button" onClick={this.reset}>cancel</button>
				</form>}
			</div>
		)
	}
}
class JsonStruct extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			kidsExpanded: props.expandAll
		};

		this.create = this.create.bind(this);
		this.update = this.update.bind(this);
		this.updateKey = this.updateKey.bind(this);
		this.remove = this.remove.bind(this);
		this.toggle = this.toggle.bind(this);
	}

	componentDidUpdate(prevProps) {
		const {props} = this;
		if (prevProps.expandAll !== props.expandAll) {
			this.setState({kidsExpanded: props.expandAll});
		}
	}

	create(k, v, trace = []) {
		// console.log('create', k, v);
		trace.push(k);
		const {name, index, val, update} = this.props;
		const type = getType(val);
		const newValue = type === TYPE_OBJECT ? {...val, [k]: v} : [...val, v];
		update(name || index, newValue, null, trace);
	}

	update(k, v, p, trace = []) {
		// console.log('update', k, v, p);
		trace.push(k);
		const {name, index, val, update} = this.props;
		const type = getType(val);
		let newValue;
		if (type === TYPE_OBJECT) {
			// if the key changed
			if (p && p != k) {
				trace.push('remove', p);
				// to retain the position of the changed key, iterate the object and flip the key at the exact order
				newValue = {};
				Object.entries(val).forEach(([k2, v2]) => {
					if (k2 == p) newValue[k] = v;
					else newValue[k2] = v2;
				})
			} else {
				newValue = {...val};
				newValue[k] = v;
			}
		} else {
			newValue = [...val];
			newValue[k] = v;
		}
		update(name || index, newValue, null, trace);
	}

	updateKey(k, v, p, trace = []) {
		// console.log('updateKey', k, v, p);
		trace.push(k);
		const {name, index, val, update} = this.props;
		update(k, val, name || index, trace);
	}

	remove(k, trace = []) {
		// console.log('remove', k);
		trace.push(k);
		const {name, index, val, update} = this.props;
		const type = getType(val);
		let newValue;
		if (type === TYPE_OBJECT) {
			newValue = {...val};
			delete newValue[k];
		} else {
			newValue = [...val];
			newValue.splice(k, 1);
		}
		update(name || index, newValue, null, trace);
	}

	toggle(e) {
		e.preventDefault();
		this.setState({kidsExpanded: !this.state.kidsExpanded})
	}

	render() {
		const {kidsExpanded} = this.state;
		const {name, index, val, remove, comma, expandAll} = this.props;
		const type = getType(val);
		const keys = Object.keys(val);
		const kids = keys.map((k, i) => {
			const v = val[k];
			const t = getType(v);
			const comma = (i < keys.length - 1);
			const name = type === TYPE_OBJECT ? k : undefined;
			const index = type === TYPE_ARRAY ? k : undefined;
			const JsonItem = (t === TYPE_ARRAY || t === TYPE_OBJECT) ? JsonStruct : JsonLine;
			return <JsonItem key={i} name={name} index={index} val={v} comma={comma}
					update={this.update} remove={this.remove} expandAll={expandAll} />;
		});
		return (
			<div className={"json-struct " + type}>
				<JsonLine name={name} index={index} val={MARKS[type].beg}
					update={this.updateKey} remove={remove}
					toggle={kids.length ? this.toggle : null} expanded={kidsExpanded} isMarker={true} />
				{kidsExpanded && <div className="json-kids">{kids}</div>}
				<JsonLine val={MARKS[type].end} comma={comma} create={this.create} ctype={type} />
			</div>
		)
	}
}
JsonStruct.defaultProps = {
	expanded: true,
	expandAll: true
};

export class JsonEdit extends React.PureComponent {
	constructor(props) {
		super(props);

		const value = props.value;
		const valueClone = JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));

		this.state = {
			value: valueClone,
			expandAll: true
		};

		this.update = this.update.bind(this);
		this.onClickExpandAll = this.onClickExpandAll.bind(this);
	}

	update(k, v, p, trace) {
		console.log(trace);
		this.setState({value: v});
	}

	onClickExpandAll(e) {
		this.setState({expandAll: !this.state.expandAll});
	}

	render() {
		const {value, expandAll} = this.state;
		return (
		<div className={"json-edit"}>
			<div>
				<JsonStruct val={this.state.value} update={this.update} expandAll={expandAll} />
			</div>
			<div>
				<button type="button" onClick={e => this.props.onChange(value)}>Save</button>
				<button type="button" onClick={this.onClickExpandAll}>{expandAll ? 'Collapse' : 'Expand'} All</button>
			</div>
		</div>
		)
	}
}

JsonEdit.propTypes = {
	value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
	className: PropTypes.string,
	onChange: PropTypes.func // (value: String, id: props.id)
};

JsonEdit.defaultProps = {
	className: '',
	onChange: function(){}
};
