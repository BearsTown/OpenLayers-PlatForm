( function() {
	"use strict";

	/**
	 * vWorld 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapVWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "vworld.Layers.Base" );

			if ( !_self.isAvailable ) {
				return false;
			}

			options.isWorld = false;
			options.isFactor = true;
			options.baseCode = "vWorld";
			options.projection = "EPSG:900913";
			options.maxExtent = [ 12873319.534819111, 3857406.4178978344, 15494719.534819111, 5166406.417897834 ];
			options.mapTypes = {
				normal : {
					id : "VBASE",
					layer : function() {
						return [ new vworld.Layers.Base( "VBASE" ) ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						vSat.max_level = 19;
						return [ vSat ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						var vHybrid = new vworld.Layers.Hybrid( "VHYBRID" );
						vSat.max_level = 19;
						vHybrid.max_level = 19;
						return [ vSat, vHybrid ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						return [ new vworld.Layers.Gray( "VGRAY" ) ];
					},
					minZoom : 6,
					maxZoom : 18
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						return [ new vworld.Layers.Midnight( "VMIDNIGHT" ) ];
					},
					minZoom : 6,
					maxZoom : 18
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

			var vWorldCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:900913" );
			vWorldCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var vWorldLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( vWorldCenter, vWorldLevel, false, false );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapFunc : syncMapFunc
		} );

	} );


	ugmp.baseMap.uGisBaseMapVWorld.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapVWorld.prototype.constructor = ugmp.baseMap.uGisBaseMapVWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.createBaseMap = function(target_, type_) {
		var _self = this._this || this;

		var options = {
			units : "m",
			controls : [],
			numZoomLevels : 21,
			projection : new OpenLayers.Projection( "EPSG:900913" ),
			displayProjection : new OpenLayers.Projection( "EPSG:900913" )
		};

		_self.apiMap = new OpenLayers.Map( target_, options );
		_self.setMapType( type_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.setMapType = function(type_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.layers );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.layers.length > 0 ) {
			_self._removeAllLayer( _self.apiMap.layers );
		}
	};

} )();
