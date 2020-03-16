( function() {
	"use strict";

	/**
	 * WMTS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMTS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWMTS = new ugmp.service.uGisGetCapabilitiesWMTS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	version : '1.0.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWMTS.then( function() {
	 * 	console.log( ugGetCapabilitiesWMTS.data );
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
	ugmp.service.uGisGetCapabilitiesWMTS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMTS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMTSCapabilities();
                var olJson = parser.read( result_.document );
                var xmlJson = result_.xmlJson;
                var serviceMetaData = _self.getServiceMetaDataWMTS( olJson );
                
                var capabilities = ( xmlJson["Capabilities"] ) ? xmlJson["Capabilities"] : xmlJson["wmts:Capabilities"];
				var style = capabilities["Contents"]["Layer"]["Style"];
				if ( style !== undefined ) {
					var legendURL = style["ows:LegendURL"];
					if ( legendURL !== undefined ) {
	    	            legendURL = legendURL["ows:OnlineResource"]["@attributes"]["xlink:href"];
	    	            serviceMetaData["legendURL"] = legendURL;
	    	        }
				}
				
    	        var extra_serviceIdentification = capabilities["ows:ServiceIdentification"];    	        
    	        
    	        if(extra_serviceIdentification  !== undefined ) {
    	        	if ( extra_serviceIdentification["ows:Abstract"] ) {
    	        		serviceMetaData["abstract"] = extra_serviceIdentification["ows:Abstract"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:AccessConstraints"] ) {
    	        		serviceMetaData["accessconstraints"] = extra_serviceIdentification["ows:AccessConstraints"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Fees"] ) {
    	        		serviceMetaData["fees"] = extra_serviceIdentification["ows:Fees"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Keywords"] ) {
    	        		var keywords = extra_serviceIdentification["ows:Keywords"]["ows:Keyword"];
        	        	var keywordList = [];
        	        	
        	        	if ( keywords !== undefined ) {
        	                if ( Array.isArray( keywords ) ) {            
        	                    for(var i in keywords) {
        	                        keywordList.push( keywords[i]["#text"]);
        	                    }
        	                } else {
        	                    keywordList.push( keywords["#text"] );
        	                }
        	            }        	
        	        	serviceMetaData["keywords"] = keywordList; 
    	        	}
    	        }
                
                var data = {
                	olJson : olJson,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : serviceMetaData
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWMTS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWMTS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWMTS;
	
	
	/**
	 * WMTS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWMTS.prototype.getServiceMetaDataWMTS = function(xmlJson_) {
    	var json = xmlJson_;  
        
        var crs = json["Contents"]["TileMatrixSet"];
        if ( Array.isArray( crs ) ) {
            crs = crs[0]["SupportedCRS"];
        } else {
            crs = crs["SupportedCRS"];
        }
        
        var title = json["ServiceIdentification"]["Title"];
		var abstract = json["ServiceIdentification"]["Abstract"];
		var fees = json["ServiceIdentification"]["Fees"];
		var accessconstraints = json["ServiceIdentification"]["AccessConstraints"];
        
        var keywordList = [];
        var keywords = json["ServiceIdentification"]["Keywords"];
        if ( keywords !== undefined ) {
            if ( Array.isArray( keywords ) ) {            
                for(var i in keywords) {
                    keywordList.push( keywords[i]["Keyword"] );
                }
            } else {
                keywordList.push( keywords["Keyword"] );
            }
        }

        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            accessconstraints : accessconstraints
        };
        
        return metaData;
    };

} )();
