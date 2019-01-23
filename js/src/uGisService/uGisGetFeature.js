( function() {
	"use strict";

	/**
	 * WFS getFeature 서비스 객체.
	 * 
	 * OGC 표준의 WFS getFeature 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugFeatures = new ugmp.service.uGisGetFeature( {
	 * 	useProxy : true,
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 100,
	 * 	typeName : 'world_country',
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	filter : new ol.format.filter.like( 'NAME', 'South*' )
	 * } );
	 * 
	 * ugFeatures.then( function(res) {
	 * 	console.log( res.features );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.filter {ol.format.filter.Filter} 필터. Default is `undefined`.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL. Default is `""`.
	 * @param opt_options.typeName {String} 레이어명. Default is `""`.
	 * @param opt_options.maxFeatures {Boolean} 피쳐 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.outputFormat {String} outputFormat. Default is `text/xml; subtype=gml/3.1.1`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	ugmp.service.uGisGetFeature = ( function(opt_options) {
		var _self = this;

		this.filter = null;
		this.srsName = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.typeName = null;
		this.maxFeatures = null;
		this.outputFormat = null;
		this.dataViewId = null;

		this.deferred = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};
			_self.deferred = _$.Deferred();

			_self.filter = ( options.filter !== undefined ) ? options.filter : undefined;
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : [];
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;
			_self.outputFormat = ( options.outputFormat !== undefined ) ? options.outputFormat : "text/xml; subtype=gml/3.1.1";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

			var featureRequest = new ol.format.WFS().writeGetFeature( {
				filter : _self.filter,
				// featureNS : "",
				srsName : _self.srsName,
				featureTypes : [ _self.typeName ],
				maxFeatures : _self.maxFeatures,
				outputFormat : _self.outputFormat
			} );

			var url = _self.serviceURL;

			if ( _self.useProxy ) {
				url = ugmp.uGisConfig.getProxy() + url;
			}

			var response = new ugmp.uGisHttp.requestData( {
				url : url,
				dataType : "",
				type : "POST",
				contentType : "text/xml",
				dataViewId : _self.dataViewId,
				data : new XMLSerializer().serializeToString( featureRequest )
			} );

			response.then(
					function(response_) {
						// -To do : response가 text일 경우 처리.
						var data = {
							state : false,
							message : null,
							features : null,
							typeName : _self.typeName
						};

						try {
							if ( ugmp.util.uGisUtil.isXMLDoc( response_ ) ) {
								var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );
								if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
									var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
									data.state = false;
									data.message = "ServiceExceptionReport : " + "<br>" + message;
								} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
									var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
									data.state = false;
									data.message = "ExceptionReport : " + "<br>" + message;
								} else {
									data.state = true;
									data.features = new ol.format.WFS().readFeatures( response_ );
								}
							} else {
								data.state = true;
								data.features = new ol.format.GeoJSON().readFeatures( response_ );
							}

							_self.deferred.resolve( data );

						} catch ( e ) {
							_self.deferred.reject( e );
						}
					} ).fail( function(result_) {
				_self.deferred.reject( result_ );
			} );

		} )();
		// END initialize


		return _self.deferred.promise();

	} );

} )();
