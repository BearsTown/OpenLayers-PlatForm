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

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "google";
			options.projection = "EPSG:900913";
			options.maxExtent = ol.proj.get( "EPSG:900913" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "roadmap", // google.maps.MapTypeId.ROADMAP
					minZoom : 0,
					maxZoom : 21
				},
				satellite : {
					id : "satellite", // google.maps.MapTypeId.SATELLITE
					minZoom : 0,
					maxZoom : 19
				},
				hybrid : {
					id : "hybrid", // google.maps.MapTypeId.HYBRID
					minZoom : 0,
					maxZoom : 19
				},
				terrain : {
					id : "terrain", // google.maps.MapTypeId.TERRAIN
					minZoom : 0,
					maxZoom : 19
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "google.maps.MapTypeId" );

			if ( !_self.isAvailables() ) {
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
			var googleLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( googleLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var googleCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( {
				lat : googleCenter[ 1 ],
				lng : googleCenter[ 0 ]
			} );
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
	ugmp.baseMap.uGisBaseMapGoogle.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var googleMapOptions = {
			zoom : 4,
			center : {
				lat : -33,
				lng : 151
			},
			disableDefaultUI : true
		};

		_self.apiMap = new google.maps.Map( document.getElementById( target_ ), googleMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.setMapType = function(type_, loadEvents_) {
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
	ugmp.baseMap.uGisBaseMapGoogle.prototype.updateSize = function() {
		var _self = this._this || this;
		google.maps.event.trigger( _self.apiMap, "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 구글 지도 API events tilesloadstart 미지원
		google.maps.event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		google.maps.event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();
