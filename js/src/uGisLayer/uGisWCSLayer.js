( function() {
	"use strict";

	/**
	 * WCS 레이어 객체.
	 * 
	 * WCS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWcsLayer = new ugmp.layer.uGisWCSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	format : 'image/jpeg',
	 * 	version : '2.0.1',
	 * 	identifier : 'LAYER_ID',
	 * 	boundingBox : [...],
	 * 	useScaleRefresh : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WCS 서비스 URL.
	 * 
	 * @param opt_options.format {String} 이미지 포맷. Default is `image/jpeg`.
	 * @param opt_options.version {String} WCS 버전. Default is `1.1.1`.
	 * @param opt_options.identifier {String} 레이어 아이디.
	 * @param opt_options.boundingBox {Array} boundingBox. `※EPSG:4326`.
	 * @param opt_options.useScaleRefresh {Boolean} 이미지 해상도 자동 새로고침 사용 여부. Default is `false`.
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
		this.coverageId = null;
		this.boundingBox = null;
		this.useScaleRefresh = null;

		this.key_moveEnd = null;
		this.key_changeView = null;


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
			_self.useScaleRefresh = ( typeof ( options.useScaleRefresh ) === "boolean" ) ? options.useScaleRefresh : false;

			_self.boundingBox = _self._setBoundingBox( options.boundingBox );

			_self.olLayer = new ol.layer.Image( {} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setMap : _self.setMap,
			update : _self._update,
			version : _self.version,
			identifier : _self.identifier,
			useScaleRefresh : _self.useScaleRefresh,
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
	 * Map을 설정한다. 해당 Map을 통해 Coverage의 BOUNDINGBOX를 갱신한다.
	 * 
	 * @param olMap {ol.Map}
	 * @param load {Function} 로드 함수.
	 */
	ugmp.layer.uGisWCSLayer.prototype.setMap = function(olMap_, load_) {
		var _self = this._this || this;

		_self._update( olMap_.getView(), load_ );

		if ( olMap_ && _self.useScaleRefresh ) {
			ol.Observable.unByKey( _self.key_moveEnd );

			_self.key_moveEnd = olMap_.on( "moveend", function() {
				_self._update( olMap_.getView(), load_ );
			} );
		}

		_self.key_changeView = olMap_.once( "change:view", function() {
			_self.setMap( olMap_, load_ );
		} );
	};


	/**
	 * WCS Param을 설정하고 갱신한다.
	 * 
	 * @private
	 * 
	 * @param view {ol.View} View 객체.
	 * @param load {Function} 로드 함수.
	 */
	ugmp.layer.uGisWCSLayer.prototype._update = function(view_, load_) {
		var _self = this._this || this;

		var viewExtent = view_.calculateExtent();
		viewExtent = ol.proj.transformExtent( viewExtent, view_.getProjection(), "EPSG:4326" );

		if ( !ol.extent.intersects( viewExtent, _self.boundingBox ) ) {
			return false;
		}

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

		if ( _self.useScaleRefresh ) {
			var poly1 = turf.polygon( [ [ [ viewExtent[ 0 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 3 ] ], [ viewExtent[ 2 ], viewExtent[ 3 ] ],
					[ viewExtent[ 2 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 1 ] ] ] ] );

			var poly2 = turf.polygon( [ [ [ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ], [ _self.boundingBox[ 0 ], _self.boundingBox[ 3 ] ],
					[ _self.boundingBox[ 2 ], _self.boundingBox[ 3 ] ], [ _self.boundingBox[ 2 ], _self.boundingBox[ 1 ] ],
					[ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ] ] ] );

			var intersection = turf.intersect( poly1, poly2 );
			var intersectCoordinate = intersection.geometry.coordinates[ 0 ];
			var intersectExtent = [ intersectCoordinate[ 0 ][ 0 ], intersectCoordinate[ 0 ][ 1 ], intersectCoordinate[ 2 ][ 0 ], intersectCoordinate[ 2 ][ 1 ] ];

			if ( intersectExtent[ 0 ] > intersectExtent[ 2 ] ) {
				var temp = intersectExtent[ 2 ];
				intersectExtent[ 2 ] = intersectExtent[ 0 ];
				intersectExtent[ 0 ] = temp;
			}

			if ( intersectExtent[ 1 ] > intersectExtent[ 3 ] ) {
				var temp = intersectExtent[ 3 ];
				intersectExtent[ 3 ] = intersectExtent[ 1 ];
				intersectExtent[ 1 ] = temp;
			}

			params.BOUNDINGBOX = intersectExtent;
		}

		params.BOUNDINGBOX.push( "EPSG:4326" );

		if ( _self.useProxy ) {
			_self.getGetCoverageURL = ugmp.uGisConfig.getProxy() + ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		} else {
			_self.getGetCoverageURL = ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		}

		load_( true );

		_self.olLayer.setSource( new ol.source.ImageStatic( {
			url : _self.getGetCoverageURL,
			// projection : view_.getProjection(),
			projection : "EPSG:4326",
			imageExtent : params.BOUNDINGBOX,
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


	/**
	 * 레이어를 destroy한다.
	 * 
	 * @override
	 */
	ugmp.layer.uGisWCSLayer.prototype.destroy = function() {
		var _self = this._this || this;

		ol.Observable.unByKey( _self.key_moveEnd );
		ol.Observable.unByKey( _self.key_changeView );
	};

} )();
