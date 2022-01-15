import assert from "./Assert.js";
export default class Asset
{
	constructor(currency, balance, id)
	{
		this.id = id;
		if(this.id == null || this.id == undefined)
		{
			delete this.id;
		}
		this.currency = currency;

		assert(balance).number;
		this.quantity = balance;
	}

	deposit(value)
	{
		assert(value).positive;
		this.quantity += value;
		return this.quantity;
	}
}