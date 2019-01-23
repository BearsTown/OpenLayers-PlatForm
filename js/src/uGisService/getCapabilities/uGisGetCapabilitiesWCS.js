( function() {
	"use strict";

	/**
	 * WCS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WCS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWCS = new ugmp.service.uGisGetCapabilitiesWCS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	version : '2.0.1',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWCS.then( function() {
	 * 	console.log( ugGetCapabilitiesWCS.data );
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
	ugmp.service.uGisGetCapabilitiesWCS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WCS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : undefined,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWCS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWCS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWCS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWCS;
	
	
	/**
	 * WCS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWCS.prototype.getServiceMetaDataWCS = function(xmlJson_) {
    	var json = xmlJson_;
    	var version = json["wcs:Capabilities"]["@attributes"]["version"];
        var title = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Title"];
        title = ( title ) ? title["#text"] : "null";
		var abstract = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"];
		abstract = ( abstract ) ? abstract["#text"] : "null";
		var fees = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Fees"];
		fees = ( fees ) ? fees["#text"] : "null";
		var accessconstraints = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"];
		accessconstraints = ( accessconstraints ) ? accessconstraints["#text"] : "null";
        var crs = "EPSG:4326";
		
        var keywordList = [];
        var keywords = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"];
        if ( keywords ) {
        	keywords = keywords["ows:Keyword"];
        	for(var i in keywords) {
                keywordList.push( keywords[i]["#text"] );
            }
        }        
        
        var providerName = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        providerName = ( providerName ) ? providerName["#text"] : "null";
        var providerSite = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        providerSite = ( providerSite ) ? providerSite["#text"] : "null";
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];
        
        var tempSupportedFormat = json["wcs:Capabilities"]["wcs:Contents"]["wcs:SupportedFormat"];
        
        var supportedFormats = [];
        for(var i in tempSupportedFormat) {
            supportedFormats.push( tempSupportedFormat[i]["#text"] );
        }
        
        var tempCoverageSummary = json["wcs:Capabilities"]["wcs:Contents"]["wcs:CoverageSummary"];
        
        if ( !Array.isArray( tempCoverageSummary ) ) {
            tempCoverageSummary = [ tempCoverageSummary ];
        }
        
        var coverages = [];
        for(var i in tempCoverageSummary) {
            var lowerCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( lowerCorner ) {
            	lowerCorner = lowerCorner["ows:LowerCorner"]["#text"];
            } else {
            	lowerCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:LowerCorner"]["#text"];
            }
            
            var upperCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( upperCorner ) {
            	upperCorner = upperCorner["ows:UpperCorner"]["#text"];
            } else {
            	upperCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:UpperCorner"]["#text"];
            }
            
            var extent = [];
            extent[0] = parseFloat( ( lowerCorner.split(" ") )[0] );
            extent[1] = parseFloat( ( lowerCorner.split(" ") )[1] );
            extent[2] = parseFloat( ( upperCorner.split(" ") )[0] );
            extent[3] = parseFloat( ( upperCorner.split(" ") )[1] );
            
            var identifier;
            if ( version === "2.0.1" ) {
            	identifier = tempCoverageSummary[i][ "wcs:CoverageId" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "CoverageId" ]["#text"];
            } else {
            	identifier = tempCoverageSummary[i][ "wcs:Identifier" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "Identifier" ]["#text"];
            }
            
            coverages.push( {
                Identifier : identifier,
                BBOX : extent
            } );
        }
        
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            coverages : coverages,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            accessconstraints : accessconstraints,
            supportedFormats : supportedFormats
        };
        
        return metaData;
    };

} )();
