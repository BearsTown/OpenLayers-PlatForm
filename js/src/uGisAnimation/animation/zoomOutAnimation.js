( function() {
	"use strict";

	/**
	 * zoomOutAnimation 객체.
	 * 
	 * 피처를 축소하는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var zoomOutAni = new ugmp.animation.zoomOutAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @Extends {ugmp.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.zoomOutAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "zoomOut";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.zoomOutAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.zoomOutAnimation.prototype.constructor = ugmp.animation.zoomOutAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.zoomOutAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var fac = _self.easing( e.elapsed );

		if ( fac ) {
			fac = 1 / fac;
			var style = _self.style;
			var imgs, sc = []
			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) {
					sc[ i ] = imgs.getScale();
					imgs.setScale( sc[ i ] * fac );
				}
			}

			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / fac - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( 1 / fac - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.scale( fac, fac );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();

			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) imgs.setScale( sc[ i ] );
			}

		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.zoomOutAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();
