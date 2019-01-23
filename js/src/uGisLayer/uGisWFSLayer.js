( function() {
	"use strict";

	/**
	 * WFS 레이어 객체.
	 * 
	 * WFS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWfsLayer = new ugmp.layer.uGisWFSLayer( {
	 *	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	layerName : 'world_country',
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 300,
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL.
	 * 
	 * @param opt_options.layerName {String} 레이어명.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.maxFeatures {Number} 피처 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWFSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.srsName = null;
		this.layerName = null;
		this.maxFeatures = null;
		this.dataViewId = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WFS";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;

			_self.olLayer = new ol.layer.Vector( {
				source : new ol.source.Vector()
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			srsName : _self.srsName,
			layerName : _self.layerName,
			getFeatures : _self.getFeatures
		} );

	} );


	ugmp.layer.uGisWFSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWFSLayer.prototype.constructor = ugmp.layer.uGisWFSLayer;


	/**
	 * OGC WFS getFeatures를 요청한다.
	 * 
	 * @param filter {ol.format.filter.Filter} 필터
	 * 
	 * @return uFeatures {@link ugmp.service.uGisGetFeature} ugmp.service.uGisGetFeature.
	 */
	ugmp.layer.uGisWFSLayer.prototype.getFeatures = function(filter_, dataViewId_) {
		var _self = this._this || this;

		var uFeatures = new ugmp.service.uGisGetFeature( {
			srsName : _self.srsName,
			useProxy : _self.useProxy,
			serviceURL : _self.getServiceURL(),
			typeName : _self.layerName,
			maxFeatures : _self.maxFeatures,
			outputFormat : "application/json",
			filter : ( filter_ !== undefined ) ? filter_ : undefined,
			dataViewId : dataViewId_,
		} );

		return uFeatures;
	};

} )();
