( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 배경지도 객체.
	 * 
	 * 다양하게 제공되는 지도 API나 WMTS 서비스를 배경지도로 사용할 수 있다.
	 * 
	 * uGisMapPlatForm에서 기본적으로 내장한 배경지도 API는 다음과 같으며 API KEY가 정상적일 경우에만 사용할 수 있다.
	 * 
	 * 1. Google(normal, hybrid)
	 * 
	 * 2. OpenStreetMap(none, normal, gray)
	 * 
	 * 3. Stamen(toner, terrain)
	 * 
	 * 4. vWorld(normal, hybrid, gray, midnight)
	 * 
	 * 5. 바로E맵(normal, white, colorVision)
	 * 
	 * 6. 네이버(normal, hybrid)
	 * 
	 * 7. 다음(normal, hybrid)
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugBaseMap = new ugmp.baseMap.uGisBaseMap( {
	 * 	target : 'base',
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	baseMapKey : 'google_normal'
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.target {String} 배경지도 DIV ID.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.baseMapKey {String} 배경지도 Key ( _로 구분 ). Default is `osm_normal`.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMap = ( function(opt_options) {
		var _self = this;

		this.target = null;
		this.uGisMap = null;

		this.nowMapView = null;
		this.baseMapList = null;
		this.nowBaseMapKey = null;

		this.key_zoomEnd = null;
		this.key_changeCenter = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.target = ( options.target !== undefined ) ? options.target : undefined;
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.nowBaseMapKey = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "osm_normal";

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_self.addBaseMapType( "osm", new ugmp.baseMap.uGisBaseMapOSM() );
			_self.addBaseMapType( "daum", new ugmp.baseMap.uGisBaseMapDaum() );
			_self.addBaseMapType( "naver", new ugmp.baseMap.uGisBaseMapNaver() );
			_self.addBaseMapType( "vWorld", new ugmp.baseMap.uGisBaseMapVWorld() );
			_self.addBaseMapType( "baroEmap", new ugmp.baseMap.uGisBaseMapBaroEmap() );
			_self.addBaseMapType( "stamen", new ugmp.baseMap.uGisBaseMapStamen() );
			_self.addBaseMapType( "google", new ugmp.baseMap.uGisBaseMapGoogle() );

			_self.callBaseMapType( _self.nowBaseMapKey );

			_self.setVisible( true );
		} )();
		// END initialize


		return {
			_this : _self,
			remove : _self.remove,
			getVisible : _self.getVisible,
			setVisible : _self.setVisible,
			getOpacity : _self.getOpacity,
			setOpacity : _self.setOpacity,
			visibleToggle : _self.visibleToggle,
			changeBaseMap : _self.changeBaseMap,
			addBaseMapType : _self.addBaseMapType,
			getSelectedBaseMap : _self.getSelectedBaseMap,
			getUsableBaseMapList : _self.getUsableBaseMapList
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype.callBaseMapType = function(baseMapKey_) {
		var _self = this._this || this;

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			ugmp.uGisConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];
		var properties = baseMap.getTypeProperties( type );

		baseMap.createBaseMap( _self.target, type );

		var view = _self._createView( baseMap, type );

		_self._activeChangeResolution( baseMap );

		_self._transformLayerProjection( _self.uGisMap.getMap().getView().getProjection().getCode(), properties[ "projection" ] );

		_self.uGisMap.getMap().setView( view );

		view.setCenter( [ view.getCenter()[ 0 ] + 5, view.getCenter()[ 1 ] ] );
		view.setCenter( [ view.getCenter()[ 0 ] - 5, view.getCenter()[ 1 ] ] );

		_$( "#" + _self.target ).resize( function() {
			if ( baseMap.updateSize ) {
				baseMap.updateSize();
			}
		} );

		_$( window ).resize( function() {
			if ( _self._updateSize ) {
				_self._updateSize();
			}
		} );
	};


	/**
	 * uGisMap <==> uGisBaseMap 동기화 설정 사용
	 * 
	 * @param baseMap {ugmp.baseMap} 배경지도 객체
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.uGisMap.getMap().getView();

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_zoomEnd );
			ol.Observable.unByKey( _self.key_changeCenter );
			ol.Observable.unByKey( _self.key_changeResolution );

			_self.key_changeCenter = evt1_.target.getView().on( "change:center", baseMap_.syncMapFunc );
			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			var targetView = view_;

			var zoomEnd = function(evt2_) {
				var v = evt2_.map.getView();
				var newZoomLevel = v.getZoom();

				if ( currentZoomLevel != newZoomLevel ) {
					currentZoomLevel = newZoomLevel;
					baseMap_.syncMapFunc( evt2_ );
				}

				_self.key_zoomEnd = _self.uGisMap.getMap().once( "moveend", function(evt3_) {
					zoomEnd( evt3_ );
				} );
			};


			_self.key_changeResolution = targetView.once( "change:resolution", function(evt4_) {
				_self.uGisMap.getMap().once( "moveend", function(evt5_) {
					zoomEnd( evt5_ );
				} );
			} );

		}
	};


	/**
	 * 배경지도를 추가한다.
	 * 
	 * {@link ugmp.baseMap.uGisBaseMapDefault ugmp.baseMap.uGisBaseMapDefault}를 확장한 배경지도 객체 또는 사용자 정의 배경지도(WMTS)를 추가할 수 있다.
	 * 
	 * 사용자 정의 배경지도(WMTS)를 추가하기 위해서는 {@link ugmp.baseMap.uGisBaseMapCustom ugmp.baseMap.uGisBaseMapCustom}를 사용한다.
	 * 
	 * 기본 내장 배경지도 코드. ["osm", "daum", "naver", "vWorld", "baroEmap", "stamen", "google"]
	 * 
	 * @param code {String} 배경지도 코드.
	 * @param obj {Object} etc -> uGisBaseMapCustom.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.addBaseMapType = function(code_, obj_) {
		var _self = this._this || this;

		_self.baseMapList = _self.baseMapList || {};

		if ( obj_ && obj_.isAvailables() ) {
			_self.baseMapList[ code_ ] = {
				code : code_,
				object : obj_
			}
		}
	};


	/**
	 * View 생성
	 * 
	 * @param baseMap {String} 배경지도
	 * @param type {String} 배경지도 타입
	 * 
	 * @private
	 * 
	 * @return nowMapView {ol.View} 현재 Map의 View
	 */
	ugmp.baseMap.uGisBaseMap.prototype._createView = function(baseMap_, type_) {
		var _self = this._this || this;

		var properties = baseMap_.getTypeProperties( type_ );
		var oldView = _self.uGisMap.getMap().getView();

		var viewData = {
			projection : properties[ "projection" ],
			extent : properties[ "maxExtent" ],
			center : ol.proj.transform( oldView.getCenter(), oldView.getProjection(), properties[ "projection" ] ),
			zoom : oldView.getZoom(),
			minZoom : properties[ "minZoom" ],
			maxZoom : properties[ "maxZoom" ]
		};

		if ( type_.indexOf( "custom" ) > -1 ) {
			// delete viewData.minZoom;
			// delete viewData.maxZoom;
		}

		if ( properties[ "resolutions" ] ) {
			viewData.resolutions = properties[ "resolutions" ]
		}

		_self.nowMapView = new ol.View( viewData );

		return _self.nowMapView;
	};


	/**
	 * 피처 좌표계 변경
	 * 
	 * View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 레이어 정보 변경
	 * 
	 * @param source {String} 원본 좌표계
	 * @param destination {String} 변경 좌표계
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._transformLayerProjection = function(source_, destination_) {
		var _self = this._this || this;

		var layers = _self.uGisMap.getMap().getLayers().getArray();
		for ( var idx_layer in layers ) {

			if ( layers[ idx_layer ] instanceof ol.layer.Group ) {
				var orderGroupLayers = layers[ idx_layer ].getLayersArray();
				for ( var i in orderGroupLayers ) {
					transform( orderGroupLayers[ i ], source_, destination_ );
				}

			} else {
				transform( layers[ idx_layer ], source_, destination_ );
			}

		}


		function transform(layer_, source_, destination_) {
			var source = layer_.getSource();
			if ( source instanceof ol.source.TileWMS || source instanceof ol.source.ImageWMS ) {
				if ( destination_ === "EPSG:4326" ) {
					// source.getParams().CRS = "EPSG:4326";
					source.getParams().VERSION = "1.1.0";
					source.updateParams( source.getParams() );
				}
			} else if ( source instanceof ol.source.Vector ) {
				/**
				 * ★ - To do : 피처 좌표변경 추가 작업 필요.
				 */
				var features = source.getFeatures();
				for ( var idx_feature in features ) {
					features[ idx_feature ].getGeometry().transform( source_, destination_ );
				}
			}
		}
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._updateSize = function() {
		var _self = this._this || this;

		var code = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var type = _self.nowBaseMapKey.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = _self.nowBaseMapKey;
			type = _self.nowBaseMapKey;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];

		baseMap.updateSize();
	};


	/**
	 * 해당 배경지도가 사용 가능한지 확인한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._isBaseMapUsable = function(baseMapKey_) {
		var _self = this._this || this;

		var usable = true;
		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		if ( _self.baseMapList[ code ] ) {
			var baseMap = _self.baseMapList[ code ][ "object" ];
			var usableKeys = baseMap.getUsableKeys();
			if ( !( usableKeys.indexOf( baseMapKey_ ) !== -1 ) ) {
				usable = false;
			}

		} else {
			usable = false;
		}

		return usable;
	};


	/**
	 * 배경지도를 변경한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 */
	ugmp.baseMap.uGisBaseMap.prototype.changeBaseMap = function(baseMapKey_) {
		var _self = this._this || this;

		if ( baseMapKey_ === _self.nowBaseMapKey ) {
			return false;
		}

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			ugmp.uGisConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		var beforeBMCode = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var beforeBMType = _self.nowBaseMapKey.split( "_" )[ 1 ];
		var afterBMCode = baseMapKey_.split( "_" )[ 0 ];
		var afterBMType = baseMapKey_.split( "_" )[ 1 ];

		if ( beforeBMCode.indexOf( "custom" ) > -1 ) {
			beforeBMCode = _self.nowBaseMapKey;
			beforeBMType = _self.nowBaseMapKey;
		}
		if ( afterBMCode.indexOf( "custom" ) > -1 ) {
			afterBMCode = baseMapKey_;
			afterBMType = baseMapKey_;
		}

		var beforeBaseMap = _self.baseMapList[ beforeBMCode ][ "object" ];
		var afterBaseMap = _self.baseMapList[ afterBMCode ][ "object" ];

		var beforeProperties = beforeBaseMap.getTypeProperties( beforeBMType );
		var afterProperties = afterBaseMap.getTypeProperties( afterBMType );


		// 배경지도 코드가 같으면서 타입이 다를 때
		if ( ( beforeBMCode === afterBMCode ) && ( beforeBMType !== afterBMType ) ) {
			afterBaseMap.setMapType( afterBMType );
			var view = _self.nowMapView;

			view.setMinZoom( afterProperties.minZoom );
			view.setMaxZoom( afterProperties.maxZoom );
		} else {
			// 배경지도 코드가 다를 때
			var viewExtent = _self.nowMapView.calculateExtent( _self.uGisMap.getMap().getSize() );
			var beforeProjection = beforeProperties[ "projection" ];
			var afterProjection = afterProperties[ "projection" ];
			var beforeZoomCount = beforeProperties[ "zoomCount" ];
			var afterZoomCount = afterProperties[ "zoomCount" ];

			document.getElementById( _self.target ).innerHTML = "";
			document.getElementById( _self.target ).style.background = "";

			afterBaseMap.createBaseMap( _self.target, afterBMType );

			var view = _self._createView( afterBaseMap, afterBMType );

			_self._activeChangeResolution( afterBaseMap );

			if ( !( ol.proj.equivalent( ol.proj.get( beforeProjection ), ol.proj.get( afterProjection ) ) ) ) {
				_self._transformLayerProjection( beforeProjection, afterProjection );
			}

			_self.uGisMap.getMap().setView( view );

			if ( beforeBaseMap.isWorlds() ) {

				if ( !afterBaseMap.isWorlds() ) {
					// 세계 좌표계에서 변경될 때
					var afterExtent = afterProperties.maxExtent;
					afterExtent = ol.proj.transformExtent( afterExtent, afterProjection, "EPSG:3857" );
					viewExtent = ol.proj.transformExtent( viewExtent, beforeProjection, "EPSG:3857" );

					// 현재 영역이 변경되는 배경지도의 좌표계에 포함될 때
					if ( ol.extent.containsExtent( afterExtent, viewExtent ) ) {
						view.fit( ol.proj.transformExtent( viewExtent, "EPSG:3857", afterProjection ) );
						if ( afterBaseMap.isFactors() ) {
							view.setZoom( view.getZoom() + 1 );
						}
					} else {
						// 포함되지 않으면 변경되는 배경지도의 FullExtent로 설정
						view.fit( afterProperties.maxExtent );
					}
				}

			} else {
				view.fit( ol.proj.transformExtent( viewExtent, beforeProjection, afterProjection ) );

				if ( afterBaseMap.isFactors() ) {
					view.setZoom( view.getZoom() + 1 );
				}
			}

		}

		view.setCenter( [ view.getCenter()[ 0 ] + 5, view.getCenter()[ 1 ] ] );
		view.setCenter( [ view.getCenter()[ 0 ] - 5, view.getCenter()[ 1 ] ] );

		_self.nowBaseMapKey = baseMapKey_;

		console.log( "### changeBaseMap ###" );
		console.log( "baseMapType : " + _self.nowBaseMapKey );
		console.log( "View : " );
		console.log( view );
	};


	/**
	 * 사용 가능한 배경지도 타입(키) 목록을 가져온다.
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getUsableBaseMapList = function() {
		var _self = this._this || this;

		var usableBaseMapList = [];

		for ( var i in _self.baseMapList ) {
			usableBaseMapList = usableBaseMapList.concat( _self.baseMapList[ i ][ "object" ].getUsableKeys() );
		}

		return usableBaseMapList;
	};


	/**
	 * 배경지도를 삭제한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.remove = function(baseMapKey_) {
		var _self = this._this || this;

		var code = baseMapKey_.split( "_" )[ 0 ];

		// 사용자 정의 배경지도만 삭제
		if ( code.indexOf( "custom" ) > -1 ) {
			// 활성화된 배경지도 삭제 시
			if ( _self.nowBaseMapKey === baseMapKey_ ) {
				for ( var base in _self.baseMapList ) {
					if ( _self.baseMapList.hasOwnProperty( base ) ) {
						var tempBaseMap = _self.baseMapList[ base ][ "object" ].getUsableKeys()[ 0 ];
						_self.changeBaseMap( tempBaseMap );
						break;
					}
				}
			}

			delete _self.baseMapList[ baseMapKey_ ];
		}

		return _self.getUsableBaseMapList();
	};


	/**
	 * 현재 선택된 배경지도의 키를 가져온다.
	 * 
	 * @return nowBaseMapKey {String} 현재 선택된 배경지도 키.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getSelectedBaseMap = function() {
		var _self = this._this || this;
		return _self.nowBaseMapKey;
	};


	/**
	 * 배경지도의 불투명도를 가져온다.
	 * 
	 * @return opacity {Double} 배경지도 불투명도 값.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.target );

		return element.style.opacity;
	};


	/**
	 * 배경지도의 불투명도를 설정할 수 있다.
	 * 
	 * 0.0 ~ 1.0 사이의 숫자. 0.0 = 투명, 1.0 = 불투명
	 * 
	 * @param opacity {Double} 배경지도 불투명도 값.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.setOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.target );

		if ( typeof opacity_ === 'number' ) {
			element.style.opacity = opacity_;
		}
	};


	/**
	 * 배경지도의 ON/OFF 상태를 가져온다.
	 * 
	 * @return visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getVisible = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.target );

		return ( element.style.visibility === 'visible' ) ? true : false;
	};


	/**
	 * 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.setVisible = function(visible_) {
		var _self = this._this || this;

		var visibility = 'visible';
		var element = document.getElementById( _self.target );

		if ( typeof visible_ === 'boolean' ) {
			if ( !visible_ ) {
				visibility = 'hidden';
			}
		}

		element.style.visibility = visibility;
	};


	/**
	 * 배경지도의 ON/OFF 상태를 토글한다.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.visibleToggle = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.target );
		var visibility = element.style.visibility;

		if ( visibility === 'visible' ) {
			_self.setVisible( false );
		} else {
			_self.setVisible( true );
		}
	};

} )();
