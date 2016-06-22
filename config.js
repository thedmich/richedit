$.config('richedit').override(
	{
		actions:
		{
			paragraph:
			{
				caption: 'Copy'
			},
			heading:
			{
				caption: 'Heading'
			},
			/*raiseSection:
			{
				caption: 'Raise section'
			},
			lowerSection:
			{
				caption: 'Lower section'
			},
			list:
			{
				caption: 'Unordered list'
			},
			orderedList:
			{
				caption: 'Ordered list'
			},
			table:
			{
				caption: 'Table'
			},*/
			bold:
			{
				caption: 'Bold'
			},
			cursive:
			{
				caption: 'Cursive'
			}/*,
			link:
			{
				caption: 'Link'
			},
			newLine:
			{
				caption: 'New line'
			},
			cut:
			{
				caption: 'Copy'
			},
			copy:
			{
				caption: 'Copy'
			},
			paste:
			{
				caption: 'Paste'
			},
			undo:
			{
				caption: 'Undo'
			},
			redo:
			{
				caption: 'Redo'
			}*/
		},
		buttons:
		{
			paragraph:
			{
				caption: 'Paragraph',
				group: 'text',
				action: 'paragraph'
			},
			heading:
			{
				caption: 'Heading',
				group: 'text',
				action: 'heading'
			},/*
			raiseSection: {
				caption: 'Raise section',
				group: 'text',
				action: 'raiseSection',
			},
			lowerSection:
			{
				caption: 'Lower section',
				group: 'text',
				action: 'lowerSection'
			},
			unorderedList: {
				caption: 'Unordered list',
				group: 'lists',
				action: 'list',
				pressed: 'ul, ul > li'
			},
			orderedList: {
				caption: 'Ordered list',
				group: 'lists',
				action: 'orderedList',
				pressed: 'ol, ol > li'
			},
			table: {
				caption: 'Table',
				group: 'text',
				action: 'table',
				pressed: 'table *'
			},
			newLine: {
				caption: 'New line',
				group: 'text',
				action: 'newLine'
			},*/
			bold:
			{
				caption: 'Bold element',
				group: 'format',
				action: 'bold',
				pressed: 'b, b *'
			},
			cursive:
			{
				caption: 'Cursive element',
				group: 'format',
				action: 'cursive',
				pressed: 'i, i *'
			}/*,
			link: {
				caption: 'Link',
				action: 'link'
			},
			cut: {
				caption: 'Cut',
				group: 'main',
				action: 'cut'
			},
			copy: {
				caption: 'Copy',
				group: 'main',
				action: 'copy'
			},
			paste: {
				caption: 'Paste',
				group: 'main',
				action: 'paste'
			},
			undo: {
				caption: 'Undo',
				group: 'undo-redo',
				action: 'undo'
			},
			redo: {
				caption: 'Redo',
				group: 'undo-redo',
				action: 'redo'
			}*/
		},
		hotkeys:
		{
			bold:
			{
				shortcut: 'Ctrl+B',
				action: 'bold'
			}
		},
		formats:
		{
			aml:
			{
				namespace: 'http://www.bestyle.ru/standards/aml/',
				additionalNamespaces:
				{
					'lx': 'http://www.bestyle.ru/standards/LiveXML'
				},
				rootElement: 'document',
				whitespacesCleaningAllowed: true,
				emptyTagsRemovingAllowed: true,
				emptyTags: ['image'],
			},
			html:
			{
				namespace: 'http://www.w3.org/1999/xhtml',
				rootElement: 'html',
				emptyTagsRemovingAllowed: true,
				whitespacesCleaningAllowed: true,
				mergedNodes: ['b', 'i', 'div.section:not([aml\\:type])'],
				emptyTags: ['img', 'input', 'hr'],
				ignoredTags: ['tbody'],
			}
		},
		elements:
		{
			'heading':
			{
				formats:
				{
					aml:
					{
						tag: 'heading',
						selector: 'heading'
					},
					html:
					{
						tag: 'h6',
						attrs:
						{
							'type': 'heading',
							'class': 'heading'
						},
						selector: 'span[type="heading"],h1,h2,h3,h4,h5,h6',
						initialContent: '<br/>'
					}
				},
				allowedChilds:
				{
					elements: ["link", "boldEmphasis", 'cursiveEmphasis']
				}
			},
			'section':
			{
				formats:
				{
					aml:
					{
						tag: 'section'
					},
					html:
					{
						tag: 'div',
						attrs:
						{
							'class': 'section'
						},
						selector: 'div.section,div.contentContainer',
						initialContent: '<br/>'
					}
				},
				allowedChilds:
				{
					groups: ['section-content']
				}
			},
			'paragraph':
			{
				formats:
				{
					aml:
					{
						tag: 'paragraph'
					},
					html:
					{
						tag: 'p',
						initialContent: '<br/>'
					}
				},
				allowedChilds:
				{
					groups: ['paragraph-content']
				}
			},
			'link':
			{
				formats:
				{
					aml:
					{
						tag: 'link',
						attrs:
						{
							'uri': {htmlAttr: 'href'}
						}
					},
					html:
					{
						tag: 'a',
						attrs:
						{
							'href': {amlAttr: 'uri'}
						}
					}
				},
				allowedChilds:
				{
					elements: ['boldEmphasis', 'cursiveEmphasis', 'image']
				}
			},
			'dynamicLink':
			{
				formats:
				{
					aml:
					{
						tag: 'link',
						selector: 'link[dynamic="true"]',
						attrs:
						{
							dynamic: 'true',
							'uri': {htmlAttr: 'action'}
						}
					},
					html:
					{
						tag: 'form',
						attrs:
						{
							'action': {amlAttr: 'uri'}
						}
					}
				}
			},
			'interval':
			{
				formats:
				{
					aml:
					{
						tag: 'interval'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'interval'
						}
					}
				},
				allowedChilds:
				{
					elements: ['intervalBegin', 'intervalEnd']
				}
			},
			'intervalBegin':
			{
				formats:
				{
					aml:
					{
						tag: 'begin'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'intervalBegin'
						}
					}
				}
			},
			'intervalEnd':
			{
				formats:
				{
					aml:
					{
						tag: 'end'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'intervalEnd'
						}
					}
				}
			},
			'list':
			{
				formats:
				{
					aml:
					{
						tag: 'list'
					},
					html:
					{
						tag: 'ul',
						selector: 'ul',
						attrs:
						{
							'type' : 'unordered'
						}
					}
				},
				allowedChilds:
				{
					elements: ['listItem']
				}
			},
			'orderedList':
			{
				formats:
				{
					aml:
					{
						tag: 'list',
						attrs:
						{
							'type' : 'ordered'
						}
					},
					html:
					{
						tag: 'ol',
						selector: 'ol',
						attrs:
						{
							'type' : 'ordered'
						}
					}
				},
				allowedChilds:
				{
					elements: ['listItem']
				}
			},
			'listItem':
			{
				formats:
				{
					aml:
					{
						tag: 'item'
					},
					html:
					{
						tag: 'li',
						initialContent: '<br/>'
					}
				},
				allowedChilds:
				{
					groups: ['paragraph-content'],
					elements: ['paragraph']
				}
			},
			'table':
			{
				formats:
				{
					aml:
					{
						tag: 'table'
					},
					html:
					{
						tag: 'table'
					}
				},
				allowedChilds:
				{
					elements: ['tableRow']
				}
			},
			'tableRow':
			{
				formats:
				{
					aml:
					{
						tag: 'row'
					},
					html:
					{
						tag: 'tr'
					}
				},
				allowedChilds:
				{
					elements: ['tableCell']
				}
			},
			'tableCell':
			{
				formats:
				{
					aml:
					{
						tag: 'cell'
					},
					html:
					{
						tag: 'td',
						initialContent: '<br/>'
					}
				},
				allowedChilds:
				{
					groups: ['paragraph-content']
				}
			},
			'image':
			{
				formats:
				{
					aml:
					{
						tag: 'image',
						attrs:
						{
							'uri':
							{
								htmlAttr: 'src'
							}
						}
					},
					html:
					{
						tag: 'img',
						attrs:
						{
							'src':
							{
								amlAttr: 'uri'
							},
							'title':
							{
								amlAttr: 'title'
							}
						}
					}
				}
			},
			'string':
			{
				formats:
				{
					aml:
					{
						tag: 'string'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'string'
						}
					}
				},
				allowedChilds:
				{
					elements: ['boldEmphasis', 'cursiveEmphasis']
				}
			},
			'number':
			{
				formats:
				{
					aml:
					{
						tag: 'number'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'number'
						}
					}
				}
			},
			'text':
			{
				formats:
				{
					aml:
					{
						tag: 'text'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'text'
						}
					}
				},
				allowedChilds:
				{
					groups: ['section-content']
				}
			},
			'datetime':
			{
				formats:
				{
					aml:
					{
						tag: 'datetime'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'datetime'
						}
					}
				}
			},
			'address':
			{
				formats:
				{
					aml:
					{
						tag: 'address'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'address'
						}
					}
				}
			},
			'email':
			{
				formats:
				{
					aml:
					{
						tag: 'email'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'email'
						}
					}
				}
			},
			'phone':
			{
				formats:
				{
					aml:
					{
						tag: 'phone'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'phone'
						}
					}
				}
			},
			'price':
			{
				formats:
				{
					aml:
					{
						tag: 'price'
					},
					html:
					{
						tag: 'span',
						attrs:
						{
							'type': 'price'
						}
					}
				}
			},
			'boldEmphasis':
			{
				formats:
				{
					aml:
					{
						tag: 'emphasis',
						attrs:
						{
							'type': 'bold'
						}
					},
					html:
					{
						tag: 'b'
					}
				},
				allowedChilds:
				{
					elements: ['cursiveEmphasis']
				}
			},
			'cursiveEmphasis':
			{
				formats:
				{
					aml:
					{
						tag: 'emphasis',
						attrs:
						{
							'type': 'italic'
						}
					},
					html:
					{
						tag: 'i'
					}
				},
				allowedChilds:
				{
					elements: ['boldEmphasis']
				}
			}
		},
		elementGroups:
		{
			'section-content': [
				'heading',
				'section',
				'paragraph',
				'link',
				'dynamicLink',
				'interval',
				'list',
				'orderedList',
				'table',
				'image',
				'string',
				'number',
				'text',
				'datetime',
				'address',
				'email',
				'phone',
				'price',
				'boldEmphasis',
				'cursiveEmphasis'
			],
			'paragraph-content': [
				'image',
				'string',
				'number',
				'text',
				'datetime',
				'link',
				'list',
				'orderedList',
				'interval',
				'address',
				'email',
				'phone',
				'price',
				'boldEmphasis',
				'cursiveEmphasis'
			]
		},
		initialElement: 'paragraph'
	}
);
