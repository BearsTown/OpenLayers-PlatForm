/**
 * @namespace ugmp.layer
 */

( function() {
	"use strict";

	/**
	 * 레이어의 기본 객체. 공통으로 서비스 URL, 프록시, GetFeature 사용 여부를 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.useGetFeature {Boolean} GetFeature 사용 여부. Default is `false`.
	 * 
	 * @class
	 */
	ugmp.layer.uGisLayerDefault = ( function(opt_options) {
		var _self = this;

		this.useProxy = null;
		this.serviceURL = null;
		this.useGetFeature = null;

		this.olLayer = null;
		this.layerKey = null;
		this.layerType = null;
		this.isUseLoading = null;
		this.tocVisibleFlag = null;
		this.layerVisibleFlag = null;
		this.scaleVisibleFlag = null;

		this.minZoom = null;
		this.maxZoom = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.isUseLoading = ugmp.uGisConfig.isUseLoading();
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : false;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.useGetFeature = ( options.useGetFeature !== undefined ) ? options.useGetFeature : false;

			_self.layerKey = ugmp.util.uGisUtil.generateUUID();
			_self.layerType = ( options.layerType !== undefined ) ? options.layerType : "";
			_self.tocVisibleFlag = true;
			_self.layerVisibleFlag = true;
			_self.scaleVisibleFlag = true;

			_self.minZoom = 0;
			_self.maxZoom = 21;

		} )();
		// END Initialize


		return {
			destroy : _self.destroy,
			setMinZoom : _self.setMinZoom,
			setMaxZoom : _self.setMaxZoom,
			getMinZoom : _self.getMinZoom,
			getMaxZoom : _self.getMaxZoom,

			getVisible : _self.getVisible,
			getOlLayer : _self.getOlLayer,
			getLayerKey : _self.getLayerKey,
			getLayerType : _self.getLayerType,
			getServiceURL : _self.getServiceURL,

			visibleToggle : _self.visibleToggle,
			setTocVisible : _self.setTocVisible,
			setScaleVisible : _self.setScaleVisible,
			setLayerVisible : _self.setLayerVisible,

			getUseGetFeature : _self.getUseGetFeature,
			setUseGetFeature : _self.setUseGetFeature
		}

	} );


	/**
	 * 서비스 URL을 가져온다.
	 * 
	 * @return serviceURL {String} 서비스 URL.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getServiceURL = function() {
		var _self = this._this || this;
		return _self.serviceURL;
	};


	/**
	 * 레이어 키를 가져온다.
	 * 
	 * @return layerKey {String} 레이어 키.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getLayerKey = function() {
		var _self = this._this || this;
		return _self.layerKey;
	};


	/**
	 * 레이어 타입을 가져온다.
	 * 
	 * @return layerType {String} 레이어 타입.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getLayerType = function() {
		var _self = this._this || this;
		return _self.layerType;
	};


	/**
	 * OpenLayers의 `ol.layer` 객체를 가져온다.
	 * 
	 * @return olLayer {ol.layer} OpenLayers의 `ol.layer` 객체
	 */
	ugmp.layer.uGisLayerDefault.prototype.getOlLayer = function() {
		var _self = this._this || this;
		return _self.olLayer;
	};


	/**
	 * 레이어 visible 상태를 가져온다.
	 * 
	 * 1. 오픈레이어스 레이어 상태
	 * 
	 * 2. 레이어 visible상태
	 * 
	 * 3. TOC visible 상태
	 * 
	 * 4. 스케일 visible 상태
	 * 
	 * 모든 항목의 visible 상태가 `true`일 경우에만 `true`.
	 * 
	 * @return visible {Boolean} visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getVisible = function() {
		var _self = this._this || this;
		return ( _self.olLayer.getVisible() && _self.layerVisibleFlag && _self.tocVisibleFlag && _self.scaleVisibleFlag );
	};


	/**
	 * 레이어 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 레이어 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setLayerVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.tocVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.layerVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어 visible 상태를 토글한다.
	 */
	ugmp.layer.uGisLayerDefault.prototype.visibleToggle = function() {
		var _self = this._this || this;

		_self.setLayerVisible( !_self.layerVisibleFlag );
	};


	/**
	 * TOC visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} TOC visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setTocVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.tocVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 스케일 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 스케일 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setScaleVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.tocVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.scaleVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어의 MinZoom을 설정한다.
	 * 
	 * @param minZoom {Integer} MinZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setMinZoom = function(minZoom_) {
		var _self = this._this || this;
		_self.minZoom = minZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MaxZoom을 설정한다.
	 * 
	 * @param maxZoom {Integer} MaxZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setMaxZoom = function(maxZoom_) {
		var _self = this._this || this;
		_self.maxZoom = maxZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MinZoom 값을 가져온다.
	 * 
	 * @return minZoom {Integer} MinZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getMinZoom = function() {
		var _self = this._this || this;
		return _self.minZoom;
	};


	/**
	 * 레이어의 MaxZoom 값을 가져온다.
	 * 
	 * @return maxZoom {Integer} MaxZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getMaxZoom = function() {
		var _self = this._this || this;
		return _self.maxZoom;
	};


	/**
	 * GetFeature 사용 여부를 가져온다.
	 * 
	 * @return useGetFeature {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getUseGetFeature = function() {
		var _self = this._this || this;
		return _self.useGetFeature;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setUseGetFeature = function(state_) {
		var _self = this._this || this;

		if ( typeof state_ === "boolean" ) {
			_self.useGetFeature = state_;
		} else {
			_self.useGetFeature = false;
		}
	};
	
	
	/**
	 * 레이어를 destroy한다.
	 * 
	 * @abstract
	 */
	ugmp.layer.uGisLayerDefault.prototype.destroy = function() {
		var _self = this._this || this;
	};

} )();
