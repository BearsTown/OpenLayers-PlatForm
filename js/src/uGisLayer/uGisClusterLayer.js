( function() {
	"use strict";

	/**
	 * Cluster 레이어 객체.
	 * 
	 * Cluster 데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★ 기능 개발
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugVectorLayer = new ugmp.layer.uGisClusterLayer( {
	 * distance : 50,
	 * features : [ new ol.Feature( {
	 * 	geometry : new ol.geom.Point({...})
	 * } ) ],
	 * useAnimation : true,
	 * style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.distance {Number} 클러스터 사이의 거리. Default is `50`.
	 * @param opt_options.useAnimation {Boolean} 애니메이션 효과 사용 여부. Default is `true`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 대상 피처 리스트.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisClusterLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.distance = null;
		this.features = null;

		this.clusters = null;
		this.animation = null;
		this.oldcluster = null;
		this.useAnimation = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Cluster";
			options.useGetFeature = false;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.clusters = [];
			_self.oldcluster = new ol.source.Vector();
			_self.animation = {
				start : false
			};

			_self.style = ( options.style !== undefined ) ? options.style : _self._defaultStyle;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.distance = ( typeof ( options.distance ) === "number" ) ? options.distance : 50;
			_self.useAnimation = ( typeof ( options.useAnimation ) === "boolean" ) ? options.useAnimation : true;

			_self._init();

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setDistance : _self.setDistance,
			getFeatures : _self.getFeatures,
			setUseAnimation : _self.setUseAnimation
		} );

	} );


	ugmp.layer.uGisClusterLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisClusterLayer.prototype.constructor = ugmp.layer.uGisClusterLayer;


	/**
	 * init
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._init = function(state_) {
		var _self = this._this || this;

		_self.olLayer = new ol.layer.Vector( {
			source : new ol.source.Cluster( {
				distance : _self.distance,
				source : new ol.source.Vector( {
					features : _self.features
				} )
			} ),
			style : _getStyle
		} );


		_self.setUseAnimation( _self.useAnimation );
		_self.olLayer.set( 'animationMethod', ol.easing.easeOut );

		// Save cluster before change
		_self.olLayer.getSource().on( 'change', _self._saveCluster, _self );
		// Animate the cluster
		_self.olLayer.on( 'precompose', _self._animate, _self );
		_self.olLayer.on( 'postcompose', _self._postanimate, _self );


		var styleCache = {};
		function _getStyle(feature, resolution) {
			var size = feature.get( 'features' ).length;
			var style = styleCache[ size ];
			if ( !style ) {
				if ( typeof _self.style === "function" ) {
					style = _self.style.call( this, feature, resolution );
				} else {
					style = _self.style;
				}
				styleCache[ size ] = style;
			}
			return [ style ];
		}
	};


	/**
	 * 기본 스타일
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._defaultStyle = function(feature, resolution) {
		var size = feature.get( 'features' ).length;
		var color = size > 25 ? "192,0,0" : size > 8 ? "255,128,0" : "0,128,0";
		var radius = Math.max( 8, Math.min( size * 0.75, 20 ) );
		var dash = 2 * Math.PI * radius / 6;
		var dash = [ 0, dash, dash, dash, dash, dash, dash ];
		var style = new ol.style.Style( {
			image : new ol.style.Circle( {
				radius : radius,
				stroke : new ol.style.Stroke( {
					color : "rgba(" + color + ",0.5)",
					width : 15,
					lineDash : dash,
					lineCap : "butt"
				} ),
				fill : new ol.style.Fill( {
					color : "rgba(" + color + ",1)"
				} )
			} ),
			text : new ol.style.Text( {
				text : size.toString(),
				fill : new ol.style.Fill( {
					color : '#fff'
				} )
			} )
		} );

		return style;
	};


	/**
	 * 클러스터 애니메이션 효과 사용 여부 설정.
	 * 
	 * @param state {Boolean} 애니메이션 효과 사용 여부.
	 */
	ugmp.layer.uGisClusterLayer.prototype.setUseAnimation = function(state_) {
		var _self = this._this || this;
		_self.olLayer.set( 'animationDuration', state_ ? 700 : 0 );
	};


	/**
	 * 클러스터 사이의 거리 설정.
	 * 
	 * @param distance {Number} 클러스터 사이의 거리.
	 */
	ugmp.layer.uGisClusterLayer.prototype.setDistance = function(distance_) {
		var _self = this._this || this;

		var source = _self.olLayer.getSource();
		ol.source.Cluster.prototype.setDistance.call( source, distance_ );
	};


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	ugmp.layer.uGisClusterLayer.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getSource().getFeatures();
	};


	/**
	 * _saveCluster
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._saveCluster = function() {
		var _self = this._this || this;

		_self.oldcluster.clear();
		if ( !_self.olLayer.get( 'animationDuration' ) ) return;

		var features = _self.olLayer.getSource().getFeatures();
		if ( features.length && features[ 0 ].get( 'features' ) ) {
			_self.oldcluster.addFeatures( _self.clusters );
			_self.clusters = features.slice( 0 );
			_self.sourceChanged = true;
		}
	};


	/**
	 * Get the cluster that contains a feature
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._getClusterForFeature = function(f, cluster) {
		var _self = this._this || this;

		for ( var j = 0 , c; c = cluster[ j ]; j++ ) {
			var features = cluster[ j ].get( 'features' );

			if ( features && features.length ) {
				for ( var k = 0 , f2; f2 = features[ k ]; k++ ) {
					if ( f === f2 ) {
						return cluster[ j ];
					}
				}
			}
		}
		return false;
	};


	/**
	 * _stopAnimation
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._stopAnimation = function() {
		var _self = this._this || this;
		_self.animation.start = false;
		_self.animation.cA = [];
		_self.animation.cB = [];
	};


	/**
	 * animate the cluster
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._animate = function(e) {
		var _self = this._this || this;

		var duration = _self.olLayer.get( 'animationDuration' );
		if ( !duration ) return;

		var resolution = e.frameState.viewState.resolution;
		var a = _self.animation;
		var time = e.frameState.time;

		// Start a new animation, if change resolution and source has changed
		if ( a.resolution != resolution && _self.sourceChanged ) {
			var extent = e.frameState.extent;

			if ( a.resolution < resolution ) {
				extent = ol.extent.buffer( extent, 100 * resolution );
				a.cA = _self.oldcluster.getFeaturesInExtent( extent );
				a.cB = _self.olLayer.getSource().getFeaturesInExtent( extent );
				a.revers = false;
			} else {
				extent = ol.extent.buffer( extent, 100 * resolution );
				a.cA = _self.olLayer.getSource().getFeaturesInExtent( extent );
				a.cB = _self.oldcluster.getFeaturesInExtent( extent );
				a.revers = true;
			}

			a.clusters = [];

			for ( var i = 0 , c0; c0 = a.cA[ i ]; i++ ) {
				var f = c0.get( 'features' );
				if ( f && f.length ) {
					var c = _self._getClusterForFeature( f[ 0 ], a.cB );
					if ( c ) a.clusters.push( {
						f : c0,
						pt : c.getGeometry().getCoordinates()
					} );
				}
			}

			// Save state
			a.resolution = resolution;
			_self.sourceChanged = false;

			// No cluster or too much to animate
			if ( !a.clusters.length || a.clusters.length > 1000 ) {
				_self._stopAnimation();
				return;
			}
			// Start animation from now
			time = a.start = ( new Date() ).getTime();
		}

		// Run animation
		if ( a.start ) {
			var vectorContext = e.vectorContext;
			var d = ( time - a.start ) / duration;

			// Animation ends
			if ( d > 1.0 ) {
				_self._stopAnimation();
				d = 1;
			}
			d = _self.olLayer.get( 'animationMethod' )( d );

			// Animate
			var style = _self.olLayer.getStyle();
			var stylefn = ( typeof ( style ) == 'function' ) ? style : style.length ? function() {
				return style;
			} : function() {
				return [ style ];
			};

			// Layer opacity
			e.context.save();
			e.context.globalAlpha = _self.olLayer.getOpacity();

			// Retina device
			var ratio = e.frameState.pixelRatio;

			for ( var i = 0 , c; c = a.clusters[ i ]; i++ ) {
				var pt = c.f.getGeometry().getCoordinates();

				if ( a.revers ) {
					pt[ 0 ] = c.pt[ 0 ] + d * ( pt[ 0 ] - c.pt[ 0 ] );
					pt[ 1 ] = c.pt[ 1 ] + d * ( pt[ 1 ] - c.pt[ 1 ] );
				} else {
					pt[ 0 ] = pt[ 0 ] + d * ( c.pt[ 0 ] - pt[ 0 ] );
					pt[ 1 ] = pt[ 1 ] + d * ( c.pt[ 1 ] - pt[ 1 ] );
				}

				// Draw feature
				var st = stylefn( c.f, resolution );
				/* Preserve pixel ration on retina */
				var s;
				var geo = new ol.geom.Point( pt );
				for ( var k = 0; s = st[ k ]; k++ ) {
					var sc;
					// OL < v4.3 : setImageStyle doesn't check retina
					var imgs = ol.Map.prototype.getFeaturesAtPixel ? false : s.getImage();
					if ( imgs ) {
						sc = imgs.getScale();
						imgs.setScale( sc * ratio );
					}
					// OL3 > v3.14
					if ( vectorContext.setStyle ) {
						vectorContext.setStyle( s );
						vectorContext.drawGeometry( geo );
					}
					// older version
					else {
						vectorContext.setImageStyle( imgs );
						vectorContext.setTextStyle( s.getText() );
						vectorContext.drawPointGeometry( geo );
					}
					if ( imgs ) imgs.setScale( sc );
				}
			}

			e.context.restore();
			// tell OL3 to continue postcompose animation
			e.frameState.animate = true;

			// Prevent layer drawing (clip with null rect)
			e.context.save();
			e.context.beginPath();
			e.context.rect( 0, 0, 0, 0 );
			e.context.clip();
			_self.clip_ = true;
		}

		return;
	};


	/**
	 * remove clipping after the layer is drawn
	 * 
	 * @private
	 */
	ugmp.layer.uGisClusterLayer.prototype._postanimate = function(e) {
		var _self = this._this || this;
		if ( _self.clip_ ) {
			e.context.restore();
			_self.clip_ = false;
		}
	};

} )();
