( function() {
	"use strict";

	/**
	 * 다음 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapDaum = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "daum.maps.MapTypeId" );

			if ( !_self.isAvailable ) {
				return false;
			}

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "daum";
			options.projection = "EPSG:5181";
			options.maxExtent = ol.proj.get( "EPSG:5181" ).getExtent();
			options.mapTypes = {
				normal : {
					id : daum.maps.MapTypeId[ "NORMAL" ], // 1
					minZoom : 1,
					maxZoom : 14
				},
				satellite : {
					id : daum.maps.MapTypeId[ "SKYVIEW" ], // 2
					minZoom : 1,
					maxZoom : 15
				},
				hybrid : {
					id : daum.maps.MapTypeId[ "HYBRID" ], // 3
					minZoom : 1,
					maxZoom : 15
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

			var daumCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			var daumLevel = ( 15 - syncData[ "zoom" ] );

			_self.apiMap.setLevel( daumLevel );
			_self.apiMap.setCenter( new daum.maps.LatLng( daumCenter[ 1 ], daumCenter[ 0 ] ) );
			_self.apiMap.relayout();
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapFunc : syncMapFunc
		} );

	} );


	ugmp.baseMap.uGisBaseMapDaum.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapDaum.prototype.constructor = ugmp.baseMap.uGisBaseMapDaum;


	/**
	 * 다음 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.createBaseMap = function(target_, type_) {
		var _self = this._this || this;

		var mapContainer = document.getElementById( target_ );
		var daumMapOptions = {
			center : new daum.maps.LatLng( 33.450701, 126.570667 ),
			level : 3
		};

		_self.apiMap = new daum.maps.Map( mapContainer, daumMapOptions );
		_self.setMapType( type_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.setMapType = function(type_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.relayout();
	};

} )();
