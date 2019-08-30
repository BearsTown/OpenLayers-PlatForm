( function() {
	"use strict";

	/**
	 * Vector3D 레이어 객체.
	 * 
	 * 벡터데이터를 3D로 표현할 수 있는 레이어 객체.
	 * 
	 * ※도형의 Z값으로 렌더링하는 것은 아니며, 해당 피처의 높이 값 컬럼 설정을 통해 건물의 대략적인 높이만 표현할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugVector3DLayer = new ugmp.layer.uGisVector3DLayer( {
	 * 	srsName :'EPSG:3857',
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.style {ol.style.Style} 스타일.
	 * 
	 * @param opt_options.initBuild {Boolean} 초기 3D 렌더링 사용 여부.
	 * @param opt_options.labelColumn {String} 피처에 표시할 라벨 컬럼명.
	 * @param opt_options.heightColumn {String} 피처의 높이를 참조할 컬럼명.
	 * @param opt_options.maxResolution {Number} 3D 렌더링 최대 Resolution. Default is `0.6`.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisVector3DLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.initBuild = null;
		this.features = null;
		this.srsName = null;
		this.labelColumn = null;
		this.heightColumn = null;
		this.maxResolution = null;

		this.ugRender3D = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector3D";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.labelColumn = ( options.labelColumn !== undefined ) ? options.labelColumn : "";
			_self.initBuild = ( typeof ( options.initBuild ) === "boolean" ) ? options.initBuild : true;
			_self.heightColumn = ( options.heightColumn !== undefined ) ? options.heightColumn : "";
			_self.maxResolution = ( typeof ( options.maxResolution ) === "number" ) ? options.maxResolution : 0.6;

			_self._init();

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures,
			getRender3D : _self.getRender3D
		} );

	} );


	ugmp.layer.uGisVector3DLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisVector3DLayer.prototype.constructor = ugmp.layer.uGisVector3DLayer;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.layer.uGisVector3DLayer.prototype._init = ( function() {
		var _self = this._this || this;

		_self.olLayer = new ol.layer.Vector( {
			// zIndex : 8999,
			declutter : true,
			// style : _self.style,
			source : new ol.source.Vector( {
				features : _self.features
			} )
		} );

		_self.ugRender3D = new ugmp.etc.uGisRender3D( {
			style : _self.style,
			layer : _self.olLayer,
			initBuild : _self.initBuild,
			labelColumn : _self.labelColumn,
			heightColumn : _self.heightColumn,
			maxResolution : _self.maxResolution
		} );
	} );


	/**
	 * uGisRender3D 객체를 가져온다.
	 * 
	 * @return ugRender3D {@link ugmp.etc.uGisRender3D} 객체.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.getRender3D = ( function() {
		var _self = this._this || this;
		return _self.ugRender3D;
	} );


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.addFeatures = ( function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	} );


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.getFeatures = ( function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	} );


	/**
	 * 레이어의 Feature를 지운다.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.clear = ( function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	} );

} )();
