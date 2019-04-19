( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지도 객체.
	 * 
	 * 다양한 타입의 레이어({@link ugmp.layer})를 추가할 수 있으며, 지도의 기본 객체이다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugMap = new ugmp.uGisMap( {
	 * 	target : 'map',
	 * 	crs : 'EPSG:3857',
	 * 	center : [ 0, 0 ],
	 * 	useMaxExtent : true,
	 * 	useAltKeyOnly : false
	 * } );
	 * 
	 * // ol.Map 객체에 직접 접근
	 * ugMap.getMap().addLayer( new ol.layer.Tile( {
	 * 	source : new ol.source.OSM()
	 * } ) );
	 * 
	 * // uGisMap에 WMS 레이어 추가
	 * ugMap.addWMSLayer( {
	 * 	uWMSLayer : new ugmp.layer.uGisWMSLayer( {...} )
	 * 	...
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.crs {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.center {Array.<Number>} 중심점. Default is `[0, 0]`.
	 * @param opt_options.target {String} 지도가 그려질 DIV ID.
	 * @param opt_options.useAltKeyOnly {Boolean} 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부.
	 * 
	 * `true`면 AltKey를 누를 상태에서만 마우스 휠줌 스크롤 사용이 가능하다. Default is `false`.
	 * 
	 * @param opt_options.useMaxExtent {Boolean} 이동할 수 있는 영역을 해당 좌표계의 최대 영역으로 한정한다. Default is `false`.
	 * 
	 * @class
	 */
	ugmp.uGisMap = ( function(opt_options) {
		var _self = this;

		this.olMap = null;
		this.mapCRS = null;
		this.useAltKeyOnly = null;

		this.layers = null;
		this.dataViewId = null;
		this.loadingSrcDiv = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.layers = [];
			_self.mapCRS = ( options.crs !== undefined ) ? options.crs.toUpperCase() : "EPSG:3857";
			_self.useAltKeyOnly = ( typeof ( options.useAltKeyOnly ) === "boolean" ) ? options.useAltKeyOnly : false;

			var center = options.center;
			if ( !Array.isArray( center ) ) {
				center = [ 0, 0 ];
			}

			var maxExtent = ( options.useMaxExtent ) ? ol.proj.get( _self.mapCRS ).getExtent() : undefined;

			var view = new ol.View( {
				zoom : 2,
				center : center,
				extent : maxExtent,
				projection : _self.mapCRS
			} );

			_self.dataViewId = ol.getUid( view );

			_self.olMap = new ol.Map( {
				target : options.target,
				layers : [],
				renderer : "canvas",
				controls : _self._createDefaultControls(),
				interactions : _self._createDefaultInteractions(),
				view : view
			} );

			_self._createScrollElement();
			_self._createLoadingElement();

			/**
			 * view 변경 시 overlay transform
			 * 
			 * 로딩 심볼 초기화
			 */
			_self.olMap.on( "change:view", function() {
				var newProjection = _self.olMap.getView().getProjection().getCode();
				_self.mapCRS = newProjection;

				var overlays = _self.olMap.getOverlays().getArray();
				for ( var i = overlays.length - 1; i >= 0; i-- ) {
					var origin = overlays[ i ].get( "origin" );
					if ( origin ) {
						var position = ol.proj.transform( origin[ "position" ], origin[ "projection" ], _self.mapCRS );
						overlays[ i ].setPosition( position );
						overlays[ i ].set( "CRS", _self.mapCRS );
					}
				}
				
				ugmp.uGisConfig.resetLoading( _self.dataViewId );
			} );

			
			var tag = ( options.target instanceof Element ) ? options.target : "#" + options.target;
			
			_$( tag ).resize( function() {
				_self.refresh();
			} );

			_$( window ).resize( function() {
				_self.refresh();
			} );

			console.log( "####### uGisMap Init #######" );
			console.log( "openLayers Map : " );
			console.log( _self.olMap );
			console.log( "Projection : " + _self.mapCRS );
		} )();
		// END initialize


		return {
			_this : _self,
			refresh : _self.refresh,
			getCRS : _self.getCRS,
			getMap : _self.getMap,
			setExtent : _self.setExtent,
			getLayers : _self.getLayers,
			setAltKeyOnly : _self.setAltKeyOnly,
			removeLayer : _self.removeLayer,
			addWMSLayer : _self.addWMSLayer,
			addWFSLayer : _self.addWFSLayer,
			addWCSLayer : _self.addWCSLayer,
			addWMTSLayer : _self.addWMTSLayer,
			addVectorLayer : _self.addVectorLayer,
			addClusterLayer : _self.addClusterLayer,
			calculateScale : _self.calculateScale,
			getDataViewId : _self.getDataViewId,
			getScaleForZoom : _self.getScaleForZoom,
			setLoadingVisible : _self.setLoadingVisible,
			removeAllListener : _self.removeAllListener,
			removeAllInteraction : _self.removeAllInteraction,
			setActiveAllInteraction : _self.setActiveAllInteraction
		}

	} );


	/**
	 * 지도 영역 스크롤 이벤트 Element
	 * 
	 * @private
	 */
	ugmp.uGisMap.prototype._createScrollElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var altEmpty = document.createElement( "div" );
		altEmpty.setAttribute( "altText", "" );
		altEmpty.style.top = "0px";
		altEmpty.style.zIndex = 2;
		altEmpty.style.opacity = 0;
		altEmpty.style.width = "100%";
		altEmpty.style.height = "100%";
		altEmpty.style.position = "absolute";
		altEmpty.style.pointerEvents = "none";
		altEmpty.style.transitionDuration = "1s";
		altEmpty.style.backgroundColor = "rgba( 0, 0, 0, 0.5 )";

		var text = document.createElement( "p" );
		text.textContent = "지도를 확대/축소하려면 Alt를 누른 채 스크롤하세요.";
		text.style.left = "0px";
		text.style.right = "0px";
		text.style.top = "50%";
		text.style.color = "white";
		text.style.fontSize = "25px";
		text.style.margin = "0 auto";
		text.style.textAlign = "center";
		text.style.position = "absolute";
		text.style.transform = "translateY(-50%)";

		altEmpty.appendChild( text );

		element.insertBefore( altEmpty, element.firstChild );

		_self.olMap.scrollCallBack = new _scrollCallBack( altEmpty, function() {
			return _self.useAltKeyOnly
		} );

		function _scrollCallBack(altElement_, getAltKeyOnly_) {
			var _this = this;

			this.tId = null;
			this.altElement = null;
			this.getAltKeyOnly = null;

			( function(altElement_, getAltKeyOnly_) {
				_this.altElement = altElement_;
				_this.getAltKeyOnly = getAltKeyOnly_;
			} )( altElement_, getAltKeyOnly_ );

			function _none() {
				_this.altElement.style.opacity = 0;
				_this.altElement.style.transitionDuration = "0.8s";
			}

			this.run = function() {
				_this.altElement.style.opacity = 1;
				_this.altElement.style.transitionDuration = "0.3s";

				window.clearTimeout( _this.tId );

				_this.tId = window.setTimeout( function() {
					_none();
				}, 1500 );
			};

			this.clear = function() {
				window.clearTimeout( _this.tId );
				_none();
			};


			return {
				run : _this.run,
				clear : _this.clear,
				getAltKeyOnly : _this.getAltKeyOnly
			}
		}
	};


	/**
	 * 로딩 심볼 Element
	 * 
	 * @private
	 */
	ugmp.uGisMap.prototype._createLoadingElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var loadingDiv = document.createElement( "div" );
		loadingDiv.id = "loadingDIV";
		loadingDiv.style.zIndex = 1;
		loadingDiv.style.top = "0px";
		loadingDiv.style.left = "0px";
		loadingDiv.style.right = "0px";
		loadingDiv.style.bottom = "0px";
		loadingDiv.style.display = "none";
		loadingDiv.style.margin = "auto";
		loadingDiv.style.position = "absolute";
		loadingDiv.style.pointerEvents = "none";

		_self.loadingSrcDiv = new Image();
		_self.loadingSrcDiv.src = ugmp.uGisConfig.getLoadingImg();
		_self.loadingSrcDiv.onload = function(evt) {
			loadingDiv.style.width = evt.target.width + "px";
			loadingDiv.style.height = evt.target.height + "px";

			loadingDiv.appendChild( _self.loadingSrcDiv );
			element.insertBefore( loadingDiv, element.firstChild );
		};


		ugmp.uGisConfig.addProgress( _self.dataViewId, function(state_) {
			if ( state_ ) {
				loadingDiv.style.display = "block";
			} else {
				loadingDiv.style.display = "none";
			}
		} );
	};


	/**
	 * Default Interactions 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Interaction의 기본 효과 제거.
	 * 
	 * -모든 Intercation 삭제 시 꼭 필요한 Interaction은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return interactions {Array.<ol.interaction.Interaction>}
	 */
	ugmp.uGisMap.prototype._createDefaultInteractions = function() {
		var interactions = [ new ol.interaction.DragRotate(), new ol.interaction.DoubleClickZoom( {
			duration : 0
		} ), new ol.interaction.PinchZoom( {
			duration : 0,
			constrainResolution : true
		} ), new ol.interaction.MouseWheelZoom( {
			constrainResolution : true,
			duration : 0
		} ), new ol.interaction.DragZoom( {
			duration : 0,
			condition : ol.events.condition.shiftKeyOnly
		} ), new ol.interaction.DragPan( {
			kinetic : false
		} ) ];

		for ( var i in interactions ) {
			interactions[ i ].set( "necessary", true );
		}

		return interactions;
	};


	/**
	 * Default Controls 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Control의 기본 효과 제거.
	 * 
	 * -모든 Control 삭제 시 꼭 필요한 Control은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return controls {Array.<ol.control.Control>}
	 */
	ugmp.uGisMap.prototype._createDefaultControls = function() {
		var controls = [ new ol.control.Rotate(), new ol.control.Zoom( {
			duration : 0
		} ) ];

		for ( var i in controls ) {
			controls[ i ].set( "necessary", true );
		}

		return controls;
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 설정된 ol.Map 객체를 가져온다.
	 * 
	 * @return olMap {ol.Map} ol.Map 객체.
	 */
	ugmp.uGisMap.prototype.getMap = function() {
		var _self = this._this || this;
		return _self.olMap;
	};


	/**
	 * 현재 지도 좌표계를 가져온다.
	 * 
	 * @return mapCRS {String} 현재 지도 좌표계.
	 */
	ugmp.uGisMap.prototype.getCRS = function() {
		var _self = this._this || this;
		return _self.mapCRS;
	};


	/**
	 * 지정된 Extent로 지도 영역 맞추기.
	 * 
	 * @param envelop {Array.<Double>} Extent.
	 */
	ugmp.uGisMap.prototype.setExtent = function(envelop_) {
		var _self = this._this || this;
		_self.olMap.getView().fit( envelop_ );
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 추가된 {@link ugmp.layer} 목록을 가져온다.
	 * 
	 * @param layerType {String} 레이어 타입. (WMS, WFS, WMTS, Vector...)
	 * 
	 * @return layers {Array.<ugmp.layer>} 레이어 목록.
	 */
	ugmp.uGisMap.prototype.getLayers = function(layerType_) {
		var _self = this._this || this;

		var layers = [];

		if ( _self.layers && layerType_ ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getLayerType() === layerType_ ) {
					layers.push( layer );
				}
			}
		} else {
			layers = _self.layers;
		}

		return layers;
	};


	/**
	 * WMS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWMSLayer {ugmp.layer.uGisWMSLayer} {@link ugmp.layer.uGisWMSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.resolution {Float} 레이어 추가 후 설정될 resolution.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWMS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWMSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWMSLayer = ( options.uWMSLayer !== undefined ) ? options.uWMSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;
		var resolution = ( options.resolution !== undefined ) ? options.resolution : undefined;

		var deferred = _$.Deferred();

		try {
			_self.olMap.addLayer( uWMSLayer.getOlLayer() );
			_self.layers.push( uWMSLayer );

			var source = uWMSLayer.getOlLayer().getSource();
			source.on( [ "imageloadstart", "tileloadstart" ], function(evt) {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( [ "imageloadend", "tileloadend" ], function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( [ "imageloaderror", "tileloaderror" ], function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );


			/**
			 * extent로 이동
			 */
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent ) ) {
					for ( var i in extent ) {
						extent[ i ] = parseFloat( extent[ i ] );
					}

					_self.setExtent( extent );

					if ( resolution ) {
						_olMap.getView().setResolution( resolution );
					}
				} else {
					var capabilities = new ugmp.service.uGisGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : uWMSLayer.getServiceURL(),
						dataViewId : _self.dataViewId
					} );

					capabilities.then(
							function(result_) {

								if ( result_.state ) {
									var transExtent = ol.proj.transformExtent( capabilities.data.serviceMetaData.maxExtent,
											capabilities.data.serviceMetaData.crs, _self.mapCRS );
									_self.setExtent( transExtent );
								} else {
									ugmp.uGisConfig.alert_Error( result_.message );
									deferred.reject( result_.message );
									return deferred.promise();
								}

							} ).fail( function(e) {
						ugmp.uGisConfig.alert_Error( "Error : " + e );
						deferred.reject( false );
						return deferred.promise();
					} );
				}

			}

			deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WFS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWFSLayer {ugmp.layer.uGisWFSLayer} {@link ugmp.layer.uGisWFSLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWFSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWFSLayer = ( options.uWFSLayer !== undefined ) ? options.uWFSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olWFSLayer = uWFSLayer.getOlLayer();
			_self.olMap.addLayer( olWFSLayer );
			_self.layers.push( uWFSLayer );

			var uFeatures = uWFSLayer.getFeatures( undefined, _self.dataViewId );

			uFeatures.then( function(result_) {

				if ( result_.state ) {
					olWFSLayer.getSource().addFeatures( result_.features );

					if ( useExtent ) {
						var transExtent = ol.proj.transformExtent( olWFSLayer.getSource().getExtent(), uWFSLayer.srsName, _self.mapCRS );
						_self.setExtent( transExtent );
					}

					deferred.resolve( true );
				} else {
					ugmp.uGisConfig.alert_Error( result_.message );
					deferred.reject( result_.message );
					return deferred.promise();
				}

			} ).fail( function(e) {
				ugmp.uGisConfig.alert_Error( "Error : " + e );
				deferred.reject( false );
				return deferred.promise();
			} );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WCS 레이어 추가
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWCSLayer {ugmp.layer.uGisWCSLayer} {@link ugmp.layer.uGisWCSLayer} 객체.
	 * @param opt_options.extent {Array} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부. Default is `false`.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWCS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWCSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWCSLayer = ( options.uWCSLayer !== undefined ) ? options.uWCSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWCSLayer = uWCSLayer.getOlLayer();

			if ( uWCSLayer.getBoundingBox() && uWCSLayer.getBoundingBox().length > 3 ) {

				_self.olMap.addLayer( olWCSLayer );
				_self.layers.push( uWCSLayer );
				
				uWCSLayer.setMap( _self.olMap, _load );
				
				var extent = ol.proj.transformExtent( uWCSLayer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				deferred.resolve( true );
			} else {
				var capabilities = new ugmp.service.uGisGetCapabilitiesWCS( {
					useProxy : true,
					version : uWCSLayer.version,
					serviceURL : uWCSLayer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var serviceMetaData = capabilities.data.serviceMetaData;
						var coverageList = serviceMetaData.coverages;

						for ( var i in coverageList ) {
							if ( coverageList[ i ][ "Identifier" ] === uWCSLayer.identifier ) {
								uWCSLayer.setBoundingBox( coverageList[ i ][ "BBOX" ] );
								break;
							}
						}

						_self.olMap.addLayer( olWCSLayer );
						_self.layers.push( uWCSLayer );
						
						uWCSLayer.setMap( _self.olMap, _load );
						
						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( uWCSLayer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						deferred.resolve( true );

					} else {
						ugmp.uGisConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}


		function _load(state_) {
			if ( ugmp.uGisConfig.isUseLoading() ) {
				ugmp.uGisConfig.loading( _self.dataViewId, state_ );
			}
		}

		return deferred.promise();
	};


	/**
	 * WMTS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWMTSLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWMTS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWMTSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWMTSLayer = ( options.uWMTSLayer !== undefined ) ? options.uWMTSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWMTSLayer = uWMTSLayer.getOlLayer();

			if ( uWMTSLayer.getWmtsCapabilities() && uWMTSLayer.getOriginExtent() ) {
				uWMTSLayer.update( true );
				_self.olMap.addLayer( olWMTSLayer );
				_self.layers.push( uWMTSLayer );
				var extent = ol.proj.transformExtent( uWMTSLayer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				setOn();
				deferred.resolve( true );
			} else {
				var capabilities = new ugmp.service.uGisGetCapabilitiesWMTS( {
					useProxy : true,
					version : uWMTSLayer.version,
					serviceURL : uWMTSLayer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var layers = capabilities.data.olJson.Contents.Layer;

						for ( var i in layers ) {
							if ( layers[ i ][ "Identifier" ] === uWMTSLayer.layer ) {
								uWMTSLayer.setOriginExtent( layers[ i ][ "WGS84BoundingBox" ] );
								break;
							}
						}

						uWMTSLayer.setWmtsCapabilities( capabilities.data );

						uWMTSLayer.update( true );

						_self.olMap.addLayer( olWMTSLayer );
						_self.layers.push( uWMTSLayer );

						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( uWMTSLayer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						setOn();

						deferred.resolve( true );

					} else {
						ugmp.uGisConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			// deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}

		function setOn() {
			var source = uWMTSLayer.getOlLayer().getSource();
			source.on( "tileloadstart", function(evt) {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( "tileloadend", function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( "tileloaderror", function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
		}

		return deferred.promise();
	};


	/**
	 * Vector 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uVectorLayer {ugmp.layer.uGisVectorLayer} {@link ugmp.layer.uGisVectorLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addVectorLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uVectorLayer = ( options.uVectorLayer !== undefined ) ? options.uVectorLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olVectorLayer = uVectorLayer.getOlLayer();
			_self.olMap.addLayer( olVectorLayer );
			_self.layers.push( uVectorLayer );

			if ( useExtent ) {
				var extent = olVectorLayer.getSource().getExtent();

				if ( extent && extent[ 0 ] !== Infinity ) {
					var transExtent = ol.proj.transformExtent( olVectorLayer.getSource().getExtent(), uVectorLayer.srsName, _self.mapCRS );
					_self.setExtent( transExtent );
				}
			}

			deferred.resolve( true );
		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};

	
	/**
	 * Cluster 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uClusterLayer {ugmp.layer.uGisClusterLayer} {@link ugmp.layer.uGisClusterLayer} 객체.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addClusterLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uClusterLayer = ( options.uClusterLayer !== undefined ) ? options.uClusterLayer : undefined;

		var deferred = _$.Deferred();

		try {
			var olClusterLayer = uClusterLayer.getOlLayer();
			_self.olMap.addLayer( olClusterLayer );
			_self.layers.push( uClusterLayer );

			deferred.resolve( true );
		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};
	

	/**
	 * 지도 새로고침.
	 */
	ugmp.uGisMap.prototype.refresh = function() {
		var _self = this._this || this;

		if ( _self.olMap ) {
			var view = _self.olMap.getView();
//			view.setCenter( [ view.getCenter()[ 0 ] + 5, view.getCenter()[ 1 ] ] );
			view.setCenter( [ view.getCenter()[ 0 ] + 0.0001, view.getCenter()[ 1 ] ] );

			window.setTimeout( function() {
				view.setCenter( [ view.getCenter()[ 0 ] - 0.0001, view.getCenter()[ 1 ] ] );
			}, 1 );

			_self.olMap.updateSize();
		}
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 등록된 {@link ugmp.layer}를 삭제한다.
	 * 
	 * @param uGisLayerKey {String} 삭제할 {@link ugmp.layer}의 KEY.
	 */
	ugmp.uGisMap.prototype.removeLayer = function(uGisLayerKey_) {
		var _self = this._this || this;

		for ( var i = 0; i < _self.layers.length; i++ ) {
			var uGisLayer = _self.layers[ i ];

			if ( uGisLayer.getLayerKey() === uGisLayerKey_ ) {
				uGisLayer.destroy();
				_self.olMap.removeLayer( uGisLayer.getOlLayer() );
				_self.layers.splice( i, 1 );
			}
		}
	};


	/**
	 * Temp Scale -> Resolution
	 * 
	 * @param scale {Double} scale
	 * 
	 * @private
	 * 
	 * @return resolution {Double} resolution
	 */
	ugmp.uGisMap.prototype.getResolutionFromScale = function(scale_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return scale_ / ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * Temp Resolution -> Scale
	 * 
	 * @param resolution {Double} resolution
	 * 
	 * @private
	 * 
	 * @return scale {Double} scale
	 */
	ugmp.uGisMap.prototype.getScaleFromResolution = function(resolution_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return resolution_ * ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * 현재 지도에서 해당 Extent의 스케일을 계산한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.extent {Array.<Number>} 스케일을 계산할 Extent. Default is 현재 지도 영역.
	 * @param opt_options.originCRS {String} 레이어 원본 좌표계. Default is 현재 지도 좌표계.
	 * 
	 * @return scale {Double} 스케일.
	 */
	ugmp.uGisMap.prototype.calculateScale = function(opt_options) {
		var _self = this._this || this;

		var scale = null;
		var extent = null;
		var viewCRS = null;
		var originCRS = null;
		var PPI = 0.000264583;

		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			viewCRS = _self.mapCRS;
			originCRS = ( options.originCRS !== undefined ) ? options.originCRS : _self.getCRS();
			extent = ( options.extent !== undefined ) ? options.extent : _self.olMap.getView().calculateExtent( _self.olMap.getSize() );

			var mapDistance;
			var canvasDistance;

			var eWidth = ol.extent.getWidth( extent );
			var eHeight = ol.extent.getHeight( extent );

			var pixelWidth = _self.olMap.getSize()[ 0 ];
			var pixelHeight = _self.olMap.getSize()[ 1 ];

			var resX = eWidth / pixelWidth;
			var resY = eHeight / pixelHeight;

			if ( resX >= resY ) {
				mapDistance = _getMapWidthInMeter();
				canvasDistance = pixelWidth * PPI;
				scale = mapDistance / canvasDistance;
			} else {
				mapDistance = _getMapHeightInMeter();
				canvasDistance = pixelHeight * PPI;
				scale = mapDistance / canvasDistance;
			}

		} )( opt_options );


		function _getMapWidthInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 2 ], extent[ 1 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getMapHeightInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 0 ], extent[ 3 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getDistanceInMeter(p1_, p2_) {
			var latLon1 = _getLatLon( p1_ );
			var latLon2 = _getLatLon( p2_ );

			var dx = latLon2[ 0 ] - latLon1[ 0 ];
			var dy = latLon2[ 1 ] - latLon1[ 1 ];

			return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
		}


		function _getLatLon(p_) {
			var latLon = new Array( 2 );

			if ( viewCRS === null || ( viewCRS === originCRS ) ) {
				latLon[ 0 ] = p_[ 0 ];
				latLon[ 1 ] = p_[ 1 ];

				return latLon;
			}

			try {
				var np = ol.proj.transform( p_, viewCRS, originCRS );

				latLon[ 0 ] = np[ 0 ];
				latLon[ 1 ] = np[ 1 ];

				return latLon;
			} catch ( e ) {

			}
		}

		return scale;
	};


	/**
	 * 현재 지도에서 해당 줌 레벨의 스케일을 계산한다.
	 * 
	 * @param zoom {Integer} 줌 레벨.
	 * 
	 * @return scale {Double} 스케일.
	 */
	ugmp.uGisMap.prototype.getScaleForZoom = function(zoom_) {
		var _self = this._this || this;

		var resolution = _self.olMap.getView().getResolutionForZoom( zoom_ );

		var eWidth = resolution * _self.olMap.getSize()[ 0 ];
		var eHeight = resolution * _self.olMap.getSize()[ 1 ];

		var dummyExtent = [ 0, 0, eWidth, eHeight ];

		return _self.calculateScale( {
			extent : dummyExtent,
			originCRS : _self.getCRS()
		} );
	};


	/**
	 * 현재 지도에 등록된 모든 이벤트리스너를 제거한다.
	 * 
	 * @param type {String} 이벤트 타입
	 */
	ugmp.uGisMap.prototype.removeAllListener = function(type_) {
		var _self = this._this || this;

		var clickListeners = ol.events.getListeners( _self.olMap, type_ );
		for ( var i = clickListeners.length - 1; i >= 0; i-- ) {
			ol.Observable.unByKey( clickListeners[ i ] );
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction을 제거한다. (Default Interaction 제외)
	 */
	ugmp.uGisMap.prototype.removeAllInteraction = function() {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( !( interactions[ i ].get( "necessary" ) ) ) {
				_self.olMap.removeInteraction( interactions[ i ] );
			}
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction 사용 설정. (Default Interaction 포함)
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setActiveAllInteraction = function(state_) {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			interactions[ i ].setActive( state_ );
		}
	};


	/**
	 * 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setAltKeyOnly = function(state_) {
		var _self = this._this || this;

		if ( _self.useAltKeyOnly === state_ ) {
			return;
		}
		_self.useAltKeyOnly = state_;
	};


	/**
	 * 로딩 심볼 표시 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setLoadingVisible = function(state_) {
		var _self = this._this || this;

		if ( state_ ) {
			_self.loadingSrcDiv.style.display = "block";
		} else {
			_self.loadingSrcDiv.style.display = "none";
		}
	};


	/**
	 * 현재 지도의 View ID를 가져온다. View ID는 고유값이므로 해당 지도의 Key로 사용한다.
	 * 
	 * @return dataViewId {String} View ID.
	 */
	ugmp.uGisMap.prototype.getDataViewId = function() {
		var _self = this._this || this;
		return _self.dataViewId;
	};

} )();
