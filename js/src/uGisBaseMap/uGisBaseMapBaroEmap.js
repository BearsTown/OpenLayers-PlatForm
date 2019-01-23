( function() {
	"use strict";

	/**
	 * 바로E맵 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ngii.version" );

			if ( !_self.isAvailables() ) {
				return false;
			}

			_self.resolutions = [ 1954.597389, 977.2986945, 488.64934725, 244.324673625, 122.1623368125, 61.08116840625, 30.540584203125, 15.2702921015625,
					7.63514605078125, 3.817573025390625, 1.9087865126953125, 0.9543932563476563, 0.47719662817382813, 0.23859831408691406 ];

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "baroEmap";
			options.projection = "EPSG:5179";
			options.maxExtent = ol.proj.get( "EPSG:5179" ).getExtent();
			options.mapTypes = {
				normal : {
					id : 0,
					minZoom : 0,
					maxZoom : 12
				},
				white : {
					id : 4,
					minZoom : 0,
					maxZoom : 12
				},
				colorVision : {
					id : 1,
					minZoom : 0,
					maxZoom : 12
				}
			};

			_self.init( options );

		} )();
		// END initialize


		/**
		 * 지도 화면 이동 이벤트 동기화
		 * 
		 * @param evt {Function} <change:resolution|change:center>
		 */
		function syncMapFunc(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var baroEmapCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var baroEmapLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( baroEmapCenter, baroEmapLevel, false, false );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapFunc : syncMapFunc
		} );

	} );


	ugmp.baseMap.uGisBaseMapBaroEmap.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.constructor = ugmp.baseMap.uGisBaseMapBaroEmap;


	/**
	 * 바로E맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.createBaseMap = function(target_, type_) {
		var _self = this._this || this;

		_self.apiMap = new ngii.map( target_ );
		_self.setMapType( type_ );
	};


	/**
	 * 배경지도 타입 설정
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.setMapType = function(type_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap._setMapMode( _self.mapTypes[ type ][ "id" ] );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 타입에 해당하는 속성 정보 가져오기
	 * 
	 * @override {ugmp.baseMap.uGisBaseMapDefault.prototype.getTypeProperties}
	 * 
	 * @param type {String} 배경지도 타입
	 * 
	 * @return {Object} 해당 타입 속성
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.getTypeProperties = function(type_) {
		var _self = this._this || this;

		var superProperties = ugmp.baseMap.uGisBaseMapDefault.prototype.getTypeProperties.call( this, type_ );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			resolutions : _self.resolutions,
		} );
	};

} )();
