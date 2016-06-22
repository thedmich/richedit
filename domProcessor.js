/**
 * Constructs a new DOM processor
 * 
 * @param {object} elementsConfig
 * @param {object} groupsConfig
 * @param {object} formatsConfig
 */
function domProcessor(elementsConfig, groupsConfig, formatsConfig) 
{
	// Set the properties from the paremeters
	this.elements = elementsConfig;
	this.groups = groupsConfig;
	this.formats = formatsConfig;
	
	// Просчитать селекторы для каждого элемента
	this.generateElementsSelectors();
}

domProcessor.prototype.elements; // elements JSON
domProcessor.prototype.groups; // droups JSON
domProcessor.prototype.formats; // formats JSON
domProcessor.prototype.defaultFormatName; // default format

/**
 * Создает селекторы для всех элементов, во всех форматах (и сохраняет в кеше)
 */
domProcessor.prototype.generateElementsSelectors = function()
{
	// Iterate through all the elements
	for(var elementName in this.elements)
	{	
		var element = this.elements[elementName];

		// Generate selector for all formats (tag + attributes)
		for(var name in element.formats)
		{
			var rule = element.formats[name];
			
			// If the rule has no selector defined, than generate the selector automatically
			if(rule.selector === undefined)
			{
				// Start the seelctor from the tag name
				var selector = rule.tag; 
				
				// If rule has attributes, append them to the selector
				if(rule.attrs !== undefined)
					for(var attrName in rule.attrs)
					{
						var attrValue = rule.attrs[attrName];

						// Только строковые атрибуты попадают в селекторы
						// Use only string attributes as selectors
						if($.type(attrValue) === "string")
							selector += '[' + attrName + '="' + attrValue + '"]';
					}

				// Set the generated selector
				rule.selector = selector;
			}
		}
	}
};

/**
 * Sets a default format name
 * 
 * @param {string} formatName
 */
domProcessor.prototype.setDefaultFormatName = function(formatName)
{
	// Set the corresponding property
	this.defaultFormatName = formatName;
};

/**
 * Transfroms a node fragment from a source format to a destination format
 * 
 * @param {DocumentFragment} sourceFragment Source document fragment
 * @param {object} options
 * @param {object} dstNode destination object
 *
 * @returns {Node} dstNode
 */
domProcessor.prototype.transform = function(
	sourceFragment, 
	options,
	dstNode
)	
{
	// Init variables
	var self = this;
	var preserveAttributes = options.preserveAttributes;
	
	// Get the formats from the options
	sourceFormatName = (options.sourceFormatName !== undefined) ? 
		options.sourceFormatName : this.defaultFormatName;		
	dstFormatName = options.dstFormatName ? 
		options.dstFormatName : this.defaultFormatName;

	// Generate dstNode as XML document
	if(dstNode === undefined)
		dstNode = this.getDocument(dstFormatName);
	
	// If the destination node is a document, create the document fragment instead
	if(dstNode instanceof Document)
		dstNode = dstNode.createDocumentFragment();
	
	// Iterate through all the child nodes of the source fragment
	$(sourceFragment).contents().each(
		function() 
		{
			// If this is a text node
			if(self.isTextNode(this))
			{
				// Copy it to the destination node
				var textNode = dstNode.ownerDocument.createTextNode(this.data);
				$(dstNode).append(textNode);
			}
			// If this is a comment node
			else if(self.isCommentNode(this))
				$(dstNode).append(self.unescapeNode(this)); // copy it unescaped
			// Check if we need to ignore the node
			else if(self.checkNodeIgnored(this, sourceFormatName))
			{
				// Go through this node to the child nodes
				self.transform(this, options, dstNode);
			}
			// If the node is an element
			else
			{
				// Try to recognize the element using the source format
				var element = self.recognizeElement(this, sourceFormatName);

				// If the element is not recognized, escape it
				if(element === undefined)
					$(dstNode).append(self.escapeNode(this, dstNode.ownerDocument));
				else
				{	
					// Convert the element into target format
					var convertedElement = dstNode.ownerDocument.createElement(
						element.formats[dstFormatName].tag
					);
	
					// Copy attributes from source element
					self.transformAttributes(
						convertedElement, 
						this, 
						sourceFormatName, 
						dstFormatName, 
						element.formats[dstFormatName], 
						preserveAttributes
					);
	
					// Create attributes from the format description
					self.buildElementAttributes(convertedElement, element.formats[dstFormatName]);
					
					// Transform the node recursively
					$(dstNode).append(
						self.transform(this, options, convertedElement)
					);
				}
			}
		}
	);

	// Return the transformed node
	return dstNode;
};

/**
 * Checks if a specified node is a text node
 * 
 * @param {Node} node
 * @returns {boolean}
 */
domProcessor.prototype.isTextNode = function(node)
{
	// Check that node type is 3
	return (node.nodeType === 3);
};

/**
 * Checks if a specified node is a DOM fragment
 * 
 * @param {Node} node
 * @returns {boolean}
 */
domProcessor.prototype.isDomFragment = function(node)
{
	// Check that node type is 11
	return (node.nodeType === 11);
};

/**
 * Checks if a specified node is a comment
 *
 * @param {Node} node
 * @returns {boolean}
 */
domProcessor.prototype.isCommentNode = function(node)
{
	// Check that node type is 8
	return (node.nodeType === 8);
};

/**
 * Checks if a specified node contains only whitespace characters
 * 
 * @param {Node} node
 * @returns {boolean}
 */
domProcessor.prototype.containsOnlyWhitespaces = function(node)
{
    // Check that string contains no characters other than spaces
    return !/\S/.test(node.nodeValue)
};

/**
 * Escapes a node by making a comment with its contents
 * 
 * @param {Node} node A node to escape
 * @param {Document} targetDocument A target document
 * @returns {Node}
 */
domProcessor.prototype.escapeNode = function(node, targetDocument)
{
	// Create the comment node with the node's XML representation
	return targetDocument.createComment(xmlToString(node));
};

/**
 * Unescapes a node by parsing a comment with its XML representation
 *
 * @param {Node} commentNode
 * @returns {boolean}
 */
domProcessor.prototype.unescapeNode = function(commentNode)
{
	// Parse the comment's XML contents into the DOMFragment and return its nodes
	return $($.parseXML(commentNode.nodeValue)).contents();
};

/**
 * Checks if a node is ignored (ex: automatically added 'tbody' tag)
 * 
 * @param {Node} node
 * @param {string} formatName
 * @returns {boolean}
 */
domProcessor.prototype.checkNodeIgnored = function(node, formatName)
{
	// If the format name is not specified, use the default value
	if(formatName === undefined)
		formatName = this.defaultFormatName;

	// Get the ingnored tags for the given format
	var ignoredTags = this.formats[formatName].ignoredTags;
	
	// Try to find the node tag among the ignored tags
	if($.inArray(node.tagName.toLowerCase(), ignoredTags) !== -1)
		return true;
	
	return false;
};

/**
 * Recoginzes element's name
 * 
 * @param {Node} domElement
 * @param {string} formatName
 * @returns {string} elementName
 */
domProcessor.prototype.recognizeElementName = function(domElement, formatName)
{
	// If the fromat is not specified, use default one
	if(formatName === undefined)
		formatName = this.defaultFormatName;
	var matchedElementNames = [];

	// This is a text node, return 'plaintext'
	if(this.isTextNode(domElement))
	{
		return 'plaintext';
	}

	// This is a comment node, return 'comment'
	if(this.isCommentNode(this))
	{
		return 'comment';
	}
	
	// Iterate all selectors in cached elements
	for(var elementName in this.elements)
	{
		// Get the element's description from the JSON
		var rule = this.elements[elementName].formats[formatName];

		// If tag match (optimization)
		if(domElement.tagName.toLowerCase() === rule.tag && 
			this.elementsMatchSelector(domElement, rule.selector)
		)
			matchedElementNames.push(elementName);
	}
	
	return matchedElementNames[matchedElementNames.length - 1];
};

/**
  * Recoginzes element and returns its description
 * 
 * @param {Node} domElement
 * @param {string} formatName
 * @returns {object} element
 */
domProcessor.prototype.recognizeElement = function(domElement, formatName)
{
	return this.elements[this.recognizeElementName(domElement, formatName)];
};

/**
 * Checks that specified elements match a selector
 *
 * @param {Array} elements
 * @param {string} selector CSS selector
 * @returns {boolean}
 */
domProcessor.prototype.elementsMatchSelector = function(elements, selector) 
{
	// Test the selector against the elements
	return $(elements).is(selector);
};

/**
  * Builds an element
 * 
 * @param {string} elementName
 * @param {Document} document
 * @param {object} options
 * @returns {Node}
 */
domProcessor.prototype.buildElement = function(elementName, document, options)
{
	// Init options
	if(options === undefined) options = {};

	// Init the initial content option
	if(options.addInitialContent === undefined)
		options.addInitialContent = true;	
	
	// Init the format name option
	if(options.formatName === undefined)
		options.formatName = this.defaultFormatName;
	
	// Get the format description
	var format = this.elements[elementName].formats[options.formatName];
	var element = new richtextElement(document.createElement(format.tag), elementName);
	
	// Create the attributes using the format description
	this.buildElementAttributes(element.node, format);
	
	// If the content is specified
	if(options.content !== undefined)
	{
		// Append the content
		$(element.node).append(options.content);

		// Sanitize the element
		this.sanitizeNode(element.node, options.formatName);
	}
	
	// If the element is empty and we need to add an initial content
	if(options.addInitialContent && this.isNodeEmpty(element.node) && 
		format.initialContent !== undefined
	) 
	{
		// Append the initial content
		$(element.node).append(format.initialContent);
	}
	
	return element;
};

/**
 * Создает атрибуты для элемента
 * 
 * @param {Node} element Target element
 * @param {object} format
 * @returns {Node}
 */
domProcessor.prototype.buildElementAttributes = function(element, format)
{
	// Create attributes from format description
	if(format.attrs !== undefined)
		for(var attrName in format.attrs)
		{
			// String value
			if($.type(format.attrs[attrName]) === 'string')
				$(element).attr(attrName, format.attrs[attrName]);
		}
};

/**
 * Transforms element attributes
 * 
 * @param {Node} dstElement
 * @param {Node} sourceElement
 * @param {string} sourceFormatName
 * @param {string} dstFormatName
 * @param {object} dstFormat
 * @param {boolean} preserveAttributes
 * @returns {Node}
 */
domProcessor.prototype.transformAttributes = function(
	dstElement, 
	sourceElement, 
	sourceFormatName, 
	dstFormatName, 
	dstFormat, 
	preserveAttributes
)
{
	// Create attributes from format description
	if(dstFormat.attrs !== undefined)
		for(var attrName in dstFormat.attrs)
		{
			// Если значением атрибута является объект, ссылающийся на атрибут исходного объекта,
			// например (uri => href)
			var attrDefs = dstFormat.attrs[attrName];
				
			// Находим по имени значени атрибута в объекте источнике и копируем его в новый объект
			for(var defName in attrDefs)
			{					
				var attrDef = attrDefs[defName];
				var attrValue = $(sourceElement).attr(attrDef);
				$(dstElement).attr(attrName, attrValue);
			}
		}
	
	// Generate the attribute prefixes
	var dstFormatPrefix = dstFormatName + ':';
	var srcFormatPrefix = sourceFormatName + ':';
	
	// Iterate through all the source element's attributes
	for(var i = 0; i < sourceElement.attributes.length; i++) 
	{
		var attrName = sourceElement.attributes[i].nodeName;
		var attrValue = sourceElement.attributes[i].nodeValue;
		
		// If the attribute has the prefix of the destination format (ex. aml:element), strip the prefix
		if(attrName.indexOf(dstFormatPrefix) === 0)
		{
			attrName = attrName.replace(dstFormatPrefix, '');
			$(dstElement).attr(attrName, attrValue);
		}
		// If we have to preserve attributes, then just copy them with the prefix of the source format, preserving existing attributes
		else if(preserveAttributes)
		{
			if(dstFormat !== undefined && dstFormat.attrs !== undefined && 
				dstFormat.attrs[attrName] === undefined
			)
			{
				attrName = srcFormatPrefix + attrName;
				$(dstElement).attr(attrName, attrValue);
			}
		}
		
	}
};

/**
 * Checks if a specified element may contain a child with a specified name
 * 
 * @param {string} childElementName
 * @param {object} node — domNode object
 * @param {string} elementName
 * @returns {boolean}
 */
domProcessor.prototype.isChildNameAllowedForElement = function(
	childElementName, 
	node,
	elementName
)
{
	// Text and comments allowed inside any element
	if(childElementName === 'plaintext' || childElementName === 'comment')
	{
		return true;
	}

	// If element name is not passed, try to recognize it
	var element = {};
	if(elementName === undefined || elementName === null)
	{
		element = this.recognizeElement(node);
		if(element === undefined)
		{
			throw new Error("DomProcessor error: unrecognizing element");
		}
	}
	else
	{
		// Get the element config
		element = this.elements[elementName];
	}
	
	// Функция для поиска допустимых подэлементов (вызывается рекурсивно)
	var getAllowedChilds = function(element)
	{
		var allowChilds = element.allowedChilds;
		
		// [REVIEW-100-2] Да, тут только на undefined можно проверять.
		// [REVIEW-100-2] Added 2 lines:
		// Если передан элемент DOM, тогда проверяем, нет ли в описании inheritFromParent или inheritFromParentOf
		if(node !== undefined)
		{
			// Для inheritFromParent считываем allowedChilds у родительского элемента
			if(allowChilds.inheritFromParent && allowChilds.inheritFromParent !== undefined)
			{
				allowChilds = getAllowedChilds(this.recognizeElement(node.parentNode));
			}

			// Для inheritFromParentOf считываем allowedChilds 
			// у родителя указанного элемента (из списка анцесторов)
			if(allowChilds.inheritFromParentOf && allowChilds.inheritFromParentOf !== undefined)
			{
				var ancestorElement = this.findAncestorElement(
					allowChilds.inheritFromParentOf, node
				);
				allowChilds = getAllowedChilds(this.recognizeElement(ancestorElement.parentNode));
			}
		}
		return allowChilds;
	};
	
	// Get the list of allowed child elements
	var allowChilds = getAllowedChilds(element);

	// If there are no childs allowed, return false
	if(allowChilds === undefined) return false;
	
	// Search if it's allowed by the groups
	if(allowChilds.groups !== undefined)
		// Iterate through the groups of allowed childs
		for(var groupIndex in allowChilds.groups)
		{
			// Get the group name
			var groupName = allowChilds.groups[groupIndex];

			// Search for the sought-for element name in the group
			if($.inArray(childElementName, this.groups[groupName]) !== -1)
				return true;
		}
	
	// Search if it's allowed by the elements
	if(allowChilds.elements !== undefined)
		// Search for the sought-for element name in the array of allowed childs
		if($.inArray(childElementName, allowChilds.elements) !== -1)
			return true;

	// A child is dissalowed by default
	return false;
};

/**
 * Sanitizes node and all its contents, removing empty and wrong nodes and merging
 * similar elements.
 * 
 * @param {node} node
 * @param {string} formatName
 * @param {string} elementName
 */
domProcessor.prototype.sanitizeNode = function(node, formatName, elementName)
{
	// If the format isn't specified, use default
	if(formatName === undefined)
	{
		formatName = this.defaultFormatName;
	}
	
	// Init variables
	var self = this;
	var format = this.formats[formatName];

	// If element is a text or a coment node, then quit the processing:
	// there is nothing to sanitize
	if(this.isTextNode(node) || 
		this.isCommentNode(node) || 
		this.nodeHasOnlyInitialContent(node, formatName, elementName)
	)
	{
		return;
	}
	
	// Normalize node (merge text nodes, clean excess whitespaces)
	node.normalize();
	
	// Iterate all child nodes and sanitize
	var currentChild = node.firstChild;
	while(currentChild !== null)
	{
		// Remember next element
		var nextElement = currentChild.nextSibling;
		
		// Skip checking of text nodes, comments and ignored nodes
		if(!self.isTextNode(currentChild) && !self.isCommentNode(currentChild) && 
			!self.checkNodeIgnored(currentChild)
		)
		{
			// Run this function recursively for the current child node
			self.sanitizeNode(currentChild, formatName);
			
			// If the format allows the removing of empty elements, remove the empty childs
			if(self.isNodeEmpty(currentChild) && format.emptyTagsRemovingAllowed &&
				$.inArray(currentChild.tagName.toLowerCase(), format.emptyTags) === -1
			)
			{
				$(currentChild).remove();
				
				// Move to the next element
				currentChild = nextElement;
				continue;
			}
			
			// Recognize element name corresponding to the current child node
			var currentChildElementName = self.recognizeElementName(currentChild, formatName);

			// If the current child node is not allowed for this node and it's not just created
			if(!self.isChildNameAllowedForElement(currentChildElementName, node, elementName) && 
				!self.nodeHasOnlyInitialContent(currentChild)
			)
			{
				// Remeber the previous sibling and the parent node
				var prevSibling = currentChild.previousSibling;
				var parentNode = currentChild.parentNode;
				
				// If the current child node has node contents
				if($(currentChild).contents().length === 0) 
				{
					// Remove it
					$(currentChild).remove();
				}
				else 
				{
					// Unwrap it
					$(currentChild).contents().unwrap();
				}
				// Choose approrite replacement for the current child node
				currentChild = (!prevSibling) ? parentNode.firstChild : 
					prevSibling.nextSibling;
				continue;
			}

			// If the current child node can be merged with the previous node
			if(currentChild.previousSibling !== null && 
				self.canMergeNodes(currentChild.previousSibling, currentChild, format)
			)
			{
				// Merge nodes
				self.mergeNodes(currentChild.previousSibling, currentChild);
			}
		}
		else if((self.isTextNode(currentChild) || self.isCommentNode(currentChild)) && 
				self.isNodeEmpty(currentChild)
		)
		{
			// Remove it
			$(currentChild).remove();
		}
		
		// Move to the next element
		currentChild = nextElement;
	}
};

/**
 * Checks if a node is empty
 * 
 * @param {Node} node
 * @returns {boolean}
 */
domProcessor.prototype.isNodeEmpty = function(node)
{
	// If the node is a text and it contains only whitespaces, then it is considered to be empty
	if(this.isTextNode(node))
		return this.containsOnlyWhitespaces(node);

	// Otherwise the node is considered to be empty only if it has no childs
	if($(node).contents().length === 0) 
		return true;
	
	return false;
};


/**
 * Checks if two nodes can be merged. For this they must be of a same type,
 * have the same names and attributes
 * 
 * @param {Node} nodeA First node to merge
 * @param {Node} nodeB Second node to merge
 * @param {object} format — формат проверяемых элементов
 * @returns {boolean}
 */
domProcessor.prototype.canMergeNodes = function(nodeA, nodeB, format) 
{
	// Селекторы, которые допускают склеивание
	var selectors = format.mergedNodes;
	
	// If both nodes are text
	if(this.isTextNode(nodeA) && this.isTextNode(nodeB))
		return true;
	
	// If any of nodes is comment, they can't be merged
	if(this.isCommentNode(nodeA) || this.isCommentNode(nodeB))
		return false;
	
	// Check that the node types are equal
	if(nodeA.nodeType !== nodeB.nodeType)
		return false;
	
	// Check that the tag names are equal
	if(nodeA.tagName.toLowerCase() !== nodeB.tagName.toLowerCase())
		return false;
	
	// Check if the format selectors allows merging
	var matchedSelector = false;
	for(var i = 0; i < selectors.length; i++) 
	{
		if(this.elementsMatchSelector(nodeA, selectors[i]) &&
			this.elementsMatchSelector(nodeB, selectors[i])
		)
		{
			matchedSelector = true;
			break;
		}
	}
	
	// Если нельзя, то результат отрицательный
	if(!matchedSelector)
		return false;

	// Check the attributes
	var nodeAAttrs = nodeA.attributes, nodeBAttrs = nodeB.attributes;
	
	// Check that the attributes count are equal
	if(nodeAAttrs.length !== nodeBAttrs.length)
		return false;

	// Check coinsiding of all attributes
// [REVIEW-100-2] Почему не сработает? Выше у меня есть проверка, что количество атрибутов должно быть одинаковое. 
// [REVIEW-100-2] А здесь проверяется что все атрибута из A есть в B. Так как количество одинаковое, то полное сходство по атрибутам гарантировано
// [REVIEW-100-2] Added 8 lines:
	for(var i = 0; i < nodeAAttrs.length; i++) 
	{
		var name = nodeAAttrs[i].name;
		if(nodeBAttrs[name] === undefined) return false;
		if(nodeAAttrs[i].value !== nodeBAttrs[name].value) 
			return false;
	}

	return true;
};

/**
 * Merge two nodes (using splitter if specified).
 * 
 * @param {Node} nodeA First node to merge (в нем сохраняется результат склейки)
 * @param {Node} nodeB Second node to merge
 * @param {string} splitter
 * @returns {boolean}
 */
// [REVIEW-100-2] Во-первых сделал понятнее код (без смены порядка, с явнмм удалением), во-вторых написал комментарий
// [REVIEW-100-2] Added 10 lines:
domProcessor.prototype.mergeNodes = function(nodeA, nodeB, splitter) 
{
	// Добавлеяем разделитель
	if(splitter !== undefined)
		$(nodeA).append(splitter);

	// В nodeA добавляем содержимое nodeB, сам nodeB удаляем
	$(nodeA).append($(nodeB).contents());
	$(nodeB).remove();
	
	// Нормализуем nodeA (склеиваем текстовые элементы)
	nodeA.normalize();
};

/**
 * Generates a document of a specified format
 * 
 * @param {string} formatName
 * @param {string} content
 * @returns {document}
 */
domProcessor.prototype.getDocument = function(formatName, content)
{
	// For html format document is current global object @document@
	if(formatName === "html") return document;

	// Build the XML string of the document using the format config
	var format = this.formats[formatName];
	var documentString = '<' + format.rootElement +' xmlns="' + format.namespace + '"';
	
	// Add the additional namespaces using the format config
	for(var nsName in format.additionalNamespaces)
	{
		var additionalNamespace = format.additionalNamespaces[nsName];
		documentString += ' xmlns:' + nsName + '="' + additionalNamespace + '"';	
	}
	documentString += '>';
	
	// Add the specified content (if any)
	if(content !== undefined)
		documentString += content;

	// Add the ending tag
	documentString += '</'+ format.rootElement +'>';
	
	// Return the document made by parsing the XML string with jQuery
	return $.parseXML(documentString);
};

/**
 * Checks if a node contains a specified element
 * 
 * @param {Node} node
 * @param {string} elementName
 * @param {array} options
 * @returns {boolean}
 */
domProcessor.prototype.nodeContainsElement = function(
	node, 
	elementName, 
	options
)
{
	// Get the descendants
// [REVIEW-100-2] Нет, если я не проверю сначала существование options (необязталеьный параметр) и запрошу его свойство recursive, то будет ошибка.
// [REVIEW-100-2] Проверка recursive на undefined и false нужны, потом что свойство может быть не задано вообще, или специально установлено в false
// [REVIEW-100-2] Added 2 lines:
	var elements = (options !== undefined && options.recursive !== undefined && 
			options.recursive
		) ? $(node).find("*") : $(node).children();
	
	// Get the selector for the specified element
	var selector = this.getElementSelector(elementName);

	// Check that there are elements matching the selector
	return this.elementsMatchSelector(elements, selector);
};

/**
 * Searches for an element among ancestors
 *
 * @param {string} elementName
 * @param {Node} node
 * @param {Node} root
 * @returns {Node}
 */
domProcessor.prototype.findAncestorElement = function(elementName, node, root) 
{
	// Get the selector for the specified element
	var selector = this.getElementSelector(elementName);
	
	// Search the elements among the ancestors
	return $(node).closest(selector, root).get(0);
};

/**
 * Check if a node is inside a specified element
 * 
 * @param {string} elementName
 * @param {Node} node
 * @param {Node} root
 * @returns {boolean}
 */
domProcessor.prototype.nodeInsideElement = function(
	elementName,
	node,
	root
)
{
	// Search the elements among the ancestors
	return this.findAncestorElement(elementName, node, root) !== undefined;
};

/**
 * Returns child elements
 * 
 * @param {Node} node
 * @param {string} elementName
 * @returns {Array}
 */
domProcessor.prototype.getChildElements = function(node, elementName) 
{
	// Get the selector for the specified element
	var selector = this.getElementSelector(elementName);
	
	// Search the elements among the children
	return $(node).children().filter(selector);
};

/**
 * Returns a selector for a specified element
 * 
 * @param {string} elementName
 * @param {string} formatName
 * @returns {string} selector
 */
domProcessor.prototype.getElementSelector = function(elementName, formatName) 
{
	// If the format isn't specified, use default
	if(formatName === undefined)
		formatName = this.defaultFormatName;
	
	// Get the selector for the specified element
	return this.elements[elementName].formats[formatName].selector;
};

/**
  * Checks if a specified node is an element of a specified name
 * 
 * @param {Node} node
 * @param {string} elementName
 * @returns {boolean}
 */
domProcessor.prototype.nodeIsElement = function(node, elementName) 
{
	// If the node is undefined or it's a text node, then return false
	if(node === undefined || this.isTextNode(node))
		return false;
	
	// Recognize the element and compare its name to the specified name
	return this.recognizeElementName(node) === elementName;
};

/**
 * Checks that a node has only initial content.
 * 
 * @param {Node} node
 * @param {string} formatName
 * @param {string} elementName
 * @returns {boolean}
 */
domProcessor.prototype.nodeHasOnlyInitialContent = function(node, formatName, elementName)
{
	// If the format name is not specified, use the default format name
	if(formatName === undefined)
		formatName = this.defaultFormatName;
	
	// Recognize the element
	if(elementName === null || elementName === undefined)
	{
		elementName = this.recognizeElementName(node, formatName);
	}

	// Get the format by its name
	var format = this.elements[elementName].formats[formatName];

	// Клонируем элемент и нормализуем его для проверки содержимого
	var copyNode = $(node).clone().get(0);
	copyNode.normalize();

	// If the element requires an initial content and there's only it, the return true
	if($(copyNode).html() === format.initialContent || $(copyNode).children('br').length !== 0)
	{
		$(copyNode).remove();
		return true;
	}
	
	// Else return false
	$(copyNode).remove();
	return false;
};

/**
 * Ищет допустимого родителя для вставки domFragment
 * 
 * @param {Node} node - стартовые узел
 * @param {DomFragment} fragment - фрагмент
 * @param {Node} root - ограничительный узел
 * @returns {Node}
 */
domProcessor.prototype.findAllowedAncestorForFragment = function(node, fragment, root) 
{
	// Инициализация переменных
	var self = this, ancestor = node;
	
	// Запускаем цикл, до того как дойдем до огрничительного узла
	while(ancestor !== root)
	{
		// Проверяем, подходит ли все содержимое фрагмента для текущего родителя
		var accepting = true;
		$(fragment).contents().each(function() 
		{
			// Если хотя бы одно не подходит, ищем выше
			if(!self.isChildNameAllowedForElement(self.recognizeElementName(this), ancestor))
			{
				accepting = false;
			}
		});
		
		// Либо идем к следующему родителю, либо прерываем цикл
		if(!accepting)
			ancestor = ancestor.parentNode;
		else break;
	}
	
	// Возвращаем результат
	return ancestor;
};

/**
 * Возвращает все текстовые узлы любой вложенности в элементах
 * 
 * @param {Array} nodes
 * @returns {Array}
 */
domProcessor.prototype.getAllTextNodes = function(nodes) 
{
	// Инициализация переменных
	var textNodes = [], self = this;
	
	// Цикл по всем переданным узлам
	$(nodes).each(function() 
	{
		// Если текущий узел текстовый, сразу его добавляем в результат
		if(self.isTextNode(this))
			textNodes.push(this);
		else
		{
			// Рекурсивно вызываемая функция поиска текстовых узлов
			var getTextNodes = function(node)
			{
				var all = [];
				
				// Цикл по всем дочерным элементам, запускает рекурсию
				for(var current = node.firstChild; current; current = current.nextSibling)
				{
					if(current.nodeType === 3)
					{
						all.push(current);
					}
					else
					{
						all = all.concat(getTextNodes(current));
					}
				}

				return all;
			};
			
			// Результат скалдываем с результатом для других узлов
			textNodes = textNodes.concat(getTextNodes(this));
		}
	});
	
	// Возвращаем результат
	return textNodes;
};