/**
 * @namespace ugmp.service
 */

( function() {
	"use strict";

	/**
	 * GetCapabilities 서비스 기본 객체.
	 * 
	 * OGC 표준의 GetCapabilities 서비스를 요청하는 객체로 도메인이 다를 경우 프록시로 요청하여야 한다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.service {String} 서비스 타입 (WMS, WFS, WFS, WCS, WMTS). Default is `WMS`.
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesDefault = ( function(opt_options) {
		var _self = this;

		this.service = null;
		this.version = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.request = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.request = "GetCapabilities";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.service = ( typeof ( options.service ) === "string" ) ? options.service : "WMS";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._setVersion( options.version );

			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		} )();
		// END Initialize


		return {
			getAttribute : _self.getAttribute
		}

	} );


	/**
	 * 타입별 버전 설정.
	 * 
	 * @private
	 * 
	 * @param version {String} 서비스 버전
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype._setVersion = function(version_) {
		var _self = this._this || this;

		if ( version_ ) {
			_self.version = version_;
		} else {
			switch ( _self.service ) {
				case "WMS" :
					_self.version = "1.3.0";
					break;
				case "WFS" :
					_self.version = "1.1.0";
					break;
				case "WCS" :
					_self.version = "1.1.1";
					break;
				case "WMTS" :
					_self.version = "1.0.0";
					break;
				default :
					_self.version = "1.3.0";
			}
		}
	};


	/**
	 * Capabilities OGC 표준 속성을 가져온다.
	 * 
	 * @retrun attribute {Object} OGC 표준 속성.
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype.getAttribute = function() {
		var _self = this._this || this;

		var attribute = {
			SERVICE : _self.service,
			VERSION : _self.version,
			REQUEST : _self.request
		};

		return attribute;
	};


	/**
	 * 해당 서비스 getCapabilities를 요청한다.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype.callAjax = function() {
		var _self = this._this || this;

		var deferred = _$.Deferred();

		var url = ugmp.util.uGisUtil.appendParams( _self.serviceURL, _self.getAttribute() );

		if ( _self.useProxy ) {
			url = ugmp.uGisConfig.getProxy() + url;
		}

		var response = new ugmp.uGisHttp.requestData( {
			url : url,
			type : "GET",
			loading : true,
			contentType : "",
			dataType : "XML",
			dataViewId : _self.dataViewId,
		} );

		response.then( function(response_) {
			// -To do : response가 text일 경우 처리.
			var data = {
				state : false,
				message : null,
				xmlJson : null,
				document : response_
			};

			try {
				var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );
				data.xmlJson = xmlJson;

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					data.state = false;
					data.message = "ServiceExceptionReport : " + "<br>" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					data.state = false;
					data.message = "ExceptionReport : " + "<br>" + message;
				} else {
					data.state = true;
				}

				deferred.resolve( data );

			} catch ( e ) {
				deferred.reject( e );
			}
		} ).fail( function(result) {
			deferred.reject( result );
		} );

		return deferred.promise();
	};

} )();
