( function() {
	"use strict";

	/**
	 * HTTP ajax 통신.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugHttp = ugmp.uGisHttp.requestData( {
	 * 	url : '/sampleXML.xml',
	 * 	type : 'GET',
	 * 	dataType : 'XML',
	 * 	contentType : 'text/xml',
	 * 	data : {
	 * 		param1 : '1',
	 * 		param2 : '2'
	 * 	}
	 * } );
	 * 
	 * ugHttp.then( function(res) {
	 * 	console.log( res );
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	ugmp.uGisHttp = ( function() {

		return {
			requestData : this.requestData
		}

	} );


	/**
	 * Request Data.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.url {String} URL 주소.
	 * 
	 * @param opt_options.type {String} GET or POST. Default is `GET`.
	 * @param opt_options.data {Object} 서버에 전송할 데이터.
	 * @param opt_options.contentType {String} contentType 유형. Default is `application/x-www-form-urlencoded; charset=UTF-8`.
	 * @param opt_options.dataType {String} dataType 유형. Default is `XML`.
	 * @param opt_options.dataViewId {String} 지도의 View ID.
	 * 
	 * @return deferred.promise {jQuery.deferred.promise}
	 */
	ugmp.uGisHttp.prototype.requestData = function(opt_options) {
		var _this = this;
		var options = opt_options || {};

		this.isUseLoading = ugmp.uGisConfig.isUseLoading();

		this.deferred = _$.Deferred();

		this.url = ( options.url !== undefined ) ? options.url : "";
		this.type = ( options.type !== undefined ) ? options.type : "GET";
		this.data = ( options.data !== undefined ) ? options.data : {};
		this.contentType = ( options.contentType !== undefined ) ? options.contentType : "application/x-www-form-urlencoded; charset=UTF-8";
		this.dataType = ( options.dataType !== undefined ) ? options.dataType : "XML";
		this.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		_$.ajax( {
			url : _this.url,
			type : _this.type,
			data : _this.data,
			dataType : _this.dataType,
			contentType : _this.contentType,
			beforeSend : function() {
				if ( _this.isUseLoading ) {
					ugmp.uGisConfig.loading( _this.dataViewId, true );
				}
			},
			complete : function() {
				if ( _this.isUseLoading ) {
					ugmp.uGisConfig.loading( _this.dataViewId, false );
				}
			},
			success : function(response_) {
				_this.deferred.resolve( response_ );
			},
			error : function(response_) {
				_this.deferred.reject( response_ );
			}
		} );

		return _this.deferred.promise();
	};


	ugmp.uGisHttp = new ugmp.uGisHttp();

} )();
