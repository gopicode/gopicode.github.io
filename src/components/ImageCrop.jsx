import PropTypes from 'prop-types';
import './ImageCrop.less';
import {pick} from '../lib/helper.js';

// inspired from: http://deepliquid.com/projects/Jcrop/demos.php
export class ImageCrop extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
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
		this.cropRef = React.createRef();
		this.onImgLoad = this.onImgLoad.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	}

	componentDidMount() {
		document.addEventListener('mouseup', this.onMouseUp);
		// document.addEventListener('mousemove', this.onMouseMove);
	}

	componentWillUnmount() {
		document.removeEventListener('mouseup', this.onMouseUp);
		// document.removeEventListener('mousemove', this.onMouseMove);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		// TODO: update state based on props.value changes
	}

	onImgLoad(e) {
		const dim = {imgWidth: e.target.width, imgHeight: e.target.height};
		console.log('onImgLoad', dim);
		this.setState(dim);
	}

	onMouseDown({nativeEvent:e}) {
		if (this.state.isBegining || this.state.isDragging || this.state.isResizing) return false;

		if (e.target.classList.contains('image-crop__shim')) {
			this.setState({isBegining: true, startX: e.screenX, startY: e.screenY,
				left: e.offsetX, top: e.offsetY, width: 0, height: 0});
		}
		else if (e.target.classList.contains('image-crop__drag')) {
			this.setState({isDragging: true, startX: e.screenX, startY: e.screenY});
		}
		else if (e.target.classList.contains('image-crop__handle')) {
			const direction = e.target.getAttribute('data-direction');
			this.setState({isResizing: true, direction, startX: e.screenX, startY: e.screenY});
		}
	}

	// dx, dy are difference in the X and Y directions respectively
	// it is calculated with previous positions [startX, startY]
	// after calculation, [startX, startY] are updated to the current mouse point
	onMouseMove(e) {
		if (this.state.isBegining) {
			const width = e.screenX - this.state.startX;
			const height = e.screenY - this.state.startY;
			this.setState({width, height});
		}
		else if (this.state.isDragging) {
			const startX = e.screenX;
			const startY = e.screenY;
			const dx = startX - this.state.startX;
			const dy = startY - this.state.startY;

			const { left, top, width, height, imgWidth, imgHeight } = this.state;
			const left1 = left + dx;
			const top1 = top + dy;

			// limit the drag inside the container area
			if (left1 < 0 || top1 < 0 || left1 + width > imgWidth || top1 + height > imgHeight) return;
			this.setState({startX, startY, left: left1, top: top1});
		}
		else if (this.state.isResizing) {
			const startX = e.screenX;
			const startY = e.screenY;
			const dx = startX - this.state.startX;
			const dy = startY - this.state.startY;
			const { left, top, width, height } = this.state;

			// init next dimensions to the existing one.
			let left1 = left, top1 = top, width1 = width, height1 = height;

			// update next dimensions based on the direction of movement
			switch (this.state.direction) {
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
			this.setState({startX, startY, left: left1, top: top1, width: width1, height: height1});
		}
	}

	onMouseUp(e) {
		if (this.state.isBegining || this.state.isDragging || this.state.isResizing) {
			this.setState({isBegining: false, isDragging: false, isResizing: false});
			const value = pick(this.state, 'left', 'top', 'width', 'height');
			this.props.onChange(value, this.props.id);
		}
	}

	render() {
		const { src, zIndex } = this.props;
		const { left, top, width, height, isBegining } = this.state;
		const drawArea = isBegining || width > 0 || height > 0;

		// set the same image as background for the cropper div
		// background-position is set in the reverse of the div's position to select the same area in the background
		const areaStyle = {
			left, top, width, height,
			backgroundImage: 'url(' + src + ')',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: `-${left}px -${top}px`
		};

		const shimStyle = {
			background: drawArea ? 'rgba(0, 0, 0, 0.4)' : 'transparent'
		};
		return (
		<div className="image-crop" ref={this.cropRef} style={{zIndex}}
				onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove}>
			<img className="image-crop__img" src={src} onLoad={this.onImgLoad} />
			<div className="image-crop__shim" style={shimStyle}/>
			{drawArea && <div className="image-crop__area" style={areaStyle} draggable="false">
				<div className="image-crop__vline"></div>
				<div className="image-crop__hline"></div>
				<div className="image-crop__vline right"></div>
				<div className="image-crop__hline bottom"></div>
				{!isBegining && <div className="image-crop__drag"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="north"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="south"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="east"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="west"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="north-east"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="south-east"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="north-west"></div>}
				{!isBegining && <div className="image-crop__handle" data-direction="south-west"></div>}
			</div>}
		</div>
		)
	}
}

ImageCrop.defaultProps = {
	value: {left: 0, top: 0, width: 0, height: 0},
	zIndex: 1,
	onChange: function(){}
}
