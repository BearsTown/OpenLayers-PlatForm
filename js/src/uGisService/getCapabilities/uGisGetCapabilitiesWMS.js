( function() {
	"use strict";

	/**
	 * WMS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWMS = new ugmp.service.uGisGetCapabilitiesWMS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 * 	version : '1.3.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWMS.then( function() {
	 * 	console.log( ugGetCapabilitiesWMS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.service.uGisGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesWMS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : olJson,
					xmlJson : result_.xmlJson,
					document : result_.document,
					serviceMetaData : _self.getServiceMetaDataWMS( olJson )
				};

				_self.promise.data = data;
			} );

		} )();
		// END Initialize

		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWMS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWMS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWMS;
	
	
	/**
	 * WMS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWMS.prototype.getServiceMetaDataWMS = function(olJson_) {
        var json = olJson_;
        
        var service = json["Service"]["Name"];
        var version = json["version"];
        var getCapabilitiesFormat = "";
        var getCapabilitiesFormats = json["Capability"]["Request"]["GetCapabilities"]["Format"];
		for(var i in getCapabilitiesFormats) {
			getCapabilitiesFormat += ( getCapabilitiesFormats[i] +( (getCapabilitiesFormats.length-1) == i ? "" : ", " ) );
		}
		var getMapFormat = "";
		var getMapFormats = json["Capability"]["Request"]["GetMap"]["Format"];
		for(var i in getMapFormats) {
			getMapFormat += ( getMapFormats[i] +( (getMapFormats.length-1) == i ? "" : ", " ) );
		}
		var getFeatureInfoFormat = "";
		var getFeatureInfoFormats = json["Capability"]["Request"]["GetFeatureInfo"]["Format"];
		for(var i in getFeatureInfoFormats) {
			getFeatureInfoFormat += ( getFeatureInfoFormats[i] +( (getFeatureInfoFormats.length-1) == i ? "" : ", " ) );
		}
		var exceptionFormat = "";
		var exceptionFormats = json["Capability"]["Exception"];
		for(var i in exceptionFormats) {
			exceptionFormat += ( exceptionFormats[i] +( (exceptionFormats.length-1) == i ? "" : ", " ) );
		}
        var WGS84 = json["Capability"]["Layer"]["EX_GeographicBoundingBox"];
        var maxExtent = json["Capability"]["Layer"]["BoundingBox"][0]["extent"];
		var crs = json["Capability"]["Layer"]["BoundingBox"][0]["crs"];		
		var title = json["Service"]["Title"];
		var onlineResource = json["Service"]["OnlineResource"];
        var abstract = json["Service"]["Abstract"];
        var fees = json["Service"]["Fees"];
        var accessConstraints = json["Service"]["AccessConstraints"];
        var contactPerson;
        var contactOrganization;
        
        if ( json["Service"]["ContactInformation"] !== undefined ) {
            contactPerson = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactPerson"];
            contactOrganization = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactOrganization"];
        }
        
        var keywordList = json["Service"]["KeywordList"];
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            // maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywordList : keywordList,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOrganization : contactOrganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };

} )();
