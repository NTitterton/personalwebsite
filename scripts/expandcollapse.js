'use strict';

const e = React.createElement;
const domContainer = document.querySelector('#expand');

class ExpandButton extends ReactElement {
	constructor(props) {
		super(props);
		this.state = {
			pressed: false;
		}
		this.press = this.press.bind(this);
	}

	press(event) {

	}

	render() {
		if (!this.pressed) {
			return e("button", {onClick:this.press});
		} else {
			return e()
		}
	}
}

ReactDOM.render(e(ExpandButton), domContainer);