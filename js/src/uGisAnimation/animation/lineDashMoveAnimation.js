( function() {
	"use strict";

	/**
	 * lineDashMoveAnimation 객체.
	 * 
	 * 라인 형태의 피처를 라인 대시 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var lineDashMoveAni = new ugmp.animation.lineDashMoveAnimation( {
	 * 	duration : 1000,
	 * 	repeat : 200,
	 * 	useFade : false
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
	ugmp.animation.lineDashMoveAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.reverse = null;

		this.currentOffset = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "lineDashMove";

			_self.currentOffset = 0;

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setReverse : _self.setReverse
		} );

	} );


	ugmp.animation.lineDashMoveAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.lineDashMoveAnimation.prototype.constructor = ugmp.animation.lineDashMoveAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		if ( _self.repeat < e.nowNB ) {
			return true;
		}

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			if ( !( e.time <= _self.duration ) ) {
				_self.moveLineDash();
			}
			_self.customDrawGeom( e, e.geom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 애니메이션 Canvas에 그리기.
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * @param geom {ol.geom.Geometry} 표시할 Geometry.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.customDrawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var vectorContext = e.vectorContext;
		var frameState = e.frameState;

		vectorContext.setStyle( _self.lineDashStyle() );
		vectorContext.drawGeometry( geom );
	};


	/**
	 * 라인 대시 스타일.
	 * 
	 * @private
	 * 
	 * @return style {ol.style.Stroke} 라인 대시 스타일.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.lineDashStyle = function() {
		var _self = this._this || this;

		var style = _self.strokeStyle;

		style.getStroke().setLineDashOffset( _self.currentOffset );

		return style;
	};


	/**
	 * 라인 대시 offset 조정.
	 * 
	 * @private
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.moveLineDash = function() {
		var _self = this._this || this;

		if ( _self.reverse ) {
			_self.currentOffset -= 10;
			if ( _self.currentOffset <= -100 ) {
				_self.currentOffset = 0;
			}
		} else {
			_self.currentOffset += 10;

			if ( _self.currentOffset >= 100 ) {
				_self.currentOffset = 0;
			}
		}
	};


	/**
	 * 방향을 전환한다.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.setReverse = function() {
		var _self = this._this || this;
		_self.reverse = !_self.reverse;
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			reverse : _self.reverse
		} );
	};

} )();
