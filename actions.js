// Get configs of the actions and the buttuns
var actionsConfig = $.config("richedit.actions"),
	buttonsConfig = $.config("richedit.buttons");

// Set the callback to determine if the 'paragraph' action is disabled
actionsConfig.get("paragraph").disabled = function(richtext)
{
	return richtext.isOnlyElementSelected('paragraph');
};

// Set the callback to perform the 'paragraph' action
actionsConfig.get("paragraph").callback = function(richtext)
{
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Создаем элемент и вставляем его в виде фрагмента в выделение
		var paragraph = richtext.processor.buildElement('paragraph', document);
		richtext.insertFragment(paragraph.asFragment());
		
		// Выделяем новый вставленный элемент
		richtext.selection.selectNode(paragraph.node);
	}
	else
	{
		// Сохраняем абсолютные координаты
		var coordinates = richtext.getSelectionCoordinates();
		
		// Инициализация переменных
		var container = richtext.selection.getContextNode();
		var elements = [];
		
		// Вырезаем все содержимое выделение и оборачиваем его в абзацы
		$(richtext.selection.extractContents()).contents().each(function() 
		{	
			elements.push(richtext.processor.buildElement(
					'paragraph',
					document, 
					{content: this}
				).node
			);	
		});
		
		// Затем получившиеся абзацы вставляем в текущее выделение
		richtext.insertFragment($(document.createDocumentFragment()).append(elements));
		
		// Чистим и восстанавливаем выделение
		richtext.processor.sanitizeNode(container);
		richtext.restoreSelectionFromCoordinates(coordinates);
	}
};
 
// Set the callback to determine if the 'heading' button is pressed
buttonsConfig.get("heading").pressed = function(richtext)
{
	return richtext.isOnlyElementSelected('heading');
};

// Set the callback to perform the 'heading' action
actionsConfig.get("heading").callback = function(richtext)
{
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Создаем элемент и вставляем его в виде фрагмента в выделение
		var heading = richtext.processor.buildElement('heading', document);
		richtext.insertFragment(heading.asFragment());
		
		// Выделяем новый вставленный элемент
		richtext.selection.selectNode(heading.node);
	}
	else
	{
		// Сохраняем абсолютные координаты
		var coordinates = richtext.getSelectionCoordinates();
		
		// Инициализация переменных
		var container = richtext.selection.getContextNode();
		var elements = [];
		
		// Вырезаем все содержимое выделение и оборачиваем его в заголовки
		$(richtext.selection.extractContents()).contents().each(function() 
		{	
			elements.push(richtext.processor.buildElement(
					'heading',
					document, 
					{content: this}
				).node
			);	
		});
		
		// Затем получившиеся заголовки вставляем в текущее выделение
		richtext.insertFragment($(document.createDocumentFragment()).append(elements));
		
		// Чистим и восстанавливаем выделение
		richtext.processor.sanitizeNode(container);
		richtext.restoreSelectionFromCoordinates(coordinates);
	}
};

// Set the callback to determine if the 'bold' button is pressed
buttonsConfig.get("bold").pressed = function(richtext)
{		
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Проверяем находится ли текущий контейнер выделения внутри bold
		if(richtext.processor.nodeInsideElement(
			'boldEmphasis', richtext.selection.getContextNode(), 
			richtext.element)
		)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	// Получаем список всех текстовых узлов в выделение (несколлаписровано)
	var textNodes = richtext.selection.getNodes(),
		pressed = true;
	
	// Если текстовых узлов нет, кнопка не нажата
	if(textNodes.length === 0)
		return false;
	
	// Если хотя бы один текстовый узел не находится внутри bold, кнопка не нажата	
	$(textNodes).each(function() 
	{	
		if(!richtext.processor.nodeInsideElement('boldEmphasis', this, richtext.element))
		{
			pressed = false;
			return false;
		}
	});
	
	// Возвращаем результат
	return pressed;
};

// Set the callback to perform the 'bold' action
actionsConfig.get("bold").callback = function(richtext)
{	
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Сохраняем выделение
		var coordinates = richtext.getSelectionCoordinates();
		
		// Текущее слово оборачиваем в bold
		$(richtext.selection.getContextWord()).wrap(
			richtext.processor.buildElement('boldEmphasis', document).node
		);

		// Восстанавливаем выделение
		richtext.restoreSelectionFromCoordinates(coordinates);
	}
	
	// Получаем общего контейнера и обрезаем краевые элементы выделения
	var container = richtext.selection.getContextNode();
	richtext.selection.splitBoundaries();
	
	// Получаем список всех элементов выделения, которые могут быть внутри bold
	var nodes = richtext.selection.getNodes(false, 
		function(node)
		{
			return richtext.processor.isChildNameAllowedForElement(
				richtext.processor.recognizeElementName(node), undefined, 'boldEmphasis');
		}
	);
	
	// Оборачиваем все эти элементы в bold
	$(nodes).each(function() 
	{	
		$(this).wrap(richtext.processor.buildElement('boldEmphasis', document).node);
	});
	
	// Чистим
	richtext.processor.sanitizeNode(container);
};

// Set the callback to determine if the 'cursive' button is pressed
buttonsConfig.get("cursive").pressed = function(richtext)
{	
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Проверяем находится ли текущий контейнер выделения внутри cursive
		if(richtext.processor.nodeInsideElement(
			'cursiveEmphasis', richtext.selection.getContextNode(), 
			richtext.element)
		)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	// Получаем список всех текстовых узлов в выделение (несколлаписровано)
	var textNodes = richtext.selection.getNodes(),
		pressed = true;

	// Если текстовых узлов нет, кнопка не нажата
	if(textNodes.length === 0)
		return false;
	
	// Если хотя бы один текстовый узел не находится внутри cursive, кнопка не нажата	
	$(textNodes).each(function() 
	{	
		if(!richtext.processor.nodeInsideElement('cursiveEmphasis', this, richtext.element))
		{
			pressed = false;
			return false;
		}
	});
	
	// Возвращаем результат
	return pressed;
};

// Set the callback to perform the 'cursive' action
actionsConfig.get("cursive").callback = function(richtext)
{
	// Если выделение сколлапсировано
	if(richtext.selection.isCollapsed())
	{
		// Сохраняем выделение
		var coordinates = richtext.getSelectionCoordinates();
		
		// Текущее слово оборачиваем в cursive
		$(richtext.selection.getContextWord()).wrap(
			richtext.processor.buildElement('cursiveEmphasis', document).node
		);

		// Восстанавливаем выделение
		richtext.restoreSelectionFromCoordinates(coordinates);
	}
	
	// Получаем общего контейнера и обрезаем краевые элементы выделения
	var container = richtext.selection.getContextNode();
	richtext.selection.splitBoundaries();
	
	// Получаем список всех элементов выделения, которые могут быть внутри cursive
	var nodes = richtext.selection.getNodes(false, 
		function(node)
		{
			return richtext.processor.isChildNameAllowedForElement(
				richtext.processor.recognizeElementName(node), undefined, 'cursiveEmphasis');
		}
	);
	
	// Оборачиваем все эти элементы в cursive
	$(nodes).each(function() 
	{	
		$(this).wrap(richtext.processor.buildElement('cursiveEmphasis', document).node);
	});
	
	// Чистим
	richtext.processor.sanitizeNode(container);	
};
/*
// Set the callback to determine if the 'lowerSection' action is disabled
actionsConfig.get("lowerSection").disabled = function(richtext)
{	

};

// Set the callback to perform the 'lowerSection' action
actionsConfig.get("lowerSection").callback = function(richtext)
{		

};
*/