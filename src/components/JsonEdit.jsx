import PropTypes from 'prop-types';
import './JsonEdit.css';

const TYPE_NULL = 'null';
const TYPE_ARRAY = 'array';
const TYPE_OBJECT = 'object';
const TYPE_BOOLEAN = 'boolean';
const TYPE_NUMBER = 'number';
const TYPE_STRING = 'string';
const TYPE_MARKER = '__mark';

const MARKS = {
	"array": {beg: "[", end: "]"},
	"object": {beg: "{", end: "}"}
}

function getType(val) {
	if (val === null) return TYPE_NULL;
	if (Array.isArray(val)) return TYPE_ARRAY;
	return typeof(val);
}

function typecast(val) {
	val = val.trim()
	if (/^null$/i.test(val)) return null;
	if (/^true$/i.test(val)) return true;
	if (/^false$/i.test(val)) return false;
	if (/^\d+$/.test(val)) return Number(val);
	if (/^\d+\.\d+$/.test(val)) return Number(val);
	if (/^\{\}$/i.test(val)) return {};
	if (/^\[\]$/i.test(val)) return [];
	return String(val);
}

function joinPath(jpath, key) {
	return jpath ? [jpath, key].join('.') : key;
}

export class JsonEdit extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			value: props.value,
			action: '',
			jpath: ''
		};

		this.onCancel = this.onCancel.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
	}

	onEdit(jpath) {
		console.log('onEdit', jpath)
		this.setState({action: 'edit', jpath})
	}

	onAdd(jpath) {
		console.log('onAdd', jpath)
		this.setState({action: 'add', jpath})
	}

	onCreate(jpath, key, val) {
		console.log('onCreate', jpath, key, val);
		let parts = jpath.split('.')
		let obj = {...this.state.value}
		parts.forEach(part => {
			obj = obj[part]
		})
		obj[key] = typecast(val);
		this.setState({action: ''})
	}

	onUpdate(jpath, key2, val) {
		key2 = key2.trim();
		let parts = jpath.split('.')
		let key = parts.pop()
		let newValue = {...this.state.value}
		let obj = newValue
		parts.forEach(part => {
			obj = obj[part]
		})
		if (key2 === key) {
			obj[key] = typecast(val);
		} else {
			obj[key2] = typecast(val);
			delete obj[key];
		}
		console.log('onUpdate', jpath, parts, obj, key, val);
		this.setState({value: newValue, action: ''})
	}

	onDelete(jpath) {
		let parts = jpath.split('.')
		let key = parts.pop()
		let newValue = {...this.state.value}
		let obj = newValue
		parts.forEach(part => {
			obj = obj[part]
		})
		if (getType(obj) === TYPE_ARRAY) {
			obj.splice(key, 1);
			console.log('onDelete array', jpath, parts, obj, key)
		} else {
			delete obj[key];
			console.log('onDelete object', jpath, parts, obj, key)
		}
		this.setState({value: newValue, action: ''})
	}

	onCancel(jpath) {
		console.log('onCancel', jpath)
		this.setState({action: ''})
	}

	draw(elem, opts = {}) {
		const {type: parentType, jpath: parentPath} = opts;
		const keys = Object.keys(elem);
		const items = [];

		for (let i = 0; i < keys.length; i += 1) {
			const key = keys[i];
			const val = elem[key];
			const comma = (keys.length > 1 && i + 1 < keys.length);
			const jpath = joinPath(parentPath, key);
			const type = getType(val);

			if (type === TYPE_ARRAY || type === TYPE_OBJECT) {
				const mark = MARKS[type];
				const collapseable = (type === TYPE_ARRAY && val.length >= 1) || Object.keys(val).length >= 1;
				items.push(this.drawItem(key, mark.beg, {type, index: i + '-beg', parentType, isMarkBegin: true, collapseable}));
				items.push(this.draw(val, {type, jpath}));
				if (this.state.action === 'add' && this.state.jpath === jpath) {
					items.push(
					<form className="json-val" onSubmit={e => {
						e.preventDefault();
						const form = e.currentTarget;
						const keyNew = type === TYPE_OBJECT ? form.elements['key'].value : val.length;
						const valNew = form.elements['val'].value;
						this.onCreate(jpath, keyNew, valNew);
					}}>
						{type === TYPE_OBJECT && <input type="text" name="key" placeholder="key" autoFocus={true}/>}
						<input type="text" name="val" placeholder="value"  autoFocus={type === TYPE_ARRAY}/>
						<button type="submit">create</button>
						<button onClick={this.onCancel} type="button">cancel</button>
					</form>
					)
				}
				items.push(this.drawItem(null, mark.end,
					{type, jpath, index: i + '-end', comma, deleteable: true, addable: true, parentType}
				));

			} else {
				const editable = this.state.action === 'edit' && jpath === this.state.jpath
				items.push(this.drawItem(key, val,
					{index: i, type, jpath, comma, deleteable: true, editable, parentType}));
			}
		}
		return (
		<div className="json-object">
			{items}
		</div>
		)
	}

	drawItem(key, val, opts = {}) {
		const {comma, index, jpath, type, deleteable, addable, editable, parentType, isMarkBegin, collapseable} = opts;
		const keyStr = (key === null || parentType === TYPE_ARRAY) ? '' : `"${key}"`;
		const valStr = type === TYPE_STRING ? `"${val}"` : String(val);

		let Tag = 'div';
		let keyMarkup, valMarkup, btnMarkup, arrowMarkup;
		if (editable) {
			Tag = 'form'
			keyMarkup = keyStr && (
			<span className="json-key">
				<input type="text" name="key" defaultValue={key} autoFocus={true} onFocus={e => e.target.select()} />
			</span>
			)
			valMarkup = (
			<span className="json-val">
				<input type="text" name="val" defaultValue={val} autoFocus={true} onFocus={e => e.target.select()} />
			</span>
			)
			btnMarkup = (
			<span>
				<button type="submit">update</button>
				<button type="button" onClick={this.onCancel}>cancel</button>
			</span>
			)
		} else {
			keyMarkup = keyStr && (
				<span className="json-key" onClick={e => this.onEdit(jpath)}>{keyStr + ':'}</span>
			)
			valMarkup = (
				<span className="json-val" onClick={e => this.onEdit(jpath)}>{valStr}{comma && ","}</span>
			)
			btnMarkup = (
			<span className="json-btns">
				{addable && <button className="json-btn-add" onClick={e => this.onAdd(jpath)}>+</button>}
				{deleteable && <button className="json-btn-del" onClick={e => this.onDelete(jpath)}>-</button>}
			</span>
			)
			if (collapseable && isMarkBegin) {
				arrowMarkup = (
					<button type="button" className="json-btn-arrow" onClick={e => {
						const btn = e.currentTarget;
						const $line = btn.closest('.json-line');
						if (!$line) return;
						let $node = $line.nextElementSibling;
						if (!$node.matches('.json-object')) return;
						$node.classList.toggle('is-hidden');
						const isHidden = $node.classList.contains('is-hidden');
						btn.innerHTML = isHidden ? '&rarr;' : '&darr;'
						isHidden ? btn.classList.add('show') : btn.classList.remove('show');
					}}>&darr;</button>
				)
			}
		}

		return (
		<div key={index} className="json-line">
			<Tag onSubmit={e => {
				e.preventDefault();
				const form = e.currentTarget;
				const key = form.elements["key"] ? form.elements["key"].value : '';
				const val = form.elements["val"].value;
				this.onUpdate(jpath, key, val);
			}}>
				{keyMarkup}
				{valMarkup}
				{btnMarkup}
				{arrowMarkup}
				{/*<span style={{color:"#777"}}>{jpath}</span>*/}
			</Tag>
		</div>
		)
	}

	render() {
		const val = this.state.value;
		const type = getType(val); //Array.isArray(val) ? TYPE_ARRAY : TYPE_OBJECT;
		const mark = MARKS[type];
		return (
		<div className={"json-edit"}>
			<div>
				{this.drawItem(null, mark.beg, {index: '0-beg'})}
				{this.draw(val, {type, jpath:''})}
				{this.drawItem(null, mark.end, {type, index: '0-end'})}
			</div>
			<div>
				<button type="button" onClick={e => this.props.onChange(this.state.value)}>Save</button>
			</div>
		</div>
		)
	}
}

JsonEdit.propTypes = {
	value: PropTypes.object.isRequired,
	className: PropTypes.string,
	onChange: PropTypes.func // (value: String, id: props.id)
};

JsonEdit.defaultProps = {
	className: '',
	onChange: function(){}
};
