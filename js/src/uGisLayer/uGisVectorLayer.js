( function() {
	"use strict";

	/**
	 * Vector 레이어 객체.
	 * 
	 * 벡터데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugVectorLayer = new ugmp.layer.uGisVectorLayer( {
	 * 	declutter : true, 
	 * 	srsName : 'EPSG:3857',
	 * 	style : new ol.style.Style({...}),
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ]
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.declutter {Boolean} 디클러터링 설정 (이미지, 텍스트). Default is `true`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisVectorLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.features = null;
		this.srsName = null;
		this.declutter = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.declutter = ( typeof ( options.declutter ) === "boolean" ) ? options.declutter : true;

			_self.olLayer = new ol.layer.Vector( {
				// zIndex : 8999,
				declutter : false,
				style : _self.style,
				source : new ol.source.Vector( {
					features : _self.features
				} )
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures
		} );

	} );


	ugmp.layer.uGisVectorLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisVectorLayer.prototype.constructor = ugmp.layer.uGisVectorLayer;


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	ugmp.layer.uGisVectorLayer.prototype.addFeatures = function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	};


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	ugmp.layer.uGisVectorLayer.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	};


	/**
	 * 레이어의 Feature를 지운다.
	 */
	ugmp.layer.uGisVectorLayer.prototype.clear = function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	};

} )();
