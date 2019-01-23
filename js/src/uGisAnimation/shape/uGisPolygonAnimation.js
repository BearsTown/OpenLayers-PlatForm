( function() {
	"use strict";

	/**
	 * uGisPolygonAnimation 객체.
	 * 
	 * Polygon(폴리곤) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Polygon 또는 ol.geom.MultiPolygon
	 * 
	 * ※스타일 타입 : ol.style.Style
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGPolygonAni = new ugmp.animation.uGisPolygonAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Polygon({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Polygon|ol.geom.MultiPolygon>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.Style} Polygon 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisPolygonAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisPolygonAnimation";

			_super = ugmp.animation.uGisShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	ugmp.animation.uGisPolygonAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisPolygonAnimation.prototype.constructor = ugmp.animation.uGisPolygonAnimation;


	/**
	 * Polygon 애니메이션 스타일을 설정한다.
	 * 
	 * @param polyonStyle {ol.style.Style} Polygon 스타일.
	 */
	ugmp.animation.uGisPolygonAnimation.prototype.setStyle = function(polyonStyle_) {
		var _self = this._this || this;

		var polyStyle = polyonStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} ),
			fill : new ol.style.Fill( {
				color : [ 0, 0, 0, 0 ]
			} ),
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : polyStyle.getStroke(),
			fill : polyStyle.getFill()
		} ) ];

		_self.setStyles( style );
	};

} )();
