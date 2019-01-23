( function() {
	"use strict";

	/**
	 * dropAnimation 객체.
	 * 
	 * 피처를 위에서 아래로 또는 아래에서 위로 떨어트리는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var dropAni = new ugmp.animation.dropAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	side : 'top',
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.side {String} 시작 위치 (top, bottom). Default is `top`.
	 * 
	 * @class
	 */
	ugmp.animation.dropAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.side = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "drop";

			_self.setSide( options.side );

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setSide : _self.setSide
		} );

	} );


	ugmp.animation.dropAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.dropAnimation.prototype.constructor = ugmp.animation.dropAnimation;


	/**
	 * 시작 위치를 설정한다.
	 * 
	 * @param side side {String} 시작 위치 (top, bottom).
	 */
	ugmp.animation.dropAnimation.prototype.setSide = function(side_) {
		var _self = this._this || this;
		_self.side = ( typeof ( side_ ) === "string" ) ? side_ : "top";
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
	ugmp.animation.dropAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var dy;
			if ( _self.side == 'top' ) {
				dy = e.extent[ 3 ] - e.bbox[ 1 ];
			} else if ( _self.side == 'bottom' ) {
				dy = e.extent[ 1 ] - e.bbox[ 3 ];
			}

			var flashGeom = e.geom.clone();
			flashGeom.translate( 0, dy * ( 1 - _self.easing( e.elapsed ) ) );
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
	ugmp.animation.dropAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			side : _self.side
		} );
	};

} )();
