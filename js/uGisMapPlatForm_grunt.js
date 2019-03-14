/**
 * UIT GIS OpenLayers 3 MapPlatForm
 * 
 * http://www.ugistech.net
 * 
 * Author : LeeJaeHyuk
 * 
 * Date : 2019.03.14
 */
( function(window, jQuery) {
	"use strict";

	if ( typeof jQuery === "undefined" ) {
		alert( "need for jQuery !" );
		return false;
	}

	window._$ = jQuery;
	window.ugmp = {
		version : "1.4.1",
		toc : {},
		util : {},
		layer : {},
		control : {},
		service : {},
		manager : {},
		baseMap : {},
		animation : {}
	};

	var hostIndex = location.href.indexOf( location.host ) + location.host.length;
	var contextPath = location.href.substring( hostIndex, location.href.indexOf( '/', hostIndex + 1 ) );

	window.ugmp.contextPath = contextPath;

	_$( document ).ready( function() {
		window.uGisMapPlatForm = window.ugmp;
	} );

} )( window, jQuery );
