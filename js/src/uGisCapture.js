( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지도 캡쳐 객체.
	 * 
	 * 배경지도 및 uGisMap에 등록된 레이어를 캡쳐할 수 있다.
	 * 
	 * ※`useSync(동기화)`는 같은 Document일 경우 사용 가능하며 새창으로 띄울 경우 `false`로 설정해야한다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugCapture = new ugmp.uGisCapture( {
	 * 	useSync : true,
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	uGisBaseMap : new ugmp.baseMap.uGisBaseMap({...}),
	 * 	uGisLayerManager : new ugmp.manager.uGisLayerManager({...}),
	 * 	appendElement : document.getElementById('map'),
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useSync {Boolean} 캡쳐 대상 지도 연동 사용 여부. Default is `false`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisBaseMap {ugmp.baseMap.uGisBaseMap} {@link ugmp.baseMap.uGisBaseMap} 객체.
	 * @param opt_options.uGisLayerManager {ugmp.manager.uGisLayerManager} {@link ugmp.manager.uGisLayerManager} 객체.
	 * @param opt_options.appendElement {Element} 캡쳐 대상 지도 Element를 추가할 Element.
	 * 
	 * @class
	 */
	ugmp.uGisCapture = ( function(opt_options) {
		var _self = this;

		this.useSync = null;
		this.origin_ugMap = null;
		this.appendElement = null;
		this.origin_ugBaseMap = null;
		this.origin_ugLayerManager = null;

		this.captureDivId = null;
		this.captureMapId = null;
		this.readyFunction = null;
		this.captureUgMap = null;
		this.captureElement = null;
		this.arrDeferred_ready = null;
		this.captureBaseMapId = null;
		this.captureUgBaseMap = null;
		this.captureLayerManager = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.useSync = ( typeof ( options.useSync ) === "boolean" ) ? options.useSync : false;
			_self.origin_ugMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.origin_ugBaseMap = ( options.uGisBaseMap !== undefined ) ? options.uGisBaseMap : undefined;
			_self.origin_ugLayerManager = ( options.uGisLayerManager !== undefined ) ? options.uGisLayerManager : undefined;
			_self.appendElement = ( options.appendElement !== undefined ) ? options.appendElement : undefined;
			_self.readyFunction = ( typeof options.readyFunction === "function" ) ? options.readyFunction : undefined;

			_self.arrDeferred_ready = [];

			if ( !_self.origin_ugMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			var uuid = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
			_self.captureDivId = "captureDiv_" + uuid;
			_self.captureMapId = "captureMap_" + uuid;
			_self.captureBaseMapId = "captureBaseMap_" + uuid;

			_self._createCaptureElement();
			_self._setCaptureMap();
			_self._setCaptureLayer();

		} )();
		// END initialize


		return {
			_this : _self,
			ready : _self.ready,
			destroy : _self.destroy,
			runCapture : _self.runCapture,
			getUgisMap : _self.getUgisMap,
			getUgisBaseMap : _self.getUgisBaseMap,
			setBaseMapVisible : _self.setBaseMapVisible,
			getUgisLayerManager : _self.getUgisLayerManager,
			baseMapVisibleToggle : _self.baseMapVisibleToggle
		}

	} );


	/**
	 * Capture DIV Element를 생성한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._createCaptureElement = function() {
		var _self = this._this || this;

		var mapMainDIV = document.createElement( "div" );
		mapMainDIV.id = _self.captureDivId;
		mapMainDIV.style.width = "100%";
		mapMainDIV.style.height = "100%";
		mapMainDIV.style.overflow = "hidden";
		mapMainDIV.style.position = "relative";
		mapMainDIV.style.backgroundColor = "white";

		var baseMapDIV = document.createElement( "div" );
		baseMapDIV.id = _self.captureBaseMapId;
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "z-Index", "20" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "position", "absolute !important" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "background-color", "rgb(255, 255, 254)" );

		var mapDIV = document.createElement( "div" );
		mapDIV.id = _self.captureMapId;
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "z-Index", "30" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "position", "absolute !important" );
		// ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "background-color", "rgba(255, 255, 255, 0)" );

		mapMainDIV.appendChild( baseMapDIV );
		mapMainDIV.appendChild( mapDIV );

		_self.captureElement = mapMainDIV;
	};


	/**
	 * Capture할 배경지도, 지도를 설정한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._setCaptureMap = function() {
		var _self = this._this || this;

		_self.appendElement.insertBefore( _self.captureElement, _self.appendElement.firstChild );

		// 캡쳐 지도 생성
		_self.captureUgMap = new ugmp.uGisMap( {
			target : document.getElementById( _self.captureMapId ),
			crs : _self.origin_ugMap.getCRS(),
			center : _self.origin_ugMap.getMap().getView().getCenter(),
			useMaxExtent : true,
			useAltKeyOnly : false
		} );

		// 캡쳐 기본 컨트롤 모두 제거
		var controls = _self.captureUgMap.getMap().getControls().getArray();
		for ( var i = controls.length - 1; i >= 0; i-- ) {
			_self.captureUgMap.getMap().removeControl( controls[ i ] );
		}

		// 캡쳐 기본 상호작용 모두 제거
		var interactions = _self.captureUgMap.getMap().getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( interactions[ i ] instanceof ol.interaction.DragRotate ) {
				_self.captureUgMap.getMap().removeInteraction( interactions[ i ] );
				break;
			}
		}

		// 드래그 패닝
		var ugDragPan = new ugmp.control.uGisDragPan( {
			uGisMap : _self.captureUgMap,
			useDragPan : false,
			cursorCssName : "cursor-default",
			activeChangeListener : function(state_) {
				console.log( "uGisDragPan : " + state_ );
			}
		} );

		ugDragPan.setActive( true );


		// 캡쳐 배경 지도 설정 및 생성
		if ( _self.origin_ugBaseMap ) {
			_self.captureUgBaseMap = new ugmp.baseMap.uGisBaseMap( {
				target : _self.captureBaseMapId,
				uGisMap : _self.captureUgMap,
				baseMapKey : "osm_none",
				useElementMargin : false
			} );

			var baseMapDIV = document.getElementById( _self.captureBaseMapId );
			baseMapDIV.firstElementChild.style.top = null;
			baseMapDIV.firstElementChild.style.left = null;
			baseMapDIV.firstElementChild.style.overflow = null;
			baseMapDIV.firstElementChild.style.width = "100%";
			baseMapDIV.firstElementChild.style.height = "100%";

			_self.captureUgBaseMap.setVisible( _self.origin_ugBaseMap.getVisible() );
			_self.captureUgBaseMap.setOpacity( _self.origin_ugBaseMap.getOpacity() );

			var baseMapKey = _self.origin_ugBaseMap.getSelectedBaseMap();

			if ( baseMapKey.indexOf( "custom" ) > -1 ) {
				var originObj = _self.origin_ugBaseMap._this.baseMapList[ baseMapKey ].object;
				var uWMTSLayer = originObj._this.uWMTSLayer;

				var cWMTSLyer = new ugmp.layer.uGisWMTSLayer( {
					useProxy : true,
					serviceURL : uWMTSLayer.getServiceURL(),
					layer : uWMTSLayer.layer,
					version : uWMTSLayer.version,
					matrixSet : uWMTSLayer.matrixSet,
					wmtsCapabilities : uWMTSLayer.getWmtsCapabilities(),
					originExtent : uWMTSLayer.getOriginExtent()
				} );

				var bKey = "custom_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
				var custom = new ugmp.baseMap.uGisBaseMapCustom( {
					baseMapKey : bKey,
					uWMTSLayer : cWMTSLyer,
					capabilities : uWMTSLayer.getWmtsCapabilities(),
					isWorld : originObj.isWorlds(),
					isFactor : originObj.isFactors()
				} );

				custom._this.resolutions = originObj._this.resolutions;
				custom._this.mapTypes[ bKey ].maxZoom = originObj._this.mapTypes[ baseMapKey ].maxZoom;
				custom._this.mapTypes[ bKey ].resolutions = originObj._this.mapTypes[ baseMapKey ].resolutions;

				_self.captureUgBaseMap.addBaseMapType( bKey, custom );
				_self.captureUgBaseMap.changeBaseMap( bKey );
			} else if ( baseMapKey.indexOf( "TMS" ) > -1 ) {
				var code = baseMapKey.split( "_" )[ 0 ];

				var tms = new ugmp.baseMap.uGisBaseMapTMS_vWorld( {
					baseCode : code,
					projection : _self.origin_ugBaseMap.getApiMap().getView().getProjection().getCode()
				} );

				_self.captureUgBaseMap.addBaseMapType( code, tms );
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

				for ( var i in layers ) {
					var urls = layers[ i ].getSource().getUrls();
					var reUrls = [];
					for ( var u in urls ) {
						reUrls.push( ugmp.uGisConfig.getProxy() + urls[ u ] );
					}
					layers[ i ].getSource().setUrls( reUrls );
				}
			} else {
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				if ( baseMapKey === "osm_gray" ) {
					var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

					for ( var i in layers ) {
						layers[ i ].getSource().setUrl( ugmp.uGisConfig.getProxy() + "https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png" );
					}
				}
			}
		}

		// 캡쳐 지도 ol.View 설정
		var originView = _self.origin_ugMap.getMap().getView();
		originView.setRotation( 0 );
		_self.captureUgMap.getMap().setView( new ol.View( {
			zoom : originView.getZoom(),
			center : originView.getCenter(),
			extent : ol.proj.get( _self.origin_ugMap.getCRS() ).getExtent(),
			projection : originView.getProjection().getCode(),
			maxZoom : originView.getMaxZoom(),
			minZoom : originView.getMinZoom(),
			resolution : originView.getResolution(),
			resolutions : originView.getResolutions(),
			rotation : 0
		} ) );

		// 대상 지도와 캡쳐 지도 동기화
		if ( _self.useSync ) {
			_self.captureUgMap.getMap().setView( originView );
		}
	};


	/**
	 * Capture할 레이어를 설정한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._setCaptureLayer = function() {
		var _self = this._this || this;

		var ugLayers = [];

		// uGisLayerManager 사용 여부에 따른 레이어 설정
		if ( _self.origin_ugLayerManager ) {
			_self.captureLayerManager = new ugmp.manager.uGisLayerManager( {
				uGisMap : _self.captureUgMap,
				useMinMaxZoom : true
			} );

			ugLayers = _self.origin_ugLayerManager.getAll( true );
		} else {
			var orginUgLayers = _self.origin_ugMap.getLayers();
			for ( var i in orginUgLayers ) {
				ugLayers.push( {
					uGisLayer : orginUgLayers[ i ]
				} );
			}
		}

		// 레이어 순차 동기화로 추가
		( function loop(i) {
			if ( i < ugLayers.length ) {
				var addObject;
				var ugLayer = ugLayers[ i ][ "uGisLayer" ];

				if ( !ugLayer.getVisible() ) {
					loop( i + 1 );
					return false;
				}

				if ( ugLayer.getLayerType() === "WMS" ) {
					addObject = _self._addUGisLayer().addWMSLayer;
				} else if ( ugLayer.getLayerType() === "WFS" ) {
					addObject = _self._addUGisLayer().addWFSLayer;
				} else if ( ugLayer.getLayerType() === "Vector" ) {
					addObject = _self._addUGisLayer().addVectorLayer;
				} else if ( ugLayer.getLayerType() === "Vector3D" ) {
					addObject = _self._addUGisLayer().addVector3DLayer;
				} else if ( ugLayer.getLayerType() === "Cluster" ) {
					addObject = _self._addUGisLayer().addClusterLayer;
				} else if ( ugLayer.getLayerType() === "WMTS" ) {
					addObject = _self._addUGisLayer().addWMTSLayer;
				} else if ( ugLayer.getLayerType() === "WCS" ) {
					addObject = _self._addUGisLayer().addWCSLayer;
				}

				// 레이어 visible, zIndex, opacity 설정
				var addedUgLayer = addObject.create( ugLayer );
				addedUgLayer.setLayerVisible( ugLayer.getVisible() );
				addedUgLayer.getOlLayer().setZIndex( ugLayer.getOlLayer().getZIndex() );
				addedUgLayer.getOlLayer().setOpacity( ugLayer.getOlLayer().getOpacity() );

				// uGisLayerManager 사용 시 대상 지도에서 설정된 Zoom 설정
				if ( _self.captureLayerManager ) {
					addedUgLayer.setMinZoom( ugLayer.getMinZoom() );
					addedUgLayer.setMaxZoom( ugLayer.getMaxZoom() );
				}

				// 대상 지도에서 uGisWMSToc 객체 사용 시 생성
				if ( _self.origin_ugLayerManager && addedUgLayer.getLayerType() === "WMS" ) {
					var ugToc = ugLayers[ i ][ "uGisToc" ];

					// WMS Capabilities 요청
					var ugGetCapabilitiesWMS = new ugmp.service.uGisGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : addedUgLayer.getServiceURL(),
						dataViewId : _self.captureUgMap.getDataViewId()
					} );

					_self.arrDeferred_ready.push( ugGetCapabilitiesWMS );

					ugGetCapabilitiesWMS.then( function() {
						var toc = addObject.toc( {
							key : ugToc.tocKey,
							addLayer : addedUgLayer,
							saveData : JSON.parse( JSON.stringify( ugToc.getSaveData() ) ),
							capabilities : ugGetCapabilitiesWMS.data
						} );
						if ( _self.captureLayerManager ) {
							_self.captureLayerManager.add( {
								uGisToc : toc,
								uGisLayer : addedUgLayer
							} );
						}
					} );
				} else {
					if ( _self.captureLayerManager ) {
						_self.captureLayerManager.add( {
							uGisLayer : addedUgLayer
						} );
					}
				}

				var def_add = addObject.add( addedUgLayer );
				_self.arrDeferred_ready.push( def_add );
				def_add.then( function(res) {
				} );
				loop( i + 1 );
			} else {
				_self.ready();
			}
		} )( 0 );
	};


	/**
	 * 등록된 레이어를 순차 비동기로 추가한다.
	 * 
	 * @param ugLayer {ugmp.layer} {@link ugmp.layer}객체.
	 * 
	 * @return {Object}
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._addUGisLayer = function(ugLayer_) {
		var _self = this._this || this;

		var addWMSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWMSLayer( {
					useProxy : true,
					singleTile : ugLayer_._this.singleTile,
					serviceURL : ugLayer_.getServiceURL(),
					ogcParams : ugLayer_.getOlLayer().getSource().getParams()
				} );
			},
			add : function(ugWmsLayer_) {
				return _self.captureUgMap.addWMSLayer( {
					uWMSLayer : ugWmsLayer_,
					useExtent : false,
					extent : null,
					resolution : null
				} );
			},
			toc : function(options_) {
				return new ugmp.toc.uGisWMSToc( {
					tocKey : options_.key,
					uGisMap : _self.captureUgMap,
					uGisLayer : options_.addLayer,
					loadData : options_.saveData,
					capabilities : options_.capabilities
				} );
			}
		};

		var addWFSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWFSLayer( {
					useProxy : true,
					serviceURL : ugLayer_.getServiceURL(),
					layerName : ugLayer_.layerName,
					srsName : _self.captureUgMap.getCRS(),
					maxFeatures : ugLayer_._this.maxFeatures,
					style : ugLayer_._this.style,
					filter : ugLayer_._this.filter
				} );
			},
			add : function(ugWfsLayer_) {
				return _self.captureUgMap.addWFSLayer( {
					uWFSLayer : ugWfsLayer_,
					useExtent : false
				} );
			}
		};

		var addVectorLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = ugmp.util.uGisUtil.cloneStyle( style );
				}

				return new ugmp.layer.uGisVectorLayer( {
					style : style,
					features : ugLayer_.getFeatures(),
					srsName : ugLayer_._this.srsName,
				} );
			},
			add : function(ugVectorLayer_) {
				return _self.captureUgMap.addVectorLayer( {
					uVectorLayer : ugVectorLayer_,
					useExtent : false
				} );
			}
		};

		var addVector3DLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = ugmp.util.uGisUtil.cloneStyle( style );
				}

				return new ugmp.layer.uGisVector3DLayer( {
					style : style,
					features : ugLayer_.getFeatures(),
					initBuild : ugLayer_._this.initBuild,
					srsName : ugLayer_._this.srsName,
					labelColumn : ugLayer_._this.labelColumn,
					heightColumn : ugLayer_._this.heightColumn,
					maxResolution : ugLayer_._this.maxResolution					
				} );
			},
			add : function(ugVector3DLayer_) {
				return _self.captureUgMap.addVector3DLayer( {
					uVector3DLayer : ugVector3DLayer_,
					useExtent : false
				} );
			}
		};

		var addClusterLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;
				return new ugmp.layer.uGisClusterLayer( {
					style : ( typeof style === "function" ) ? style : ugmp.util.uGisUtil.cloneStyle( style ),
					features : ugmp.util.uGisUtil.cloneFeatures( ugLayer_.getFeatures() ),
					distance : ugLayer_._this.distance,
					useAnimation : ugLayer_._this.useAnimation
				} );
			},
			add : function(ugClusterLayer_) {
				return _self.captureUgMap.addClusterLayer( {
					uClusterLayer : ugClusterLayer_,
					useExtent : false
				} );
			}
		};

		var addWMTSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWMTSLayer( {
					useProxy : true,
					serviceURL : ugLayer_.getServiceURL(),
					layer : ugLayer_.layer,
					version : ugLayer_.version,
					matrixSet : ugLayer_.matrixSet,
					wmtsCapabilities : ugLayer_.getWmtsCapabilities(),
					originExtent : ugLayer_.getOriginExtent()
				} );
			},
			add : function(ugWmtsLayer_) {
				return _self.captureUgMap.addWMTSLayer( {
					uWMTSLayer : ugWmtsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		var addWCSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWCSLayer( {
					useProxy : true,
					version : ugLayer_.version,
					identifier : ugLayer_.identifier,
					format : ugLayer_._this.format,
					serviceURL : ugLayer_.getServiceURL(),
					boundingBox : ugLayer_.getBoundingBox(),
					useScaleRefresh : ugLayer_.useScaleRefresh
				} );
			},
			add : function(ugWcsLayer_) {
				return _self.captureUgMap.addWCSLayer( {
					uWCSLayer : ugWcsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		return {
			addWFSLayer : addWFSLayer,
			addWCSLayer : addWCSLayer,
			addWMSLayer : addWMSLayer,
			addWMTSLayer : addWMTSLayer,
			addVectorLayer : addVectorLayer,
			addClusterLayer : addClusterLayer,
			addVector3DLayer : addVector3DLayer
		}
	};


	/**
	 * 캡쳐 지도 {ugmp.uGisMap} 객체를 가져온다.
	 * 
	 * @return captureUgMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisMap = function() {
		var _self = this._this || this;
		return _self.captureUgMap;
	};


	/**
	 * 캡쳐 배경 지도 {ugmp.uGisBaseMap} 객체를 가져온다.
	 * 
	 * @return captureBaseMapId {ugmp.uGisBaseMap} {@link ugmp.uGisBaseMap} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisBaseMap = function() {
		var _self = this._this || this;
		return _self.captureUgBaseMap;
	};


	/**
	 * 캡쳐 레이어 매니저 {ugmp.manager.uGisLayerManager} 객체를 가져온다.
	 * 
	 * @return captureLayerManager {ugmp.manager.uGisLayerManager} {@link ugmp.manager.uGisLayerManager} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisLayerManager = function() {
		var _self = this._this || this;
		return _self.captureLayerManager;
	};


	/**
	 * Capture 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF.
	 */
	ugmp.uGisCapture.prototype.setBaseMapVisible = function(visible_) {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.setVisible( visible_ );
		}
	};


	/**
	 * Capture 배경지도의 ON/OFF 상태를 토글한다.
	 */
	ugmp.uGisCapture.prototype.baseMapVisibleToggle = function() {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.visibleToggle();
		}
	};


	/**
	 * 지도 캡쳐를 시작한다.
	 * 
	 * @param callBack {Function} 콜백 함수.
	 */
	ugmp.uGisCapture.prototype.runCapture = function(callBack_) {
		var _self = this._this || this;

		document.getElementById( _self.captureBaseMapId ).style.overflow = "";
		document.getElementById( _self.captureBaseMapId ).firstElementChild.style.overflow = "";

		if ( typeof callBack_ !== "function" ) {
			return false;
		}

		var baseMapCode = "none";

		if ( _self.origin_ugBaseMap ) {
			baseMapCode = _self.origin_ugBaseMap.getSelectedBaseMap().split( "_" )[ 0 ];
		}

		if ( baseMapCode.indexOf( "naver" ) > -1 || baseMapCode.indexOf( "daum" ) > -1 || baseMapCode.indexOf( "baroEmap" ) > -1 ) {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_etc( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				logging : false,
				proxy : ugmp.uGisConfig.getProxy()
			} ).then( function(canvas) {
				callBack_.call( this, canvas );
			} );
		} else {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_google( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				proxy : ugmp.uGisConfig.getProxy(),
				onrendered : function(canvas) {
					callBack_.call( this, canvas );
				}
			} );
		}
	};


	/**
	 * 생성된 Capture 객체를 destroy 한다.
	 */
	ugmp.uGisCapture.prototype.destroy = function(callBack_) {
		var _self = this._this || this;

		_$( "#" + _self.captureBaseMapId ).empty();
		_self.captureUgMap.getMap().setTarget( null );
	};


	/**
	 * setLayer Ready Success
	 */
	ugmp.uGisCapture.prototype.ready = function() {
		var _self = this._this || this;

		$.when.apply( $, _self.arrDeferred_ready ).then( function() {
			if ( _self.readyFunction ) {
				_self.readyFunction.call( _self );
			}

			_self.captureUgMap.refresh();
		} );
	};

} )();
