( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지도 캡쳐 객체.
	 * 
	 * 배경지도 및 uGisMap에 등록된 레이어를 캡쳐할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugCapture = new ugmp.uGisCapture( {
	 * 	useSync : true,
	 * 	useLayerManager : true,
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	uGisBaseMap : new ugmp.baseMap.uGisBaseMap({...}),
	 * 	appendElement : document.getElementById('map'),
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useSync {Boolean} 캡쳐 대상 지도 연동 사용 여부. Default is `false`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisBaseMap {ugmp.baseMap.uGisBaseMap} {@link ugmp.baseMap.uGisBaseMap} 객체.
	 * @param opt_options.appendElement {Element} 캡쳐 대상 지도 Element를 추가할 Element.
	 * @param opt_options.useLayerManager {Boolean} 레이어 매니저 사용 여부. Default is `false`.
	 * 
	 * @class
	 */
	ugmp.uGisCapture = ( function(opt_options) {
		var _self = this;

		this.useSync = null;
		this.uGisMap = null;
		this.uGisBaseMap = null;
		this.appendElement = null;
		this.useLayerManager = null;

		this.captureDivId = null;
		this.captureMapId = null;
		this.captureUgMap = null;
		this.captureElement = null;
		this.ugLayerManager = null;
		this.captureBaseMapId = null;
		this.captureUgBaseMap = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.useSync = ( typeof ( options.useSync ) === "boolean" ) ? options.useSync : false;
			_self.uGisBaseMap = ( options.uGisBaseMap !== undefined ) ? options.uGisBaseMap : undefined;
			_self.appendElement = ( options.appendElement !== undefined ) ? options.appendElement : undefined;
			_self.useLayerManager = ( typeof ( options.useLayerManager ) === "boolean" ) ? options.useLayerManager : false;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			var uuid = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
			_self.captureDivId = "captureDiv_" + uuid;
			_self.captureMapId = "captureMap_" + uuid;
			_self.captureBaseMapId = "captureBaseMap_" + uuid;

			_self._createCaptureElement();
			_self._setCaptureMap();

		} )();
		// END initialize


		return {
			_this : _self,
			destroy : _self.destroy,
			runCapture : _self.runCapture,
			setBaseMapVisible : _self.setBaseMapVisible,
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
		mapMainDIV.style.position = "relative";

		var baseMapDIV = document.createElement( "div" );
		baseMapDIV.id = _self.captureBaseMapId;
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "z-Index", "20" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "position", "absolute !important" );

		var mapDIV = document.createElement( "div" );
		mapDIV.id = _self.captureMapId;
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "z-Index", "30" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "position", "absolute !important" );

		mapMainDIV.appendChild( baseMapDIV );
		mapMainDIV.appendChild( mapDIV );

		_self.captureElement = mapMainDIV;
	};


	/**
	 * Capture할 배경지도, 지도, 레이어를 설정한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._setCaptureMap = function() {
		var _self = this._this || this;
debugger
		_self.appendElement.insertBefore( _self.captureElement, _self.appendElement.firstChild );

		_self.captureUgMap = new ugmp.uGisMap( {
			// target : _self.captureMapId,
			target : document.getElementById( _self.captureMapId ),
			crs : _self.uGisMap.getCRS(),
			center : _self.uGisMap.getMap().getView().getCenter(),
			useMaxExtent : true,
			useAltKeyOnly : false
		} );

		var controls = _self.captureUgMap.getMap().getControls().getArray();
		for ( var i = controls.length - 1; i >= 0; i-- ) {
			_self.captureUgMap.getMap().removeControl( controls[ i ] );
		}

		_self.captureUgMap.getMap().getView().setZoom( _self.uGisMap.getMap().getView().getZoom() );

		if ( _self.uGisBaseMap ) {
			_self.captureUgBaseMap = new ugmp.baseMap.uGisBaseMap( {
				target : _self.captureBaseMapId,
				uGisMap : _self.captureUgMap,
				baseMapKey : "osm_none"
			} );

			var baseMapKey = _self.uGisBaseMap.getSelectedBaseMap();

			if ( baseMapKey.split( "_" )[ 0 ] !== "custom" ) {
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				if ( baseMapKey === "osm_gray" ) {
					var osm = _self.captureUgBaseMap._this.baseMapList[ "osm" ][ "object" ];
					var layers = osm._this.apiMap.getLayers().getArray();

					for ( var i in layers ) {
						osm._this.apiMap.removeLayer( layers[ i ] );
					}

					osm._this.apiMap.addLayer( new ol.layer.Tile( {
						source : new ol.source.XYZ( {
							url : ugmp.uGisConfig.getProxy() + "http://{a-c}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png"
						} )
					} ) );
				}
			} else {
				var uWMTSLayer = _self.uGisBaseMap._this.baseMapList[ baseMapKey ][ "object" ]._this.uWMTSLayer;

				var ugGetCapabilitiesWMTS = new ugmp.service.uGisGetCapabilitiesWMTS( {
					useProxy : true,
					version : uWMTSLayer.layer,
					serviceURL : uWMTSLayer.getServiceURL(),
					dataViewId : _self.uGisMap.getDataViewId()
				} );

				ugGetCapabilitiesWMTS.then( function() {
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
						capabilities : ugGetCapabilitiesWMTS.data,
						isWorld : _self.uGisBaseMap._this.baseMapList[ baseMapKey ][ "object" ].isWorlds(),
						isFactor : _self.uGisBaseMap._this.baseMapList[ baseMapKey ][ "object" ].isFactors()
					} );

					_self.captureUgBaseMap.addBaseMapType( bKey, custom );
					_self.captureUgBaseMap.changeBaseMap( bKey );

					if ( _self.useSync ) {
						// _self.captureUgMap.getMap().setView( _self.uGisMap.getMap().getView() );
					}
				} );
			}
		}

		if ( _self.useSync ) {
			_self.captureUgMap.getMap().setView( _self.uGisMap.getMap().getView() );
		} else {
			var view = _self.uGisMap.getMap().getView();
			_self.captureUgMap.getMap().setView ( new ol.View({
				zoom : view.getZoom(),
				center : view.getCenter(),
				extent : ol.proj.get( _self.uGisMap.getCRS() ).getExtent(),
				projection : view.getProjection().getCode(),
				maxZoom : view.getMaxZoom(),
				minZoom : view.getMinZoom(),
				resolution : view.getResolution(),
				resolutions : view.getResolutions(),
				rotation : view.getRotation()
			}) );
		}
		
		

		if ( _self.useLayerManager ) {
			_self.ugLayerManager = new ugmp.manager.uGisLayerManager( {
				uGisMap : _self.captureUgMap,
				useMinMaxZoom : true
			} );
		}

		var ugLayers = _self.uGisMap.getLayers();
		( function loop(i) {
			if ( i < ugLayers.length ) {
				var addObject;
				var ugLayer = ugLayers[ i ];

				if ( ugLayer.getLayerType() === "WMS" ) {
					addObject = _self._addUGisLayer().addWMSLayer;
				} else if ( ugLayer.getLayerType() === "WFS" ) {
					addObject = _self._addUGisLayer().addWFSLayer;
				} else if ( ugLayer.getLayerType() === "Vector" ) {
					addObject = _self._addUGisLayer().addVectorLayer;
				} else if ( ugLayer.getLayerType() === "Cluster" ) {
					addObject = _self._addUGisLayer().addClusterLayer;
				} else if ( ugLayer.getLayerType() === "WMTS" ) {
					addObject = _self._addUGisLayer().addWMTSLayer;
				}

				var addedUgLayer = addObject.create( ugLayer );
				addedUgLayer.getOlLayer().setZIndex( ugLayer.getOlLayer().getZIndex() );
				addedUgLayer.getOlLayer().setOpacity( ugLayer.getOlLayer().getOpacity() );

				if ( _self.useLayerManager ) {
					addedUgLayer.setMinZoom( ugLayer_.getMinZoom() );
					addedUgLayer.setMaxZoom( ugLayer_.getMaxZoom() );

					_self.ugLayerManager.add( {
						uGisLayer : addedUgLayer
					} );
				}

				addObject.add( addedUgLayer ).then( function(res) {
					loop( i + 1 );
				} );
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
			}
		};

		var addWFSLayer = {
			create : function(ugLayer_) {
				return ugLayer_;
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
				return ugLayer_;
			},
			add : function(ugVectorLayer_) {
				return _self.captureUgMap.addVectorLayer( {
					uVectorLayer : ugVectorLayer_,
					useExtent : false
				} );
			}
		};

		var addClusterLayer = {
			create : function(ugLayer_) {
				return ugLayer_;
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

		return {
			addWMSLayer : addWMSLayer,
			addWFSLayer : addWFSLayer,
			addWMTSLayer : addWMTSLayer,
			addVectorLayer : addVectorLayer,
			addClusterLayer : addClusterLayer
		}
	};


	/**
	 * 캡쳐 DIV ID를 가져온다.
	 * 
	 * @return captureDivId {String} 캡쳐 DIV ID.
	 */
	ugmp.uGisCapture.prototype.getCaptureDivId = function() {
		var _self = this._this || this;
		return _self.captureDivId;
	};


	/**
	 * 배경지도 DIV ID를 가져온다.
	 * 
	 * @return captureBaseMapId {String} 배경지도 DIV ID.
	 */
	ugmp.uGisCapture.prototype.getCaptureBaseMapId = function() {
		var _self = this._this || this;
		return _self.captureBaseMapId;
	};


	/**
	 * 지도 DIV ID를 가져온다.
	 * 
	 * @return captureMapId {String} 지도 DIV ID.
	 */
	ugmp.uGisCapture.prototype.getCaptureMapId = function() {
		var _self = this._this || this;
		return _self.captureMapId;
	};


	/**
	 * 캡쳐 DIV Element를 가져온다.
	 * 
	 * @return captureElement {Element} 캡쳐 DIV Element.
	 */
	ugmp.uGisCapture.prototype.getCaptureElement = function() {
		var _self = this._this || this;
		return _self.captureElement;
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

		if ( typeof callBack_ !== "function" ) {
			return false;
		}

		var baseMapCode = "none";

		if ( _self.uGisBaseMap ) {
			baseMapCode = _self.uGisBaseMap.getSelectedBaseMap().split( "_" )[ 0 ];
		}

		if ( baseMapCode.indexOf( "google" ) > -1 ) {
			html2canvas_google( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				proxy : ugmp.uGisConfig.getProxy(),
				onrendered : function(canvas) {
					callBack_.call( this, canvas );
				}
			} );
		} else {
			html2canvas_etc( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				proxy : ugmp.uGisConfig.getProxy()
			} ).then( function(canvas) {
				callBack_.call( this, canvas );
			} );
		}
	};


	/**
	 * 생성된 Capture 객체를 destroy 한다.
	 */
	ugmp.uGisCapture.prototype.destroy = function(callBack_) {
		var _self = this._this || this;

		_self.captureUgMap.getMap().setTarget( null );
	};

} )();
