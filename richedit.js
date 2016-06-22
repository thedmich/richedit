/**
 * Constructs a new richedit object
 * 
 * @param {Node} element
 */
function richedit(element)
{
	// Init text processing framework
	rangy.init();
	
	// Init the textarea element, the groups and the states
	this.textarea = element;
	this.groups = [];
	this.states = [];

	// Get the config
	this.config = $.config("richedit").get();
	
	// Create the HTML structure, replace the textarea
	this.createHTMLStructure();
	
	// Create the DOM processor
	var processor = new domProcessor(
		this.config.elements,
		this.config.elementGroups,
		this.config.formats
	);

	// Generate the AML fragment using the text from the textarea
	var amlFragment = $(processor.getDocument('aml').createDocumentFragment())
		.append($(this.textarea).text());

	// Convert the AML fragment into HTML
	var convertedFragment = processor.transform(
		amlFragment,
		{sourceFormatName: 'aml', dstFormatName: 'html', preserveAttributes: true}
	);

	// Set default format
	processor.setDefaultFormatName('html');

	// Sanitize the converted HTML fragment
	processor.sanitizeNode(convertedFragment, 'html', 'section');

	// Append the converted HTML fragment into the content container
	$(this.contentContainer).append(convertedFragment);
	
	// Create the richtext object
	this.richtext = new richtext(
		this.contentContainer, processor,
		this.config.initialElement
	);
	
	// Call the parent constructors
	container.prototype.constructor.call(this, this.element);

	this.setType('richedit');
	
	actionManager.prototype.constructor.call(
		this,
		this.config.actions
	);
	
	// Create the controls (the panel, the buttons and the hotkeys)
	this.createControls();

	// Bind the event handlers
	this.bindEvents();
}

mixin(richedit, container, actionManager);

richedit.prototype.contentContainer; // container for richedit contents
richedit.prototype.richtext; // richtext object
richedit.prototype.textarea; // hidden textarea to hold AML in
richedit.prototype.aml; // AML representation of text
richedit.prototype.html; // HTML representation of text
richedit.prototype.domProcessor; // DOM processor object
richedit.prototype.pasteBuffer; // buffer for text pasting
richedit.prototype.states;  // array of richedit states
richedit.prototype.activeState; // active state
richedit.prototype.config; // richedit config

richedit.prototype.panel; // tool panel
richedit.prototype.groups; // action groups

/**
 * Builds an HTML structure
 * 
 */
richedit.prototype.createHTMLStructure = function()
{
	// Create the main 'div' container
	this.element = $('<div class="richedit" />').get(0);

	// Create the 'div' container for editable content
	this.contentContainer = $('<div class="section contentContainer"' + 
		' contenteditable="true" spellcheck="false" />').get(0);
	
	// Append the content container into the main container
	$(this.element).append(this.contentContainer);
	
	// Append the main container after the textarea
	$(this.textarea).after(this.element);
	
	// Hide the textarea (to replace it with the richedit)
	$(this.textarea).hide();
	
	// Create the buffer for the paste operations
	this.pasteBuffer = $('<div class="richeditPasteBuffer"' + 
		' contenteditable="true" spellcheck="false" />').get(0); 
	
	// Append the paste buffer into the richedit
	$(this.element).append(this.pasteBuffer);
};

/**
 * Creates richedit controls
 * 
 */
richedit.prototype.createControls = function()
{
	// Create the buttons panel
	var buttonsPanel = new panel();

	// Insert the buttons panel as a first element
	this.prependElement(buttonsPanel); 
	this.panel = buttonsPanel;
	
	// Create the buttons and the hotkeys
	this.createButtonsFromJson(this.config.buttons);
	this.createHotkeysFromJson(this.config.hotkeys);
};

/**
 * Creates buttons using a config
 * 
 * @param {object} buttonsJson
 */
richedit.prototype.createButtonsFromJson = function(buttonsJson) 
{	
	// Iterate all the buttons from the config
	// and make an approriate button on the panel
	for(var buttonName in buttonsJson) 
	{
		// Factory button
		var buttonAction = this.getActionByName(buttonsJson[buttonName].action);
		var bt = new button(buttonsJson[buttonName], buttonAction);

		// Set the button name
		bt.setName(buttonName);

		var gr; // the button group
		
		var groupName = buttonsJson[buttonName].group;
		// Create the button group if it does not exist yet, or use the existing one
		if(this.groups[groupName] === undefined)
		{
			gr = new buttonGroup(this.groups[groupName]); 
			this.groups[groupName] = gr;

			// Add the button group onto the buttons panel
			this.panel.addElement(gr); 
		}
		else gr = this.groups[groupName];
		
		// Add the button to the group
		gr.addElement(bt);
	}
};

/**
 * Creates hotkeys using a config
 * 
 * @param {object} hotkeysJson
 */
richedit.prototype.createHotkeysFromJson = function(hotkeysJson)
{
	// Iterate all the hotkeys from the config
	// and make an approriate hotkey object
	for(var hotkeyName in hotkeysJson) 
	{
		var hotkeyAction = this.getActionByName(hotkeysJson[hotkeyName].action);
		var newHotkey = new hotkey(hotkeysJson[hotkeyName], hotkeyAction);
		newHotkey.setDomElement(this);
	}
};

/**
 * Creates actions using a config
 * 
 * @param {object} actionJson
 * @returns {action}
 */
richedit.prototype.createActionFromJson = function(actionJson)
{
	// Call the actionManager's inherited method
	var action = actionManager.prototype.createActionFromJson
		.call(this, actionJson);

	// Bind the callback function to the action
	var self = this;
	action.callback = function() 
	{
		// Call the callback function
		actionJson.callback(self.richtext);

		// Focus on the content container
		$(self.contentContainer).focus();

		// Call onChange event handlers
		self.onChange();
	};
	
	return action;
};

/**
 * Сохраняет текущий текст ричедита в буфер в формате AML
 * 
 */
richedit.prototype.updateAML = function()
{
	$(this.textarea).text(this.richtext.asAml());
};

/**
 * Binds miscellaneous event handlers
 * 
 */
richedit.prototype.bindEvents = function()
{
	// Init variables
	var self = this;

	// Bind onChange handler on mouseup event
	$(this.element).bind("mouseup",
		function()
		{
			self.onChange();
		}
	);
	
	// Save AML to the textarea when the richedit loses a focus
	$(this.element).bind("focusout",
		function()
		{
			// If the pannel is inactive
			if(!$(self.panel.element).is(":hover"))
			{
				// Deactivate the panel and update AML
				self.deactivate();
				self.updateAML();
			}
		}
	);
	
	// Prevent default 'enter', 'delete' and 'backspace' event hadlers
	$(this.element).keydown(
		function(e)
		{
			if(e.which === 13 || e.keyCode === 46 || e.keyCode === 8)
			{
				e.preventDefault();
				return false;
			}
			self.onChange();
		}
	);
};

/**
 * Returns richedit buttons
 */
richedit.prototype.getButtons = function()
{
	// Lazy initiaiztion
	if(this.buttons === undefined)
	{
		this.buttons = [];
	
		// Iterate over button groups
		for(var groupName in this.groups)
		{
			var group = this.groups[groupName];
			
			// Iterate over each button of the group
			for(var j = 0; j < group.getElements('button').length; j++)
				this.buttons.push(group.getElements('button')[j]);
		}
	}
	
	return this.buttons;
};

/**
 * Calls specified callback function for each button
 * 
 * @param {function} callback
 */
richedit.prototype.eachButton = function(callback)
{	
	var buttons = this.getButtons();
	// Iterate through all the buttons and call the callback
	for(var i = 0; i < buttons.length; i++)
		callback(buttons[i]);
};

/**
 * Handles editor state changes and brings all controls
 * in the consistent state
 * 
 */
richedit.prototype.onChange = function()
{
	var self = this;
	
	// Check all buttons for pressed state
	this.eachButton(
		function(button)
		{	
			// Get the rule to determine if the button have to be pressed
			var rule = self.config.buttons[button.name].pressed;
				
			//If button have to be pressed
			if(self.richtext.testRule(rule))
			{
				// Press it
				button.press();
			}
			else
			{
				// Release it
				button.release();
			}
		}
	);

	// Check all actions for disabled state
	this.eachAction(
		function(action)
		{		
			// Get the rule to determine if the action have to be pressed
			var rule = self.config.actions[action.name].disabled;

			//If button have to be disabled
			if(self.richtext.testRule(rule, self)) 
			{
				// Disable the action
				action.disable();
			}
			else
			{
				// Enable the action
				action.enable();
			}
		}
	);
};

/**
 * Deactivates a richedit
 * 
 */
richedit.prototype.deactivate = function()
{
	// Disable each action
	this.eachAction(
		function(action)
		{
			action.disable();
		}
	);
};

/**
 * Activates a richedit
 * 
 */
richedit.prototype.activate = function()
{
	//Enable action
	this.eachAction(
		function(action)
		{
			action.enable();
		}
	);
};

// JQuery function for simple richedit creation
jQuery.fn.richedit = function()
{
	// Init a richedit for each element
	$(this).each(
		function(index, value)
		{
			return new richedit(value);
		}
	);
};

