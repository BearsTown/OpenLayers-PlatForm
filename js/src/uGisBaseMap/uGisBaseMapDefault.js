/**
 * @namespace ugmp.baseMap
 */

( function() {
	"use strict";

	/**
	 * uGisBaseMap 기본 객체.
	 * 
	 * 배경지도의 기본 객체로 배경지도의 코드값은 언더바(_) 기준으로 나눈다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.isWorld {Boolean} 세계 좌표 여부. Default is `true`.
	 * @param opt_options.isFactor {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부. Default is `true`.
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `custom_code`.
	 * @param opt_options.mapTypes {Object} 베이스맵 타입 별 속성 정보.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.maxExtent {Array.<Double>} 베이스맵 최대 영역. Default is `EPSG:3857 Extent`.
	 * @param opt_options.isAvailable {Boolean} 베이스맵 사용 가능 여부.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapDefault = ( function(opt_options) {
		var _self = this;

		this.apiMap = null;
		this.isWorld = null;
		this.isFactor = null;
		this.baseCode = null;
		this.mapTypes = null;
		this.projection = null;
		this.maxExtent = null;
		this.isAvailable = null;


		/**
		 * Initialize
		 */
		( function() {

		} )();
		// END initialize


		return {
			isWorlds : _self.isWorlds,
			isFactors : _self.isFactors,
			isAvailables : _self.isAvailables,
			updateSize : _self.updateSize,
			setMapType : _self.setMapType,
			syncMapFunc : _self.syncMapFunc,
			getUsableKeys : _self.getUsableKeys,
			createBaseMap : _self.createBaseMap,
			getTypeProperties : _self.getTypeProperties
		}

	} );


	/**
	 * 초기화
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.init = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		_self.apiMap = ( options.apiMap !== undefined ) ? options.apiMap : undefined;
		_self.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
		_self.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
		_self.mapTypes = ( options.mapTypes !== undefined ) ? options.mapTypes : {};
		_self.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "custom_code";
		_self.projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";
		_self.maxExtent = ( options.maxExtent !== undefined ) ? options.maxExtent : ol.proj.get( "EPSG:3857" ).getExtent();

		if ( typeof ( options.createBaseMap ) === "function" ) {
			_self.createBaseMap = options.createBaseMap;
		}
		if ( typeof ( options.syncMapFunc ) === "function" ) {
			_self.syncMapFunc = options.syncMapFunc;
		}
		if ( typeof ( options.setMapType ) === "function" ) {
			_self.setMapType = options.setMapType;
		}
		if ( typeof ( options.updateSize ) === "function" ) {
			_self.updateSize = options.updateSize;
		}
		if ( typeof ( options.getTypeProperties ) === "function" ) {
			_self.getTypeProperties = options.getTypeProperties;
		}
	};


	/**
	 * 지도 API 맵을 생성한다.
	 * 
	 * @abstract
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.createBaseMap = function(target_, type_) {
	};


	/**
	 * 지도 화면 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:resolution|change:center>
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.syncMapFunc = function(evt_) {
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.setMapType = function(type_) {
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @abstract
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.updateSize = function() {
	};


	/**
	 * 타입에 해당하는 속성 정보 가져온다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 * 
	 * @return {Object} 해당 타입 속성
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getTypeProperties = function(type_) {
		var _self = this._this || this;

		var minZoom = _self.mapTypes[ type_ ][ "minZoom" ];
		var maxZoom = _self.mapTypes[ type_ ][ "maxZoom" ];

		return {
			minZoom : minZoom,
			maxZoom : maxZoom,
			baseCode : _self.baseCode,
			projection : _self.projection,
			maxExtent : _self.maxExtent,
			id : _self.mapTypes[ type_ ][ "id" ]
		}
	};


	/**
	 * API 사용 가능 여부를 설정한다.
	 * 
	 * @param script {String} API 사용 테스트 스크립트.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.checkIsAvailable = function(script_) {
		var _self = this._this || this;

		try {
			new Function( script_.toString() )();
			_self.isAvailable = true;
		} catch ( e ) {
			_self.isAvailable = false;
		}
	};


	/**
	 * 사용 가능한 타입(키) 리스트를 가져온다.
	 * 
	 * @return {Array.<String>} 사용 가능한 타입(키) 리스트를.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getUsableKeys = function() {
		var _self = this._this || this;

		var usableKeys = [];
		var types = _self.mapTypes;
		for ( var i in types ) {
			if ( i.indexOf( "custom_" ) > -1 ) {
				usableKeys.push( _self.baseCode );
			} else {
				usableKeys.push( _self.baseCode + "_" + i );
			}
		}

		return usableKeys;
	};


	/**
	 * 동기화 데이터.
	 * 
	 * @param evt {Function} ol3 change:resolution, change:center
	 * 
	 * @return {Object} 현재 View의 동기화 데이터.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getSyncData = function(evt_) {
		var _self = this._this || this;

		var view = evt_.target;

		if ( view instanceof ol.Map ) {
			view = view.getView();
		}

		return {
			view : view,
			center : view.getCenter(),
			projection : view.getProjection(),
			resolution : view.getResolution(),
			zoom : Math.round( view.getZoom() )
		};
	};


	/**
	 * 베이스맵 사용 가능 여부.
	 * 
	 * @return {Boolean} 베이스맵 사용 가능 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isAvailables = function() {
		var _self = this._this || this;
		return _self.isAvailable;
	};


	/**
	 * 세계 좌표 여부.
	 * 
	 * @return {Boolean} 세계 좌표 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isWorlds = function() {
		var _self = this._this || this;
		return _self.isWorld;
	};

	/**
	 * 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 * 
	 * @return {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isFactors = function() {
		var _self = this._this || this;
		return _self.isFactor;
	};

} )();
