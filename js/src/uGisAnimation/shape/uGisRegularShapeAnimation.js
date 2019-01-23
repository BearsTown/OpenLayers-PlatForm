( function() {
	"use strict";

	/**
	 * uGisRegularShapeAnimation 객체.
	 * 
	 * RegularShape 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.RegularShape
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGregularShapeAni = new ugmp.animation.uGisCircleAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.RegularShape({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.RegularShape} RegularShape 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisRegularShapeAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisRegularShapeAnimation";

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


	ugmp.animation.uGisRegularShapeAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisRegularShapeAnimation.prototype.constructor = ugmp.animation.uGisRegularShapeAnimation;


	/**
	 * RegularShape 애니메이션 스타일을 설정한다.
	 * 
	 * @param regularShapeStyle {ol.style.RegularShape} RegularShape 애니메이션 스타일.
	 */
	ugmp.animation.uGisRegularShapeAnimation.prototype.setStyle = function(regularShapeStyle_) {
		var _self = this._this || this;

		var regularShapeStyle = regularShapeStyle_;

		var style = [ new ol.style.Style( {
			image : regularShapeStyle
		} ) ];

		_self.setStyles( style );
	};

} )();
