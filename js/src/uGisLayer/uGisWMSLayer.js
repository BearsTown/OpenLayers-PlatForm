( function() {
	"use strict";

	/**
	 * WMS 레이어 객체.
	 * 
	 * WMS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWmsLayer = new ugmp.layer.uGisWMSLayer( {
	 *	useProxy : false,
	 *	singleTile : false,
	 *	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 *	ogcParams : {
	 *		LAYERS : 'ROOT',
	 *		CRS : ugMap.getCRS(),
	 *		VERSION : '1.3.0';
	 *		...
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMS 서비스 URL.
	 * @param opt_options.wfsServiceURL {String} WFS 서비스 URL (GetFeature).
	 * 
	 * @param opt_options.singleTile {Boolean} 싱글 타일 설정. Default is `false`.
	 * @param opt_options.ogcParams {Object} WMS OGC 표준 속성.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWMSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.singleTile = null;
		this.ogcParams = null;
		this.wfsServiceURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMS";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			if ( options.wfsServiceURL ) {
				_self.wfsServiceURL = options.wfsServiceURL;
			} else {
				_self.wfsServiceURL = _self.serviceURL.replace( "/wms", "/wfs" );
			}

			_self.singleTile = ( options.singleTile !== undefined ) ? options.singleTile : false;
			_self.ogcParams = ( options.ogcParams !== undefined ) ? options.ogcParams : {};

			var serviceURL = _self.serviceURL;
			if ( _self.useProxy ) {
				if ( serviceURL.indexOf( "?" ) === -1 ) {
					serviceURL += "??";
				} else if ( serviceURL.indexOf( "?" ) === serviceURL.length - 1 ) {
					serviceURL = serviceURL.replace( "?", "??" );
				}

				serviceURL = ugmp.uGisConfig.getProxy() + serviceURL;
			}

			if ( _self.singleTile ) {
				var source = new ol.source.ImageWMS( {
					url : serviceURL,
					params : _self.ogcParams,
					// ratio : 1
				} );

				_self.olLayer = new ol.layer.Image( {
					source : source
				} );
			} else {
				var source = new ol.source.TileWMS( {
					url : serviceURL,
					params : _self.ogcParams
				} );

				_self.olLayer = new ol.layer.Tile( {
					source : source
				} );
			}

		} )();


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			ogcParams : _self.ogcParams,
			getWFSServiceURL : _self.getWFSServiceURL
		} );

	} );


	ugmp.layer.uGisWMSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWMSLayer.prototype.constructor = ugmp.layer.uGisWMSLayer;


	/**
	 * WFS 서비스 URL을 가져온다.
	 * 
	 * @return wfsServiceURL {String} WFS 서비스 URL.
	 */
	ugmp.layer.uGisWMSLayer.prototype.getWFSServiceURL = function() {
		var _self = this._this || this;
		return _self.wfsServiceURL;
	};

} )();
