( function() {
	"use strict";

	/**
	 * bounceAnimation 객체.
	 * 
	 * 피처를 상,하로 튕기는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var bounceAni = new ugmp.animation.bounceAnimation( {
	 * 	duration : 2000,
	 * 	repeat : 100,
	 * 	amplitude : 40,
	 * 	bounce : 5,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.bounce {Integer} 바운스. Default is `3`.
	 * @param opt_options.amplitude {Integer} 높이. Default is `40`.
	 * 
	 * @Extends {ugmp.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.bounceAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.bounce = null;
		this.amplitude = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "bounce";

			_self.setBounce( options.bounce );
			_self.setAmplitude( options.amplitude );

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setBounce : _self.setBounce,
			setAmplitude : _self.setAmplitude
		} );

	} );


	ugmp.animation.bounceAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.bounceAnimation.prototype.constructor = ugmp.animation.bounceAnimation;


	/**
	 * 바운스를 설정한다.
	 * 
	 * @param bounce {Number.<Integer>} 바운스.
	 */
	ugmp.animation.bounceAnimation.prototype.setBounce = function(bounce_) {
		var _self = this._this || this;
		_self.bounce = ( typeof ( bounce_ ) === "number" ) ? ( bounce_ >= 0 ? bounce_ : 3 ) : 3;
	};


	/**
	 * 높이를 설정한다.
	 * 
	 * @param easing {Number.<Integer>} 높이
	 */
	ugmp.animation.bounceAnimation.prototype.setAmplitude = function(amplitude_) {
		var _self = this._this || this;
		_self.amplitude = ( typeof ( amplitude_ ) === "number" ) ? ( amplitude_ >= 0 ? amplitude_ : 40 ) : 40;
	};


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.bounceAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var bounce = -Math.PI * ( _self.bounce );
			var flashGeom = e.geom.clone();
			var t = Math.abs( Math.sin( bounce * e.elapsed ) ) * _self.amplitude * ( 1 - _self.easing( e.elapsed ) ) * e.frameState.viewState.resolution;
			flashGeom.translate( 0, t );
			_self.drawGeom( e, flashGeom );
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
	ugmp.animation.bounceAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			bounce : _self.bounce,
			amplitude : _self.amplitude
		} );
	};

} )();
