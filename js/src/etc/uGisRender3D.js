( function() {
	"use strict";

	/**
	 * Vector 3D 렌더링 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugRender3D = new ugmp.etc.uGisRender3D( {
	 * 	style : new ol.style.Style({...}),
	 * 	layer : new ol.layer.Vector({...}),
	 * 	initBuild : true,
	 * 	labelColumn : 'BUILD_NAME',
	 * 	heightColumn : 'BUILD_HEIGHT',
	 * 	maxResolution : 0.5
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.style {ol.style.Style} 스타일.
	 * @param opt_options.easing {ol.easing} ol.easing 타입.
	 * @param opt_options.layer {ol.layer.Vector} 벡터레이어 객체.
	 * @param opt_options.initBuild {Boolean} 초기 3D 렌더링 사용 여부.
	 * @param opt_options.labelColumn {String} 피처에 표시할 라벨 컬럼명.
	 * @param opt_options.heightColumn {String} 피처의 높이를 참조할 컬럼명.
	 * @param opt_options.animateDuration {Number} 3D 렌더링 지연 시간. Default is `1000`.
	 * @param opt_options.maxResolution {Number} 3D 렌더링 최대 Resolution. Default is `0.6`.
	 * 
	 * @class
	 */
	ugmp.etc.uGisRender3D = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.layer = null;
		this.easing = null;
		this.initBuild = null;
		this.labelColumn = null;
		this.defaultHeight = null;
		this.heightColumn = null;
		this.maxResolution = null;
		this.animateDuration = null;

		this.res = null;
		this.center = null;
		this.height = null;
		this.matrix = null;
		this.listener = null;
		this.animate = null;
		this.toHeight = null;
		this.buildState = null;
		this.elapsedRatio = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.layer = ( options.layer !== undefined ) ? options.layer : undefined;
			_self.easing = ( options.easing !== undefined ) ? options.easing : ol.easing.easeOut;
			_self.initBuild = ( typeof ( options.initBuild ) === "boolean" ) ? options.initBuild : true;
			_self.labelColumn = _self.labelColumn = ( options.labelColumn !== undefined ) ? options.labelColumn : "";
			_self.heightColumn = _self.heightColumn = ( options.heightColumn !== undefined ) ? options.heightColumn : "";
			_self.animateDuration = ( typeof ( options.animateDuration ) === "number" ) ? options.animateDuration : 1000;
			_self.defaultHeight = options.defaultHeight = ( typeof ( options.defaultHeight ) === "number" ) ? options.defaultHeight : 0;
			_self.maxResolution = options.maxResolution = ( typeof ( options.maxResolution ) === "number" ) ? options.maxResolution : 0.6;

			_super = ol.Object.call( _self, options );

			_self._init();

		} )();
		// END Initialize

		
		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			isBuild3D : _self.isBuild3D,
			setBuild3D : _self.setBuild3D,
			buildToggle : _self.buildToggle
		} );

	} );


	ugmp.etc.uGisRender3D.prototype = Object.create( ol.Object.prototype );
	ugmp.etc.uGisRender3D.prototype.constructor = ugmp.etc.uGisRender3D;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._init = ( function() {
		var _self = this._this || this;

		_self._setStyle( _self.style );
		_self._setLayer( _self.layer );
		_self.height = _self._getHfn( _self.heightColumn );
	} );


	/**
	 * Set style associated with the renderer
	 * 
	 * @param {ol.style.Style} s
	 * 
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._setStyle = ( function(style_) {
		var _self = this._this || this;

		if ( style_ instanceof ol.style.Style ) {
			_self._style = style_;
		} else {
			_self._style = new ol.style.Style();
		}

		if ( !_self._style.getStroke() ) {
			_self._style.setStroke( new ol.style.Stroke( {
				width : 1,
				color : "RED"
			} ) );
		}

		if ( !_self._style.getFill() ) {
			_self._style.setFill( new ol.style.Fill( {
				color : "rgba(0,0,255,0.5)"
			} ) );
		}

		// Get the geometry
		if ( style_ && style_.getGeometry() ) {
			var geom = style_.getGeometry();
			if ( typeof ( geom ) === "function" ) {
				_self.set( "geometry", geom );
			} else {
				_self.set( "geometry", function() {
					return geom;
				} );
			}
		} else {
			_self.set( "geometry", function(f_) {
				return f_.getGeometry();
			} );
		}
	} );


	/**
	 * Set layer to render 3D
	 * 
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._setLayer = ( function(layer_) {
		var _self = this._this || this;

		_self._layer = layer_;

		if ( _self.listener_ ) {
			_self.listener_.forEach( function(lKey_) {
				ol.Observable.unByKey( lKey_ );
			} );
		}

		_self.listener_ = layer_.on( [ "postcompose", "postrender" ], _self._onPostcompose.bind( _self ) );
		
		_self.setBuild3D( _self.initBuild );
	} );


	/**
	 * Calculate 3D at potcompose
	 * 
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._onPostcompose = ( function(e_) {
		var _self = this._this || this;

		var res = e_.frameState.viewState.resolution;
		if ( res > _self.get( "maxResolution" ) ) return;

		var asd = ugMap.getMap().getRenderer().getLayerRenderer( _self.layer );


		asd.declutterTree_.clear();

		_self.res = res * 400;

		if ( _self.animate ) {
			var elapsed = e_.frameState.time - _self.animate;

			if ( elapsed < _self.animateDuration ) {
				_self.elapsedRatio = _self.easing( elapsed / _self.animateDuration );
				// tell OL3 to continue postcompose animation
				e_.frameState.animate = true;
			} else {
				_self.animate = false;
				_self.height = _self.toHeight;
			}
		}

		var ratio = e_.frameState.pixelRatio;
		var ctx = e_.context;
		var m = _self.matrix = e_.frameState.coordinateToPixelTransform;
		// Old version (matrix)
		if ( !m ) {
			m = e_.frameState.coordinateToPixelMatrix, m[ 2 ] = m[ 4 ];
			m[ 3 ] = m[ 5 ];
			m[ 4 ] = m[ 12 ];
			m[ 5 ] = m[ 13 ];
		}


		_self.center = [ ctx.canvas.width/2/ratio, ctx.canvas.height/ratio ];


		var f = _self.layer.getSource().getFeaturesInExtent( e_.frameState.extent );
		ctx.save();
		ctx.scale( ratio, ratio );

		var s = _self.style;
		ctx.lineWidth = s.getStroke().getWidth();
		ctx.fillStyle = ol.color.asString( s.getFill().getColor() );
		ctx.strokeStyle = ol.color.asString( s.getStroke().getColor() );

		var builds = [];
		for ( var i = 0; i < f.length; i++ ) {
			builds.push( _self._getFeature3D( f[ i ], _self._getFeatureHeight( f[ i ] ) ) );
		}

		_self._drawFeature3D( ctx, builds );
		ctx.restore();
	} );


	/**
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._getFeature3D = ( function(f_, h_) {
		var _self = this._this || this;

		var geom = _self.get( "geometry" )( f_ );
		var c = geom.getCoordinates();

		switch ( geom.getType() ) {
			case "Polygon" :
				c = [ c ];
				// fallthrough

			case "MultiPolygon" :
				var build = [];
				for ( var i = 0; i < c.length; i++ ) {
					for ( var j = 0; j < c[ i ].length; j++ ) {
						var b = [];
						for ( var k = 0; k < c[ i ][ j ].length; k++ ) {
							b.push( _self._hvector( c[ i ][ j ][ k ], h_ ) );
						}
						build.push( b );
					}
				}

				return {
					type : "MultiPolygon",
					feature : f_,
					geom : build
				};

			case "Point" :
				return {
					type : "Point",
					feature : f_,
					geom : _self._hvector( c, h )
				};

			default :
				return {};
		}
	} );


	/**
	 * Create a function that return height of a feature
	 * 
	 * @param {function|string|number} h a height function or a popertie name or a fixed value
	 * 
	 * @private
	 * 
	 * @return {function} function(f) return height of the feature f
	 */
	ugmp.etc.uGisRender3D.prototype._getHfn = ( function(h_) {
		var _self = this._this || this;

		switch ( typeof ( h_ ) ) {
			case 'function' :
				return h_;

			case 'string' : {
				var dh = _self.get( "defaultHeight" );
				return ( function(f_) {
					return ( Number( f_.get( h_ ) ) || dh );
				} );
			}

			case 'number' :
				return ( function(/* f */) {
					return h_;
				} );

			default :
				return ( function(/* f */) {
					return 10;
				} );
		}
	} );


	/**
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._hvector = ( function(pt_, h_) {
		var _self = this._this || this;

		var p0 = [ pt_[ 0 ] * _self.matrix[ 0 ] + pt_[ 1 ] * _self.matrix[ 1 ] + _self.matrix[ 4 ],
			pt_[ 0 ] * _self.matrix[ 2 ] + pt_[ 1 ] * _self.matrix[ 3 ] + _self.matrix[ 5 ] ];
	
		return {
			p0 : p0,
			p1 : [ p0[ 0 ] + h_ / _self.res * ( p0[ 0 ] - _self.center[ 0 ] ), p0[ 1 ] + h_ / _self.res * ( p0[ 1 ] - _self.center[ 1 ] ) ]
		};
	} );


	/**
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._getFeatureHeight = ( function(f_) {
		var _self = this._this || this;

		if ( _self.animate ) {
			var h1 = _self.height( f_ );
			var h2 = _self.toHeight( f_ );

			return ( h1 * ( 1 - _self.elapsedRatio ) + _self.elapsedRatio * h2 );
		} else {
			return _self.height( f_ );
		}
	} );


	/**
	 * @private
	 */
	ugmp.etc.uGisRender3D.prototype._drawFeature3D = ( function(ctx_, build_) {
		var _self = this._this || this;

		var i, j, b, k;
		// Construct
		for ( i = 0; i < build_.length; i++ ) {
			switch ( build_[ i ].type ) {
				case "MultiPolygon" : {
					for ( j = 0; j < build_[ i ].geom.length; j++ ) {
						b = build_[ i ].geom[ j ];
						for ( k = 0; k < b.length; k++ ) {
							ctx_.beginPath();
							ctx_.moveTo( b[ k ].p0[ 0 ], b[ k ].p0[ 1 ] );
							ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							ctx_.stroke();
						}
					}
					break;
				}

				case "Point" : {
					var g = build_[ i ].geom;
					ctx_.beginPath();
					ctx_.moveTo( g.p0[ 0 ], g.p0[ 1 ] );
					ctx_.lineTo( g.p1[ 0 ], g.p1[ 1 ] );
					ctx_.stroke();
					break;
				}
				default :
					break;
			}
		}

		// Roof
		for ( i = 0; i < build_.length; i++ ) {
			switch ( build_[ i ].type ) {
				case "MultiPolygon" : {
					ctx_.beginPath();
					for ( j = 0; j < build_[ i ].geom.length; j++ ) {
						b = build_[ i ].geom[ j ];
						if ( j == 0 ) {
							ctx_.moveTo( b[ 0 ].p1[ 0 ], b[ 0 ].p1[ 1 ] );
							for ( k = 1; k < b.length; k++ ) {
								ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							}
						} else {
							ctx_.moveTo( b[ 0 ].p1[ 0 ], b[ 0 ].p1[ 1 ] );
							for ( k = b.length - 2; k >= 0; k-- ) {
								ctx_.lineTo( b[ k ].p1[ 0 ], b[ k ].p1[ 1 ] );
							}
						}
						ctx_.closePath();
					}
					ctx_.fill( "evenodd" );
					ctx_.stroke();


					b = build_[ i ];
					var text = b.feature.get( _self.labelColumn );

					if ( text ) {
						var center = ugmp.util.uGisGeoSpatialUtil.getGeomCenter( b.feature.getGeometry() );
						var p = _self._hvector( center, _self._getFeatureHeight( b.feature ) ).p1;

						var f = ctx_.fillStyle;

						var m = ctx_.measureText( text );
						var h = Number( ctx_.font.match( /\d+(\.\d+)?/g ).join( [] ) );
						ctx_.fillStyle = "rgba(255,255,255,0.5)";
						ctx_.fillRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.strokeRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )

						ctx_.font = "bold 12px Verdana";
						ctx_.fillStyle = 'black';
						ctx_.textAlign = 'center';
						ctx_.textBaseline = 'bottom';
						ctx_.fillText( text, p[ 0 ], p[ 1 ] );

						ctx_.fillStyle = f;
					}

					break;
				}

				case "Point" : {
					b = build_[ i ];
					var text = b.feature.get( _self.labelColumn );

					if ( text ) {
						var p = b.geom.p1;
						var f = ctx_.fillStyle;
						ctx_.fillStyle = ctx_.strokeStyle;
						ctx_.textAlign = 'center';
						ctx_.textBaseline = 'bottom';
						ctx_.fillText( text, p[ 0 ], p[ 1 ] );
						var m = ctx_.measureText( text );
						var h = Number( ctx_.font.match( /\d+(\.\d+)?/g ).join( [] ) );
						ctx_.fillStyle = "rgba(255,255,255,0.5)";
						ctx_.fillRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.strokeRect( p[ 0 ] - m.width / 2 - 5, p[ 1 ] - h - 5, m.width + 10, h + 10 )
						ctx_.fillStyle = f;
					}

					break;
				}
				default :
					break;
			}
		}
	} );


	/**
	 * Check if animation is on
	 * 
	 * @private
	 * 
	 * @return {Boolean} 현재 animation 상태.
	 */
	ugmp.etc.uGisRender3D.prototype._animating = ( function() {
		var _self = this._this || this;

		if ( _self.animate && new Date().getTime() - _self.animate > _self.animateDuration ) {
			_self.animate = false;
		}

		return !!_self.animate;
	} );


	/**
	 * 3D 렌더링 ON/OFF 설정을 한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.etc.uGisRender3D.prototype.setBuild3D = ( function(state_) {
		var _self = this._this || this;

		if ( state_ ) {
			_self.buildState = true;
			_self.toHeight = _self._getHfn( _self.heightColumn );
		} else {
			_self.buildState = false;
			_self.toHeight = _self._getHfn( 0 );
		}

		_self.animate = new Date().getTime();

		// Force redraw
		_self.layer.changed();
	} );
	
	
	/**
	 * 3D 렌더링 ON/OFF 상태를 토글한다.
	 */
	ugmp.etc.uGisRender3D.prototype.buildToggle = ( function() {
		var _self = this._this || this;
		_self.setBuild3D( !_self.buildState );
	} );
	
	
	/**
	 * 3D 렌더링 ON/OFF 상태를 가져온다.
	 * 
	 * @return {Boolean} 현재 렌더링 ON/OFF 상태.
	 */
	ugmp.etc.uGisRender3D.prototype.isBuild3D = ( function() {
		var _self = this._this || this;
		_self.setBuild3D( !_self.buildState );
	} );

} )();