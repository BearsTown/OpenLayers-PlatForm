( function() {
	"use strict";

	/**
	 * uGisLineGradientAnimation 객체.
	 * 
	 * Line(선) 형태의 피처에 그라데이션 애니메이션 효과를 줄 수 있는 객체이다.
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
	 * var uGLineGraAni = new ugmp.animation.uGisLineGradientAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.LineString({...}),
	 * 		...
	 * 	) ],
	 *	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 *	animations : [ new ugmp.animation.lineGradientAnimation({...}) ],
	 *	style : {
	 *		lineWidth : 5,
	 *		startColor : 'white',
	 *		endColor : 'blue',
	 *		useSymbol : true,
	 *		symbolSRC : '/images/gRbrraN.png',
	 *		symbolAnchor : [ 0.5, 0.5 ]
	 *	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피처 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * 
	 * @param opt_options.lineWidth {Number} 선 두께.
	 * @param opt_options.startColor {ol.Color | ol.ColorLike} 그라데이션 색상1.
	 * @param opt_options.endColor {ol.Color | ol.ColorLike} 그라데이션 색상2.
	 * @param opt_options.useSymbol {Boolean} 심볼 사용 여부.
	 * @param opt_options.symbolSRC {String} 심볼 경로 || base64.
	 * @param opt_options.symbolAnchor {Number} 심볼 중심 위치.
	 * 
	 * @class
	 */
	ugmp.animation.uGisLineGradientAnimation = ( function(opt_options) {
		var _self = this;

		this.sync = null;
		this.uGisMap = null;
		this.features = null;
		this.originCRS = null;
		this.list_animation = null;

		this.isStop = null;
		this.vectorLayer = null;
		this.animationType = null;
		this.transFormFeatures = null;

		this.uGSUtil = null;
		this.dummyContext = null;
		this.list_PostcomposeKey = null;

		this.lineWidth = null;
		this.startColor = null;
		this.endColor = null;
		this.useSymbol = null;
		this.symbolIcon = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.sync = ( options.sync !== undefined ) ? options.sync : true;
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.originCRS = ( options.originCRS !== undefined ) ? options.originCRS : "EPSG:4326";
			_self.list_animation = ( Array.isArray( options.animations ) ) ? options.animations : [];
			_self.animationType = "uGisLineGradientAnimation";

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( 'uGisMap undefined' );
				return false;
			}

			_self.isStop = false;
			_self.transFormFeatures = _self.features;
			_self.vectorLayer = new ol.layer.Vector( {
				source : new ol.source.Vector()
			} );
			_self.vectorLayer.isStop = _self.isStop;
			_self.vectorLayer.animations = _self.list_animation;
			_self.uGisMap.getMap().addLayer( _self.vectorLayer );

			_self.list_PostcomposeKey = [];
			_self.uGSUtil = ugmp.util.uGisGeoSpatialUtil;
			_self.dummyContext = document.createElement( 'canvas' ).getContext( '2d' );

			_self.lineWidth = 2;
			_self.startColor = "white";
			_self.endColor = "black";
			_self.useSymbol = false;

			var proj1 = ol.proj.get( _self.originCRS );
			var proj2 = _self.uGisMap.getMap().getView().getProjection();
			_self._transformProjection( proj1, proj2 );

			_self._init();

			_self.setStyle( options.style );
			_self.setUgisMap( _self.uGisMap );


			// View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피처 정보 변경
			_self.uGisMap.getMap().on( 'change:view', function(evt_) {
				var oView = evt_.oldValue;
				var nView = evt_.target.getView();

				var oCRS = oView.getProjection();
				var nCRS = nView.getProjection();

				if ( !( ol.proj.equivalent( oCRS, nCRS ) ) ) {
					var list_PostcomposeKey = _self.list_PostcomposeKey;

					for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
						var postcomposeKey = list_PostcomposeKey[ i ];
						ol.Observable.unByKey( postcomposeKey );
					}
					_self._transformProjection( oCRS, nCRS );
					_self._init();
				}
			} );

		} )();
		// END Initialize


		return {
			_this : _self,
			start : _self.start,
			stop : _self.stop,
			destroy : _self.destroy,
			setStyle : _self.setStyle,
			getLayer : _self.getLayer,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * 피처 좌표계 변경.
	 * 
	 * View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피처 정보 변경.
	 * 
	 * @param source {ol.ProjectionLike} 원본 좌표계.
	 * @param destination {ol.ProjectionLike} 변경 좌표계.
	 * 
	 * @private
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype._transformProjection = function(source_, destination_) {
		var _self = this._this || this;

		if ( !( ol.proj.equivalent( source_, destination_ ) ) ) {
			_self.transFormFeatures = [];

			var features = _self.features.slice();

			var i, ii;
			for ( i = 0, ii = features.length; i < ii; ++i ) {
				var geom = features[ i ].clone().getGeometry();

				if ( !geom ) {
					continue;
				}

				_self.transFormFeatures.push( new ol.Feature( {
					geometry : geom.transform( _self.originCRS, destination_ )
				} ) );
			}
		}
	};


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype._init = function() {
		var _self = this._this || this;

		/**
		 * 피처 초기화
		 */
		( function() {
			var features = _self.transFormFeatures;

			for ( var i = 0; i < features.length; i++ ) {
				var feature = features[ i ];

				if ( !( feature instanceof ol.Feature ) ) {
					continue;
				}

				var geometry = feature.getGeometry();

				// 피처 타입별 처리
				if ( geometry instanceof ol.geom.LineString ) {
					addAnimateFeature( feature );
				} else if ( geometry instanceof ol.geom.MultiLineString ) {
					var lineStrings = geometry.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				}
			}


			/**
			 * 애니메이션 피처 옵션 등록
			 * 
			 * @param feature {ol.Feature} 대상 피처
			 */
			function addAnimateFeature(feature_) {
				var options = {
					vectorContext : null,
					frameState : null,
					start : 0,
					time : 0,
					elapsed : 0,
					extent : false,
					feature : feature_,
					geom : feature_.getGeometry(),
					typeGeom : feature_.getGeometry().getType(),
					bbox : feature_.getGeometry().getExtent(),
					coord : ol.extent.getCenter( feature_.getGeometry().getExtent() ),
					nowNB : 0,
					interval : ( _self.sync ? 0 : Math.floor( ( Math.random() * ( 1500 - 500 + 1 ) ) + 500 ) )
				};


				var length = feature_.getGeometry().getLength(); // 총 거리
				var cs = feature_.getGeometry().getCoordinates(); // 좌표 배열
				var lens = new Array( cs.length ); // 각 좌표 별 시작점 부터 현재 까지 거리를 담을 배열
				lens[ 0 ] = 0;
				for ( var i = 1; i < cs.length; i++ ) {
					lens[ i ] = lens[ i - 1 ] + _self.uGSUtil.getDistanceBtwPotins( cs[ i ], cs[ i - 1 ] );
				}

				options.length = length;
				options.cs = cs;
				options.lens = lens;

				var listenerKey = _self.vectorLayer.animateFeature( options );
				_self.list_PostcomposeKey.push( listenerKey );
			}

		} )();

	};


	/**
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.setStyle = function(style_) {
		var _self = this._this || this;

		var options = style_ || {};

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStyle( style_ );
		}
	};


	/**
	 * uGisMap을 설정한다.
	 * 
	 * @param uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.setUgisMap = function(uGisMap_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setUgisMap( uGisMap_ );
		}
	};


	/**
	 * 애니메이션을 시작한다.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.start = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = false;
	};


	/**
	 * 애니메이션을 정지한다.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.stop = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = true;
	};


	/**
	 * 현재 애니메이션을 전체 초기화한다.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.destroy = function() {
		var _self = this._this || this;

		var list_PostcomposeKey = _self.list_PostcomposeKey;

		for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
			var postcomposeKey = list_PostcomposeKey[ i ];
			ol.Observable.unByKey( postcomposeKey );
		}

		_self.features = null;
		_self.transFormFeatures = null;

		_self.uGisMap.getMap().removeLayer( _self.vectorLayer );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var animProperties = [];
		var animList = _self.list_animation;
		for ( var i in animList ) {
			animProperties.push( animList[ i ].getProperties() );
		}

		return {
			animationType : _self.animationType,
			animProperties : animProperties
		}
	};


	/**
	 * 애니메이션 벡터 레이어를 가져온다.
	 * 
	 * @return {ol.layer.Vector} 애니메이션 벡터 레이어.
	 */
	ugmp.animation.uGisLineGradientAnimation.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};

} )();
