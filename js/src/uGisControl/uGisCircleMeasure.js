( function() {
	"use strict";

	/**
	 * 원 면적 측정 객체.
	 * 
	 * 마우스로 지도상에서 원 면적을 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugCircleMeasure = new ugmp.control.uGisCircleMeasure( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-measureArea',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {ugmp.control.uGisMeasureDefault}
	 */
	ugmp.control.uGisCircleMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};
			
			options.drawType = "Circle";
			options.useDrawEndDisplay = true;
			
			options.featureStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "#ffcc33",
					width : 3
				} ),
				image : new ol.style.Circle( {
					radius : 7,
					fill : new ol.style.Fill( {
						color : "#ffcc33"
					} )
				} )
			} );
			
			options.drawingStyle = new ol.style.Style( {
				fill : new ol.style.Fill({
					color : "rgba(255, 255, 255, 0.2)"
				}),
				stroke : new ol.style.Stroke( {
					color : "rgba(0, 0, 0, 0.5)",
					lineDash : [ 10, 10 ],
					width : 2
				} )
			} );
			
			_super = ugmp.control.uGisMeasureDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );

	
	ugmp.control.uGisCircleMeasure.prototype = Object.create( ugmp.control.uGisMeasureDefault.prototype );
	ugmp.control.uGisCircleMeasure.prototype.constructor = ugmp.control.uGisCircleMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisCircleMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		ugmp.control.uGisMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "원 면적 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.feature.getGeometry().getCenter();
			_self.measureTooltip.setPosition( tooltipCoord );

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatArea( geom );

				_self.measureTooltipElement.innerHTML = output;
			} );
		}, this );

		_self.interaction.on( "drawend", function(evt) {
			var temp = _self.measureTooltip;
			_self.measureTooltipElement.className = "tooltip tooltip-static";
			_self.measureTooltip.setOffset( [ 0, -7 ] );

			var closer = document.createElement( "a" );
			closer.href = "#";
			closer.className = "tooltip-closer";
			closer.onclick = function() {
				_self.uGisMap.getMap().removeOverlay( temp );
				_self.removeFeature( evt.feature );
				closer.blur();
				return false;
			};

			_self.measureTooltipElement.appendChild( closer );

			_self.sketch = null;
			_self.measureTooltipElement = null;
			_self.createMeasureTooltip();

			ol.Observable.unByKey( _self.sketchChangeListener );
		}, this );
	}


	/**
	 * Format area output.
	 * 
	 * @param {ol.geom.Circle} circle The circle.
	 * 
	 * @private
	 * 
	 * @return {String} Formatted area.
	 */
	ugmp.control.uGisCircleMeasure.prototype._formatArea = function(circle_) {
		var _self = this._this || this;
		
		var sourceProj = _self.uGisMap.getCRS();
		var c1 = ol.proj.transform( circle_.getFirstCoordinate(), sourceProj, 'EPSG:4326' );
		var c2 = ol.proj.transform( circle_.getLastCoordinate(), sourceProj, 'EPSG:4326' );
		var radius = new ol.Sphere( 6378137 ).haversineDistance( c1, c2 );

		var area = radius * radius * Math.PI;
		
		var output;
		
		if ( area > 10000 ) {
			output = ( Math.round(area / 1000000 * 100) / 100 ) + " " + "km<sup>2</sup>";
		} else {
			output = ( Math.round(area * 100) / 100 ) + " " + "m<sup>2</sup>";
        }
		
        return output;
	};
	
} )();
