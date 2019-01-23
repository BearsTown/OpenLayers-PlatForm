/**
 * @namespace ugmp.animation
 */

( function() {
	"use strict";

	/**
	 * featureAnimation 기본 객체.
	 * 
	 * 피처 애니메이션의 기본 객체. 공통으로 반복 횟수, 투명도 효과, 지연 시간을 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @class
	 */
	ugmp.animation.featureAnimationDefault = ( function(opt_options) {
		var _self = this;

		this.easing = null;
		this.repeat = null;
		this.useFade = null;
		this.duration = null;

		this.style = null;
		this.isStop = null;
		this.strokeStyle = null;
		this.animationType = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.animationType = ( typeof ( options.animationType ) === "string" ) ? options.animationType : "zoomIn";

			_self.setEasing( options.easing );
			_self.setRepeat( options.repeat );
			_self.setUseFade( options.useFade );
			_self.setDuration( options.duration );

		} )();
		// END Initialize


		return {
			animate : _self.animate,
			setStyle : _self.setStyle,
			setRepeat : _self.setRepeat,
			setUseFade : _self.setUseFade,
			setDuration : _self.setDuration,
			setStrokeStyle : _self.setStrokeStyle,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * animate
	 * 
	 * @abstract
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.featureAnimationDefault.prototype.animate = function(e) {
		return false;
	};


	/**
	 * 효과 타입을 설정한다.
	 * 
	 * @param easing {String} 효과 타입 (ol.easing).
	 */
	ugmp.animation.featureAnimationDefault.prototype.setEasing = function(easing_) {
		var _self = this._this || this;
		_self.easing = ( typeof ( easing_ ) === "string" ) ? ol.easing[ easing_ ] : ol.easing.linear;
	};


	/**
	 * 반복 횟수를 설정한다.
	 * 
	 * @param repeat {Number.<Integer>} 반복 횟수.
	 */
	ugmp.animation.featureAnimationDefault.prototype.setRepeat = function(repeat_) {
		var _self = this._this || this;
		_self.repeat = ( typeof ( repeat_ ) === "number" ) ? ( repeat_ >= 0 ? repeat_ : 10000 ) : 10000;
	};


	/**
	 * 투명도 효과 사용 여부 설정.
	 * 
	 * @param fade {Boolean} 투명도 효과 사용 여부.
	 */
	ugmp.animation.featureAnimationDefault.prototype.setUseFade = function(fade_) {
		var _self = this._this || this;
		_self.useFade = ( typeof ( fade_ ) === "boolean" ) ? fade_ : true;
	};


	/**
	 * 지연 시간을 설정한다.
	 * 
	 * @param duration {Number.<Integer>} 지연 시간.
	 */
	ugmp.animation.featureAnimationDefault.prototype.setDuration = function(duration_) {
		var _self = this._this || this;
		_self.duration = ( typeof ( duration_ ) === "number" ) ? ( duration_ >= 0 ? duration_ : 2000 ) : 2000;
	};


	/**
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	ugmp.animation.featureAnimationDefault.prototype.setStyle = function(style_) {
		var _self = this._this || this;
		_self.style = style_;
	};


	/**
	 * Stroke 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Stroke 스타일.
	 */
	ugmp.animation.featureAnimationDefault.prototype.setStrokeStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var style = new ol.style.Style( {
			stroke : strokeStyle_
		} );

		_self.strokeStyle = style;
	};


	/**
	 * 애니메이션 Canvas에 그리기.
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * @param geom {ol.geom.Geometry} 표시할 Geometry.
	 */
	ugmp.animation.featureAnimationDefault.prototype.drawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			// e.context.globalAlpha = ol.easing.easeOut( 1 - e.elapsed );
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var style = _self.style;
		for ( var i = 0; i < style.length; i++ ) {
			var sc = 0;
			var imgs = ol.Map.prototype.getFeaturesAtPixel ? false : style[ i ].getImage();
			if ( imgs ) {
				sc = imgs.getScale();
				imgs.setScale( e.frameState.pixelRatio * sc );
			}

			e.vectorContext.setStyle( style[ i ] );
			e.vectorContext.drawGeometry( geom );

			if ( imgs ) {
				imgs.setScale( sc );
			}
		}
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.featureAnimationDefault.prototype.getProperties = function() {
		var _self = this._this || this;

		return {
			repeat : _self.repeat,
			useFade : _self.useFade,
			duration : _self.duration,
			animationType : _self.animationType
		}
	};

} )();
