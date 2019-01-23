( function() {
	'use strict';

	var UGIS_PROP = UGIS_PROP || {};

	var root = '/uGisMapPlatForm';
	var hostIndex = location.href.indexOf( location.host ) + location.host.length;
	var contextPath = location.href.substring( hostIndex, location.href.indexOf( '/', hostIndex + 1 ) );
	root = contextPath + root;

	var imagesPath = 'resources/images/';

	UGIS_PROP.OBJECT = {
		CONFIG : {
			name : 'uGisConfig',
			link_api : root + '/apidoc/ugmp.uGisConfig.html',
			object : 'ugmp.uGisConfig'
		},
		HTTP : {
			name : 'uGisHttp',
			link_api : root + '/apidoc/ugmp.uGisHttp.html',
			object : 'ugmp.uGisHttp'
		},
		MAP : {
			name : 'uGisMap',
			link_api : root + '/apidoc/ugmp.uGisMap.html',
			object : 'ugmp.uGisMap'
		},
		POPUP : {
			name : 'uGisPopup',
			link_api : root + '/apidoc/ugmp.uGisPopup.html',
			object : 'ugmp.uGisPopup'
		},
		CAPTURE : {
			name : 'uGisCapture',
			link_api : root + '/apidoc/ugmp.uGisCapture.html',
			object : 'ugmp.uGisCapture'
		},

		SERVICE : {
			CAPABILITIES : {
				DEFAULT : {
					name : 'uGisGetCapabilitiesDefault',
					link_api : root + '/apidoc/ugmp.service.uGisGetCapabilitiesDefault.html',
					object : 'ugmp.service.uGisGetCapabilitiesDefault'
				},
				WMS : {
					name : 'uGisGetCapabilitiesWMS',
					link_api : root + '/apidoc/ugmp.service.uGisGetCapabilitiesWMS.html',
					object : 'ugmp.service.uGisGetCapabilitiesWMS'
				},
				WFS : {
					name : 'uGisGetCapabilitiesWFS',
					link_api : root + '/apidoc/ugmp.service.uGisGetCapabilitiesWFS.html',
					object : 'ugmp.service.uGisGetCapabilitiesWFS'
				},
				WCS : {
					name : 'uGisGetCapabilitiesWCS',
					link_api : root + '/apidoc/ugmp.service.uGisGetCapabilitiesWCS.html',
					object : 'ugmp.service.uGisGetCapabilitiesWCS'
				},
				WMTS : {
					name : 'uGisGetCapabilitiesWMTS',
					link_api : root + '/apidoc/ugmp.service.uGisGetCapabilitiesWMTS.html',
					object : 'ugmp.service.uGisGetCapabilitiesWMTS'
				},
			},
			DESCRIBEFEATURETYPE : {
				name : 'uGisDescribeFeatureType',
				link_api : root + '/apidoc/ugmp.service.uGisDescribeFeatureType.html',
				object : 'ugmp.service.uGisDescribeFeatureType'
			},
			GETFEATURE : {
				name : 'uGisGetFeature',
				link_api : root + '/apidoc/ugmp.service.uGisGetFeature.html',
				object : 'ugmp.service.uGisGetFeature'
			}
		},

		LAYER : {
			DEFAULT : {
				name : 'uGisLayerDefault',
				link_api : root + '/apidoc/ugmp.layer.uGisLayerDefault.html',
				object : 'ugmp.layer.uGisLayerDefault'
			},
			WMS : {
				name : 'uGisWMSLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisWMSLayer.html',
				object : 'ugmp.layer.uGisWMSLayer'
			},
			WFS : {
				name : 'uGisWFSLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisWFSLayer.html',
				object : 'ugmp.layer.uGisWFSLayer'
			},
			WCS : {
				name : 'uGisWCSLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisWCSLayer.html',
				object : 'ugmp.layer.uGisWCSLayer'
			},
			WMTS : {
				name : 'uGisWMTSLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisWMTSLayer.html',
				object : 'ugmp.layer.uGisWMTSLayer'
			},
			VECTOR : {
				name : 'uGisVectorLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisVectorLayer.html',
				object : 'ugmp.layer.uGisVectorLayer'
			},
			CLUSTER : {
				name : 'uGisClusterLayer',
				link_api : root + '/apidoc/ugmp.layer.uGisClusterLayer.html',
				object : 'ugmp.layer.uGisClusterLayer'
			}
		},

		TOC : {
			DEFAULT : {
				name : 'uGisTocDefault',
				link_api : root + '/apidoc/ugmp.toc.uGisTocDefault.html',
				object : 'ugmp.toc.uGisTocDefault'
			},
			WMS : {
				name : 'uGisWMSToc',
				link_api : root + '/apidoc/ugmp.toc.uGisWMSToc.html',
				object : 'ugmp.toc.uGisWMSToc'
			},
			WEBWMS : {
				name : 'uGisWebWMSToc',
				link_api : root + '/apidoc/ugmp.toc.uGisWebWMSToc.html',
				object : 'ugmp.toc.uGisWebWMSToc'
			},
			WFS : {
				name : 'uGisWFSToc',
				link_api : root + '/apidoc/ugmp.toc.uGisWFSToc.html',
				object : 'ugmp.toc.uGisWFSToc'
			},
			WMTS : {
				name : 'uGisWMTSToc',
				link_api : root + '/apidoc/ugmp.toc.uGisWMTSToc.html',
				object : 'ugmp.toc.uGisWMTSToc'
			}
		},

		BASEMAP : {
			DEFAULT : {
				name : 'uGisBaseMapDefault',
				link_api : root + '/apidoc/ugmp.baseMap.uGisBaseMapDefault.html',
				object : 'ugmp.baseMap.uGisBaseMapDefault'
			},
			BASEMAP : {
				name : 'uGisBaseMap',
				link_api : root + '/apidoc/ugmp.baseMap.uGisBaseMap.html',
				object : 'ugmp.baseMap.uGisBaseMap'
			},
			CUSTOM : {
				name : 'uGisBaseMapCustom',
				link_api : root + '/apidoc/ugmp.baseMap.uGisBaseMapCustom.html',
				object : 'ugmp.baseMap.uGisBaseMapCustom'
			}
		},

		CONTROL : {
			DEFAULT : {
				name : 'uGisControlDefault',
				link_api : root + '/apidoc/ugmp.control.uGisControlDefault.html',
				object : 'ugmp.control.uGisControlDefault'
			},
			DRAGPAN : {
				name : 'uGisDragPan',
				link_api : root + '/apidoc/ugmp.control.uGisDragPan.html',
				object : 'ugmp.control.uGisDragPan'
			},
			ZOOMIN : {
				name : 'uGisDragZoomIn',
				link_api : root + '/apidoc/ugmp.control.uGisDragZoomIn.html',
				object : 'ugmp.control.uGisDragZoomIn'
			},
			ZOOMOUT : {
				name : 'uGisDragZoomOut',
				link_api : root + '/apidoc/ugmp.control.uGisDragZoomOut.html',
				object : 'ugmp.control.uGisDragZoomOut'
			},
			DRAWFEATURE : {
				name : 'uGisDrawFeature',
				link_api : root + '/apidoc/ugmp.control.uGisDrawFeature.html',
				object : 'ugmp.control.uGisDrawFeature'
			},
			MEASURE_DEFAULT : {
				name : 'uGisMeasureDefault',
				link_api : root + '/apidoc/ugmp.control.uGisMeasureDefault.html',
				object : 'ugmp.control.uGisMeasureDefault'
			},
			LENGTH : {
				name : 'uGisLengthMeasure',
				link_api : root + '/apidoc/ugmp.control.uGisLengthMeasure.html',
				object : 'ugmp.control.uGisLengthMeasure'
			},
			AREA : {
				name : 'uGisAreaMeasure',
				link_api : root + '/apidoc/ugmp.control.uGisAreaMeasure.html',
				object : 'ugmp.control.uGisAreaMeasure'
			}
		},

		MANAGER : {
			CONTROL : {
				name : 'uGisControlManager',
				link_api : root + '/apidoc/ugmp.manager.uGisControlManager.html',
				object : 'ugmp.manager.uGisControlManager'
			},

			LAYER : {
				name : 'uGisLayerManager',
				link_api : root + '/apidoc/ugmp.manager.uGisLayerManager.html',
				object : 'ugmp.manager.uGisLayerManager'
			}
		},

		ANIMATION : {
			DEFAULT : {
				name : 'featureAnimationDefault',
				link_api : root + '/apidoc/ugmp.animation.featureAnimationDefault.html',
				object : 'ugmp.animation.featureAnimationDefault'
			},
			BOUNCE : {
				name : 'bounceAnimation',
				link_api : root + '/apidoc/ugmp.animation.bounceAnimation.html',
				object : 'ugmp.animation.bounceAnimation'
			},
			DROP : {
				name : 'dropAnimation',
				link_api : root + '/apidoc/ugmp.animation.dropAnimation.html',
				object : 'ugmp.animation.dropAnimation'
			},
			SHOW : {
				name : 'showAnimation',
				link_api : root + '/apidoc/ugmp.animation.showAnimation.html',
				object : 'ugmp.animation.showAnimation'
			},
			TELEPORT : {
				name : 'teleportAnimation',
				link_api : root + '/apidoc/ugmp.animation.teleportAnimation.html',
				object : 'ugmp.animation.teleportAnimation'
			},
			ZOOMIN : {
				name : 'zoomInAnimation',
				link_api : root + '/apidoc/ugmp.animation.zoomInAnimation.html',
				object : 'ugmp.animation.zoomInAnimation'
			},
			ZOOMOUT : {
				name : 'zoomOutAnimation',
				link_api : root + '/apidoc/ugmp.animation.zoomOutAnimation.html',
				object : 'ugmp.animation.zoomOutAnimation'
			},
			LINEDASH : {
				name : 'lineDashMoveAnimation',
				link_api : root + '/apidoc/ugmp.animation.lineDashMoveAnimation.html',
				object : 'ugmp.animation.lineDashMoveAnimation'
			},
			LINEGRADIENT : {
				name : 'lineGradientAnimation',
				link_api : root + '/apidoc/ugmp.animation.lineGradientAnimation.html',
				object : 'ugmp.animation.lineGradientAnimation'
			},
			UGISLINEGRADIENT : {
				name : 'uGisLineGradientAnimation',
				link_api : root + '/apidoc/ugmp.animation.uGisLineGradientAnimation.html',
				object : 'ugmp.animation.uGisLineGradientAnimation'
			},
			SHAPE_DEFAULT : {
				name : 'uGisShapeAnimationDefault',
				link_api : root + '/apidoc/ugmp.animation.uGisShapeAnimationDefault.html',
				object : 'ugmp.animation.uGisShapeAnimationDefault'
			},
			CIRCLE : {
				name : 'uGisCircleAnimation',
				link_api : root + '/apidoc/ugmp.animation.uGisCircleAnimation.html',
				object : 'ugmp.animation.uGisCircleAnimation'
			},
			LINE : {
				name : 'uGisLineAnimation',
				link_api : root + '/apidoc/ugmp.animation.uGisLineAnimation.html',
				object : 'ugmp.animation.uGisLineAnimation'
			},
			POLYGON : {
				name : 'uGisPolygonAnimation',
				link_api : root + '/apidoc/ugmp.animation.uGisPolygonAnimation.html',
				object : 'ugmp.animation.uGisPolygonAnimation'
			},
			REGULAR : {
				name : 'uGisRegularShapeAnimation',
				link_api : root + '/apidoc/ugmp.animation.uGisRegularShapeAnimation.html',
				object : 'ugmp.animation.uGisRegularShapeAnimation'
			},
		},

		UTIL : {
			UTIL : {
				name : 'uGisUtil',
				link_api : root + '/apidoc/ugmp.util.uGisUtil.html',
				object : 'ugmp.util.uGisUtil'
			},
			GEOUTIL : {
				name : 'uGisGeoSpatialUtil',
				link_api : root + '/apidoc/ugmp.util.uGisGeoSpatialUtil.html',
				object : 'ugmp.util.uGisGeoSpatialUtil'
			}
		},
	};

	var PO = UGIS_PROP.OBJECT;

	UGIS_PROP.EXAMPLE = {
		BASIC : {
			HTTP : {
				name : 'HTTP',
				title : 'uGisHttp - HTTP 통신',
				desc : 'HTTP 통신(ajax)',
				link_code : root + '/examples/basic/uGisHttp.html',
				link_view : root + '/examples/basic/uGisHttp_view.html',
				img : imagesPath + 'basic/uGisHttp.jpg',
				requires : [ PO.HTTP ]
			},
			MAP : {
				name : 'MAP',
				title : 'uGisMap - 지도',
				desc : '지도를 생성한다.',
				link_code : root + '/examples/basic/uGisMap.html',
				link_view : root + '/examples/basic/uGisMap_view.html',
				img : imagesPath + 'basic/uGisMap.jpg',
				requires : [ PO.CONFIG, PO.MAP ]
			},
			POPUP : {
				name : 'POPUP',
				title : 'uGisPopup - 팝업',
				desc : '팝업을 생성하고 지도에 표현한다.',
				link_code : root + '/examples/basic/uGisPopup.html',
				link_view : root + '/examples/basic/uGisPopup_view.html',
				img : imagesPath + 'basic/uGisPopup.jpg',
				requires : [ PO.CONFIG, PO.MAP, PO.POPUP ]
			},
			WHEELZOOM : {
				name : 'WHEELZOOM',
				title : 'MouseWheelZoom AltKeyOnly',
				desc : '마우스 휠로 지도 줌 레벨 조절 시 AltKey 조합을 설정한다.',
				link_code : root + '/examples/basic/wheelZoomAltKeyOnly.html',
				link_view : root + '/examples/basic/wheelZoomAltKeyOnly_view.html',
				img : imagesPath + 'basic/scroll.jpg',
				requires : [ PO.CONFIG, PO.MAP ]
			}
		},

		SERVICE : {
			CAPABILITIES : {
				WMS : {
					name : 'CAPABILITIES_WMS',
					title : 'uGisGetCapabilitiesWMS - WMS GetCapabilities 서비스',
					desc : 'WMS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWMS.html',
					link_view : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWMS_view.html',
					img : imagesPath + 'basic/uGisHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WMS ]
				},
				WFS : {
					name : 'CAPABILITIES_WFS',
					title : 'uGisGetCapabilitiesWFS - WFS GetCapabilities 서비스',
					desc : 'WFS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWFS.html',
					link_view : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWFS_view.html',
					img : imagesPath + 'basic/uGisHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WFS ]
				},
				WCS : {
					name : 'CAPABILITIES_WCS',
					title : 'uGisGetCapabilitiesWCS - WCS GetCapabilities 서비스',
					desc : 'WCS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWCS.html',
					link_view : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWCS_view.html',
					img : imagesPath + 'basic/uGisHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WCS ]
				},
				WMTS : {
					name : 'CAPABILITIES_WMTS',
					title : 'uGisGetCapabilitiesWMTS - WMTS GetCapabilities 서비스',
					desc : 'WMTS GetCapabilities 서비스를 요청한다.',
					link_code : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWMTS.html',
					link_view : root + '/examples/service/getCapabilities/uGisGetCapabilitiesWMTS_view.html',
					img : imagesPath + 'basic/uGisHttp.jpg',
					requires : [ PO.SERVICE.CAPABILITIES.WMTS ]
				},
			},
			DESCRIBEFEATURETYPE : {
				name : 'DESCRIBEFEATURETYPE',
				title : 'uGisDescribeFeatureType - DescribeFeatureType 서비스',
				desc : 'WFS uGisDescribeFeatureType 서비스를 요청한다.',
				link_code : root + '/examples/service/uGisDescribeFeatureType.html',
				link_view : root + '/examples/service/uGisDescribeFeatureType_view.html',
				img : imagesPath + 'basic/uGisHttp.jpg',
				requires : [ PO.SERVICE.DESCRIBEFEATURETYPE ]
			},
			GETFEATURE : {
				name : 'GETFEATURE',
				title : 'uGisGetFeature - uGisGetFeature 서비스',
				desc : 'WFS GetFeature 서비스를 요청한다.',
				link_code : root + '/examples/service/uGisGetFeature.html',
				link_view : root + '/examples/service/uGisGetFeature_view.html',
				img : imagesPath + 'basic/uGisGetFeature.jpg',
				requires : [ PO.SERVICE.GETFEATURE ]
			}
		},

		LAYER : {
			WMS : {
				name : 'WMS',
				title : 'uGisWMSLayer - WMS 레이어',
				desc : 'WMS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisWMSLayer.html',
				link_view : root + '/examples/layer/uGisWMSLayer_view.html',
				img : imagesPath + 'layer/uGisWMSLayer.jpg',
				requires : [ PO.LAYER.WMS ]
			},
			WFS : {
				name : 'WFS',
				title : 'uGisWFSLayer - WFS 레이어',
				desc : 'WFS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisWFSLayer.html',
				link_view : root + '/examples/layer/uGisWFSLayer_view.html',
				img : imagesPath + 'layer/uGisWFSLayer.jpg',
				requires : [ PO.LAYER.WFS ]
			},
			WCS : {
				name : 'WCS',
				title : 'uGisWCSLayer - WCS 레이어',
				desc : 'WCS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisWCSLayer.html',
				link_view : root + '/examples/layer/uGisWCSLayer_view.html',
				img : imagesPath + 'layer/uGisWCSLayer.jpg',
				requires : [ PO.LAYER.WCS ]
			},
			WMTS : {
				name : 'WMTS',
				title : 'uGisWMTSLayer - WMTS 레이어',
				desc : 'WMTS 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisWMTSLayer.html',
				link_view : root + '/examples/layer/uGisWMTSLayer_view.html',
				img : imagesPath + 'layer/uGisWMTSLayer.jpg',
				requires : [ PO.LAYER.WMTS ]
			},
			VECTOR : {
				name : 'VECTOR',
				title : 'uGisVectorLayer - Vector 레이어',
				desc : 'Vector 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisVectorLayer.html',
				link_view : root + '/examples/layer/uGisVectorLayer_view.html',
				img : imagesPath + 'layer/uGisVectorLayer.jpg',
				requires : [ PO.LAYER.VECTOR ]
			},
			CLUSTER : {
				name : 'CLUSTER',
				title : 'uGisClusterLayer - Cluster 레이어',
				desc : 'Cluster 레이어를 생성하고, 지도에 표현한다.',
				link_code : root + '/examples/layer/uGisClusterLayer.html',
				link_view : root + '/examples/layer/uGisClusterLayer_view.html',
				img : imagesPath + 'layer/uGisClusterLayer.jpg',
				requires : [ PO.LAYER.CLUSTER ]
			}
		},

		TOC : {
			WMS : {
				name : 'WMS',
				title : 'uGisWMSToc - WMS TOC',
				desc : 'WMS TOC를 생성한다.',
				link_code : root + '/examples/toc/uGisWMSToc.html',
				link_view : root + '/examples/toc/uGisWMSToc_view.html',
				img : imagesPath + 'toc/uGisWMSToc.jpg',
				requires : [ PO.TOC.WMS ]
			},
			WEBWMS : {
				name : 'WEBWMS',
				title : 'uGisWebWMSToc - Web WMS TOC',
				desc : 'Web WMS TOC를 생성한다.',
				link_code : root + '/examples/toc/uGisWebWMSToc.html',
				link_view : root + '/examples/toc/uGisWebWMSToc_view.html',
				img : imagesPath + 'toc/uGisWebWMSToc.jpg',
				requires : [ PO.TOC.WEBWMS ]
			},
			WFS : {
				name : 'WFS',
				title : 'uGisWFSToc - WFS TOC',
				desc : 'WFS TOC를 생성한다.',
				link_code : root + '/examples/toc/uGisWFSToc.html',
				link_view : root + '/examples/toc/uGisWFSToc_view.html',
				img : imagesPath + 'toc/uGisWFSToc.jpg',
				requires : [ PO.LAYER.WFS, PO.TOC.WFS ]
			},
			WMTS : {
				name : 'WMTS',
				title : 'uGisWMTSToc - WMTS TOC',
				desc : 'WMTS TOC를 생성한다.',
				link_code : root + '/examples/toc/uGisWMTSToc.html',
				link_view : root + '/examples/toc/uGisWMTSToc_view.html',
				img : imagesPath + 'toc/uGisWMTSToc.jpg',
				requires : [ PO.LAYER.WMTS, PO.TOC.WMTS ]
			}
		},

		BASEMAP : {
			BASEMAP : {
				name : 'BASEMAP',
				title : 'uGisBaseMap - 배경지도',
				desc : '배경지도를 생성한다.',
				link_code : root + '/examples/baseMap/uGisBaseMap.html',
				link_view : root + '/examples/baseMap/uGisBaseMap_view.html',
				img : imagesPath + 'baseMap/uGisBaseMap.jpg',
				requires : [ PO.MAP, PO.BASEMAP.BASEMAP ]
			},
			CUSTOM : {
				name : 'CUSTOM',
				title : 'uGisBaseMapCustom - 사용자 정의 배경지도(WMTS)',
				desc : 'WMTS 레이어를 배경지도로 생성한다.',
				link_code : root + '/examples/baseMap/uGisBaseMapCustom.html',
				link_view : root + '/examples/baseMap/uGisBaseMapCustom_view.html',
				img : imagesPath + 'baseMap/uGisBaseMapCustom.jpg',
				requires : [ PO.MAP, PO.SERVICE.CAPABILITIES.WMTS, PO.LAYER.WMTS, PO.BASEMAP.BASEMAP, PO.BASEMAP.CUSTOM ]
			}
		},

		CONTROL : {
			DRAGPAN : {
				name : 'DRAGPAN',
				title : 'uGisDragPan - 드래그 패닝',
				desc : '마우스 드래깅으로 지도 이동을 한다.',
				link_code : root + '/examples/control/uGisDragPan.html',
				link_view : root + '/examples/control/uGisDragPan_view.html',
				img : imagesPath + 'control/uGisDragPan.gif',
				requires : [ PO.MAP, PO.CONTROL.DRAGPAN ]
			},
			ZOOMIN : {
				name : 'DRAGZOOMIN',
				title : 'uGisDragZoomIn - 드래그 줌인',
				desc : '마우스 드래깅으로 해당 영역으로 확대한다.',
				link_code : root + '/examples/control/uGisDragZoomIn.html',
				link_view : root + '/examples/control/uGisDragZoomIn_view.html',
				img : imagesPath + 'control/uGisDragZoomIn.gif',
				requires : [ PO.MAP, PO.CONTROL.ZOOMIN ]
			},
			ZOOMOUT : {
				name : 'DRAGZOOMOUT',
				title : 'uGisDragZoomOut - 드래그 줌아웃',
				desc : '마우스 드래깅으로 해당 영역으로 축소한다.',
				link_code : root + '/examples/control/uGisDragZoomOut.html',
				link_view : root + '/examples/control/uGisDragZoomOut_view.html',
				img : imagesPath + 'control/uGisDragZoomOut.gif',
				requires : [ PO.MAP, PO.CONTROL.ZOOMOUT ]
			},
			DRAWFEATURE : {
				name : 'DRAWFEATURE',
				title : 'uGisDrawFeature - 도형 그리기',
				desc : '다양한 도형을 그린다.',
				link_code : root + '/examples/control/uGisDrawFeature.html',
				link_view : root + '/examples/control/uGisDrawFeature_view.html',
				img : imagesPath + 'control/uGisDrawFeature.gif',
				requires : [ PO.MAP, PO.CONTROL.DRAWFEATURE ]
			},
			LENGTH : {
				name : 'LENGTH',
				title : 'uGisLengthMeasure - 거리 측정',
				desc : '거리를 측정한다.',
				link_code : root + '/examples/control/uGisLengthMeasure.html',
				link_view : root + '/examples/control/uGisLengthMeasure_view.html',
				img : imagesPath + 'control/uGisLengthMeasure.gif',
				requires : [ PO.MAP, PO.CONTROL.LENGTH ]
			},
			AREA : {
				name : 'AREA',
				title : 'uGisAreaMeasure - 면적 측정',
				desc : '면적을 측정한다.',
				link_code : root + '/examples/control/uGisAreaMeasure.html',
				link_view : root + '/examples/control/uGisAreaMeasure_view.html',
				img : imagesPath + 'control/uGisAreaMeasure.gif',
				requires : [ PO.MAP, PO.CONTROL.AREA ]
			}
		},

		MANAGER : {
			CONTROL : {
				name : 'CONTROL',
				title : 'uGisControlManager - 등록된 컨트롤을 관리한다.',
				desc : '등록된 컨트롤들을 관리한다.',
				link_code : root + '/examples/manager/uGisControlManager.html',
				link_view : root + '/examples/manager/uGisControlManager_view.html',
				img : imagesPath + 'manager/uGisControlManager.jpg',
				requires : [ PO.MAP, PO.MANAGER.CONTROL ]
			},
			LAYER : {
				name : 'LAYER',
				title : 'uGisLayerManager - 등록된 레이어와 TOC를 관리한다.',
				desc : '등록된 레이어와 TOC를 관리하고, 레이어별 최소,최대 줌레벨을 설정할 수 있다.',
				link_code : root + '/examples/manager/uGisLayerManager.html',
				link_view : root + '/examples/manager/uGisLayerManager_view.html',
				img : imagesPath + 'manager/uGisLayerManager.jpg',
				requires : [ PO.MAP, PO.MANAGER.LAYER ]
			},
		},

		ANIMATION : {
			BOUNCE : {
				name : 'BOUNCE',
				title : 'bounceAnimation - 바운스 애니메이션',
				desc : '상,하로 튕기는 효과 애니메이션.',
				link_code : root + '/examples/animation/bounceAnimation.html',
				link_view : root + '/examples/animation/bounceAnimation_view.html',
				img : imagesPath + 'animation/bounceAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.BOUNCE ]
			},
			DROP : {
				name : 'DROP',
				title : 'dropAnimation - 드롭 애니메이션',
				desc : '위 에서 아래로 또는 아래에서 위로 떨어지는 효과 애니메이션.',
				link_code : root + '/examples/animation/dropAnimation.html',
				link_view : root + '/examples/animation/dropAnimation_view.html',
				img : imagesPath + 'animation/dropAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.DROP ]
			},
			SHOW : {
				name : 'SHOW',
				title : 'showAnimation - 쇼 애니메이션',
				desc : '나타내는 효과 애니메이션',
				link_code : root + '/examples/animation/showAnimation.html',
				link_view : root + '/examples/animation/showAnimation_view.html',
				img : imagesPath + 'animation/showAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.SHOW ]
			},
			TELEPORT : {
				name : 'TELEPORT',
				title : 'teleportAnimation - 텔레포트 애니메이션',
				desc : '순간 이동하는 것처럼 나타내는 효과 애니메이션.',
				link_code : root + '/examples/animation/teleportAnimation.html',
				link_view : root + '/examples/animation/teleportAnimation_view.html',
				img : imagesPath + 'animation/teleportAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.TELEPORT ]
			},
			ZOOMIN : {
				name : 'ZOOMIN',
				title : 'zoomInAnimation - 줌 인 애니메이션',
				desc : '확대 효과 애니메이션.',
				link_code : root + '/examples/animation/zoomInAnimation.html',
				link_view : root + '/examples/animation/zoomInAnimation_view.html',
				img : imagesPath + 'animation/zoomInAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.ZOOMIN ]
			},
			ZOOMOUT : {
				name : 'ZOOMOUT',
				title : 'zoomOutAnimation - 줌 아웃 애니메이션',
				desc : '축소 효과 애니메이션.',
				link_code : root + '/examples/animation/zoomOutAnimation.html',
				link_view : root + '/examples/animation/zoomOutAnimation_view.html',
				img : imagesPath + 'animation/zoomOutAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE, PO.ANIMATION.ZOOMOUT ]
			},
			LINEDASH : {
				name : 'LINEDASH',
				title : 'lineDashMoveAnimation - 라인 대시 애니메이션',
				desc : '라인 대시 효과 애니메이션.',
				link_code : root + '/examples/animation/lineDashMoveAnimation.html',
				link_view : root + '/examples/animation/lineDashMoveAnimation_view.html',
				img : imagesPath + 'animation/lineDashMoveAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINE, PO.ANIMATION.LINEDASH ]
			},
			LINEGRADIENT : {
				name : 'LINEGRADIENT',
				title : 'lineGradientAnimation - 라인 그라데이션 애니메이션',
				desc : '그라데이션 효과 애니메이션.',
				link_code : root + '/examples/animation/lineGradientAnimation.html',
				link_view : root + '/examples/animation/lineGradientAnimation_view.html',
				img : imagesPath + 'animation/lineGradientAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINEGRADIENT, PO.ANIMATION.UGISLINEGRADIENT ]
			},
			LINETOARCGRADIEN : {
				name : 'LINETOARCGRADIEN',
				title : 'lineToArcGradienAnimation - 호 형태 라인 그라데이션 애니메이션',
				desc : '일반 라인을 호 형태로 나타내는 그라데이션 효과 애니메이션.',
				link_code : root + '/examples/animation/lineToArcGradienAnimation.html',
				link_view : root + '/examples/animation/lineToArcGradienAnimation_view.html',
				img : imagesPath + 'animation/lineToArcGradienAnimation.gif',
				requires : [ PO.UTIL.UTIL, PO.UTIL.GEOUTIL, PO.ANIMATION.LINEGRADIENT, PO.ANIMATION.UGISLINEGRADIENT ]
			},
			CIRCLE : {
				name : 'CIRCLE',
				title : 'uGisCircleAnimation - 원 애니메이션',
				desc : 'Circle(원) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/uGisCircleAnimation.html',
				link_view : root + '/examples/animation/uGisCircleAnimation_view.html',
				img : imagesPath + 'animation/uGisCircleAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.CIRCLE ]
			},
			LINE : {
				name : 'LINE',
				title : 'uGisLineAnimation - 라인 애니메이션',
				desc : 'Line(선) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/uGisLineAnimation.html',
				link_view : root + '/examples/animation/uGisLineAnimation_view.html',
				img : imagesPath + 'animation/uGisLineAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.LINE ]
			},
			POLYGON : {
				name : 'POLYGON',
				title : 'uGisPolygonAnimation - 폴리곤 애니메이션',
				desc : 'Polygon(폴리곤) 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/uGisPolygonAnimation.html',
				link_view : root + '/examples/animation/uGisPolygonAnimation_view.html',
				img : imagesPath + 'animation/uGisPolygonAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.POLYGON ]
			},
			REGULAR : {
				name : 'REGULAR',
				title : 'uGisRegularShapeAnimation - 레귤러 애니메이션',
				desc : 'Regular Shape 형태의 피처를 처리하는 애니메이션. (멀티 애니메이션)',
				link_code : root + '/examples/animation/uGisRegularShapeAnimation.html',
				link_view : root + '/examples/animation/uGisRegularShapeAnimation_view.html',
				img : imagesPath + 'animation/uGisRegularShapeAnimation.gif',
				requires : [ PO.MAP, PO.HTTP, PO.ANIMATION.REGULAR ]
			}
		},

		ETC : {
			CAPTURE : {
				name : 'CAPTURE',
				title : 'uGisCapture - 배경지도 및 uGisMap 캡쳐',
				desc : '배경지도 및 uGisMap에 등록된 레이어를 캡쳐할 수 있다.',
				link_code : root + '/examples/etc/uGisCapture.html',
				link_view : root + '/examples/etc/uGisCapture_view.html',
				img : imagesPath + 'etc/uGisCapture.jpg',
				requires : [ PO.MAP, PO.CAPTURE ]
			}
		}
	};

	var PE = UGIS_PROP.EXAMPLE;

	UGIS_PROP.EXAMPLE_GROUP = [
			{
				name : 'Basic',
				examples : [ PE.BASIC.CONFIG, PE.BASIC.HTTP, PE.BASIC.MAP, PE.BASIC.POPUP, PE.BASIC.WHEELZOOM ]
			},
			{
				name : 'Service',
				examples : [ PE.SERVICE.CAPABILITIES.WMS, PE.SERVICE.CAPABILITIES.WFS, PE.SERVICE.CAPABILITIES.WCS, PE.SERVICE.CAPABILITIES.WMTS,
						PE.SERVICE.DESCRIBEFEATURETYPE, PE.SERVICE.GETFEATURE ]
			},
			{
				name : 'Layer',
				examples : [ PE.LAYER.WMS, PE.LAYER.WFS, PE.LAYER.WMTS, PE.LAYER.VECTOR, PE.LAYER.CLUSTER ]
			},
			{
				name : 'TOC',
				examples : [ PE.TOC.WMS, PE.TOC.WEBWMS, PE.TOC.WFS, PE.TOC.WMTS ]
			},
			{
				name : 'BaseMap',
				examples : [ PE.BASEMAP.BASEMAP, PE.BASEMAP.CUSTOM ]
			},
			{
				name : 'Control',
				examples : [ PE.CONTROL.DRAGPAN, PE.CONTROL.ZOOMIN, PE.CONTROL.ZOOMOUT, PE.CONTROL.DRAWFEATURE, PE.CONTROL.LENGTH, PE.CONTROL.AREA ]
			},
			{
				name : 'Manager',
				examples : [ PE.MANAGER.CONTROL, PE.MANAGER.LAYER ]
			},
			{
				name : 'Animation',
				examples : [ PE.ANIMATION.BOUNCE, PE.ANIMATION.DROP, PE.ANIMATION.SHOW, PE.ANIMATION.TELEPORT, PE.ANIMATION.ZOOMIN, PE.ANIMATION.ZOOMOUT,
						PE.ANIMATION.LINEDASH, PE.ANIMATION.LINEGRADIENT, PE.ANIMATION.LINETOARCGRADIEN, PE.ANIMATION.CIRCLE, PE.ANIMATION.LINE,
						PE.ANIMATION.POLYGON, PE.ANIMATION.REGULAR ]
			},
			{
				name : 'Etc',
				examples : [ PE.ETC.CAPTURE ]
			} ];


	window.UGIS_PROP = UGIS_PROP;

} )();
