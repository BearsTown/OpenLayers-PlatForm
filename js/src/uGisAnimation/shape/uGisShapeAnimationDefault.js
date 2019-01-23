( function() {
	"use strict";

	/**
	 * uGisShapeAnimation 기본 객체.
	 * 
	 * 피처의 Shape 타입 애니메이션의 기본 객체. 공통으로 동기화 사용 여부, 멀티 애니메이션(ugmp.animation.featureAnimationDefault) 효과를 줄 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * 
	 * @class
	 */
	ugmp.animation.uGisShapeAnimationDefault = ( function(opt_options) {
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
		this.list_PostcomposeKey = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.sync = ( typeof ( options.sync ) === "boolean" ) ? options.sync : true;
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.originCRS = ( options.originCRS !== undefined ) ? options.originCRS : "EPSG:4326";
			_self.list_animation = ( Array.isArray( options.animations ) ) ? options.animations : [];
			_self.animationType = ( typeof ( options.animationType ) === "string" ) ? options.animationType : undefined;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( 'uGisMap undefined' );
				return false;
			}

			_self.isStop = false;
			_self.transFormFeatures = _self.features;
			_self.vectorLayer = new ol.layer.Vector( {
				source : new ol.source.Vector(),
			// zIndex : 99999
			} );
			_self.vectorLayer.isStop = _self.isStop;
			_self.vectorLayer.animations = _self.list_animation;
			_self.uGisMap.getMap().addLayer( _self.vectorLayer );

			_self.list_PostcomposeKey = [];

			var proj1 = ol.proj.get( _self.originCRS );
			var proj2 = _self.uGisMap.getMap().getView().getProjection();
			_self._transformProjection( proj1, proj2 );

			// View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피쳐 정보 변경
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
					_self.init();
				}
			} );

		} )();
		// END Initialize


		return {
			stop : _self.stop,
			start : _self.start,
			destroy : _self.destroy,
			getLayer : _self.getLayer,
			getProperties : _self.getProperties
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.init = function() {
		var _self = this._this || this;

		/**
		 * 피쳐 초기화
		 */
		( function() {
			var features = _self.transFormFeatures;

			for ( var i = 0; i < features.length; i++ ) {
				var feature = features[ i ];

				if ( !( feature instanceof ol.Feature ) ) {
					continue;
				}

				var geometry = feature.getGeometry();

				// 피쳐 타입별 처리
				if ( geometry instanceof ol.geom.Point || geometry instanceof ol.geom.LineString || geometry instanceof ol.geom.Polygon ) {
					addAnimateFeature( feature );
				} else if ( geometry instanceof ol.geom.MultiPoint ) {
					var points = geometry.getPoints();
					for ( var j = 0; j < points.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : points[ j ]
						} ) );
					}
				} else if ( geometry instanceof ol.geom.MultiLineString ) {
					var lineStrings = geometry.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				} else if ( geometry instanceof ol.geom.MultiPolygon ) {
					var polygons = geometry.getPolygons();
					for ( var j = 0; j < polygons.length; j++ ) {
						addAnimateFeature( new ol.Feature( {
							geometry : polygons[ j ]
						} ) );
					}
				}
			}


			/**
			 * 애니메이션 피쳐 옵션 등록
			 * 
			 * @param feature {ol.Feature} 대상 피쳐
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

				var listenerKey = _self.vectorLayer.animateFeature( options );
				_self.list_PostcomposeKey.push( listenerKey );
			}

		} )();

	};


	/**
	 * 피처 좌표계 변경.
	 * 
	 * -View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 피쳐 정보 변경.
	 * 
	 * @param source {ol.ProjectionLike} 원본 좌표계.
	 * @param destination {ol.ProjectionLike} 변경 좌표계.
	 * 
	 * @private
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype._transformProjection = function(source_, destination_) {
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
	 * 애니메이션 스타일을 설정한다.
	 * 
	 * @param style {Array.<ol.style>} 애니메이션 스타일 리스트.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.setStyles = function(style_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStyle( style_ );
		}
	};


	/**
	 * Stroke 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Stroke 스타일.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.setStrokeStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var list = _self.list_animation;
		for ( var i in list ) {
			list[ i ].setStrokeStyle( strokeStyle_ );
		}
	};


	/**
	 * 애니메이션을 시작한다.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.start = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = false;
	};


	/**
	 * 애니메이션을 정지한다.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.stop = function() {
		var _self = this._this || this;
		_self.vectorLayer.isStop = true;
	};


	/**
	 * 현재 애니메이션을 전체 초기화한다.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.destroy = function() {
		var _self = this._this || this;

		var list_PostcomposeKey = _self.list_PostcomposeKey;

		for ( var i = 0; i < list_PostcomposeKey.length; i++ ) {
			var postcomposeKey = list_PostcomposeKey[ i ];
			ol.Observable.unByKey( postcomposeKey );
		}

		_self.features = [];
		_self.transFormFeatures = [];

		_self.uGisMap.getMap().removeLayer( _self.vectorLayer );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.getProperties = function() {
		var _self = this._this || this;

		var animProperties = [];
		var animList = _self.list_animation;
		for ( var i in animList ) {
			animProperties.push( animList[ i ].getProperties() );
		}

		return {
			animProperties : animProperties,
			animationType : _self.animationType
		}
	};


	/**
	 * 애니메이션 벡터 레이어를 가져온다.
	 * 
	 * @return {ol.layer.Vector} 애니메이션 벡터 레이어.
	 */
	ugmp.animation.uGisShapeAnimationDefault.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};

} )();
