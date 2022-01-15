

import API from "./API.js";
import Socket from "./Socket.js";
import UI from "./UI.js";

export default class CC
{
	constructor()
	{
		this.socket = new Socket();
		this.ui = new UI();
		this.api = new API(this.socket, this.ui);
	}
}

const cc = new CC();
