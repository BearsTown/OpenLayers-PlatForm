( function() {
	"use strict";

	/**
	 * 측정 기본 객체.
	 * 
	 * 마우스로 지도상에서 측정할 수 있는 측정 컨트롤 기본 객체.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * 
	 * @Extends {ugmp.control.uGisDrawFeature}
	 * 
	 * @class
	 */
	ugmp.control.uGisMeasureDefault = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.sketch = null;
		this.overlays = null;
		this.destroyed = null;
		this.helpTooltip = null;
		this.continueMsg = null;
		this.measureTooltip = null;
		this.helpTooltipElement = null;
		this.measureTooltipElement = null;

		this.pointerMoveListener = null;
		this.sketchChangeListener = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.noneInit = true;

			_super = ugmp.control.uGisDrawFeature.call( _self, options );

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			destroy : _self.destroy,
			setActive : _self.setActive
		} );

	} );


	ugmp.control.uGisMeasureDefault.prototype = Object.create( ugmp.control.uGisDrawFeature.prototype );
	ugmp.control.uGisMeasureDefault.prototype.constructor = ugmp.control.uGisMeasureDefault;


	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisDrawFeature.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisMeasureDefault.prototype._init = function() {
		var _self = this._this || this;

		ugmp.control.uGisDrawFeature.prototype._init.call( this );

		_self.overlays = [];
		_self.destroyed = false;
	};


	/**
	 * Creates a new help tooltip
	 * 
	 * @private
	 */
	ugmp.control.uGisMeasureDefault.prototype.createHelpTooltip = function() {
		var _self = this._this || this;

		if ( _self.helpTooltip ) {
			_self.uGisMap.getMap().removeOverlay( _self.helpTooltip );
		}

		_self.helpTooltipElement = document.createElement( "div" );
		_self.helpTooltipElement.className = "tooltip hidden";
		_self.helpTooltip = new ol.Overlay( {
			element : _self.helpTooltipElement,
			offset : [ 25, 12 ],
			positioning : "center-left"
		} );

		_self.uGisMap.getMap().addOverlay( _self.helpTooltip );
	};


	/**
	 * Creates a new measure tooltip
	 * 
	 * @private
	 */
	ugmp.control.uGisMeasureDefault.prototype.createMeasureTooltip = function() {
		var _self = this._this || this;

		_self.measureTooltipElement = document.createElement( "div" );
		_self.measureTooltipElement.className = "tooltip tooltip-measure";
		_self.measureTooltip = new ol.Overlay( {
			element : _self.measureTooltipElement,
			offset : [ 0, -15 ],
			positioning : "bottom-center"
		} );

		_self.overlays.push( _self.measureTooltip );
		_self.uGisMap.getMap().addOverlay( _self.measureTooltip );
	};


	/**
	 * Draw Interaction 활성화를 설정한다.
	 * 
	 * @override {ugmp.control.uGisDrawFeature.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	ugmp.control.uGisMeasureDefault.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.destroyed ) {
			return false;
		}

		if ( _self.interaction.getActive() === state_ ) {
			return false;
		}

		ugmp.control.uGisDrawFeature.prototype.setActive.call( this, state_ );

		ol.Observable.unByKey( _self.pointerMoveListener );

		if ( state_ ) {
			_self.createHelpTooltip();
			_self.createMeasureTooltip();

			_self.pointerMoveListener = _self.uGisMap.getMap().on( "pointermove", _pointerMoveHandler );
		} else {
			if ( _self.helpTooltipElement ) {
				_self.helpTooltipElement.parentNode.removeChild( _self.helpTooltipElement );
			}

			if ( _self.measureTooltipElement ) {
				_self.measureTooltipElement.parentNode.removeChild( _self.measureTooltipElement );
			}
		}


		// Handle pointer move.
		// @param {ol.MapBrowserEvent} evt The event.
		function _pointerMoveHandler(evt) {
			if ( evt.dragging ) {
				return;
			}

			var helpMsg = "측정 시작할 위치 선택";

			if ( _self.sketch ) {
				helpMsg = _self.continueMsg;
			}

			_self.helpTooltipElement.innerHTML = helpMsg;
			_self.helpTooltip.setPosition( evt.coordinate );

			_self.helpTooltipElement.classList.remove( "hidden" );
		}
	};


	/**
	 * 측정한 내용을 지운다.
	 * 
	 * @override {ugmp.control.uGisDrawFeature.prototype.clear}
	 */
	ugmp.control.uGisMeasureDefault.prototype.clear = function() {
		var _self = this._this || this;

		ugmp.control.uGisDrawFeature.prototype.clear.call( this );

		for ( var i in _self.overlays ) {
			_self.uGisMap.getMap().removeOverlay( _self.overlays[ i ] );
		}
	};


	/**
	 * 컨트롤을 초기화한다.
	 * 
	 * @override {ugmp.control.uGisDrawFeature.prototype.destroy}
	 */
	ugmp.control.uGisMeasureDefault.prototype.destroy = function() {
		var _self = this._this || this;

		_self.clear();
		_self.setActive( false );
		_self.destroyed = true;
		_self.uGisMap.getMap().removeOverlay( _self.helpTooltip );
		ol.Observable.unByKey( _self.pointerMoveListener );
		ugmp.control.uGisDrawFeature.prototype.destroy.call( this, true );
	};


	/**
	 * 피처를 제거한다.
	 * 
	 * @param feature {ol.Feature} 제거할 피처.
	 * 
	 * @override {ugmp.control.uGisDrawFeature.prototype.removeFeature}
	 */
	ugmp.control.uGisMeasureDefault.prototype.removeFeature = function(feature_) {
		var _self = this._this || this;

		ugmp.control.uGisDrawFeature.prototype.removeFeature.call( this, feature_ );
	};

} )();
