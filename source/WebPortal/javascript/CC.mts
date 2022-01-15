

import API from "./API.js";
import Socket from "./Socket.mjs";
import UI from "./UI.mjs";

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
