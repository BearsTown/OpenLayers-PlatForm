( function() {
	"use strict";

	/**
	 * uGisCircleAnimation 객체.
	 * 
	 * Circle(원) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.Circle
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGcircleAni = new ugmp.animation.uGisCircleAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Circle({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Circle} Circle 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisCircleAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisCircleAnimation";

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


	ugmp.animation.uGisCircleAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisCircleAnimation.prototype.constructor = ugmp.animation.uGisCircleAnimation;


	/**
	 * Circle 애니메이션 스타일을 설정한다.
	 * 
	 * @param circleStyle {ol.style.Circle} Circle 스타일.
	 */
	ugmp.animation.uGisCircleAnimation.prototype.setStyle = function(circleStyle_) {
		var _self = this._this || this;

		var style = [ new ol.style.Style( {
			image : circleStyle_
		} ) ];

		_self.setStyles( style );
	};

} )();
