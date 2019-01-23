( function() {
	"use strict";

	/**
	 * 구글 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapGoogle = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "google.maps.MapTypeId" );

			if ( !_self.isAvailables() ) {
				return false;
			}

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "google";
			options.projection = "EPSG:900913";
			options.maxExtent = ol.proj.get( "EPSG:900913" ).getExtent();
			options.mapTypes = {
				normal : {
					id : google.maps.MapTypeId.ROADMAP, // roadmap
					minZoom : 0,
					maxZoom : 21
				},
				satellite : {
					id : google.maps.MapTypeId.SATELLITE, // satellite
					minZoom : 0,
					maxZoom : 19
				},
				hybrid : {
					id : google.maps.MapTypeId.HYBRID, // hybrid
					minZoom : 0,
					maxZoom : 19
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

			var googleCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			var googleLevel = syncData[ "zoom" ];

			_self.apiMap.setZoom( googleLevel );
			_self.apiMap.setCenter( {
				lat : googleCenter[ 1 ],
				lng : googleCenter[ 0 ]
			} );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapFunc : syncMapFunc
		} );

	} );


	ugmp.baseMap.uGisBaseMapGoogle.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapGoogle.prototype.constructor = ugmp.baseMap.uGisBaseMapGoogle;


	/**
	 * 구글 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.createBaseMap = function(target_, type_) {
		var _self = this._this || this;

		var googleMapOptions = {
			zoom : 4,
			center : {
				lat : -33,
				lng : 151
			},
			disableDefaultUI : true
		};

		_self.apiMap = new google.maps.Map( document.getElementById( target_ ), googleMapOptions );
		_self.setMapType( type_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.setMapType = function(type_) {
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
	ugmp.baseMap.uGisBaseMapGoogle.prototype.updateSize = function() {
		var _self = this._this || this;
		google.maps.event.trigger( _self.apiMap, "resize" );
	};

} )();
