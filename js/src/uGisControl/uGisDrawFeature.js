( function() {
	"use strict";

	/**
	 * 피처 그리기 객체.
	 * 
	 * 마우스로 다양한 도형을 그리는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDrawFeature = new ugmp.control.uGisDrawFeature( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	useSnap : true,
	 *	freehand : false,
	 *	useDragPan : true,
	 *	drawType : 'Polygon',
	 *	cursorCssName : 'cursor-polygon',
	 *	useDrawEndDisplay : true,
	 * 	activeChangeListener : function(state_) {
	 *		console.log( state_ );
	 * 	},
	 *	featureStyle : new ol.style.Style({...}),
	 *	drawingStyle : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @param opt_options.useSnap {Boolean} 스냅 사용 여부. Default is `false`.
	 * @param opt_options.drawType {String} 피처 타입 <Point|LineString|Polygon|Circle|Box>. Default is `LineString`.
	 * @param opt_options.useDrawEndDisplay {Boolean} 피처를 그린 후 해당 피처 Display 여부. Default is `true`.
	 * @param opt_options.featureStyle {ol.style.Style} 피처 스타일.
	 * @param opt_options.drawingStyle {ol.style.Style} drawing 피처 스타일.
	 * @param opt_options.freehand {Boolean} 자유 그리기 사용 여부. Default is `false`.
	 * 
	 * @Extends {ugmp.control.uGisControlDefault}
	 */
	ugmp.control.uGisDrawFeature = ( function(opt_options) {
		var _self = this;
		var _super;

		this.useSnap = null;
		this.freehand = null;
		this.drawType = null;
		this.featureStyle = null;
		this.drawingStyle = null;
		this.useDrawEndDisplay = null;

		this.vectorLayer = null;
		this.snapInteraction = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.control.uGisControlDefault.call( _self, options );

			_self.useSnap = ( options.useSnap !== undefined ) ? options.useSnap : false;
			_self.freehand = ( options.freehand !== undefined ) ? options.freehand : false;
			_self.featureStyle = ( options.featureStyle !== undefined ) ? options.featureStyle : undefined;
			_self.drawingStyle = ( options.drawingStyle !== undefined ) ? options.drawingStyle : _self.featureStyle;
			_self.drawType = ( options.drawType !== undefined ) ? options.drawType : "LineString";
			_self.useDrawEndDisplay = ( options.useDrawEndDisplay !== undefined ) ? options.useDrawEndDisplay : true;

			if ( !options.noneInit ) {
				_self._init();
			}

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			getLayer : _self.getLayer,
			getFeatures : _self.getFeatures,
			removeFeature : _self.removeFeature
		} );

	} );


	ugmp.control.uGisDrawFeature.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisDrawFeature.prototype.constructor = ugmp.control.uGisDrawFeature;


	/**
	 * 초기화
	 * 
	 * @override ugmp.control.uGisControlDefault.prototype._init
	 * 
	 * @private
	 */
	ugmp.control.uGisDrawFeature.prototype._init = function() {
		var _self = this._this || this;

		var vectorSource = new ol.source.Vector( {
			wrapX : false
		} );

		_self.vectorLayer = new ol.layer.Vector( {
			zIndex : 9999,
			source : vectorSource,
			style : _self.featureStyle
		} );

		_self.uGisMap.getMap().addLayer( _self.vectorLayer );

		var type;
		var geometryFunction;

		switch ( _self.drawType ) {
			case "Point" :
				type = "Point";
				geometryFunction = null;
				break;
			case "LineString" :
				type = "LineString";
				geometryFunction = null;
				break;
			case "Polygon" :
				type = "Polygon";
				geometryFunction = null;
				break;
			case "Circle" :
				type = "Circle";
				geometryFunction = null;
				break;
			case "Box" :
				type = "Circle";
				geometryFunction = ol.interaction.Draw.createBox();
				break;
			default :
				type = "Polygon";
				geometryFunction = null;
		}

		_self.interaction = new ol.interaction.Draw( {
			type : type,
			source : vectorSource,
			freehand : _self.freehand,
			style : _self.drawingStyle,
			geometryFunction : geometryFunction
		} );

		_self.interaction.setActive( false );

		if ( !_self.useDrawEndDisplay ) {
			_self.interaction.on( "drawend", function(evt) {
				setTimeout( function() {
					_self.clear();
				}, 1 );
			}, this );
		}

		ugmp.control.uGisControlDefault.prototype._init.call( this );

		if ( _self.useSnap ) {
			_self.snapInteraction = new ol.interaction.Snap( {
				source : vectorSource
			} );

			_self.uGisMap.getMap().addInteraction( _self.snapInteraction );
		}
	};


	/**
	 * 레이어를 가져온다.
	 * 
	 * @return vectorLayer {ol.layer.Vector} Vector Layer.
	 */
	ugmp.control.uGisDrawFeature.prototype.getLayer = function() {
		var _self = this._this || this;
		return _self.vectorLayer;
	};


	/**
	 * 피쳐를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} Features.
	 */
	ugmp.control.uGisDrawFeature.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.vectorLayer.getSource().getFeatures();
	};


	/**
	 * 그려진 도형을 지운다.
	 */
	ugmp.control.uGisDrawFeature.prototype.clear = function() {
		var _self = this._this || this;
		_self.vectorLayer.getSource().clear();
	};


	/**
	 * 피처를 제거한다.
	 * 
	 * @param feature {ol.Feature} 제거할 피처.
	 */
	ugmp.control.uGisDrawFeature.prototype.removeFeature = function(feature_) {
		var _self = this._this || this;
		_self.vectorLayer.getSource().removeFeature( feature_ );
	};


	/**
	 * 컨트롤을 초기화한다.
	 * 
	 * @override {ugmp.control.uGisControlDefault.prototype.destroy}
	 * 
	 * @param clearFeature {Boolean} 그려진 도형 제거 여부.
	 */
	ugmp.control.uGisDrawFeature.prototype.destroy = function(clearFeature_) {
		var _self = this._this || this;

		ugmp.control.uGisControlDefault.prototype.destroy.call( this );

		_self.uGisMap.getMap().removeInteraction( _self.snapInteraction );

		if ( clearFeature_ ) {
			_self.uGisMap.getMap().removeLayer( _self.vectorLayer );
		}
	};

} )();
