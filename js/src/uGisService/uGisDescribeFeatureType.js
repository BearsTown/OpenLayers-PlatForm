( function() {
	"use strict";

	/**
	 * WFS DescribeFeatureType 객체.
	 * 
	 * OGC 표준의 WFS DescribeFeatureType 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDescribeFeatureType = new ugmp.service.uGisDescribeFeatureType( {
	 * 	useProxy : true,
	 * 	version : '1.1.0',
	 * 	serviceURL : 'url',
	 * 	dataViewId : ugMap.getDataViewId(),
	 * 	typeName : 'LAYER_NAME'
	 * } );
	 * 
	 * ugDescribeFeatureType.then( function(res_) {
	 * 	if ( res_.state ) {
	 * 		console.log( res_.data );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전. Default is `1.1.0`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL. Default is `""`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	ugmp.service.uGisDescribeFeatureType = ( function(opt_options) {
		var _self = this;

		this.version = null;
		this.useProxy = null;
		this.typeName = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.0";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : "";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._callAjax();

		} )();
		// END Initialize


		return _self.promise;

	} );


	/**
	 * DescribeFeatureType OGC 표준 속성.
	 * 
	 * @private
	 * 
	 * @retrun attribute {Object}
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._getAttribute = function() {
		var attribute = {
			SERVICE : "WFS",
			VERSION : this.version,
			REQUEST : "DescribeFeatureType",
			TYPENAME : this.typeName
		};

		return attribute;
	};


	/**
	 * DescribeFeatureType 요청.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._callAjax = function() {
		var _self = this;

		_self.promise = _$.Deferred();

		var url = ugmp.util.uGisUtil.appendParams( _self.serviceURL, _self._getAttribute() );

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
			var resolveData = {
				state : false,
				message : undefined,
				data : {
					xmlJson : undefined,
					document : response_,
					serviceMetaData : undefined
				}
			};

			try {
				var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ServiceExceptionReport : \n" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ExceptionReport : \n" + message;
				} else {
					resolveData.state = true;
					resolveData.data.xmlJson = xmlJson;
					resolveData.data.serviceMetaData = _self._getServiceMetaData( xmlJson );
				}

				_self.promise.resolveData = resolveData;
				_self.promise.resolve( resolveData );

			} catch ( e ) {
				_self.promise.reject( e );
			}

		}, function(result_) {
			_self.promise.reject( result_ );
		} );
	};


	/**
	 * DescribeFeatureType 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} 메타데이터
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._getServiceMetaData = function(xmlJson_) {
		var _self = this;

		var json = xmlJson_;

		var sequence = {};
		var findGeomType = false;
		var geometryName = "the_geom";
		var tempSequence = json[ "xsd:schema" ][ "xsd:complexType" ][ "xsd:complexContent" ][ "xsd:extension" ][ "xsd:sequence" ][ "xsd:element" ];

		for ( var i in tempSequence ) {
			var name = tempSequence[ i ][ "@attributes" ][ "name" ];
			var type = tempSequence[ i ][ "@attributes" ][ "type" ];

			if ( !findGeomType ) {
				if ( type.split( ":" )[ 0 ] === "gml" ) {
					findGeomType = true;
					geometryName = name;
					continue;
				}
			}

			sequence[ name ] = type.split( ":" )[ 1 ];
		}

		return {
			sequence : sequence,
			geometryName : geometryName
		}
	};

} )();
