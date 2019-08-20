( function() {
	"use strict";

	/**
	 * 사용자 정의 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var custom = new ugmp.baseMap.uGisBaseMapCustom( {
	 * 	baseMapKey : 'custom_code1',
	 * 	uWMTSLayer : new ugmp.layer.uGisWMTSLayer({...}),
	 * 	capabilities : new ugmp.service.uGisGetCapabilitiesWMTS({...}).data,
	 * 	isWorld : true,
	 * 	isFactor : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseMapKey {String} 베이스맵 코드명 (custom_XXX).
	 * @param opt_options.uWMTSLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.capabilities {ugmp.service.uGisGetCapabilitiesWMTS} {@link ugmp.service.uGisGetCapabilitiesWMTS} WMTS capabilities
	 *            객체.
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapCustom = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;
		this.capabilities = null;
		this.uWMTSLayer = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;
			_self.uWMTSLayer = ( options.uWMTSLayer !== undefined ) ? options.uWMTSLayer : undefined;

			if ( !_self.capabilities ) {
				ugmp.uGisConfig.alert_Error( "capabilities undefined" );
				_self.isAvailable = false;
				return false;
			}

			if ( !_self.uWMTSLayer ) {
				ugmp.uGisConfig.alert_Error( "uWMTSLayer undefined" );
				_self.isAvailable = false;
				return false;
			}

			options.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
			options.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
			options.baseCode = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "custom_code";
			options.projection = _self.capabilities.serviceMetaData.crs;

			if ( options.projection.indexOf( "urn:ogc:def:crs:EPSG:" ) > -1 ) {
				options.projection = options.projection.replace( "urn:ogc:def:crs:EPSG:", "EPSG" );
			}

			var layers = _self.capabilities.olJson.Contents.Layer;
			for ( var i in layers ) {
				if ( layers[ i ][ "Identifier" ] === _self.uWMTSLayer.layer ) {
					options.maxExtent = ol.proj.transformExtent( layers[ i ][ "WGS84BoundingBox" ], "EPSG:4326", options.projection );
					break;
				}
			}

			var tilems = _self.capabilities.olJson.Contents.TileMatrixSet;

			for ( var i in tilems ) {
				if ( tilems[ i ][ "Identifier" ] === _self.uWMTSLayer.matrixSet ) {
					_self.resolutions = [];
					var tileMatrixs = tilems[ i ][ "TileMatrix" ];
					for ( var j in tileMatrixs ) {
						_self.resolutions.push( tileMatrixs[ j ][ "ScaleDenominator" ] * 0.000264583 );
					}

					options.mapTypes = {};
					options.mapTypes[ options.baseCode ] = {
						id : options.baseCode,
						minZoom : 0,
						resolutions : _self.resolutions,
						maxZoom : tilems[ i ][ "TileMatrix" ].length - 1
					};
					break;
				}
			}

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapCustom.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapCustom.prototype.constructor = ugmp.baseMap.uGisBaseMapCustom;


	/**
	 * Customize Map 맵을 생성한다.
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			projection : _self.projection,
			view : new ol.View( {
				zoom : 2,
				center : [ 0, 0 ],
				projection : _self.projection,
				minZoom : _self.mapTypes[ type_ ][ "minZoom" ],
				maxZoom : _self.mapTypes[ type_ ][ "maxZoom" ],
				resolutions : _self.mapTypes[ type_ ][ "resolutions" ]
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		_self.uWMTSLayer.setWmtsCapabilities( _self.capabilities );
		_self.uWMTSLayer.update( true );
		_self.apiMap.addLayer( _self.uWMTSLayer.getOlLayer() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();
