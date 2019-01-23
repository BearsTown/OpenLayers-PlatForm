( function() {
	"use strict";

	/**
	 * uGisLineAnimation 객체.
	 * 
	 * Line(선) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.LineString 또는 ol.geom.MultiLineString
	 * 
	 * ※스타일 타입 : ol.style.Stroke
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGLineAni = new ugmp.animation.uGisLineAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.LineString({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Stroke({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Stroke} Line Stroke 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisLineAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisLineAnimation";

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


	ugmp.animation.uGisLineAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisLineAnimation.prototype.constructor = ugmp.animation.uGisLineAnimation;


	/**
	 * Line Stroke 애니메이션 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Line Stroke 스타일.
	 */
	ugmp.animation.uGisLineAnimation.prototype.setStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var strokeStyle = strokeStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} )
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : strokeStyle
		} ) ];

		_self.setStrokeStyle( strokeStyle );
		_self.setStyles( style );
	};

} )();
