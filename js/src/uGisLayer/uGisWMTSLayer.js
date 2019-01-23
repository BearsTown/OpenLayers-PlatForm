( function() {
	"use strict";

	/**
	 * WMTS 레이어 객체.
	 * 
	 * WMTS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uWmtsLayer = new ugmp.layer.uGisWMTSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	layer : 'LAYER',
	 * 	matrixSet : 'MATRIXSET',
	 * 	projection : 'EPSG:3857',
	 * 	version : '1.0.0',
	 * 	wmtsCapabilities : null,
	 * 	originExtent : []
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMTS 서비스 URL.
	 * 
	 * @param opt_options.layer {String} 레이어 이름.
	 * @param opt_options.version {String} WMTS 버전. Default is `1.0.0`.
	 * @param opt_options.matrixSet {String} matrixSet.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS} {@link ugmp.service.uGisGetCapabilitiesWMTS} WMTS
	 *            Capabilities 객체.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWMTSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layer = null;
		this.version = null;
		this.matrixSet = null;
		this.originExtent = null;
		this.wmtsCapabilities = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMTS";
			options.useGetFeature = false;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.0.0";
			_self.layer = ( options.layer !== undefined ) ? options.layer : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.originExtent = _self._setOriginExtent( options.originExtent );
			_self.wmtsCapabilities = _self._setWmtsCapabilities( options.wmtsCapabilities );

			_self._update( false );

			_self.olLayer = new ol.layer.Tile( {
				// originCRS : "EPSG:4326",
				// originExtent : ( _self.originExtent !== undefined ) ? options.originExtent : [],
				source : null
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			layer : _self.layer,
			version : _self.version,
			update : _self._update,
			matrixSet : _self.matrixSet,
			getOriginExtent : _self.getOriginExtent,
			setOriginExtent : _self._setOriginExtent,
			getWmtsCapabilities : _self.getWmtsCapabilities,
			setWmtsCapabilities : _self._setWmtsCapabilities,
		} );

	} );


	var uGisWMTSLayer = ugmp.layer.uGisWMTSLayer;
	uGisWMTSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	uGisWMTSLayer.prototype.constructor = uGisWMTSLayer;


	/**
	 * OriginExtent 설정
	 * 
	 * @param originExtent {Array.<Double>} originExtent
	 */
	uGisWMTSLayer.prototype._setOriginExtent = function(originExtent_) {
		var _self = this._this || this;

		if ( originExtent_ && originExtent_.length > 3 ) {
			_self.originExtent = originExtent_;
		} else {
			_self.originExtent = undefined;
		}

		return _self.originExtent;
	};


	/**
	 * WMTS capabilities 설정
	 * 
	 * @param wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS} WMTS capabilities
	 */
	uGisWMTSLayer.prototype._setWmtsCapabilities = function(wmtsCapabilities_) {
		var _self = this._this || this;

		if ( wmtsCapabilities_ ) {
			_self.wmtsCapabilities = wmtsCapabilities_;
		} else {
			_self.wmtsCapabilities = undefined;
		}

		return _self.wmtsCapabilities;
	};


	/**
	 * WMTS Param 설정
	 * 
	 * @param use {Boolean}
	 */
	uGisWMTSLayer.prototype._update = function(use_) {
		var _self = this._this || this;

		if ( _self.olLayer && use_ ) {
			var WMTSOptions = new ol.source.WMTS.optionsFromCapabilities( _self.wmtsCapabilities.olJson, {
				layer : _self.layer,
				matrixSet : _self.matrixSet
			} );

			if ( _self.useProxy ) {
				for ( var i in WMTSOptions.urls ) {
					WMTSOptions.urls[ i ] = ugmp.uGisConfig.getProxy() + WMTSOptions.urls[ i ];
				}
			}

			_self.olLayer.setSource( new ol.source.WMTS( WMTSOptions ) );
		}
	};


	/**
	 * OriginExtent 가져오기
	 * 
	 * @return OriginExtent {Array}
	 */
	uGisWMTSLayer.prototype.getOriginExtent = function() {
		var _self = this._this || this;
		return _self.originExtent;
	};


	/**
	 * WMTS Capabilities 가져오기
	 * 
	 * @return wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS}
	 */
	uGisWMTSLayer.prototype.getWmtsCapabilities = function() {
		var _self = this._this || this;
		return _self.wmtsCapabilities;
	};


	/**
	 * GetFeature 사용 여부 설정
	 * 
	 * @Override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부
	 */
	uGisWMTSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};

} )();
