

var userInteractionHandler = null;

export default class UI
{
	constructor()
	{
		this.body = document.getElementById(`CryptoCowboy`);
		this.addText(`<h1>CryptoCowboy</h1>`);
	}

	userInteraction(UIH)
	{
		userInteractionHandler = UIH;
	}

	addText(data)
	{
		this.body.innerHTML += data + `<br>`;
	}

	add(data)
	{
		this.createContainer(data);
	}

	append(data)
	{
		this.body.appendChild(data);
	}

	createContainer(data)
	{
		const keys = Object.keys(data);

		keys.forEach(element =>
		{
			const oldContainer = document.getElementById(element);
			let container;
			if (oldContainer == undefined)
			{
				container = document.createElement(`div`);
			}
			else
			{
				container = oldContainer;
				container.innerHTML = ``;
			}

			container.innerHTML += (`<h2>${element}</h2>`);
			container.id = element;
			//this.addText(container);
			this.append(container);

			const apiCommands = data[element];
			apiCommands.forEach((value) => 
			{
				console.log(`value: `, value);
				let description = value.description;
				const command = value.command;
				const commandButton = document.createElement(`button`);
				commandButton.type = `button`;
				commandButton.value = command;
				commandButton.innerHTML = command;


				let parameters = [];

				if (typeof (description) != `string`)
				{
					if (description != undefined && description.parameters != null && description.parameters != undefined)
					{
						parameters = description.parameters;
						description = description.description;
					}
				}

				const descriptionElement = document.createElement(`span`);
				descriptionElement.innerHTML = description;
				const pair = document.createElement(`div`);
				pair.appendChild(commandButton);
				pair.appendChild(descriptionElement);

				const paramIDs = parameters.map((value, index) => 
				{
					const ele = document.createElement(`div`);
					ele.innerHTML = `${value.parameter}: <i>${value.type}</i> - "${value.description}" | Example: ${value.example}`;
					pair.appendChild(ele);

					if (value.type == `string`)
					{
						const inputBox = document.createElement(`input`);
						inputBox.type = `text`;
						inputBox.placeholder = value.parameter;
						inputBox.id = `${element}_${command}_${value.parameter}`;
						pair.appendChild(inputBox);
						return inputBox.id;
					}

				});

				commandButton.onclick = () => 
				{
					const apiData =
					{
						title: element,
						command: value.command,
						parameters: paramIDs
					};
					userInteractionHandler(apiData);
				};





				container.appendChild(pair);
			});
		});
	}
}