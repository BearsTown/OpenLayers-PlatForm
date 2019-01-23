( function() {
	"use strict";

	/**
	 * OpenStreet 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapOSM = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			var grayURL = "http://{a-c}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png";

			if ( ugmp.uGisConfig.isMapProxy() ) {
				grayURL = ugmp.uGisConfig.getProxy() + grayURL;
			}

			_self.checkIsAvailable( "new ol.layer.Tile" );

			if ( !_self.isAvailable ) {
				return false;
			}

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "osm";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : new ol.layer.Tile( {
						source : new ol.source.OSM()
					} ),
					minZoom : 0,
					maxZoom : 21
				},
				gray : {
					id : "gray",
					layer : new ol.layer.Tile( {
						source : new ol.source.XYZ( {
							url : grayURL
						} )
					} ),
					minZoom : 0,
					maxZoom : 18
				},
				none : {
					id : "none",
					layer : new ol.layer.Tile(),
					minZoom : 0,
					maxZoom : 21
				}
			};

			_self.init( options );

		} )();
		// END initialize


		/**
		 * 지도 화면 이동 이벤트 동기화
		 * 
		 * @param evt {function} <change:resolution|change:center>
		 */
		function syncMapFunc(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			var osmLevel = syncData[ "zoom" ];

			_self.apiMap.getView().setZoom( osmLevel );
			_self.apiMap.getView().setCenter( osmCenter );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapFunc : syncMapFunc
		} );

	} );


	ugmp.baseMap.uGisBaseMapOSM.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapOSM.prototype.constructor = ugmp.baseMap.uGisBaseMapOSM;


	/**
	 * OpenStreetMap 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.createBaseMap = function(target_, type_) {
		var _self = this._this || this;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.setMapType = function(type_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ] );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};

} )();
