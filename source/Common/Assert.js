import node_Assert from "assert";
const assert = node_Assert.strict;

class Assert
{
	constructor(data, fallBack)
	{
		this.data = data;
		this.fallBack = fallBack;
	}

	/**
	 * Check if condition is true, if not, use the fallback instead if it exists
	 * @param {bool} condition 
	 */
	check(condition)
	{
		if (!condition)
		{
			console.log(`this.fallBack:`, this.fallBack);
			if (this.fallBack != null && this.fallBack != undefined)
			{
				console.log(`FALLING BACK`);
				this.data = this.fallBack;
				this.fallBack = null;
			}
		}
	}

	get string()
	{
		this.notEmpty;

		const condition = () => 
		{
			return (typeof (this.data) === `string`);
		};
		this.check(condition());

		assert.ok(condition(), new Error(`${this.data} is not a string`));
		return this;
	}

	get notEmpty()
	{
		const condition = () => 
		{
			return (this.data.length > 0);
		};
		this.check(condition());

		assert.ok(condition(), new Error(`${this.data} is empty`));
		return this;
	}

	get number()
	{
		const condition = () => 
		{
			return (typeof (this.data) === `number`);
		};
		this.check(condition());

		assert.ok(condition(), new Error(`${this.data} is not a number`));
		return this;
	}

	get positive()
	{
		this.number;

		const condition = () => 
		{
			return (this.data >= 0);
		};
		this.check(condition());

		assert.ok(condition(), new Error(`${this.data} is not positive`));
		return this;
	}

	lessThan(...values)
	{
		this.number;

		values.forEach((value) => 
		{
			const condition = () => 
			{
				return (this.data < value);
			};
			this.check(condition());

			assert.ok(condition(), new Error(`${this.data} is not less than ${value}`));
		});
		return this;
	}

	/**
	 * Checks to see if the value is an instance of a class
	 * @param  {...any} values 
	 */
	isA(...values)
	{
		values.forEach((value) => 
		{
			const condition = () => 
			{
				return (this.data instanceof(value));
			};
			this.check(condition());

			assert.ok(condition(), new Error(`${this.data} is not a ${value.name}`));
		});
	}

	//	*****************
	//	I havent finished adding the condition funct, stopped here.
	lessThanOrEqual(...values)
	{
		this.number;
		values.forEach((value) => 
		{
			assert.ok(this.data <= value, new Error(`${this.data} is not less than ${value}`));
		});
		return this;
	}

	greaterThan(...values)
	{
		this.number;
		values.forEach((value) => 
		{
			assert.ok(this.data > value, new Error(`${this.data} is not greater than ${value}`));
		});
		return this;
	}

	greaterThanOrEqual(...values)
	{
		this.number;
		values.forEach((value) => 
		{
			assert.ok(this.data >= value, new Error(`${this.data} is not greater than ${value}`));
		});
		return this;
	}
}

function assertionGenerator(value, fallBack)
{
	return new Assert(value, fallBack);
}

export default assertionGenerator;