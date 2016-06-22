/**
 * Richtext element constructor
 * 
 * @param {Range} range
 */
function richtextElement(node, name)
{
	this.node = node;
	this.name = name;
}

richtextElement.prototype.node; // dom node
richtextElement.prototype.name; // element name

/**
 * Возвращает элемент, помещенный в domFragment
 * 
 * @returns {DomFragment}
 */
richtextElement.prototype.asFragment = function()
{
	return $(document.createDocumentFragment()).append(this.node);
}