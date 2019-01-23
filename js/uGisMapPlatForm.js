/**
 * UIT GIS OpenLayers 3 MapPlatForm
 * 
 * http://www.ugistech.net
 * 
 * Author : LeeJaeHyuk
 * 
 * Date : 2019.01.10
 */
( function(window, jQuery) {
	"use strict";

	if ( typeof jQuery === "undefined" ) {
		alert( "need a jQuery !" );
		return false;
	}

	window._$ = jQuery;
	window.ugmp = {
		version : "1.4.0",
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

	var srcPath = "/uGisMapPlatForm/js/src";
	var libFiles = [ 
		srcPath + "/uGisUtil/uGisUtil.js",
		srcPath + "/uGisUtil/uGisGeoSpatialUtil.js",

		srcPath + "/uGisConfig.js",
		srcPath + "/uGisHttp.js",
		srcPath + "/uGisMap.js",
		srcPath + "/uGisPopup.js",
		srcPath + "/uGisCapture.js",

		srcPath + "/olPrototype/layer/vector.js",
		srcPath + "/olPrototype/interaction/mouseWheelZoom.js",

		srcPath + "/uGisService/filterDwithin.js",
		srcPath + "/uGisService/uGisGetFeature.js",
		srcPath + "/uGisService/uGisDescribeFeatureType.js",
		
		srcPath + "/uGisService/getCapabilities/uGisGetCapabilitiesDefault.js",
		srcPath + "/uGisService/getCapabilities/uGisGetCapabilitiesWMS.js",
		srcPath + "/uGisService/getCapabilities/uGisGetCapabilitiesWFS.js",
		srcPath + "/uGisService/getCapabilities/uGisGetCapabilitiesWCS.js",
		srcPath + "/uGisService/getCapabilities/uGisGetCapabilitiesWMTS.js",

		srcPath + "/uGisLayer/uGisLayerDefault.js",
		srcPath + "/uGisLayer/uGisWMSLayer.js",
		srcPath + "/uGisLayer/uGisWFSLayer.js",
		srcPath + "/uGisLayer/uGisWCSLayer.js",
		srcPath + "/uGisLayer/uGisWMTSLayer.js",
		srcPath + "/uGisLayer/uGisVectorLayer.js",
		srcPath + "/uGisLayer/uGisClusterLayer.js",

		srcPath + "/uGisTOC/uGisTocDefault.js",
		srcPath + "/uGisTOC/uGisWMSToc.js",
		srcPath + "/uGisTOC/uGisWebWMSToc.js",
		srcPath + "/uGisTOC/uGisWFSToc.js",
		srcPath + "/uGisTOC/uGisWCSToc.js",
		srcPath + "/uGisTOC/uGisWMTSToc.js",

		srcPath + "/uGisBaseMap/uGisBaseMapDefault.js",
		srcPath + "/uGisBaseMap/uGisBaseMapOSM.js",
		srcPath + "/uGisBaseMap/uGisBaseMapDaum.js",
		srcPath + "/uGisBaseMap/uGisBaseMapNaver.js",
		srcPath + "/uGisBaseMap/uGisBaseMapVWorld.js",
		srcPath + "/uGisBaseMap/uGisBaseMapBaroEmap.js",
		srcPath + "/uGisBaseMap/uGisBaseMapStamen.js",
		srcPath + "/uGisBaseMap/uGisBaseMapGoogle.js",
		srcPath + "/uGisBaseMap/uGisBaseMapCustom.js",
		srcPath + "/uGisBaseMap/uGisBaseMap.js",

		srcPath + "/uGisAnimation/animation/featureAnimationDefault.js",
		srcPath + "/uGisAnimation/animation/showAnimation.js",
		srcPath + "/uGisAnimation/animation/zoomInAnimation.js",
		srcPath + "/uGisAnimation/animation/zoomOutAnimation.js",
		srcPath + "/uGisAnimation/animation/teleportAnimation.js",
		srcPath + "/uGisAnimation/animation/bounceAnimation.js",
		srcPath + "/uGisAnimation/animation/dropAnimation.js",
		srcPath + "/uGisAnimation/animation/lineDashMoveAnimation.js",
		srcPath + "/uGisAnimation/animation/lineGradientAnimation.js",
		srcPath + "/uGisAnimation/shape/uGisShapeAnimationDefault.js",
		srcPath + "/uGisAnimation/shape/uGisCircleAnimation.js",
		srcPath + "/uGisAnimation/shape/uGisRegularShapeAnimation.js",
		srcPath + "/uGisAnimation/shape/uGisLineAnimation.js",
		srcPath + "/uGisAnimation/shape/uGisPolygonAnimation.js",
		srcPath + "/uGisAnimation/shape/uGisLineGradientAnimation.js",

		srcPath + "/uGisControl/uGisControlDefault.js",
		srcPath + "/uGisControl/uGisDragPan.js",
		srcPath + "/uGisControl/uGisMapClick.js",
		srcPath + "/uGisControl/uGisDragZoomIn.js",
		srcPath + "/uGisControl/uGisDragZoomOut.js",
		srcPath + "/uGisControl/uGisDrawFeature.js",
		srcPath + "/uGisControl/uGisMeasureDefault.js",
		srcPath + "/uGisControl/uGisLengthMeasure.js",
		srcPath + "/uGisControl/uGisAreaMeasure.js",

		srcPath + "/uGisManager/uGisLayerManager.js",
		srcPath + "/uGisManager/uGisControlManager.js"
	];

	_$.holdReady( true );

	var arrDeferred = [];

	( function getScriptLoop(index_) {
		if ( index_ < libFiles.length ) {
			var scriptDef = _$.getScript( contextPath + "/" + libFiles[ index_ ] );

			arrDeferred.push( scriptDef );

			scriptDef.then( function(res) {
				getScriptLoop( index_ + 1 );
			} );
		} else {
			window.ugmp.promise = _$.when.apply( _$, arrDeferred ).then( function() {

			} ).then( function() {
				_$.holdReady( false );
				window.uGisMapPlatForm = window.ugmp;
			} );
		}
	} )( 0 );

} )( window, jQuery );
