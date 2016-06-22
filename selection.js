/**
 * Selection constructor
 */
function selection() { }

/*
 * Возвращает текущее выделение (оригинальный объект)
 * 
 * @returns {Selection}
 */
selection.prototype.getCurrentSelection = function()
{
	return rangy.getSelection();
};

/**
 * Возвращает текущую область выделения
 * 
 * @returns {Range}
 */
selection.prototype.getCurrentRange = function()
{
	// Берем первый диапазон в выделении
	return this.getCurrentSelection().getRangeAt(0);
};

/**
 * Устанавливает выделение по параметрам
 * 
 * @param {Node} startContainer - стартовый элемент
 * @param {number} startOffset - стартовое смещение
 * @param {Node} endContainer - конечный элемент
 * @param {number} endOffset - конечное смещение
 */
selection.prototype.setRange = function(
	startContainer, startOffset, 
	endContainer, endOffset
)
{ 
	// Получаем текущее выделение и меняем в нем параметры начала и конца
	var currentRange = this.getCurrentRange();
	currentRange.setStart(startContainer, startOffset);
	currentRange.setEnd(endContainer, endOffset);
	
	// Применяем изменения для текущего выделения 
	this.getCurrentSelection().setSingleRange(currentRange);
};

/**
 * Проверяет, содержит ли выделение узел (хотя бы частично)
 * 
 * @param {Node} node
 * @returns {boolean}
 */
selection.prototype.containsNode = function(node)
{
	return this.getCurrentRange().containsNode(node, true);
};

/**
 * Возвращает стартовый контейнер выделения
 * 
 * @returns {Node}
 */
selection.prototype.getStartContainer = function()
{
	return this.getCurrentRange().startContainer;
};

/**
 * Возвращает стартовое смещение выделения
 * 
 * @returns {number}
 */
selection.prototype.getStartOffset = function()
{
	return this.getCurrentRange().startOffset;
};

/**
 * Возвращает контейнер конца выделения
 * 
 * @returns {Node}
 */
selection.prototype.getEndContainer = function()
{
	return this.getCurrentRange().endContainer;
};

/**
 * Возвращает смещение конца выделения в контейнере
 * 
 * @returns {number}
 */
selection.prototype.getEndOffset = function()
{
	return this.getCurrentRange().endOffset;
};

/**
 * Gets a context node of a selection
 * 
 * @returns {Node} context
 */
selection.prototype.getContextNode = function()
{	
	// Get the range's container
	var container = this.getCurrentRange().commonAncestorContainer;
	
	// If the container is a text node, get its parent node
	if(container.nodeType === 3)
	{
		return container.parentNode;
	}
	
	return container;
};

/**
 * Удаляет содержимое выделения
 */
selection.prototype.deleteContents = function()
{
	this.getCurrentRange().deleteContents();
};

/**
 * Вырезает содержимое выделения, помещая его в domFragment
 * 
 * @returns {DomFragment}
 */
selection.prototype.extractContents = function()
{
	return this.getCurrentRange().extractContents();
};

/**
 * Клонирует содержимое выделения и помещает его в domFragment
 * 
 * @returns {DomFragment}
 */
selection.prototype.cloneContents = function()
{
	return this.getCurrentRange().cloneContents();
};

/**
 * Проверяет, сколлаписровано ли выделение
 * 
 * @returns {boolean}
 */
selection.prototype.isCollapsed = function()
{
	return this.getCurrentRange().collapsed;
};

/**
 * Обрезает края выделения (краевые тектовые узлы разрезаются по выделению)
 */
selection.prototype.splitBoundaries = function()
{
	this.getCurrentRange().splitBoundaries();
};

/**
 * Selects a specified element
 * 
 * @param {Node} node
 */
selection.prototype.selectNode = function(node) 
{
	var selfRange = this.getCurrentRange();
	selfRange.selectNodeContents(node);
	this.getCurrentSelection().setSingleRange(selfRange);
};

/**
 * Проверяет, содержит ли выделение все содержимое элемента
 * 
 * @param {Node} node
 * @returns {Boolean}
 */
selection.prototype.containsNodeText = function(node)
{
	return this.getCurrentRange().containsNodeText(node);
};

/**
 * Возвращает все целиком содержащиеся в выделении элементы
 * 
 * @returns {Array}
 */
selection.prototype.getSelectedNodes = function()
{
	var selfRange = this.getCurrentRange();
	
	// Получаем контейнер выделения, если он текстовый, значит берем родителя
	var ancestor = this.getContextNode();

	// If element is entirely selected
	if(this.containsNodeText(ancestor))
	{
		return [ancestor];
	}
	
	// Пользуясь библиотечной функцией getNodes получем список входящих 
	// в выделение узлов (только те которые полностью входят в выделение 
	// и еще только те которые не пустые)
	var allNodes = this.getNodes(
		false, 
		function(node) 
		{
			return selfRange.containsNodeText(node) && 
				/\S/.test(node.nodeValue);
		}
	);

	// Так как getNodes возвращает плоский списко из всех узлов разного уровня 
	// вложенности, мы делаем фильтрацию, что бы получить только первого уровня узлы
	var childNodes = [];
	for (var i = 0; i < allNodes.length; i++)
		if(allNodes[i].parentNode === ancestor)
			childNodes.push(allNodes[i]);
	
	return childNodes;
};

/**
 * Возвращает все содержащиейся в выделении элементы заданного типа с возможностью фильтрации
 * 
 * @param {Array} types - массив типов узлов
 * @param {Function} filter - функция-фильтр
 * @returns {Array}
 */
selection.prototype.getNodes = function(types, filter)
{
	// По-умолчанию типы - текстовые узлы
	if(types === undefined)
	{
		types = [3];
	}
	
	// Фильтр по-умолчанию - непустые узлы
	if(filter === undefined)
	{
		filter = function(node) 
		{
			return /\S/.test(node.nodeValue);
		}
	}
	
	// Пользуясь библиотечной функцией getNodes получем список входящих 
	// в выделение узлов (те которые непустые).
	return this.getCurrentRange().getNodes(types, filter);
};

/**
 *  Разрезаем элемент ancesеor по выделению
 *  
 * @param {Node} ancestor - родительский элемент, по которому разрезаем
 */
selection.prototype.splitNode = function(ancestor)
{
	// По-умолчанию ancestor - это контейнер выделения
	if(ancestor === undefined)
	{
		ancestor = this.getContextNode();
	}
	
	// Удаляем содержимое выделения
	this.deleteContents();
	
	var selfRange = this.getCurrentRange();
			
	// Берем последний подэлемент и ставим выделение после него
	var lastElement = $(ancestor).contents().last().get(0);
	selfRange.setEndAfter(lastElement);
	
	// Вырезаем то что выделено
	var rightPart = selfRange.extractContents();
	
	// И вставляем. Таким образом мы разрезали node
	if($(rightPart).contents().length > 0)
		selfRange.insertNode(rightPart);
	
	this.getCurrentSelection().setSingleRange(selfRange);
};

/**
 * Вставляем фрагмент в выделение
 * 
 * @param {DomFragment} fragment
 */
selection.prototype.insertFragment = function(fragment)
{
	var self = this;
	var currentRange = self.getCurrentRange();
	
	// Идем по всему содержимому фрагмента и вставляем по порядку
	$(fragment).contents().each(function() 
	{
		currentRange.insertNode(this);		
		currentRange.collapseAfter(this);
	});
};

/**
 * Возвращает тектовый узел, содержащий контекстное слово выделения
 * 
 * @returns {Node}
 */
selection.prototype.getContextWord = function() 
{	
	// Копируем выделение
	var currentRange = this.getCurrentRange().cloneRange();
	
	// Инициализация переменных
	var container = currentRange.startContainer, 
		collapsedOffset = currentRange.startOffset,
		valueLength = container.nodeValue.length;
	
	// Ищем первый пробел слева
	for (var i = collapsedOffset-1; i >= 0; i--)
		if(/\s/g.test(container.nodeValue.charAt(i)))
			break;
	
	// Ставим начало выделения туда
	currentRange.setStart(container, i+1);
	
	// Ищем первый пробел справа
	for (var i = collapsedOffset; i < valueLength; i++)
		if(/\s/g.test(container.nodeValue.charAt(i)))
			break;
	
	// Ставим конец выделения туда
	currentRange.setEnd(container, i);
	currentRange.splitBoundaries();
	
	// Возвращаем текстовый узел со словом
	return currentRange.getNodes(false)[0];
};