( function() {
	"use strict";

	/**
	 * teleportAnimation 객체.
	 * 
	 * 피처를 순간 이동하여 나타내는 것처럼 보이는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var teleportAni = new ugmp.animation.teleportAnimation( {
	 * 	duration : 2000,
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
	ugmp.animation.teleportAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "teleport";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.teleportAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.teleportAnimation.prototype.constructor = ugmp.animation.teleportAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.teleportAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var sc = _self.easing( e.elapsed );
		if ( sc ) {
			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				e.context.globalAlpha = sc;
				e.context.scale( sc, 1 / sc );
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / sc - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( sc - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();
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
	ugmp.animation.teleportAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();
