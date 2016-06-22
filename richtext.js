/**
 * Constructs a new richtext object
 *
 * @param {Node} element
 * @param {domProcessor} processor
 * @param {string} initialElement
 */
function richtext(element, processor, initialElement)
{
	// Call the inherited constructor
	control.prototype.constructor.call(this, element);

	// Set the control type
	this.setType('richtext');
	
	// Init the element and the processor properties
	this.processor = processor;

	// Focus the element
	$(this.element).focus();
	
	this.selection = new selection();
	
	// If the element is empty, add the initial element
	if(this.isEmpty())
	{
		var element = this.processor.buildElement(initialElement, document);
		$(this.element).append(element.node);
		//this.selectNode(element);
	}
};

// Mix the 'control' class methods into the 'richtext' class
mixin(richtext, control);

// Properties
richtext.prototype.processor; // DOM processor object
richtext.prototype.selection; // DOM processor object

/**
 * Gets the selection
 * 
 * @returns {selection}
 */
richtext.prototype.getSelection = function() 
{
	// If we can't get selection, throw an error
	if(rangy.getSelection === undefined)
	{
		throw new Error("No selection");
	}
	
	// Get the selection
	var selection = rangy.getSelection();

	// Check that the selection is in the current richedit
	if($(selection.anchorNode).parents().andSelf().index(this.element) === -1)
	{
		throw new Error("Wrong selection");
	}
	
	return selection;
};

/**
 * Checks if a richtext is empty
 * 
 * @returns {boolean}
 */
richtext.prototype.isEmpty = function() 
{
	// Check using the DOM processor
	return this.processor.isNodeEmpty(this.element);
};

/**
 * Gets richedit contents as an AML
 * 
 * @returns {string}
 */
richtext.prototype.asAml = function() 
{
	// Transform the richtext HTML contents to AML format using the DOM processor
	var aml = this.processor.transform(
		this.element,
		{sourceFormatName: 'html', dstFormatName: 'aml', preserveAttributes: false}
	);
	
	// Sanitize the AML
	this.processor.sanitizeNode(aml, 'aml', 'section');

	// Convert the AML to string and return it
	return xmlToString(aml);
};

/**
 * Проверяет что выделен какой то конктретный элемент (только он один)
 * 
 * @param {string} elementName
 * @returns {boolean}
 */
richtext.prototype.isOnlyElementSelected = function(elementName) 
{	
	// Получаем список выделенных элементов
	var selectedNodes = this.selection.getSelectedNodes();
	
	// Если выделен только один элемент
	if(selectedNodes.length === 1)
	{ 
		// Делаем проверку, является ли он 
		// (или его родитель, если в родителе больше ничего нет)
		// требуемым элементом
		var ancestor = selectedNodes[0];
		while(this.selection.containsNodeText(ancestor))
		{
			// Если проверку проходит, возвращаем положительный результат
			if(this.processor.nodeIsElement(ancestor, elementName))
			{
				return true;
			}
			ancestor = ancestor.parentNode;
		}
	}
	
	// Отрицательный результат, если проверка не прошла
	return false;
};

/**
 * Вставляет domFragment в текущее выделение ричтекста
 * 
 * @param {domFragment} fragment
 */
richtext.prototype.insertFragment = function(fragment)
{
	// Ищем у выделения допустимый для вставки фрагмента родительский элемент
	var ancestor = this.processor.findAllowedAncestorForFragment(
		this.selection.getContextNode(),
		fragment,
		this.element
	);
	
	// Удалеяем содержимое выделения и разрезаем элемент до найденного родителя
	this.selection.deleteContents();
	this.selection.splitNode(ancestor);
	
	// Вставляем фрагмент
	this.selection.insertFragment(fragment);
};

/**
 * Возвращает абсолютные координаты выделения в текстовом содержимом
 * 
 * @returns {array}
 */
richtext.prototype.getSelectionCoordinates = function() 
{
	// Получаем все текстовые узлы ричтекста
	var allTextNodes = this.processor.getAllTextNodes(this.element);
	
	// Получаем все текстовые узлы выделения
	var rangeTextNodes = this.selection.getNodes();
	
	// Если выделение сколлаисровано - текстовый узел будет контейнер выделения
	if(this.selection.isCollapsed())
	{
		rangeTextNodes = [this.selection.getContextNode()];
	}
	
	// Утилитарная функция для подсчета количества букв 
	// до какого-то элемента (определяется индексом)
	var countLengthBeforeIndex = function(index)
	{
		// Циклом проходи все элементы до индекса
		var count = 0;
		for(var i = 0; i < index; i++)
		{
			// И складываем количество букв
			count += allTextNodes[i].length;
		}
		
		return count;
	};
	
	// Определяем стартовый и конечный текстовые узлы выделения и их индексы
	var startIndex = $(allTextNodes).index($(rangeTextNodes[0]));
	var endIndex = $(allTextNodes).index($(rangeTextNodes[rangeTextNodes.length - 1]));
	
	// Вычисляем по идексам смещение в буквах до элементов 
	// и прибавляем смещений внутри этих элементов. Таким образом получаем результат
	return [countLengthBeforeIndex(startIndex) + this.selection.getStartOffset(), 
			countLengthBeforeIndex(endIndex) + this.selection.getEndOffset()];
};

/**
 * Восстанавливает выделение по координатам
 * 
 * @param {array} coordinates
 */
richtext.prototype.restoreSelectionFromCoordinates = function(coordinates)
{
	// Получаем все текстовые узлы ричтекста
	var allTextNodes = this.processor.getAllTextNodes(this.element);
	
	// Инициализация переменных
	var startContainer, startOffset, endContainer, endOffset, count = 0;

	// В цикле идем по всем узлам ричтекста
	for(var i = 0; i < allTextNodes.length; i++)
	{
		// Если текущий узел попадает под координаты начала выделения
		if((count + allTextNodes[i].length) >= coordinates[0] && 
			startContainer === undefined
		)
		{
			// Делаем его началом выделения и вычисляем смещение
			startContainer = allTextNodes[i];
			startOffset = coordinates[0] - count;
		}
		
		// Если текущий узел попадает под координаты конца выделения
		if((count + allTextNodes[i].length) >= coordinates[1] && 
			endContainer === undefined
		)
		{
			// Делаем его концом выделения и вычисляем смещение
			endContainer = allTextNodes[i];
			endOffset = coordinates[1] - count;
		}
		
		// Наращиваем счетчик смещения
		count += allTextNodes[i].length;
	}
	
	// Устанавливаем текущее выделение
	this.selection.setRange(startContainer, startOffset, endContainer, endOffset);
};

/**
 * Evaluate a rule
 *
 * @param {mixed} rule Can be passed as string, boolean or function.
 * @returns {boolean}
 */
richtext.prototype.testRule = function(rule)
{
	var self = this;
	
	if(rule === undefined)
		return false;
	
	// Calculate result based on parameter type
	switch(typeof(rule))
	{
		// Interprete string as a selector in the current context
		case 'string':
			// Get the context node for the current selection
			var contextNode = self.selection.getContextNode();

			// Check if the context node matches the selector
			return self.processor.elementsMatchSelector(contextNode, rule);
		
		// Interprete boolean as ready value
		case 'boolean':
			return rule;
		
		// Interprete function as a callback
		case 'function':
			return rule(self);

		// При неизвестном типе выбрасываем исключение
		default: 
			throw new Error("Unknown rule type")
	}
};