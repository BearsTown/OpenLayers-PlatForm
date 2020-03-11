( function() {
	"use strict";


	/**
	 * @constructor
	 * @extends {ol.interaction.Pointer}
	 */
	ol.interaction.uGisPointer = function(opt_options) {
		var options = opt_options || {};

		ol.interaction.Pointer.call( this, {
			handleEvent : ol.interaction.uGisPointer.prototype.handleEvent,
			handleDownEvent : ol.interaction.uGisPointer.prototype.handleDownEvent,
			handleDragEvent : ol.interaction.uGisPointer.prototype.handleDragEvent,
			handleMoveEvent : ol.interaction.uGisPointer.prototype.handleMoveEvent,
			handleUpEvent : ol.interaction.uGisPointer.prototype.handleUpEvent
		} );

		/**
		 * @type {Function}
		 * @private
		 */
		this.dragEnd_ = options.dragEnd ? options.dragEnd : null;

		/**
		 * @type {Function}
		 * @private
		 */
		this.clickEnd_ = options.clickEnd ? options.clickEnd : null;

		/**
		 * @type {layerFilter}
		 * @private
		 */
		this.layerFilter_ = null;


		/**
		 * @type {ol.Pixel}
		 * @private
		 */
		this.coordinate_ = null;

		/**
		 * @type {string|undefined}
		 * @private
		 */
		this.cursor_ = 'pointer';

		/**
		 * @type {ol.Feature}
		 * @private
		 */
		this.feature_ = null;

		/**
		 * @type {string|undefined}
		 * @private
		 */
		this.previousCursor_ = null;


		if ( options.layers ) {
			if ( typeof options.layers === 'function' ) {
				this.layerFilter_ = options.layers;
			} else {
				var layers = options.layers;
				this.layerFilter_ = function(layer) {
					return ol.array.includes( layers, layer );
				};
			}
		} else {
			this.layerFilter_ = ol.functions.TRUE;
		}

	};
	ol.inherits( ol.interaction.uGisPointer, ol.interaction.Pointer );


	/**
	 * @param {ol.MapBrowserEvent} evt Map browser event.
	 * @return {boolean} `true` to start the drag sequence.
	 */
	ol.interaction.uGisPointer.prototype.handleDownEvent = function(evt) {
		var map = evt.map;

		var feature = map.forEachFeatureAtPixel( evt.pixel, ( function(feature, layer) {
			if ( ol.functions.TRUE( feature, layer ) ) {
				if ( feature ) {
					this.feature_ = feature;
					this.coordinate_ = evt.coordinate;

					return feature;
				}
			}
		} ).bind( this ), {
			layerFilter : this.layerFilter_,
			hitTolerance : 0
		} );

		return !!feature;
	};


	/**
	 * @param {ol.MapBrowserEvent} evt Map browser event.
	 */
	ol.interaction.uGisPointer.prototype.handleDragEvent = function(evt) {
		var olMap = evt.map;

		if ( this.dragEnd_ && this.feature_ ) {
			var deltaX = evt.coordinate[ 0 ] - this.coordinate_[ 0 ];
			var deltaY = evt.coordinate[ 1 ] - this.coordinate_[ 1 ];

			var geometry = this.feature_.getGeometry();
			geometry.translate( deltaX, deltaY );

			this.coordinate_[ 0 ] = evt.coordinate[ 0 ];
			this.coordinate_[ 1 ] = evt.coordinate[ 1 ];

			this.dragEnd_.call( this, this.feature_ );
		}

		return true;
	};


	/**
	 * @param {ol.MapBrowserEvent} evt Event.
	 */
	ol.interaction.uGisPointer.prototype.handleMoveEvent = function(evt) {
		if ( this.cursor_ ) {
			var map = evt.map;
			var element = map.getViewport();

			var feature = map.forEachFeatureAtPixel( evt.pixel, ( function(feature, layer) {
				if ( ol.functions.TRUE( feature, layer ) ) {
					if ( feature ) {
						return feature;
					}
				}
			} ).bind( this ), {
				layerFilter : this.layerFilter_,
				hitTolerance : 0
			} );

			if ( feature ) {
				if ( element.style.cursor != this.cursor_ ) {
					this.previousCursor_ = element.style.cursor;
					element.style.cursor = this.cursor_;
				}
			} else if ( this.previousCursor_ !== undefined ) {
				element.style.cursor = this.previousCursor_;
				this.previousCursor_ = undefined;
			}
		}
	};


	/**
	 * @return {boolean} `false` to stop the drag sequence.
	 */
	ol.interaction.uGisPointer.prototype.handleUpEvent = function() {
		this.coordinate_ = null;
		this.feature_ = null;

		return false;
	};


	ol.interaction.uGisPointer.prototype.handleEvent = function(mapBrowserEvent) {
		if ( !( mapBrowserEvent instanceof ol.MapBrowserPointerEvent ) ) {
			return true;
		}

		var map = mapBrowserEvent.map;

		if ( this.clickEnd_ && ol.events.condition.singleClick( mapBrowserEvent ) ) {
			var feature = map.forEachFeatureAtPixel( mapBrowserEvent.pixel, ( function(feature, layer) {
				if ( ol.functions.TRUE( feature, layer ) ) {
					if ( feature ) {
						return feature;
					}
				}
			} ).bind( this ), {
				layerFilter : this.layerFilter_,
				hitTolerance : 0
			} );

			this.clickEnd_.call( this, feature );
		}

		var stopEvent = false;
		this.updateTrackedPointers_( mapBrowserEvent );
		if ( this.handlingDownUpSequence ) {
			if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERDRAG ) {
				this.handleDragEvent_( mapBrowserEvent );
			} else if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERUP ) {
				var handledUp = this.handleUpEvent_( mapBrowserEvent );
				this.handlingDownUpSequence = handledUp && this.targetPointers.length > 0;
			}
		} else {
			if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERDOWN ) {
				var handled = this.handleDownEvent_( mapBrowserEvent );
				this.handlingDownUpSequence = handled;
				stopEvent = this.shouldStopEvent( handled );
			} else if ( mapBrowserEvent.type == ol.MapBrowserEventType.POINTERMOVE ) {
				this.handleMoveEvent_( mapBrowserEvent );
			}
		}

		return !stopEvent;
	};

} )();
