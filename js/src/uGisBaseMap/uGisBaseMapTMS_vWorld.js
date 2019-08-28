( function() {
	"use strict";

	/**
	 * TMS_vWorld 배경지도 객체.
	 * 
	 * vWorld 배경지도를 특정 좌표계로 설정하여 TMS 배경지도로 사용할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `TMS`.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.projection = options.projection;
			options.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "TMS";
			options.maxExtent = ol.proj.get( options.projection ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						var base = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Base/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ base ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						return [ satellite ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						var hybrid = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Hybrid/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ satellite, hybrid ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						var gray = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/gray/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ gray ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						var midnight = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/midnight/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ midnight ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			var projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";

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
			// var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			var osmCenter = syncData[ "center" ];
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


	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.constructor = ugmp.baseMap.uGisBaseMapTMS_vWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				projection : _self.projection,
				zoom : 2
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
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers().getArray() );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		for ( var i = layers_.length - 1; i >= 0; i-- ) {
			_self.apiMap.removeLayer( layers_[ i ] );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layers = _self.apiMap.getLayers().getArray();

		for ( var i in layers ) {
			var source = layers[ i ].getSource();
			source.on( [ "tileloadstart" ], function() {
				loadEvents_.call( this, true );
			} );
			source.on( [ "tileloadend" ], function() {
				loadEvents_.call( this, false );
			} );
			source.on( [ "tileloaderror" ], function() {
				loadEvents_.call( this, false );
			} );
		}
	};

} )();
