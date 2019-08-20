( function() {
	"use strict";

	/**
	 * 네이버 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapNaver = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "naver";
			options.projection = "EPSG:5181";
			options.maxExtent = ol.proj.get( "EPSG:5181" ).getExtent();
			options.mapTypes = {
				normal : {
					id : naver.maps.MapTypeId[ "NORMAL" ], // normal
					minZoom : 1,
					maxZoom : 14
				},
				satellite : {
					id : naver.maps.MapTypeId[ "SATELLITE" ], // satellite
					minZoom : 1,
					maxZoom : 14
				},
				hybrid : {
					id : naver.maps.MapTypeId[ "HYBRID" ], // hybrid
					minZoom : 1,
					maxZoom : 14
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "naver.maps.MapTypeId" );

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
			var naverLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( naverLevel, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var naverCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( new naver.maps.LatLng( naverCenter[ 1 ], naverCenter[ 0 ] ) );
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


	ugmp.baseMap.uGisBaseMapNaver.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapNaver.prototype.constructor = ugmp.baseMap.uGisBaseMapNaver;


	/**
	 * 네이버 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var naverMapOptions = {
			center : new naver.maps.LatLng( 37.3595704, 127.105399 ),
			level : 3
		};

		_self.apiMap = new naver.maps.Map( target_, naverMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.trigger( "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 네이버 지도 API events tilesloadstart 미지원
		naver.maps.Event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		naver.maps.Event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();
