( function() {
	"use strict";

	/**
	 * lineGradientAnimation 객체.
	 * 
	 * 라인 형태의 피처를 그라데이션 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var lineGradientAni = new ugmp.animation.lineGradientAnimation( {
	 * 	duration : 5000,
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
	ugmp.animation.lineGradientAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.lineWidth = null;
		this.startColor = null;
		this.endColor = null;
		this.useSymbol = null;
		this.symbolIcon = null;

		this.uGisMap = null;
		this.uGSUtil = null;
		this.dummyContext = null;
		this.symbolSRC = null;
		this.symbolAnchor = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "lineGradient";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.uGSUtil = ugmp.util.uGisGeoSpatialUtil;
			_self.dummyContext = document.createElement( 'canvas' ).getContext( '2d' );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle,
			setUgisMap : _self.setUgisMap
		} );

	} );


	ugmp.animation.lineGradientAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.lineGradientAnimation.prototype.constructor = ugmp.animation.lineGradientAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.lineGradientAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		if ( _self.repeat < e.nowNB ) {
			return true;
		}

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			if ( !( e.time <= _self.duration ) ) {

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
	ugmp.animation.lineGradientAnimation.prototype.customDrawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var vectorContext = e.vectorContext;
		var frameState = e.frameState;

		var cs = e.cs;
		var lens = e.lens;
		var length = e.length;

		var elapsedTime = e.elapsed;
		var len = length * elapsedTime; // 현재 실행 거리
		var fcs = [ cs[ 0 ] ]; // 현재 위치 좌표를 담을 배열 (경로상 임의 위치)
		var idx = 1;
		for ( ; idx < cs.length; idx++ ) {
			var subLen = lens[ idx ];
			if ( subLen >= len ) {
				break;
			} else {
				fcs.push( cs[ idx ] );
			}
		}
		if ( idx < cs.length ) {
			var subLen = lens[ idx ];
			len = subLen - len;
			subLen = subLen - lens[ idx - 1 ];
			var dl = len / subLen;
			var x0 = cs[ idx - 1 ][ 0 ];
			var y0 = cs[ idx - 1 ][ 1 ];
			var x1 = cs[ idx ][ 0 ];
			var y1 = cs[ idx ][ 1 ];
			var c = [ x1 - ( x1 - x0 ) * dl, y1 - ( y1 - y0 ) * dl ];
			fcs.push( c );
		}

		var flashGeo = new ol.geom.LineString( fcs );

		// 경로 그리기
		if ( typeof flashGeo !== "undefined" ) {
			vectorContext.setStyle( _self._gradientStyle( new ol.Feature( {
				geometry : flashGeo
			} ) ) );
			vectorContext.drawGeometry( flashGeo );
		}

		// 현재 위치 심볼 그리기
		_self._createSymbol( vectorContext, flashGeo );
	};


	/**
	 * 라인그라데이션 스타일을 설정한다.
	 * 
	 * style options
	 * 
	 * @param lineWidth {Double} 선 두께.
	 * @param startColor {ol.Color | ol.ColorLike} 그라데이션 색상1.
	 * @param endColor {ol.Color | ol.ColorLike} 그라데이션 색상2.
	 * @param useSymbol {Boolean} 심볼 사용 여부.
	 * @param symbolSRC {String} 심볼 경로 || base64.
	 * @param symbolAnchor {Array.<Double>} 심볼 중심 위치.
	 */
	ugmp.animation.lineGradientAnimation.prototype.setStyle = function(style_) {
		var _self = this._this || this;

		var options = style_ || {};

		if ( options.lineWidth !== undefined ) _self.lineWidth = options.lineWidth;
		if ( options.startColor !== undefined ) _self.startColor = options.startColor;
		if ( options.endColor !== undefined ) _self.endColor = options.endColor;
		if ( options.useSymbol !== undefined ) _self.useSymbol = options.useSymbol;
		if ( options.symbolSRC !== undefined ) {
			var symbolImage = new Image();
			symbolImage.src = options.symbolSRC;

			symbolImage.onload = function() {
				var icon = new ol.style.Icon( {
					img : symbolImage,
					rotation : 0,
					rotateWithView : true,
					imgSize : [ this.width, this.height ],
					anchor : options.symbolAnchor
				} );

				_self.symbolIcon = new ol.style.Style( {
					image : icon
				} );
			}
		}

		_self.style = new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : _self.startColor,
				width : _self.lineWidth
			} )
		} );
	};


	/**
	 * 그라데이션 설정
	 * 
	 * @private
	 * 
	 * @param feature {ol.Feature} 대상 피쳐
	 */
	ugmp.animation.lineGradientAnimation.prototype._gradientStyle = function(feature_) {
		var _self = this._this || this;

		var feature = feature_;
		var pixelStart;
		var pixelEnd;
		var extent = feature.getGeometry().getExtent();
		var startP = feature.getGeometry().getFirstCoordinate();
		var centerP = ol.extent.getCenter( extent );

		var angle = _self.uGSUtil.getDegreeBtwPoints( startP, centerP );

		if ( ( 0 <= angle && angle < 90 ) || ( -90 < angle && angle < 0 ) ) {
			// TopLeft -> TopRight
			pixelStart = ol.extent.getTopLeft( extent );
			pixelEnd = ol.extent.getTopRight( extent );
		} else if ( 90 === angle ) {
			// BottomRight -> TopRight
			pixelStart = ol.extent.getBottomRight( extent );
			pixelEnd = ol.extent.getTopRight( extent );
		} else if ( ( 90 < angle && angle < 180 ) || ( 180 === angle ) || ( -180 < angle && angle < -90 ) ) {
			// TopRight -> TopLeft
			pixelStart = ol.extent.getTopRight( extent );
			pixelEnd = ol.extent.getTopLeft( extent );
		} else if ( -90 === angle ) {
			// TopRight -> BottomRight
			pixelStart = ol.extent.getTopRight( extent );
			pixelEnd = ol.extent.getBottomRight( extent );
		}

		var left = _self.uGisMap.getMap().getPixelFromCoordinate( pixelStart );
		var right = _self.uGisMap.getMap().getPixelFromCoordinate( pixelEnd );

		var grad = _self.dummyContext.createLinearGradient( left[ 0 ], left[ 1 ], right[ 0 ], right[ 1 ] );

		grad.addColorStop( 0, _self.startColor );
		grad.addColorStop( 1, _self.endColor );

		var style = _self.style;

		style.getStroke().setColor( grad );

		return style;
	};


	/**
	 * 현재 위치에 심볼 그리기
	 * 
	 * @private
	 * 
	 * @param vectorContext {ol.render.VectorContext} vectorContext
	 * @param geometry {ol.geom.LineString | ol.geom.MultiLineString} 애니메이션 대상 피쳐
	 */
	ugmp.animation.lineGradientAnimation.prototype._createSymbol = function(vectorContext_, geometry_) {
		var _self = this._this || this;

		if ( !vectorContext_ || !geometry_ ) {
			return;
		}
		var coords = geometry_.getCoordinates();
		var startP = coords[ coords.length - 2 ];
		var endP = coords[ coords.length - 1 ];

		var currentPoint = new ol.geom.Point( endP ); // 현재 위치를 나타낼 포인트

		// 현재 위치 포인트 그리기
		if ( typeof currentPoint !== "undefined" ) {
			if ( _self.useSymbol && _self.symbolIcon ) {
				var rotation = _self.uGSUtil.getRadianBtwPoints( startP, endP );
				_self.symbolIcon.getImage().setRotation( -rotation );
				vectorContext_.setStyle( _self.symbolIcon );
			}

			vectorContext_.drawGeometry( currentPoint );
		}
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.lineGradientAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};


	/**
	 * uGisMap을 설정한다.
	 * 
	 * @param uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap ugmp.uGisMap} 객체.
	 */
	ugmp.animation.lineGradientAnimation.prototype.setUgisMap = function(uGisMap_) {
		var _self = this._this || this;

		_self.uGisMap = uGisMap_;
	};

} )();
