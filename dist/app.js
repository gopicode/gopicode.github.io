(function (PropTypes) {
	'use strict';

	PropTypes = PropTypes && PropTypes.hasOwnProperty('default') ? PropTypes['default'] : PropTypes;

	const h = React.createElement;

	// Refer: http://exploringjs.com/es6/ch_destructuring.html for ...rest syntax
	function Button(propsAll) {
		const {children, ...props} = propsAll;
		props.className = 'btn';
		return h('button', props, children);
	}

	const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const NBSP = '\u00a0'; // unicode for entity &nbsp;

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

	class DatePicker extends React.Component {
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
	}
	DatePicker.defaultProps = {
		value: null, // null | Date object
		className: '',
		displayFormat: 'DD-MM-YYYY', // options: YYYY=FullYear, MMM=MonthName, MM=Month, DD=Day
		placeholder: 'Select...',
		zIndex: 1,
		clearable: true,
		onChange: function(){}       // (value, id)
	};

	class ComboBox extends React.PureComponent {
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
	    this.setState({
	      showList: true
	    });
	  }

	  onInputBlur(e) {
	    if (this.selectRef.current && this.selectRef.current.contains(e.relatedTarget)) return;
	    this.setState({
	      showList: false
	    });
	  }

	  onInputKeyDown({
	    nativeEvent: e
	  }) {
	    if (e.key === 'ArrowDown') {
	      e.preventDefault();
	      const args = {
	        key: e.key,
	        keyCode: e.keyCode
	      };
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
	    this.setState({
	      showList: false
	    });
	  }

	  render() {
	    const {
	      id,
	      value,
	      list,
	      className,
	      itemFormat,
	      zIndex
	    } = this.props;
	    const {
	      showList
	    } = this.state;
	    const cssList = !list.length ? 'hide' : showList ? '' : 'hide';
	    return React.createElement("span", {
	      id: id,
	      className: "combo-box " + className,
	      style: {
	        zIndex
	      }
	    }, React.createElement("input", {
	      ref: this.inputRef,
	      className: "combo-box-input",
	      autoComplete: "off",
	      value: value,
	      onChange: e => this.props.onChange(e.target.value, id),
	      onFocus: this.onInputFocus,
	      onBlur: this.onInputBlur,
	      onKeyDown: this.onInputKeyDown
	    }), React.createElement("br", null), React.createElement("span", {
	      className: ["combo-box-list", cssList].join(' ')
	    }, React.createElement("select", {
	      ref: this.selectRef,
	      className: "combo-box-select",
	      multiple: "true",
	      size: "10",
	      onBlur: this.onSelectBlur,
	      onKeyDown: this.onSelectKeyDown
	    }, list.map((item, k) => React.createElement("option", {
	      key: k,
	      value: k,
	      onClick: this.onSelectItemClick
	    }, itemFormat(item))))));
	  }

	}
	ComboBox.propTypes = {
	  value: PropTypes.string.isRequired,
	  list: PropTypes.arrayOf(PropTypes.object),
	  className: PropTypes.string,
	  onChange: PropTypes.func.isRequired,
	  // (value: String, id: props.id)
	  onSelect: PropTypes.func,
	  // (item: ListItem, id: props.id)
	  itemFormat: PropTypes.func // (item: ListItem) -> String

	};
	ComboBox.defaultProps = {
	  list: [],
	  className: '',
	  zIndex: 1,
	  onSelect: function () {},
	  itemFormat: item => item.toString()
	};

	function pick(source, ...keys) {
		return keys.reduce((obj, key) => {
			obj[key] = source[key];
			return obj;
		}, {});
	}

	class ImageCrop extends React.Component {
	  constructor(props) {
	    super(props);
	    this.model = { ...props.value,
	      isBegining: false,
	      isDragging: false,
	      isResizing: false,
	      imgWidth: 0,
	      imgHeight: 0,
	      direction: '',
	      startX: 0,
	      startY: 0
	    };
	    this.rootRef = React.createRef();
	    this.updateView = this.updateView.bind(this);
	    this.onImgLoad = this.onImgLoad.bind(this);
	    this.onMouseDown = this.onMouseDown.bind(this);
	    this.onMouseMove = this.onMouseMove.bind(this);
	    this.onMouseUp = this.onMouseUp.bind(this);
	  }

	  updateModel(patch) {
	    Object.assign(this.model, patch); // console.log('updateModel', this.model);
	  }

	  componentDidMount() {
	    this.$root = this.rootRef.current;
	    this.$shim = this.$root.querySelector('.image-crop__shim');
	    this.$area = this.$root.querySelector('.image-crop__area');
	    this.handles = Array.from(this.$root.querySelectorAll('.image-crop__handle')); // console.log('componentDidMount', this.$shim, this.$area, this.handles);

	    document.addEventListener('mouseup', this.onMouseUp);
	    requestAnimationFrame(this.updateView);
	  }

	  componentWillUnmount() {
	    document.removeEventListener('mouseup', this.onMouseUp);
	  }

	  shouldComponentUpdate(nextProps, nextState) {
	    // TODO: determine if update is required
	    return false;
	  }

	  componentDidUpdate(prevProps, prevState, snapshot) {// TODO: update state based on props.value changes
	  }

	  onImgLoad(e) {
	    const dim = {
	      imgWidth: e.target.width,
	      imgHeight: e.target.height
	    };
	    console.log('onImgLoad', dim);
	    this.updateModel(dim);
	  }

	  onMouseDown({
	    nativeEvent: e
	  }) {
	    if (this.model.isBegining || this.model.isDragging || this.model.isResizing) return false;

	    if (e.target.classList.contains('image-crop__shim')) {
	      this.updateModel({
	        isBegining: true,
	        isDragging: false,
	        isResizing: false,
	        startX: e.screenX,
	        startY: e.screenY,
	        left: e.offsetX,
	        top: e.offsetY,
	        width: 0,
	        height: 0
	      });
	    } else if (e.target.classList.contains('image-crop__drag')) {
	      this.updateModel({
	        isBegining: false,
	        isDragging: true,
	        isResizing: false,
	        startX: e.screenX,
	        startY: e.screenY
	      });
	    } else if (e.target.classList.contains('image-crop__handle')) {
	      const direction = e.target.getAttribute('data-direction');
	      this.updateModel({
	        isBegining: false,
	        isDragging: false,
	        isResizing: true,
	        startX: e.screenX,
	        startY: e.screenY,
	        direction
	      });
	    }
	  } // dx, dy are difference in the X and Y directions respectively
	  // it is calculated with previous positions [startX, startY]
	  // after calculation, [startX, startY] are updated to the current mouse point


	  onMouseMove(e) {
	    if (this.model.isBegining) {
	      const width = e.screenX - this.model.startX;
	      const height = e.screenY - this.model.startY;
	      this.updateModel({
	        width,
	        height
	      });
	    } else if (this.model.isDragging) {
	      const startX = e.screenX;
	      const startY = e.screenY;
	      const dx = startX - this.model.startX;
	      const dy = startY - this.model.startY;
	      const {
	        left,
	        top,
	        width,
	        height,
	        imgWidth,
	        imgHeight
	      } = this.model;
	      const left1 = left + dx;
	      const top1 = top + dy; // limit the drag inside the container area

	      if (left1 < 0 || top1 < 0 || left1 + width > imgWidth || top1 + height > imgHeight) return;
	      this.updateModel({
	        startX,
	        startY,
	        left: left1,
	        top: top1
	      });
	    } else if (this.model.isResizing) {
	      const startX = e.screenX;
	      const startY = e.screenY;
	      const dx = startX - this.model.startX;
	      const dy = startY - this.model.startY;
	      const {
	        left,
	        top,
	        width,
	        height
	      } = this.model; // init next dimensions to the existing one.

	      let left1 = left,
	          top1 = top,
	          width1 = width,
	          height1 = height; // update next dimensions based on the direction of movement

	      switch (this.model.direction) {
	        // top increases, height reduces and vice versa
	        case 'north':
	          top1 = top + dy;
	          height1 = height - dy;
	          break;
	        // top fixed, height changes

	        case 'south':
	          height1 = height + dy;
	          break;
	        // left fixed, width changes

	        case 'east':
	          width1 = width + dx;
	          break;
	        // left increases, width reduces and vice versa

	        case 'west':
	          left1 = left + dx;
	          width1 = width - dx;
	          break;
	        // combination of north and east cases

	        case 'north-east':
	          top1 = top + dy;
	          width1 = width + dx;
	          height1 = height - dy;
	          break;
	        // combination of south and east cases

	        case 'south-east':
	          width1 = width + dx;
	          height1 = height + dy;
	          break;
	        // combination of north and west cases

	        case 'north-west':
	          left1 = left + dx;
	          top1 = top + dy;
	          width1 = width - dx;
	          height1 = height - dy;
	          break;
	        // combination of south and east cases

	        case 'south-west':
	          left1 = left + dx;
	          width1 = width - dx;
	          height1 = height + dy;
	          break;
	      }

	      this.updateModel({
	        startX,
	        startY,
	        left: left1,
	        top: top1,
	        width: width1,
	        height: height1
	      });
	    }
	  }

	  onMouseUp(e) {
	    if (this.model.isBegining || this.model.isDragging || this.model.isResizing) {
	      this.updateModel({
	        isBegining: false,
	        isDragging: false,
	        isResizing: false
	      });
	      const value = pick(this.model, 'left', 'top', 'width', 'height');
	      this.props.onChange(value, this.props.id);
	    }
	  }

	  updateView() {
	    const {
	      src,
	      zIndex
	    } = this.props;
	    const {
	      left,
	      top,
	      width,
	      height,
	      isBegining
	    } = this.model; // detrimine if crop area can be drawn

	    const drawArea = isBegining || width > 0 || height > 0; // update the shim

	    this.$shim.style.background = drawArea ? 'rgba(0, 0, 0, 0.4)' : 'transparent'; // set the same image as background for the cropper div
	    // background-position is set in the reverse of the div's position to select the same area in the background

	    if (drawArea) {
	      this.$area.classList.remove('image-crop--hide'); // update the area styles

	      this.$area.style.left = left + 'px';
	      this.$area.style.top = top + 'px';
	      this.$area.style.width = width + 'px';
	      this.$area.style.height = height + 'px';
	      this.$area.style.backgroundImage = 'url(' + src + ')';
	      this.$area.style.backgroundRepeat = 'no-repeat';
	      this.$area.style.backgroundPosition = `-${left}px -${top}px`; // show/hide the handles

	      this.handles.forEach($handle => {
	        isBegining ? $handle.classList.add('image-crop--hide') : $handle.classList.remove('image-crop--hide');
	      });
	    } else {
	      this.$area.classList.add('image-crop--hide');
	    } // next iteration


	    if (window.suspendRAF !== true) requestAnimationFrame(this.updateView);
	  }

	  render() {
	    const {
	      src,
	      zIndex
	    } = this.props;
	    return React.createElement("div", {
	      className: "image-crop",
	      ref: this.rootRef,
	      style: {
	        zIndex
	      },
	      onMouseDown: this.onMouseDown,
	      onMouseMove: this.onMouseMove
	    }, React.createElement("img", {
	      className: "image-crop__img",
	      src: src,
	      onLoad: this.onImgLoad
	    }), React.createElement("div", {
	      className: "image-crop__shim"
	    }), React.createElement("div", {
	      className: "image-crop__area image-crop--hide",
	      draggable: "false"
	    }, React.createElement("div", {
	      className: "image-crop__vline"
	    }), React.createElement("div", {
	      className: "image-crop__hline"
	    }), React.createElement("div", {
	      className: "image-crop__vline right"
	    }), React.createElement("div", {
	      className: "image-crop__hline bottom"
	    }), React.createElement("div", {
	      className: "image-crop__drag"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "north"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "south"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "east"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "west"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "north-east"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "south-east"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "north-west"
	    }), React.createElement("div", {
	      className: "image-crop__handle",
	      "data-direction": "south-west"
	    })));
	  }

	}
	ImageCrop.defaultProps = {
	  value: {
	    left: 0,
	    top: 0,
	    width: 0,
	    height: 0
	  },
	  zIndex: 1,
	  onChange: function () {}
	};

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
	    return String(this.name);
	  }

	}

	const MARKS = {
	  "colon": ":",
	  "comma": ",",
	  "quote": '"',
	  "array": {
	    beg: new Mark("["),
	    end: new Mark("]")
	  },
	  "object": {
	    beg: new Mark("{"),
	    end: new Mark("}")
	  }
	};
	const MARKS_LIST = [MARKS.array.beg, MARKS.array.end, MARKS.object.beg, MARKS.object.end];
	const TYPE_LIST = [TYPE_STRING, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_OBJECT, TYPE_ARRAY, TYPE_NULL];

	function getType(val) {
	  if (val === null) return TYPE_NULL;
	  if (Array.isArray(val)) return TYPE_ARRAY;
	  if (MARKS_LIST.includes(val)) return TYPE_MARKER;
	  return typeof val;
	}

	function typecast(val, type) {
	  val = val.trim();
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
	      if (/^[\d\.]+$/.test(val)) $select.value = TYPE_NUMBER;else if (/^(false|true)$/i.test(val)) $select.value = TYPE_BOOLEAN;else if (/^null$/i.test(val)) $select.value = TYPE_NULL;else if (/^\{\}$/i.test(val)) $select.value = TYPE_OBJECT;else if (/^\[\]$/i.test(val)) $select.value = TYPE_ARRAY;else $select.value = TYPE_STRING;
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
	    const newType = $inputType ? $inputType.value.trim() : TYPE_STRING; // console.log('eee newType', newType);

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
	    const {
	      name,
	      index
	    } = this.props;
	    if (!(newName || index || newValue)) return;
	    const trace = ['update', newValue];
	    this.props.update(newName || index, newValue, name || index, trace);
	  }

	  remove(e) {
	    e.preventDefault();
	    const {
	      name,
	      index
	    } = this.props;
	    const trace = ['remove'];
	    this.props.remove(name || index, trace);
	  }

	  render() {
	    const {
	      ctype,
	      name,
	      val,
	      comma,
	      create,
	      update,
	      remove,
	      toggle,
	      expanded,
	      isMarker
	    } = this.props;
	    const vtype = getType(val);
	    const isNull = val === undefined || val === null;
	    const quote = getType(val) === TYPE_STRING ? MARKS.quote : '';
	    return React.createElement("div", {
	      className: "json-line"
	    }, create && React.createElement("form", {
	      className: "frm frm-create hide",
	      onSubmit: this.create,
	      onKeyDown: this.onKeyDown,
	      onInput: this.onKeyInput
	    }, ctype == TYPE_OBJECT && React.createElement("input", {
	      className: "txt",
	      type: "text",
	      name: "name",
	      defaultValue: ""
	    }), React.createElement("input", {
	      className: "txt",
	      type: "text",
	      name: "value",
	      defaultValue: ""
	    }), React.createElement("select", {
	      name: "type"
	    }, TYPE_LIST.map(t => React.createElement("option", {
	      value: t
	    }, t))), React.createElement("button", {
	      className: "btn btn-create",
	      type: "submit"
	    }, "create"), React.createElement("button", {
	      className: "btn btn-cancel",
	      type: "button",
	      onClick: this.reset
	    }, "cancel")), React.createElement("div", {
	      className: "json-item"
	    }, name && React.createElement("span", null, React.createElement("span", {
	      className: "json-name",
	      onClick: this.edit
	    }, name, MARKS.colon)), React.createElement("span", {
	      className: "json-val",
	      onClick: this.edit
	    }, isNull ? "null" : quote + val + quote), toggle && React.createElement("button", {
	      className: "btn btn-hover btn-arrow",
	      onClick: toggle
	    }, expanded ? '\u2193' : '\u2192'), remove && React.createElement("button", {
	      className: "btn btn-hover btn-del",
	      onClick: this.remove
	    }, "remove"), create && React.createElement("button", {
	      className: "btn btn-hover btn-add",
	      onClick: this.add
	    }, "add")), update && React.createElement("form", {
	      className: "frm frm-update hide",
	      onSubmit: this.update,
	      onKeyDown: this.onKeyDown,
	      onInput: this.onKeyInput
	    }, name && React.createElement("span", null, React.createElement("input", {
	      className: "txt",
	      type: "text",
	      name: "name",
	      defaultValue: name
	    }), MARKS.colon), !isMarker && React.createElement("input", {
	      className: "txt",
	      type: "text",
	      name: "value",
	      defaultValue: val
	    }), !isMarker && React.createElement("select", {
	      name: "type"
	    }, TYPE_LIST.map(t => React.createElement("option", {
	      value: t,
	      selected: vtype === t
	    }, t))), comma && React.createElement("span", {
	      className: "json-comma"
	    }, MARKS.comma), React.createElement("button", {
	      className: "btn btn-update",
	      type: "submit"
	    }, "update"), React.createElement("button", {
	      className: "btn btn-cancel",
	      type: "button",
	      onClick: this.reset
	    }, "cancel")));
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
	    const {
	      props
	    } = this;

	    if (prevProps.expandAll !== props.expandAll) {
	      this.setState({
	        kidsExpanded: props.expandAll
	      });
	    }
	  }

	  create(k, v, trace = []) {
	    // console.log('create', k, v);
	    trace.push(k);
	    const {
	      name,
	      index,
	      val,
	      update
	    } = this.props;
	    const type = getType(val);
	    const newValue = type === TYPE_OBJECT ? { ...val,
	      [k]: v
	    } : [...val, v];
	    update(name || index, newValue, null, trace);
	  }

	  update(k, v, p, trace = []) {
	    // console.log('update', k, v, p);
	    trace.push(k);
	    const {
	      name,
	      index,
	      val,
	      update
	    } = this.props;
	    const type = getType(val);
	    let newValue;

	    if (type === TYPE_OBJECT) {
	      // if the key changed
	      if (p && p != k) {
	        trace.push('remove', p); // to retain the position of the changed key, iterate the object and flip the key at the exact order

	        newValue = {};
	        Object.entries(val).forEach(([k2, v2]) => {
	          if (k2 == p) newValue[k] = v;else newValue[k2] = v2;
	        });
	      } else {
	        newValue = { ...val
	        };
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
	    const {
	      name,
	      index,
	      val,
	      update
	    } = this.props;
	    update(k, val, name || index, trace);
	  }

	  remove(k, trace = []) {
	    // console.log('remove', k);
	    trace.push(k);
	    const {
	      name,
	      index,
	      val,
	      update
	    } = this.props;
	    const type = getType(val);
	    let newValue;

	    if (type === TYPE_OBJECT) {
	      newValue = { ...val
	      };
	      delete newValue[k];
	    } else {
	      newValue = [...val];
	      newValue.splice(k, 1);
	    }

	    update(name || index, newValue, null, trace);
	  }

	  toggle(e) {
	    e.preventDefault();
	    this.setState({
	      kidsExpanded: !this.state.kidsExpanded
	    });
	  }

	  render() {
	    const {
	      kidsExpanded
	    } = this.state;
	    const {
	      name,
	      index,
	      val,
	      remove,
	      comma,
	      expandAll
	    } = this.props;
	    const type = getType(val);
	    const keys = Object.keys(val);
	    const kids = keys.map((k, i) => {
	      const v = val[k];
	      const t = getType(v);
	      const comma = i < keys.length - 1;
	      const name = type === TYPE_OBJECT ? k : undefined;
	      const index = type === TYPE_ARRAY ? k : undefined;
	      const JsonItem = t === TYPE_ARRAY || t === TYPE_OBJECT ? JsonStruct : JsonLine;
	      return React.createElement(JsonItem, {
	        key: i,
	        name: name,
	        index: index,
	        val: v,
	        comma: comma,
	        update: this.update,
	        remove: this.remove,
	        expandAll: expandAll
	      });
	    });
	    return React.createElement("div", {
	      className: "json-struct " + type
	    }, React.createElement(JsonLine, {
	      name: name,
	      index: index,
	      val: MARKS[type].beg,
	      update: this.updateKey,
	      remove: remove,
	      toggle: kids.length ? this.toggle : null,
	      expanded: kidsExpanded,
	      isMarker: true
	    }), kidsExpanded && React.createElement("div", {
	      className: "json-kids"
	    }, kids), React.createElement(JsonLine, {
	      val: MARKS[type].end,
	      comma: comma,
	      create: this.create,
	      ctype: type
	    }));
	  }

	}

	JsonStruct.defaultProps = {
	  expanded: true,
	  expandAll: true
	};
	class JsonEdit extends React.PureComponent {
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
	    this.setState({
	      value: v
	    });
	  }

	  onClickExpandAll(e) {
	    this.setState({
	      expandAll: !this.state.expandAll
	    });
	  }

	  render() {
	    const {
	      value,
	      expandAll
	    } = this.state;
	    return React.createElement("div", {
	      className: "json-edit"
	    }, React.createElement("div", null, React.createElement(JsonStruct, {
	      val: this.state.value,
	      update: this.update,
	      expandAll: expandAll
	    })), React.createElement("div", null, React.createElement("button", {
	      type: "button",
	      onClick: e => this.props.onChange(value)
	    }, "Save"), React.createElement("button", {
	      type: "button",
	      onClick: this.onClickExpandAll
	    }, expandAll ? 'Collapse' : 'Expand', " All")));
	  }

	}
	JsonEdit.propTypes = {
	  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
	  className: PropTypes.string,
	  onChange: PropTypes.func // (value: String, id: props.id)

	};
	JsonEdit.defaultProps = {
	  className: '',
	  onChange: function () {}
	};

	var cities = [
	  "Achalpur",
	  "Achhnera",
	  "Adalaj",
	  "Adilabad",
	  "Adityapur",
	  "Adoni",
	  "Adoor",
	  "Adra",
	  "Adyar",
	  "Afzalpur",
	  "Agartala",
	  "Agra",
	  "Ahmedabad",
	  "Ahmednagar",
	  "Aizawl",
	  "Ajmer",
	  "Akola",
	  "Akot",
	  "Alappuzha",
	  "Aligarh",
	  "AlipurdUrban Agglomerationr",
	  "Alirajpur",
	  "Allahabad",
	  "Alwar",
	  "Amalapuram",
	  "Amalner",
	  "Ambejogai",
	  "Ambikapur",
	  "Amravati",
	  "Amreli",
	  "Amritsar",
	  "Amroha",
	  "Anakapalle",
	  "Anand",
	  "Anantapur",
	  "Anantnag",
	  "Anjangaon",
	  "Anjar",
	  "Ankleshwar",
	  "Arakkonam",
	  "Arambagh",
	  "Araria",
	  "Arrah",
	  "Arsikere",
	  "Aruppukkottai",
	  "Arvi",
	  "Arwal",
	  "Asansol",
	  "Asarganj",
	  "Ashok Nagar",
	  "Athni",
	  "Attingal",
	  "Aurangabad",
	  "Aurangabad",
	  "Azamgarh",
	  "Bagaha",
	  "Bageshwar",
	  "Bahadurgarh",
	  "Baharampur",
	  "Bahraich",
	  "Balaghat",
	  "Balangir",
	  "Baleshwar Town",
	  "Ballari",
	  "Balurghat",
	  "Bankura",
	  "Bapatla",
	  "Baramula",
	  "Barbil",
	  "Bargarh",
	  "Barh",
	  "Baripada Town",
	  "Barmer",
	  "Barnala",
	  "Barpeta",
	  "Batala",
	  "Bathinda",
	  "Begusarai",
	  "Belagavi",
	  "Bellampalle",
	  "Belonia",
	  "Bengaluru",
	  "Bettiah",
	  "BhabUrban Agglomeration",
	  "Bhadrachalam",
	  "Bhadrak",
	  "Bhagalpur",
	  "Bhainsa",
	  "Bharatpur",
	  "Bharuch",
	  "Bhatapara",
	  "Bhavnagar",
	  "Bhawanipatna",
	  "Bheemunipatnam",
	  "Bhilai Nagar",
	  "Bhilwara",
	  "Bhimavaram",
	  "Bhiwandi",
	  "Bhiwani",
	  "Bhongir",
	  "Bhopal",
	  "Bhubaneswar",
	  "Bhuj",
	  "Bikaner",
	  "Bilaspur",
	  "Bobbili",
	  "Bodhan",
	  "Bokaro Steel City",
	  "Bongaigaon City",
	  "Brahmapur",
	  "Buxar",
	  "Byasanagar",
	  "Chaibasa",
	  "Chalakudy",
	  "Chandausi",
	  "Chandigarh",
	  "Changanassery",
	  "Charkhi Dadri",
	  "Chatra",
	  "Chennai",
	  "Cherthala",
	  "Chhapra",
	  "Chhapra",
	  "Chikkamagaluru",
	  "Chilakaluripet",
	  "Chirala",
	  "Chirkunda",
	  "Chirmiri",
	  "Chittoor",
	  "Chittur-Thathamangalam",
	  "Coimbatore",
	  "Cuttack",
	  "Dalli-Rajhara",
	  "Darbhanga",
	  "Darjiling",
	  "Davanagere",
	  "Deesa",
	  "Dehradun",
	  "Dehri-on-Sone",
	  "Delhi",
	  "Deoghar",
	  "Dhamtari",
	  "Dhanbad",
	  "Dharmanagar",
	  "Dharmavaram",
	  "Dhenkanal",
	  "Dhoraji",
	  "Dhubri",
	  "Dhule",
	  "Dhuri",
	  "Dibrugarh",
	  "Dimapur",
	  "Diphu",
	  "Dumka",
	  "Dumraon",
	  "Durg",
	  "Eluru",
	  "English Bazar",
	  "Erode",
	  "Etawah",
	  "Faridabad",
	  "Faridkot",
	  "Farooqnagar",
	  "Fatehabad",
	  "Fatehpur Sikri",
	  "Fazilka",
	  "Firozabad",
	  "Firozpur Cantt.",
	  "Firozpur",
	  "Forbesganj",
	  "Gadwal",
	  "Gandhinagar",
	  "Gangarampur",
	  "Ganjbasoda",
	  "Gaya",
	  "Giridih",
	  "Goalpara",
	  "Gobichettipalayam",
	  "Gobindgarh",
	  "Godhra",
	  "Gohana",
	  "Gokak",
	  "Gooty",
	  "Gopalganj",
	  "Gudivada",
	  "Gudur",
	  "Gumia",
	  "Guntakal",
	  "Guntur",
	  "Gurdaspur",
	  "Gurgaon",
	  "Guruvayoor",
	  "Guwahati",
	  "Gwalior",
	  "Habra",
	  "Hajipur",
	  "Haldwani-cum-Kathgodam",
	  "Hansi",
	  "Hapur",
	  "Hardoi ",
	  "Hardwar",
	  "Hazaribag",
	  "Hindupur",
	  "Hisar",
	  "Hoshiarpur",
	  "Hubli-Dharwad",
	  "Hugli-Chinsurah",
	  "Hyderabad",
	  "Ichalkaranji",
	  "Imphal",
	  "Indore",
	  "Itarsi",
	  "Jabalpur",
	  "Jagdalpur",
	  "Jaggaiahpet",
	  "Jagraon",
	  "Jagtial",
	  "Jaipur",
	  "Jalandhar Cantt.",
	  "Jalandhar",
	  "Jalpaiguri",
	  "Jamalpur",
	  "Jammalamadugu",
	  "Jammu",
	  "Jamnagar",
	  "Jamshedpur",
	  "Jamui",
	  "Jangaon",
	  "Jatani",
	  "Jehanabad",
	  "Jhansi",
	  "Jhargram",
	  "Jharsuguda",
	  "Jhumri Tilaiya",
	  "Jind",
	  "Jodhpur",
	  "Jorhat",
	  "Kadapa",
	  "Kadi",
	  "Kadiri",
	  "Kagaznagar",
	  "Kailasahar",
	  "Kaithal",
	  "Kakinada",
	  "Kalimpong",
	  "Kalpi",
	  "Kalyan-Dombivali",
	  "Kamareddy",
	  "Kancheepuram",
	  "Kandukur",
	  "Kanhangad",
	  "Kannur",
	  "Kanpur",
	  "Kapadvanj",
	  "Kapurthala",
	  "Karaikal",
	  "Karimganj",
	  "Karimnagar",
	  "Karjat",
	  "Karnal",
	  "Karur",
	  "Karwar",
	  "Kasaragod",
	  "Kashipur",
	  "KathUrban Agglomeration",
	  "Katihar",
	  "Kavali",
	  "Kayamkulam",
	  "Kendrapara",
	  "Kendujhar",
	  "Keshod",
	  "Khair",
	  "Khambhat",
	  "Khammam",
	  "Khanna",
	  "Kharagpur",
	  "Kharar",
	  "Khowai",
	  "Kishanganj",
	  "Kochi",
	  "Kodungallur",
	  "Kohima",
	  "Kolar",
	  "Kolkata",
	  "Kollam",
	  "Koratla",
	  "Korba",
	  "Kot Kapura",
	  "Kota",
	  "Kothagudem",
	  "Kottayam",
	  "Kovvur",
	  "Koyilandy",
	  "Kozhikode",
	  "Kunnamkulam",
	  "Kurnool",
	  "Kyathampalle",
	  "Lachhmangarh",
	  "Ladnu",
	  "Ladwa",
	  "Lahar",
	  "Laharpur",
	  "Lakheri",
	  "Lakhimpur",
	  "Lakhisarai",
	  "Lakshmeshwar",
	  "Lal Gopalganj Nindaura",
	  "Lalganj",
	  "Lalganj",
	  "Lalgudi",
	  "Lalitpur",
	  "Lalsot",
	  "Lanka",
	  "Lar",
	  "Lathi",
	  "Latur",
	  "Lilong",
	  "Limbdi",
	  "Lingsugur",
	  "Loha",
	  "Lohardaga",
	  "Lonar",
	  "Lonavla",
	  "Longowal",
	  "Loni",
	  "Losal",
	  "Lucknow",
	  "Ludhiana",
	  "Lumding",
	  "Lunawada",
	  "Lunglei",
	  "Macherla",
	  "Machilipatnam",
	  "Madanapalle",
	  "Maddur",
	  "Madhepura",
	  "Madhubani",
	  "Madhugiri",
	  "Madhupur",
	  "Madikeri",
	  "Madurai",
	  "Magadi",
	  "Mahad",
	  "Mahalingapura",
	  "Maharajganj",
	  "Maharajpur",
	  "Mahasamund",
	  "Mahbubnagar",
	  "Mahe",
	  "Mahemdabad",
	  "Mahendragarh",
	  "Mahesana",
	  "Mahidpur",
	  "Mahnar Bazar",
	  "Mahuva",
	  "Maihar",
	  "Mainaguri",
	  "Makhdumpur",
	  "Makrana",
	  "Malaj Khand",
	  "Malappuram",
	  "Malavalli",
	  "Malda",
	  "Malegaon",
	  "Malerkotla",
	  "Malkangiri",
	  "Malkapur",
	  "Malout",
	  "Malpura",
	  "Malur",
	  "Manachanallur",
	  "Manasa",
	  "Manavadar",
	  "Manawar",
	  "Mancherial",
	  "Mandalgarh",
	  "Mandamarri",
	  "Mandapeta",
	  "Mandawa",
	  "Mandi Dabwali",
	  "Mandi",
	  "Mandideep",
	  "Mandla",
	  "Mandsaur",
	  "Mandvi",
	  "Mandya",
	  "Manendragarh",
	  "Maner",
	  "Mangaldoi",
	  "Mangaluru",
	  "Mangalvedhe",
	  "Manglaur",
	  "Mangrol",
	  "Mangrol",
	  "Mangrulpir",
	  "Manihari",
	  "Manjlegaon",
	  "Mankachar",
	  "Manmad",
	  "Mansa",
	  "Mansa",
	  "Manuguru",
	  "Manvi",
	  "Manwath",
	  "Mapusa",
	  "Margao",
	  "Margherita",
	  "Marhaura",
	  "Mariani",
	  "Marigaon",
	  "Markapur",
	  "Marmagao",
	  "Masaurhi",
	  "Mathabhanga",
	  "Mathura",
	  "Mattannur",
	  "Mauganj",
	  "Mavelikkara",
	  "Mavoor",
	  "Mayang Imphal",
	  "Medak",
	  "Medininagar (Daltonganj)",
	  "Medinipur",
	  "Meerut",
	  "Mehkar",
	  "Memari",
	  "Merta City",
	  "Mhaswad",
	  "Mhow Cantonment",
	  "Mhowgaon",
	  "Mihijam",
	  "Mira-Bhayandar",
	  "Mirganj",
	  "Miryalaguda",
	  "Modasa",
	  "Modinagar",
	  "Moga",
	  "Mohali",
	  "Mokameh",
	  "Mokokchung",
	  "Monoharpur",
	  "Moradabad",
	  "Morena",
	  "Morinda, India",
	  "Morshi",
	  "Morvi",
	  "Motihari",
	  "Motipur",
	  "Mount Abu",
	  "Mudabidri",
	  "Mudalagi",
	  "Muddebihal",
	  "Mudhol",
	  "Mukerian",
	  "Mukhed",
	  "Muktsar",
	  "Mul",
	  "Mulbagal",
	  "Multai",
	  "Mumbai",
	  "Mundargi",
	  "Mundi",
	  "Mungeli",
	  "Munger",
	  "Murliganj",
	  "Murshidabad",
	  "Murtijapur",
	  "Murwara (Katni)",
	  "Musabani",
	  "Mussoorie",
	  "Muvattupuzha",
	  "Muzaffarpur",
	  "Mysore",
	  "Nabadwip",
	  "Nabarangapur",
	  "Nabha",
	  "Nadbai",
	  "Nadiad",
	  "Nagaon",
	  "Nagapattinam",
	  "Nagar",
	  "Nagari",
	  "Nagarkurnool",
	  "Nagaur",
	  "Nagda",
	  "Nagercoil",
	  "Nagina",
	  "Nagla",
	  "Nagpur",
	  "Nahan",
	  "Naharlagun",
	  "Naidupet",
	  "Naihati",
	  "Naila Janjgir",
	  "Nainital",
	  "Nainpur",
	  "Najibabad",
	  "Nakodar",
	  "Nakur",
	  "Nalbari",
	  "Namagiripettai",
	  "Namakkal",
	  "Nanded-Waghala",
	  "Nandgaon",
	  "Nandivaram-Guduvancheri",
	  "Nandura",
	  "Nandurbar",
	  "Nandyal",
	  "Nangal",
	  "Nanjangud",
	  "Nanjikottai",
	  "Nanpara",
	  "Narasapuram",
	  "Narasaraopet",
	  "Naraura",
	  "Narayanpet",
	  "Nargund",
	  "Narkatiaganj",
	  "Narkhed",
	  "Narnaul",
	  "Narsinghgarh",
	  "Narsinghgarh",
	  "Narsipatnam",
	  "Narwana",
	  "Nashik",
	  "Nasirabad",
	  "Natham",
	  "Nathdwara",
	  "Naugachhia",
	  "Naugawan Sadat",
	  "Nautanwa",
	  "Navalgund",
	  "Navsari",
	  "Nawabganj",
	  "Nawada",
	  "Nawanshahr",
	  "Nawapur",
	  "Nedumangad",
	  "Neem-Ka-Thana",
	  "Neemuch",
	  "Nehtaur",
	  "Nelamangala",
	  "Nellikuppam",
	  "Nellore",
	  "Nepanagar",
	  "New Delhi",
	  "Neyveli (TS)",
	  "Neyyattinkara",
	  "Nidadavole",
	  "Nilambur",
	  "Nilanga",
	  "Nimbahera",
	  "Nirmal",
	  "Niwai",
	  "Niwari",
	  "Nizamabad",
	  "Nohar",
	  "Noida",
	  "Nokha",
	  "Nokha",
	  "Nongstoin",
	  "Noorpur",
	  "North Lakhimpur",
	  "Nowgong",
	  "Nowrozabad (Khodargama)",
	  "Nuzvid",
	  "O' Valley",
	  "Obra",
	  "Oddanchatram",
	  "Ongole",
	  "Orai",
	  "Osmanabad",
	  "Ottappalam",
	  "Ozar",
	  "P.N.Patti",
	  "Pachora",
	  "Pachore",
	  "Pacode",
	  "Padmanabhapuram",
	  "Padra",
	  "Padrauna",
	  "Paithan",
	  "Pakaur",
	  "Palacole",
	  "Palai",
	  "Palakkad",
	  "Palampur",
	  "Palani",
	  "Palanpur",
	  "Palasa Kasibugga",
	  "Palghar",
	  "Pali",
	  "Pali",
	  "Palia Kalan",
	  "Palitana",
	  "Palladam",
	  "Pallapatti",
	  "Pallikonda",
	  "Palwal",
	  "Palwancha",
	  "Panagar",
	  "Panagudi",
	  "Panaji",
	  "Panamattom",
	  "Panchkula",
	  "Panchla",
	  "Pandharkaoda",
	  "Pandharpur",
	  "Pandhurna",
	  "PandUrban Agglomeration",
	  "Panipat",
	  "Panna",
	  "Panniyannur",
	  "Panruti",
	  "Panvel",
	  "Pappinisseri",
	  "Paradip",
	  "Paramakudi",
	  "Parangipettai",
	  "Parasi",
	  "Paravoor",
	  "Parbhani",
	  "Pardi",
	  "Parlakhemundi",
	  "Parli",
	  "Partur",
	  "Parvathipuram",
	  "Pasan",
	  "Paschim Punropara",
	  "Pasighat",
	  "Patan",
	  "Pathanamthitta",
	  "Pathankot",
	  "Pathardi",
	  "Pathri",
	  "Patiala",
	  "Patna",
	  "Patratu",
	  "Pattamundai",
	  "Patti",
	  "Pattran",
	  "Pattukkottai",
	  "Patur",
	  "Pauni",
	  "Pauri",
	  "Pavagada",
	  "Pedana",
	  "Peddapuram",
	  "Pehowa",
	  "Pen",
	  "Perambalur",
	  "Peravurani",
	  "Peringathur",
	  "Perinthalmanna",
	  "Periyakulam",
	  "Periyasemur",
	  "Pernampattu",
	  "Perumbavoor",
	  "Petlad",
	  "Phagwara",
	  "Phalodi",
	  "Phaltan",
	  "Phillaur",
	  "Phulabani",
	  "Phulera",
	  "Phulpur",
	  "Phusro",
	  "Pihani",
	  "Pilani",
	  "Pilibanga",
	  "Pilibhit",
	  "Pilkhuwa",
	  "Pindwara",
	  "Pinjore",
	  "Pipar City",
	  "Pipariya",
	  "Piriyapatna",
	  "Piro",
	  "Pithampur",
	  "Pithapuram",
	  "Pithoragarh",
	  "Pollachi",
	  "Polur",
	  "Pondicherry",
	  "Ponnani",
	  "Ponneri",
	  "Ponnur",
	  "Porbandar",
	  "Porsa",
	  "Port Blair",
	  "Powayan",
	  "Prantij",
	  "Pratapgarh",
	  "Pratapgarh",
	  "Prithvipur",
	  "Proddatur",
	  "Pudukkottai",
	  "Pudupattinam",
	  "Pukhrayan",
	  "Pulgaon",
	  "Puliyankudi",
	  "Punalur",
	  "Punch",
	  "Pune",
	  "Punganur",
	  "Punjaipugalur",
	  "Puranpur",
	  "Puri",
	  "Purna",
	  "Purnia",
	  "PurqUrban Agglomerationzi",
	  "Purulia",
	  "Purwa",
	  "Pusad",
	  "Puthuppally",
	  "Puttur",
	  "Puttur",
	  "Qadian",
	  "Raayachuru",
	  "Rabkavi Banhatti",
	  "Radhanpur",
	  "Rae Bareli",
	  "Rafiganj",
	  "Raghogarh-Vijaypur",
	  "Raghunathganj",
	  "Raghunathpur",
	  "Rahatgarh",
	  "Rahuri",
	  "Raiganj",
	  "Raigarh",
	  "Raikot",
	  "Raipur",
	  "Rairangpur",
	  "Raisen",
	  "Raisinghnagar",
	  "Rajagangapur",
	  "Rajahmundry",
	  "Rajakhera",
	  "Rajaldesar",
	  "Rajam",
	  "Rajampet",
	  "Rajapalayam",
	  "Rajauri",
	  "Rajgarh (Alwar)",
	  "Rajgarh (Churu)",
	  "Rajgarh",
	  "Rajgir",
	  "Rajkot",
	  "Rajnandgaon",
	  "Rajpipla",
	  "Rajpura",
	  "Rajsamand",
	  "Rajula",
	  "Rajura",
	  "Ramachandrapuram",
	  "Ramagundam",
	  "Ramanagaram",
	  "Ramanathapuram",
	  "Ramdurg",
	  "Rameshwaram",
	  "Ramganj Mandi",
	  "Ramgarh",
	  "Ramnagar",
	  "Ramnagar",
	  "Ramngarh",
	  "Rampur Maniharan",
	  "Rampur",
	  "Rampura Phul",
	  "Rampurhat",
	  "Ramtek",
	  "Ranaghat",
	  "Ranavav",
	  "Ranchi",
	  "Ranebennuru",
	  "Rangia",
	  "Rania",
	  "Ranibennur",
	  "Ranipet",
	  "Rapar",
	  "Rasipuram",
	  "Rasra",
	  "Ratangarh",
	  "Rath",
	  "Ratia",
	  "Ratlam",
	  "Ratnagiri",
	  "Rau",
	  "Raurkela",
	  "Raver",
	  "Rawatbhata",
	  "Rawatsar",
	  "Raxaul Bazar",
	  "Rayachoti",
	  "Rayadurg",
	  "Rayagada",
	  "Reengus",
	  "Rehli",
	  "Renigunta",
	  "Renukoot",
	  "Reoti",
	  "Repalle",
	  "Revelganj",
	  "Rewa",
	  "Rewari",
	  "Rishikesh",
	  "Risod",
	  "Robertsganj",
	  "Robertson Pet",
	  "Rohtak",
	  "Ron",
	  "Roorkee",
	  "Rosera",
	  "Rudauli",
	  "Rudrapur",
	  "Rudrapur",
	  "Rupnagar",
	  "Sabalgarh",
	  "Sadabad",
	  "Sadalagi",
	  "Sadasivpet",
	  "Sadri",
	  "Sadulpur",
	  "Sadulshahar",
	  "Safidon",
	  "Safipur",
	  "Sagar",
	  "Sagara",
	  "Sagwara",
	  "Saharanpur",
	  "Saharsa",
	  "Sahaspur",
	  "Sahaswan",
	  "Sahawar",
	  "Sahibganj",
	  "Sahjanwa",
	  "Saidpur",
	  "Saiha",
	  "Sailu",
	  "Sainthia",
	  "Sakaleshapura",
	  "Sakti",
	  "Salaya",
	  "Salem",
	  "Salur",
	  "Samalkha",
	  "Samalkot",
	  "Samana",
	  "Samastipur",
	  "Sambalpur",
	  "Sambhal",
	  "Sambhar",
	  "Samdhan",
	  "Samthar",
	  "Sanand",
	  "Sanawad",
	  "Sanchore",
	  "Sandi",
	  "Sandila",
	  "Sanduru",
	  "Sangamner",
	  "Sangareddy",
	  "Sangaria",
	  "Sangli",
	  "Sangole",
	  "Sangrur",
	  "Sankarankovil",
	  "Sankari",
	  "Sankeshwara",
	  "Santipur",
	  "Sarangpur",
	  "Sardarshahar",
	  "Sardhana",
	  "Sarni",
	  "Sarsod",
	  "Sasaram",
	  "Sasvad",
	  "Satana",
	  "Satara",
	  "Sathyamangalam",
	  "Satna",
	  "Sattenapalle",
	  "Sattur",
	  "Saunda",
	  "Saundatti-Yellamma",
	  "Sausar",
	  "Savanur",
	  "Savarkundla",
	  "Savner",
	  "Sawai Madhopur",
	  "Sawantwadi",
	  "Sedam",
	  "Sehore",
	  "Sendhwa",
	  "Seohara",
	  "Seoni",
	  "Seoni-Malwa",
	  "Shahabad",
	  "Shahabad, Hardoi",
	  "Shahabad, Rampur",
	  "Shahade",
	  "Shahbad",
	  "Shahdol",
	  "Shahganj",
	  "Shahjahanpur",
	  "Shahpur",
	  "Shahpura",
	  "Shahpura",
	  "Shajapur",
	  "Shamgarh",
	  "Shamli",
	  "Shamsabad, Agra",
	  "Shamsabad, Farrukhabad",
	  "Shegaon",
	  "Sheikhpura",
	  "Shendurjana",
	  "Shenkottai",
	  "Sheoganj",
	  "Sheohar",
	  "Sheopur",
	  "Sherghati",
	  "Sherkot",
	  "Shiggaon",
	  "Shikaripur",
	  "Shikarpur, Bulandshahr",
	  "Shikohabad",
	  "Shillong",
	  "Shimla",
	  "Shirdi",
	  "Shirpur-Warwade",
	  "Shirur",
	  "Shishgarh",
	  "Shivamogga",
	  "Shivpuri",
	  "Sholavandan",
	  "Sholingur",
	  "Shoranur",
	  "Shrigonda",
	  "Shrirampur",
	  "Shrirangapattana",
	  "Shujalpur",
	  "Siana",
	  "Sibsagar",
	  "Siddipet",
	  "Sidhi",
	  "Sidhpur",
	  "Sidlaghatta",
	  "Sihor",
	  "Sihora",
	  "Sikanderpur",
	  "Sikandra Rao",
	  "Sikandrabad",
	  "Sikar",
	  "Silao",
	  "Silapathar",
	  "Silchar",
	  "Siliguri",
	  "Sillod",
	  "Silvassa",
	  "Simdega",
	  "Sindagi",
	  "Sindhagi",
	  "Sindhnur",
	  "Singrauli",
	  "Sinnar",
	  "Sira",
	  "Sircilla",
	  "Sirhind Fatehgarh Sahib",
	  "Sirkali",
	  "Sirohi",
	  "Sironj",
	  "Sirsa",
	  "Sirsaganj",
	  "Sirsi",
	  "Sirsi",
	  "Siruguppa",
	  "Sitamarhi",
	  "Sitapur",
	  "Sitarganj",
	  "Sivaganga",
	  "Sivagiri",
	  "Sivakasi",
	  "Siwan",
	  "Sohagpur",
	  "Sohna",
	  "Sojat",
	  "Solan",
	  "Solapur",
	  "Sonamukhi",
	  "Sonepur",
	  "Songadh",
	  "Sonipat",
	  "Sopore",
	  "Soro",
	  "Soron",
	  "Soyagaon",
	  "Sri Madhopur",
	  "Srikakulam",
	  "Srikalahasti",
	  "Srinagar",
	  "Srinagar",
	  "Srinivaspur",
	  "Srirampore",
	  "Srisailam Project (Right Flank Colony) Township",
	  "Srivilliputhur",
	  "Sugauli",
	  "Sujangarh",
	  "Sujanpur",
	  "Sullurpeta",
	  "Sultanganj",
	  "Sultanpur",
	  "Sumerpur",
	  "Sumerpur",
	  "Sunabeda",
	  "Sunam",
	  "Sundargarh",
	  "Sundarnagar",
	  "Supaul",
	  "Surandai",
	  "Surapura",
	  "Surat",
	  "Suratgarh",
	  "SUrban Agglomerationr",
	  "Suri",
	  "Suriyampalayam",
	  "Suryapet",
	  "Tadepalligudem",
	  "Tadpatri",
	  "Takhatgarh",
	  "Taki",
	  "Talaja",
	  "Talcher",
	  "Talegaon Dabhade",
	  "Talikota",
	  "Taliparamba",
	  "Talode",
	  "Talwara",
	  "Tamluk",
	  "Tanda",
	  "Tandur",
	  "Tanuku",
	  "Tarakeswar",
	  "Tarana",
	  "Taranagar",
	  "Taraori",
	  "Tarbha",
	  "Tarikere",
	  "Tarn Taran",
	  "Tasgaon",
	  "Tehri",
	  "Tekkalakote",
	  "Tenali",
	  "Tenkasi",
	  "Tenu dam-cum-Kathhara",
	  "Terdal",
	  "Tezpur",
	  "Thakurdwara",
	  "Thammampatti",
	  "Thana Bhawan",
	  "Thane",
	  "Thanesar",
	  "Thangadh",
	  "Thanjavur",
	  "Tharad",
	  "Tharamangalam",
	  "Tharangambadi",
	  "Theni Allinagaram",
	  "Thirumangalam",
	  "Thirupuvanam",
	  "Thiruthuraipoondi",
	  "Thiruvalla",
	  "Thiruvallur",
	  "Thiruvananthapuram",
	  "Thiruvarur",
	  "Thodupuzha",
	  "Thoubal",
	  "Thrissur",
	  "Thuraiyur",
	  "Tikamgarh",
	  "Tilda Newra",
	  "Tilhar",
	  "Tindivanam",
	  "Tinsukia",
	  "Tiptur",
	  "Tirora",
	  "Tiruchendur",
	  "Tiruchengode",
	  "Tiruchirappalli",
	  "Tirukalukundram",
	  "Tirukkoyilur",
	  "Tirunelveli",
	  "Tirupathur",
	  "Tirupathur",
	  "Tirupati",
	  "Tiruppur",
	  "Tirur",
	  "Tiruttani",
	  "Tiruvannamalai",
	  "Tiruvethipuram",
	  "Tiruvuru",
	  "Tirwaganj",
	  "Titlagarh",
	  "Tittakudi",
	  "Todabhim",
	  "Todaraisingh",
	  "Tohana",
	  "Tonk",
	  "Tuensang",
	  "Tuljapur",
	  "Tulsipur",
	  "Tumkur",
	  "Tumsar",
	  "Tundla",
	  "Tuni",
	  "Tura",
	  "Uchgaon",
	  "Udaipur",
	  "Udaipur",
	  "Udaipurwati",
	  "Udgir",
	  "Udhagamandalam",
	  "Udhampur",
	  "Udumalaipettai",
	  "Udupi",
	  "Ujhani",
	  "Ujjain",
	  "Umarga",
	  "Umaria",
	  "Umarkhed",
	  "Umbergaon",
	  "Umred",
	  "Umreth",
	  "Una",
	  "Unjha",
	  "Unnamalaikadai",
	  "Unnao",
	  "Upleta",
	  "Uran Islampur",
	  "Uran",
	  "Uravakonda",
	  "Urmar Tanda",
	  "Usilampatti",
	  "Uthamapalayam",
	  "Uthiramerur",
	  "Utraula",
	  "Vadakkuvalliyur",
	  "Vadalur",
	  "Vadgaon Kasba",
	  "Vadipatti",
	  "Vadnagar",
	  "Vadodara",
	  "Vaijapur",
	  "Vaikom",
	  "Valparai",
	  "Valsad",
	  "Vandavasi",
	  "Vaniyambadi",
	  "Vapi",
	  "Vapi",
	  "Varanasi",
	  "Varkala",
	  "Vasai-Virar",
	  "Vatakara",
	  "Vedaranyam",
	  "Vellakoil",
	  "Vellore",
	  "Venkatagiri",
	  "Veraval",
	  "Vidisha",
	  "Vijainagar, Ajmer",
	  "Vijapur",
	  "Vijayapura",
	  "Vijayawada",
	  "Vijaypur",
	  "Vikarabad",
	  "Vikramasingapuram",
	  "Viluppuram",
	  "Vinukonda",
	  "Viramgam",
	  "Virudhachalam",
	  "Virudhunagar",
	  "Visakhapatnam",
	  "Visnagar",
	  "Viswanatham",
	  "Vita",
	  "Vizianagaram",
	  "Vrindavan",
	  "Vyara",
	  "Wadgaon Road",
	  "Wadhwan",
	  "Wadi",
	  "Wai",
	  "Wanaparthy",
	  "Wani",
	  "Wankaner",
	  "Wara Seoni",
	  "Warangal",
	  "Wardha",
	  "Warhapur",
	  "Warisaliganj",
	  "Warora",
	  "Warud",
	  "Washim",
	  "Wokha",
	  "Yadgir",
	  "Yamunanagar",
	  "Yanam",
	  "Yavatmal",
	  "Yawal",
	  "Yellandu",
	  "Yemmiganur",
	  "Yerraguntla",
	  "Yevla",
	  "Zaidpur",
	  "Zamania",
	  "Zira",
	  "Zirakpur",
	  "Zunheboto",
	];

	var countries = [
	  {name: 'Afghanistan', code: 'AF'},
	  {name: 'Åland Islands', code: 'AX'},
	  {name: 'Albania', code: 'AL'},
	  {name: 'Algeria', code: 'DZ'},
	  {name: 'American Samoa', code: 'AS'},
	  {name: 'AndorrA', code: 'AD'},
	  {name: 'Angola', code: 'AO'},
	  {name: 'Anguilla', code: 'AI'},
	  {name: 'Antarctica', code: 'AQ'},
	  {name: 'Antigua and Barbuda', code: 'AG'},
	  {name: 'Argentina', code: 'AR'},
	  {name: 'Armenia', code: 'AM'},
	  {name: 'Aruba', code: 'AW'},
	  {name: 'Australia', code: 'AU'},
	  {name: 'Austria', code: 'AT'},
	  {name: 'Azerbaijan', code: 'AZ'},
	  {name: 'Bahamas', code: 'BS'},
	  {name: 'Bahrain', code: 'BH'},
	  {name: 'Bangladesh', code: 'BD'},
	  {name: 'Barbados', code: 'BB'},
	  {name: 'Belarus', code: 'BY'},
	  {name: 'Belgium', code: 'BE'},
	  {name: 'Belize', code: 'BZ'},
	  {name: 'Benin', code: 'BJ'},
	  {name: 'Bermuda', code: 'BM'},
	  {name: 'Bhutan', code: 'BT'},
	  {name: 'Bolivia', code: 'BO'},
	  {name: 'Bosnia and Herzegovina', code: 'BA'},
	  {name: 'Botswana', code: 'BW'},
	  {name: 'Bouvet Island', code: 'BV'},
	  {name: 'Brazil', code: 'BR'},
	  {name: 'British Indian Ocean Territory', code: 'IO'},
	  {name: 'Brunei Darussalam', code: 'BN'},
	  {name: 'Bulgaria', code: 'BG'},
	  {name: 'Burkina Faso', code: 'BF'},
	  {name: 'Burundi', code: 'BI'},
	  {name: 'Cambodia', code: 'KH'},
	  {name: 'Cameroon', code: 'CM'},
	  {name: 'Canada', code: 'CA'},
	  {name: 'Cape Verde', code: 'CV'},
	  {name: 'Cayman Islands', code: 'KY'},
	  {name: 'Central African Republic', code: 'CF'},
	  {name: 'Chad', code: 'TD'},
	  {name: 'Chile', code: 'CL'},
	  {name: 'China', code: 'CN'},
	  {name: 'Christmas Island', code: 'CX'},
	  {name: 'Cocos (Keeling) Islands', code: 'CC'},
	  {name: 'Colombia', code: 'CO'},
	  {name: 'Comoros', code: 'KM'},
	  {name: 'Congo', code: 'CG'},
	  {name: 'Congo, The Democratic Republic of the', code: 'CD'},
	  {name: 'Cook Islands', code: 'CK'},
	  {name: 'Costa Rica', code: 'CR'},
	  {name: 'Cote D\'Ivoire', code: 'CI'},
	  {name: 'Croatia', code: 'HR'},
	  {name: 'Cuba', code: 'CU'},
	  {name: 'Cyprus', code: 'CY'},
	  {name: 'Czech Republic', code: 'CZ'},
	  {name: 'Denmark', code: 'DK'},
	  {name: 'Djibouti', code: 'DJ'},
	  {name: 'Dominica', code: 'DM'},
	  {name: 'Dominican Republic', code: 'DO'},
	  {name: 'Ecuador', code: 'EC'},
	  {name: 'Egypt', code: 'EG'},
	  {name: 'El Salvador', code: 'SV'},
	  {name: 'Equatorial Guinea', code: 'GQ'},
	  {name: 'Eritrea', code: 'ER'},
	  {name: 'Estonia', code: 'EE'},
	  {name: 'Ethiopia', code: 'ET'},
	  {name: 'Falkland Islands (Malvinas)', code: 'FK'},
	  {name: 'Faroe Islands', code: 'FO'},
	  {name: 'Fiji', code: 'FJ'},
	  {name: 'Finland', code: 'FI'},
	  {name: 'France', code: 'FR'},
	  {name: 'French Guiana', code: 'GF'},
	  {name: 'French Polynesia', code: 'PF'},
	  {name: 'French Southern Territories', code: 'TF'},
	  {name: 'Gabon', code: 'GA'},
	  {name: 'Gambia', code: 'GM'},
	  {name: 'Georgia', code: 'GE'},
	  {name: 'Germany', code: 'DE'},
	  {name: 'Ghana', code: 'GH'},
	  {name: 'Gibraltar', code: 'GI'},
	  {name: 'Greece', code: 'GR'},
	  {name: 'Greenland', code: 'GL'},
	  {name: 'Grenada', code: 'GD'},
	  {name: 'Guadeloupe', code: 'GP'},
	  {name: 'Guam', code: 'GU'},
	  {name: 'Guatemala', code: 'GT'},
	  {name: 'Guernsey', code: 'GG'},
	  {name: 'Guinea', code: 'GN'},
	  {name: 'Guinea-Bissau', code: 'GW'},
	  {name: 'Guyana', code: 'GY'},
	  {name: 'Haiti', code: 'HT'},
	  {name: 'Heard Island and Mcdonald Islands', code: 'HM'},
	  {name: 'Holy See (Vatican City State)', code: 'VA'},
	  {name: 'Honduras', code: 'HN'},
	  {name: 'Hong Kong', code: 'HK'},
	  {name: 'Hungary', code: 'HU'},
	  {name: 'Iceland', code: 'IS'},
	  {name: 'India', code: 'IN'},
	  {name: 'Indonesia', code: 'ID'},
	  {name: 'Iran, Islamic Republic Of', code: 'IR'},
	  {name: 'Iraq', code: 'IQ'},
	  {name: 'Ireland', code: 'IE'},
	  {name: 'Isle of Man', code: 'IM'},
	  {name: 'Israel', code: 'IL'},
	  {name: 'Italy', code: 'IT'},
	  {name: 'Jamaica', code: 'JM'},
	  {name: 'Japan', code: 'JP'},
	  {name: 'Jersey', code: 'JE'},
	  {name: 'Jordan', code: 'JO'},
	  {name: 'Kazakhstan', code: 'KZ'},
	  {name: 'Kenya', code: 'KE'},
	  {name: 'Kiribati', code: 'KI'},
	  {name: 'Korea, Democratic People\'S Republic of', code: 'KP'},
	  {name: 'Korea, Republic of', code: 'KR'},
	  {name: 'Kuwait', code: 'KW'},
	  {name: 'Kyrgyzstan', code: 'KG'},
	  {name: 'Lao People\'S Democratic Republic', code: 'LA'},
	  {name: 'Latvia', code: 'LV'},
	  {name: 'Lebanon', code: 'LB'},
	  {name: 'Lesotho', code: 'LS'},
	  {name: 'Liberia', code: 'LR'},
	  {name: 'Libyan Arab Jamahiriya', code: 'LY'},
	  {name: 'Liechtenstein', code: 'LI'},
	  {name: 'Lithuania', code: 'LT'},
	  {name: 'Luxembourg', code: 'LU'},
	  {name: 'Macao', code: 'MO'},
	  {name: 'Macedonia, The Former Yugoslav Republic of', code: 'MK'},
	  {name: 'Madagascar', code: 'MG'},
	  {name: 'Malawi', code: 'MW'},
	  {name: 'Malaysia', code: 'MY'},
	  {name: 'Maldives', code: 'MV'},
	  {name: 'Mali', code: 'ML'},
	  {name: 'Malta', code: 'MT'},
	  {name: 'Marshall Islands', code: 'MH'},
	  {name: 'Martinique', code: 'MQ'},
	  {name: 'Mauritania', code: 'MR'},
	  {name: 'Mauritius', code: 'MU'},
	  {name: 'Mayotte', code: 'YT'},
	  {name: 'Mexico', code: 'MX'},
	  {name: 'Micronesia, Federated States of', code: 'FM'},
	  {name: 'Moldova, Republic of', code: 'MD'},
	  {name: 'Monaco', code: 'MC'},
	  {name: 'Mongolia', code: 'MN'},
	  {name: 'Montserrat', code: 'MS'},
	  {name: 'Morocco', code: 'MA'},
	  {name: 'Mozambique', code: 'MZ'},
	  {name: 'Myanmar', code: 'MM'},
	  {name: 'Namibia', code: 'NA'},
	  {name: 'Nauru', code: 'NR'},
	  {name: 'Nepal', code: 'NP'},
	  {name: 'Netherlands', code: 'NL'},
	  {name: 'Netherlands Antilles', code: 'AN'},
	  {name: 'New Caledonia', code: 'NC'},
	  {name: 'New Zealand', code: 'NZ'},
	  {name: 'Nicaragua', code: 'NI'},
	  {name: 'Niger', code: 'NE'},
	  {name: 'Nigeria', code: 'NG'},
	  {name: 'Niue', code: 'NU'},
	  {name: 'Norfolk Island', code: 'NF'},
	  {name: 'Northern Mariana Islands', code: 'MP'},
	  {name: 'Norway', code: 'NO'},
	  {name: 'Oman', code: 'OM'},
	  {name: 'Pakistan', code: 'PK'},
	  {name: 'Palau', code: 'PW'},
	  {name: 'Palestinian Territory, Occupied', code: 'PS'},
	  {name: 'Panama', code: 'PA'},
	  {name: 'Papua New Guinea', code: 'PG'},
	  {name: 'Paraguay', code: 'PY'},
	  {name: 'Peru', code: 'PE'},
	  {name: 'Philippines', code: 'PH'},
	  {name: 'Pitcairn', code: 'PN'},
	  {name: 'Poland', code: 'PL'},
	  {name: 'Portugal', code: 'PT'},
	  {name: 'Puerto Rico', code: 'PR'},
	  {name: 'Qatar', code: 'QA'},
	  {name: 'Reunion', code: 'RE'},
	  {name: 'Romania', code: 'RO'},
	  {name: 'Russian Federation', code: 'RU'},
	  {name: 'RWANDA', code: 'RW'},
	  {name: 'Saint Helena', code: 'SH'},
	  {name: 'Saint Kitts and Nevis', code: 'KN'},
	  {name: 'Saint Lucia', code: 'LC'},
	  {name: 'Saint Pierre and Miquelon', code: 'PM'},
	  {name: 'Saint Vincent and the Grenadines', code: 'VC'},
	  {name: 'Samoa', code: 'WS'},
	  {name: 'San Marino', code: 'SM'},
	  {name: 'Sao Tome and Principe', code: 'ST'},
	  {name: 'Saudi Arabia', code: 'SA'},
	  {name: 'Senegal', code: 'SN'},
	  {name: 'Serbia and Montenegro', code: 'CS'},
	  {name: 'Seychelles', code: 'SC'},
	  {name: 'Sierra Leone', code: 'SL'},
	  {name: 'Singapore', code: 'SG'},
	  {name: 'Slovakia', code: 'SK'},
	  {name: 'Slovenia', code: 'SI'},
	  {name: 'Solomon Islands', code: 'SB'},
	  {name: 'Somalia', code: 'SO'},
	  {name: 'South Africa', code: 'ZA'},
	  {name: 'South Georgia and the South Sandwich Islands', code: 'GS'},
	  {name: 'Spain', code: 'ES'},
	  {name: 'Sri Lanka', code: 'LK'},
	  {name: 'Sudan', code: 'SD'},
	  {name: 'Suriname', code: 'SR'},
	  {name: 'Svalbard and Jan Mayen', code: 'SJ'},
	  {name: 'Swaziland', code: 'SZ'},
	  {name: 'Sweden', code: 'SE'},
	  {name: 'Switzerland', code: 'CH'},
	  {name: 'Syrian Arab Republic', code: 'SY'},
	  {name: 'Taiwan, Province of China', code: 'TW'},
	  {name: 'Tajikistan', code: 'TJ'},
	  {name: 'Tanzania, United Republic of', code: 'TZ'},
	  {name: 'Thailand', code: 'TH'},
	  {name: 'Timor-Leste', code: 'TL'},
	  {name: 'Togo', code: 'TG'},
	  {name: 'Tokelau', code: 'TK'},
	  {name: 'Tonga', code: 'TO'},
	  {name: 'Trinidad and Tobago', code: 'TT'},
	  {name: 'Tunisia', code: 'TN'},
	  {name: 'Turkey', code: 'TR'},
	  {name: 'Turkmenistan', code: 'TM'},
	  {name: 'Turks and Caicos Islands', code: 'TC'},
	  {name: 'Tuvalu', code: 'TV'},
	  {name: 'Uganda', code: 'UG'},
	  {name: 'Ukraine', code: 'UA'},
	  {name: 'United Arab Emirates', code: 'AE'},
	  {name: 'United Kingdom', code: 'GB'},
	  {name: 'United States', code: 'US'},
	  {name: 'United States Minor Outlying Islands', code: 'UM'},
	  {name: 'Uruguay', code: 'UY'},
	  {name: 'Uzbekistan', code: 'UZ'},
	  {name: 'Vanuatu', code: 'VU'},
	  {name: 'Venezuela', code: 'VE'},
	  {name: 'Viet Nam', code: 'VN'},
	  {name: 'Virgin Islands, British', code: 'VG'},
	  {name: 'Virgin Islands, U.S.', code: 'VI'},
	  {name: 'Wallis and Futuna', code: 'WF'},
	  {name: 'Western Sahara', code: 'EH'},
	  {name: 'Yemen', code: 'YE'},
	  {name: 'Zambia', code: 'ZM'},
	  {name: 'Zimbabwe', code: 'ZW'}
	];

	const PHOTO = '/src/assets/sample1.jpg';
	// const PHOTO = 'http://jcrop-cdn.tapmodo.com/v0.9.10/demos/demo_files/pool.jpg';
	const products = {
		a: 12,
		b: {
			d: null,
			e: {m: 55, n: [10, "nike"]},
			f: ["some", "other", {p: true, q: false, s: ['s', 'm', 'xl']}],
			g: "["
		},
		c: "ok"
	};


	class App extends React.Component {
		constructor(props) {
			super(props);
			this.state = {
				date1: new Date(),
				date2: null,
				cityValue: '',
				cityItem: null,
				cityList: cities,
				country: {value: '', item: null, list: countries}
			};
			this.onChange = this.onChange.bind(this);
			this.onCityChange = this.onCityChange.bind(this);
			this.onCitySelect = this.onCitySelect.bind(this);
			this.onCountryChange = this.onCountryChange.bind(this);
			this.onCountrySelect = this.onCountrySelect.bind(this);
			this.onProductsChange = this.onProductsChange.bind(this);
		}

		onChange(value, id) {
			this.setState({[id]: value});
		}

		onCityChange(value, id) {
			const list = cities.filter(item => item.toLowerCase().startsWith(value.toLowerCase()));
			this.setState({cityList: list, cityValue: value});
		}

		onCitySelect(item, id) {
			this.setState({cityItem: item, cityValue: item.toString()});
		}

		onCountryChange(value, id) {
			const list = countries.filter(item => item.name.toLowerCase().startsWith(value.toLowerCase()));
			this.setState({country: {...this.state.country, list, value: value}});
		}

		onCountrySelect(item, id) {
			this.setState({country: {...this.state.country, item, value: item.name}});
		}

		onProductsChange(value, id) {
			// this.setState({[id]: value});
			console.log('onProductsChange', value);
		}

		render() {
			let content;
			switch (location.pathname) {
				case "/image-cropper":
					content = h('div', {className: 'photo'},
						h(ImageCrop, {id: 'photo', src: PHOTO, onChange: val => this.setState({photo: val})})
					);
					break;
				case "/json-editor":
					content = h(JsonEdit, {value: products, onChange: this.onProductsChange});
					break;
				default:
					content = h('form', null,
					h('table', null,
						h('tr', null,
							h('td', null, 'From'),
							h('td', null, h(DatePicker, {id: 'date1', value: this.state.date1, zIndex: 4,
								onChange: this.onChange}))
						),
						h('tr', null,
							h('td', null, 'Upto'),
							h('td', null, h(DatePicker, {id: 'date2', value: this.state.date2, zIndex: 3,
								displayFormat: 'DD-MMM-YYYY',
								onChange: val => this.setState({date2: val})}))
						),
						h('tr', null,
							h('td', null, 'City'),
							h('td', null, h(ComboBox, {id: 'city', value: this.state.cityValue, zIndex: 2,
								list: this.state.cityList,
								onChange: this.onCityChange,
								onSelect: this.onCitySelect}))
						),
						h('tr', null,
							h('td', null, 'Country'),
							h('td', null, h(ComboBox, {id: 'country', value: this.state.country.value, zIndex: 1,
								list: this.state.country.list,
								itemFormat: item => `${item.name} - ${item.code}`,
								onChange: this.onCountryChange,
								onSelect: this.onCountrySelect}))
						),
						h('tr', null,
							h('td', null, ''),
							h('td', null, h(Button, {type: 'button'}, 'Send'))
						)
					)
				);
			}
			return h('div', null,
				h('header', {className: 'header'}, 'This is the header'),
				content,
				h('footer', {className: 'footer'}, 'This is the footer')
			);
		}
	}

	// render the application
	console.log('React.version', React.version);
	ReactDOM.render(h(App), document.getElementById('root'));

}(PropTypes));
