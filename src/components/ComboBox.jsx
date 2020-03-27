import './ComboBox.css';
import PropTypes from 'prop-types';

export class ComboBox extends React.PureComponent {
	constructor(props) {
		super(props);

		this.state = {
			showList: false
		};

		this.inputRef = React.createRef();
		this.selectRef = React.createRef();

		this.onInputFocus = this.onInputFocus.bind(this);
		this.onInputBlur = this.onInputBlur.bind(this);
		this.onInputKeyDown = this.onInputKeyDown.bind(this);
		this.onSelectBlur = this.onSelectBlur.bind(this);
		this.onSelectKeyDown = this.onSelectKeyDown.bind(this);
		this.onSelectItemClick = this.onSelectItemClick.bind(this);
	}

	onInputFocus(e) {
		e.currentTarget.select();
		this.setState({showList: true});
	}

	onInputBlur(e) {
		if (this.selectRef.current && this.selectRef.current.contains(e.relatedTarget)) return;
		this.setState({showList: false});
	}

	onInputKeyDown({nativeEvent:e}) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			const args = {key: e.key, keyCode: e.keyCode};
			const evt = new KeyboardEvent(e.type, args);
			if (this.selectRef.current) {
				this.selectRef.current.focus();
				this.selectRef.current.dispatchEvent(evt);
			}
		}
	}

	onSelectBlur(e) {
		if (this.inputRef.current && this.inputRef.current === e.relatedTarget) return;
	}

	onSelectKeyDown(e) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		this.onSelectItemClick(e);
	}

	onSelectItemClick(e) {
		const idx = +e.currentTarget.value;
		const item = this.props.list[idx];
		this.props.onSelect(item, this.props.id);
		this.setState({showList: false});
	}

	render() {
		const { id, value, list, className, itemFormat, zIndex } = this.props;
		const { showList } = this.state;
		const cssList = !list.length ? 'hide' : showList ? '' : 'hide';
		return (
		<span id={id} className={"combo-box " + className} style={{zIndex}}>
			<input ref={this.inputRef} className="combo-box-input" autoComplete="off" value={value}
				onChange={e => this.props.onChange(e.target.value, id)}
				onFocus={this.onInputFocus}
				onBlur={this.onInputBlur}
				onKeyDown={this.onInputKeyDown}
			/>
			<br/>
			<span className={["combo-box-list", cssList].join(' ')}>
				<select ref={this.selectRef} className="combo-box-select" multiple="true" size="10"
					onBlur={this.onSelectBlur}
					onKeyDown={this.onSelectKeyDown}>
				{list.map((item, k) =>
					<option key={k} value={k} onClick={this.onSelectItemClick}>
						{itemFormat(item)}
					</option>
				)}
				</select>
			</span>
		</span>
		)
	}
}

ComboBox.propTypes = {
	value: PropTypes.string.isRequired,
	list: PropTypes.arrayOf(PropTypes.object),
	className: PropTypes.string,
	onChange: PropTypes.func.isRequired, // (value: String, id: props.id)
	onSelect: PropTypes.func,            // (item: ListItem, id: props.id)
	itemFormat: PropTypes.func           // (item: ListItem) -> String
};

ComboBox.defaultProps = {
	list: [],
	className: '',
	zIndex: 1,
	onSelect: function(){},
	itemFormat: item => item.toString()
};
