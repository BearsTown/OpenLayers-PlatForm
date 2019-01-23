( function() {
	"use strict";

	/**
	 * WFS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WFS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWFS = new ugmp.service.uGisGetCapabilitiesWFS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	version : '1.1.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWFS.then( function() {
	 * 	console.log( ugGetCapabilitiesWFS.data );
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
	ugmp.service.uGisGetCapabilitiesWFS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WFS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWFS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWFS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWFS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWFS;
	
	
	/**
	 * WFS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWFS.prototype.getServiceMetaDataWFS = function(xmlJson_) {
    	var json = xmlJson_;
        
        var title = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        var crs = "EPSG:4326";
        var keywordList = [];
        var keywords = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        for(var i in keywords) {
            keywordList.push( keywords[i]["#text"] );
        }
        
        var providerName = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        var providerSite = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        
        if ( providerName !== undefined ) {
            providerName = providerName["#text"];
        }
        if ( providerSite !== undefined ) {
            providerSite = providerSite["#text"];
        }
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];

        var featureType = json["wfs:WFS_Capabilities"]["FeatureTypeList"]["FeatureType"];
        
        var layers = [];
		if ( Array.isArray( featureType ) ) {
			crs = featureType[0]["DefaultSRS"]["#text"];
            
            for (var i in featureType) {
                var temp = {
                    Title : featureType[i]["Title"]["#text"],
                    Name : featureType[i]["Name"]["#text"]
                }
                layers.push( temp );
            }
            
		} else {
			crs = featureType["DefaultSRS"]["#text"];
            
            var temp = {
                Title : featureType["Title"]["#text"],
                Name : featureType["Name"]["#text"]
            }
            layers.push( temp );
		}
                
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            // serviceContact : serviceContact,
            accessconstraints : accessconstraints,
            
            layers : layers
        };
        
        return metaData;
    };
	
} )();
