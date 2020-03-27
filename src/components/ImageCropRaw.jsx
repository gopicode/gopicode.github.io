import PropTypes from 'prop-types';
import './ImageCrop.less';
import {pick} from '../lib/helper.js';

// inspired from: http://deepliquid.com/projects/Jcrop/demos.php
export class ImageCrop extends React.Component {
	constructor(props) {
		super(props);

		this.model = {
			...props.value,
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
		Object.assign(this.model, patch);
		// console.log('updateModel', this.model);
	}

	componentDidMount() {
		this.$root = this.rootRef.current;
		this.$shim = this.$root.querySelector('.image-crop__shim');
		this.$area = this.$root.querySelector('.image-crop__area');
		this.handles = Array.from(this.$root.querySelectorAll('.image-crop__handle'));
		// console.log('componentDidMount', this.$shim, this.$area, this.handles);

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

	componentDidUpdate(prevProps, prevState, snapshot) {
		// TODO: update state based on props.value changes
	}

	onImgLoad(e) {
		const dim = {imgWidth: e.target.width, imgHeight: e.target.height};
		console.log('onImgLoad', dim);
		this.updateModel(dim);
	}

	onMouseDown({nativeEvent:e}) {
		if (this.model.isBegining || this.model.isDragging || this.model.isResizing) return false;

		if (e.target.classList.contains('image-crop__shim')) {
			this.updateModel({
				isBegining: true, isDragging: false, isResizing: false,
				startX: e.screenX, startY: e.screenY,
				left: e.offsetX, top: e.offsetY, width: 0, height: 0
			});
		}
		else if (e.target.classList.contains('image-crop__drag')) {
			this.updateModel({
				isBegining: false, isDragging: true, isResizing: false,
				startX: e.screenX, startY: e.screenY
			});
		}
		else if (e.target.classList.contains('image-crop__handle')) {
			const direction = e.target.getAttribute('data-direction');
			this.updateModel({
				isBegining: false, isDragging: false, isResizing: true,
				startX: e.screenX, startY: e.screenY, direction
			});
		}
	}

	// dx, dy are difference in the X and Y directions respectively
	// it is calculated with previous positions [startX, startY]
	// after calculation, [startX, startY] are updated to the current mouse point
	onMouseMove(e) {
		if (this.model.isBegining) {
			const width = e.screenX - this.model.startX;
			const height = e.screenY - this.model.startY;
			this.updateModel({width, height});
		}
		else if (this.model.isDragging) {
			const startX = e.screenX;
			const startY = e.screenY;
			const dx = startX - this.model.startX;
			const dy = startY - this.model.startY;

			const { left, top, width, height, imgWidth, imgHeight } = this.model;
			const left1 = left + dx;
			const top1 = top + dy;

			// limit the drag inside the container area
			if (left1 < 0 || top1 < 0 || left1 + width > imgWidth || top1 + height > imgHeight) return;
			this.updateModel({startX, startY, left: left1, top: top1});
		}
		else if (this.model.isResizing) {
			const startX = e.screenX;
			const startY = e.screenY;
			const dx = startX - this.model.startX;
			const dy = startY - this.model.startY;
			const { left, top, width, height } = this.model;

			// init next dimensions to the existing one.
			let left1 = left, top1 = top, width1 = width, height1 = height;

			// update next dimensions based on the direction of movement
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
			this.updateModel({startX, startY, left: left1, top: top1, width: width1, height: height1});
		}
	}

	onMouseUp(e) {
		if (this.model.isBegining || this.model.isDragging || this.model.isResizing) {
			this.updateModel({isBegining: false, isDragging: false, isResizing: false});
			const value = pick(this.model, 'left', 'top', 'width', 'height');
			this.props.onChange(value, this.props.id);
		}
	}

	updateView() {
		const { src, zIndex } = this.props;
		const { left, top, width, height, isBegining } = this.model;

		// detrimine if crop area can be drawn
		const drawArea = isBegining || width > 0 || height > 0;

		// update the shim
		this.$shim.style.background = drawArea ? 'rgba(0, 0, 0, 0.4)' : 'transparent';

		// set the same image as background for the cropper div
		// background-position is set in the reverse of the div's position to select the same area in the background
		if (drawArea) {
			this.$area.classList.remove('image-crop--hide');

			// update the area styles
			this.$area.style.left = left + 'px';
			this.$area.style.top = top + 'px';
			this.$area.style.width = width + 'px';
			this.$area.style.height = height + 'px';
			this.$area.style.backgroundImage = 'url(' + src + ')';
			this.$area.style.backgroundRepeat = 'no-repeat';
			this.$area.style.backgroundPosition = `-${left}px -${top}px`;

			// show/hide the handles
			this.handles.forEach($handle => {
				isBegining ? $handle.classList.add('image-crop--hide') : $handle.classList.remove('image-crop--hide');
			})
		} else {
			this.$area.classList.add('image-crop--hide');
		}

		// next iteration
		if (window.suspendRAF !== true) requestAnimationFrame(this.updateView);
	}

	render() {
		const { src, zIndex } = this.props;
		return (
		<div className="image-crop" ref={this.rootRef} style={{zIndex}}
				onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove}>
			<img className="image-crop__img" src={src} onLoad={this.onImgLoad} />
			<div className="image-crop__shim"/>
			<div className="image-crop__area image-crop--hide" draggable="false">
				<div className="image-crop__vline"></div>
				<div className="image-crop__hline"></div>
				<div className="image-crop__vline right"></div>
				<div className="image-crop__hline bottom"></div>
				<div className="image-crop__drag"></div>
				<div className="image-crop__handle" data-direction="north"></div>
				<div className="image-crop__handle" data-direction="south"></div>
				<div className="image-crop__handle" data-direction="east"></div>
				<div className="image-crop__handle" data-direction="west"></div>
				<div className="image-crop__handle" data-direction="north-east"></div>
				<div className="image-crop__handle" data-direction="south-east"></div>
				<div className="image-crop__handle" data-direction="north-west"></div>
				<div className="image-crop__handle" data-direction="south-west"></div>
			</div>
		</div>
		)
	}
}

ImageCrop.defaultProps = {
	value: {left: 0, top: 0, width: 0, height: 0},
	zIndex: 1,
	onChange: function(){}
}
