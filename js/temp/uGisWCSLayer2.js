( function() {
	"use strict";

	/**
	 * WCS 레이어 객체.
	 * 
	 * WCS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WCS 서비스 URL.
	 * 
	 * @param opt_options.format {String} 이미지 포맷. Default is `image/jpeg`.
	 * @param opt_options.version {String} WCS 버전. Default is `1.1.1`.
	 * @param opt_options.identifier {String} 레이어 아이디.
	 * @param opt_options.projection {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.coverageId {String} coverageId.
	 * @param opt_options.boundingBox {Array} boundingBox.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWCSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.format = null;
		this.version = null;
		this.identifier = null;
		this.projection = null;
		this.coverageId = null;
		this.boundingBox = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WCS";
			options.useGetFeature = false;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.1";
			_self.format = ( options.format !== undefined ) ? options.format : "image/jpeg";
			_self.identifier = ( options.identifier !== undefined ) ? options.identifier : "";
			_self.coverageId = ( options.coverageId !== undefined ) ? options.coverageId : "";
			_self.projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";
			_self.boundingBox = _self._setBoundingBox( options.boundingBox );

			_self._update( false );

			_self.olLayer = new ol.layer.Image( {
				source : new ol.source.ImageStatic( {
					url : _self.getGetCoverageURL,
					projection : _self.projection,
					imageExtent : ( _self.boundingBox !== undefined ) ? options.boundingBox : []
				} )
			} );


		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			update : _self._update,
			version : _self.version,
			identifier : _self.identifier,
			projection : _self.projection,
			setBoundingBox : _self._setBoundingBox,
			getBoundingBox : _self.getBoundingBox
		} );

	} );


	ugmp.layer.uGisWCSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWCSLayer.prototype.constructor = ugmp.layer.uGisWCSLayer;


	/**
	 * BoundingBox를 설정한다.
	 * 
	 * @private
	 * 
	 * @param boundingBox {Array.<Double>} boundingBox.
	 */
	ugmp.layer.uGisWCSLayer.prototype._setBoundingBox = function(boundingBox_) {
		var _self = this._this || this;

		if ( boundingBox_ && boundingBox_.length > 3 ) {
			_self.boundingBox = boundingBox_.slice();
			if ( !boundingBox_[ 4 ] ) {
				_self.boundingBox.push( "EPSG:4326" );				
			}
		} else {
			_self.boundingBox = undefined;
		}

		return _self.boundingBox;
	};


	/**
	 * WCS Param을 설정한다.
	 * 
	 * @private
	 * 
	 * @param use {Boolean}
	 */
	ugmp.layer.uGisWCSLayer.prototype._update = function(use_, load_) {
		var _self = this._this || this;

		var params = {
			SERVICE : "WCS",
			REQUEST : "GetCoverage",
			FORMAT : _self.format,
			VERSION : _self.version,
			IDENTIFIER : _self.identifier,
			COVERAGEID : _self.identifier,
			BOUNDINGBOX : _self.boundingBox
		};

		if ( _self.version === "2.0.1" ) {
			delete params.IDENTIFIER;
		} else {
			delete params.COVERAGEID;
		}

		if ( _self.useProxy ) {
			_self.getGetCoverageURL = ugmp.uGisConfig.getProxy() + ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		} else {
			_self.getGetCoverageURL = ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		}

		if ( _self.olLayer && use_ ) {
			load_( true );

			var imageExtent = ol.proj.transformExtent( params.BOUNDINGBOX, "EPSG:4326", _self.projection );

			_self.olLayer.setSource( new ol.source.ImageStatic( {
				url : _self.getGetCoverageURL,
				projection : _self.projection,
				imageExtent : imageExtent,
				imageLoadFunction : function(image, src) {
					var imageElement = image.getImage();

					imageElement.onload = function() {
						load_( false );
					};
					imageElement.onerror = function() {
						load_( false );
					};

					imageElement.src = src;
				}
			} ) );
		}
	};


	/**
	 * BoundingBox를 가져온다.
	 * 
	 * @return BoundingBox {Array.<Double>} BoundingBox.
	 */
	ugmp.layer.uGisWCSLayer.prototype.getBoundingBox = function() {
		var _self = this._this || this;
		return _self.boundingBox;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisWCSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};

} )();
