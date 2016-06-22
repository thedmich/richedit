<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:aml="http://www.bestyle.ru/standards/aml/">

	<xsl:variable name="richeditEnabled" select="boolean(//aml:text[@editable='true'])" />

	<xsl:template match="xsl:include[@href='richedit/richedit.xsl']" mode="links">
		<link rel="stylesheet" type="text/css" href="{$styleUrl}richedit/richedit.css" media="all"/>
	</xsl:template>

	<xsl:template match="xsl:include[@href='richedit/richedit.xsl']" mode="scripts">
		<script type="text/javascript" src="{$styleUrl}richedit/richtext.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/selection.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/domProcessor.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/config.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/actions.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/richedit.js"/>
		<script type="text/javascript" src="{$styleUrl}richedit/richtextElement.js"/>
	</xsl:template>


</xsl:stylesheet>