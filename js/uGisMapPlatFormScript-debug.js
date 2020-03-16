/**
 * UIT GIS OpenLayers 3 MapPlatForm
 * 
 * http://www.ugistech.net
 * 
 * Author : LeeJaeHyuk
 * 
 * Date : 2020.03.16
 */
( function(window, jQuery) {
	"use strict";

	if ( typeof jQuery === "undefined" ) {
		alert( "need for jQuery !" );
		return false;
	}

	window._$ = jQuery;
	window.ugmp = {
		version : "1.4.4",
		etc : {},
		toc : {},
		util : {},
		layer : {},
		control : {},
		service : {},
		manager : {},
		baseMap : {},
		animation : {}
	};

	var hostIndex = location.href.indexOf( location.host ) + location.host.length;
	var contextPath = location.href.substring( hostIndex, location.href.indexOf( '/', hostIndex + 1 ) );

	window.ugmp.contextPath = contextPath;

	_$( document ).ready( function() {
		window.uGisMapPlatForm = window.ugmp;
	} );

} )( window, jQuery );

( function() {
	"use strict";

	/**
	 * Vector 애니메이션 효과 프로토타입
	 * 
	 * @param workFeature {Object} animateFeature 옵션
	 */
	ol.layer.Vector.prototype.animateFeature = ( function(workFeature_) {
		var _self = this;
		var workFeature = workFeature_;

		var step = 0;

		// postcompose 등록
		var listenerKey = _self.on( 'postcompose', animate );

		if ( _self.changed ) {
			_self.changed();
		}


		/**
		 * 애니메이션
		 * 
		 * @param e {function} postcompose 리스너 함수
		 */
		function animate(e) {
			if ( _self.isStop ) {
				workFeature.extent = false;
				e.frameState.animate = true;
				return;
			}

			var fanim = _self.animations[ step ];
			var famimProp = fanim.getProperties();
			var viewExtent = e.frameState.extent;

			workFeature.vectorContext = e.vectorContext;
			workFeature.frameState = e.frameState;
			if ( !workFeature.extent ) {
				workFeature.extent = e.frameState.extent;
				workFeature.start = e.frameState.time - workFeature.interval;
				workFeature.context = e.context;
			}

			workFeature.time = e.frameState.time - workFeature.start;
			workFeature.elapsed = workFeature.time / famimProp.duration;

			if ( workFeature.elapsed > 1 ) {
				workFeature.elapsed = 1;
			}

			if ( !fanim.animate( workFeature ) ) {

				workFeature.nowNB++;
				// 애니메이션 반복 횟수
				if ( workFeature.nowNB < famimProp.repeat ) {
					workFeature.extent = false;
				}
				// 다음 단계 애니메이션
				else if ( step < _self.animations.length - 1 ) {
					step++;
					workFeature.nowNB = 0;
					workFeature.extent = false;
				}

			}

			// tell OL3 to continue postcompose animation
			e.frameState.animate = true;
		}

		return listenerKey;
	} );

} )();

( function() {
	"use strict";

	/*
	 * Copyright (c) 2015 Jean-Marc VIGLINO, released under the CeCILL-B license (French BSD license)
	 * (http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
	 * 
	 * Photo style for vector features
	 */
	/**
	 * @classdesc Set Photo style for vector features.
	 * 
	 * @constructor
	 * @param {} options
	 * @param { default | square | round | anchored | folio } options.kind
	 * @param {boolean} options.crop crop within square, default is false
	 * @param {Number} options.radius symbol size
	 * @param {boolean} options.shadow drop a shadow
	 * @param {ol.style.Stroke} options.stroke
	 * @param {String} options.src image src
	 * @param {String} options.crossOrigin The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if
	 *            you want to access pixel data with the Canvas renderer.
	 * @param {Number} options.offsetX Horizontal offset in pixels. Default is 0.
	 * @param {Number} options.offsetY Vertical offset in pixels. Default is 0.
	 * @param {function} options.onload callback when image is loaded (to redraw the layer)
	 * @extends {ol.style.RegularShape}
	 * @implements {ol.structs.IHasChecksum}
	 * @api
	 */
	ol.style.Photo = function(options) {
	  options = options || {};
	  this.sanchor_ = options.kind=="anchored" ? 8:0;
	  this.shadow_ = Number(options.shadow) || 0;
	  if (!options.stroke) {
	    options.stroke = new ol.style.Stroke({ width: 0, color: "#000"})
	  }
	  var strokeWidth = options.stroke.getWidth();
	  if (strokeWidth<0) strokeWidth = 0;
	  if (options.kind=='folio') strokeWidth += 6;
	  options.stroke.setWidth(strokeWidth);
	  ol.style.RegularShape.call (this, {
	    radius: options.radius + strokeWidth + this.sanchor_/2 + this.shadow_/2, 
	    points:0
	  // fill:new ol.style.Fill({color:"red"}) // No fill to create a hit detection Image
	  });
	  // Hack to get the hit detection Image (no API exported)
	  if (!this.hitDetectionCanvas_) {
	    var img = this.getImage();
	    for (var i in this) {
	      if (this[i] && this[i].getContext && this[i]!==img) {
	        this.hitDetectionCanvas_ = this[i];
	        break;
	      }
	    }
	  }
	  // Clone canvas for hit detection
	  this.hitDetectionCanvas_ = document.createElement('canvas');
	  this.hitDetectionCanvas_.width = this.getImage().width;
	  this.hitDetectionCanvas_.height = this.getImage().height;
	  this.stroke_ = options.stroke;
	  this.fill_ = options.fill;
	  this.crop_ = options.crop;
	  this.crossOrigin_ = options.crossOrigin;
	  this.kind_ = options.kind || "default";
	  this.radius_ = options.radius;
	  this.src_ = options.src;
	  this.offset_ = [options.offsetX ? options.offsetX :0, options.offsetY ? options.offsetY :0];
	  this.onload_ = options.onload;
	  if (typeof(options.opacity)=='number') this.setOpacity(options.opacity);
	  if (typeof(options.rotation)=='number') this.setRotation(options.rotation);
	  this.renderPhoto_();
	};
	ol.inherits(ol.style.Photo, ol.style.RegularShape);
	
	
	/**
	 * Clones the style.
	 * 
	 * @return {ol.style.Photo}
	 */
	ol.style.Photo.prototype.clone = function() {
	  return new ol.style.Photo({
	    stroke: this.stroke_,
	    fill: this.fill_,
	    shadow: this.shadow_,
	    crop: this.crop_,
	    crossOrigin: this.crossOrigin_,
	    kind: this.kind_,
	    radius: this.radius_,
	    src: this.src_,
	    offsetX: this.offset_[0],
	    offsetY: this.offset_[1],
	    opacity: this.getOpacity(),
	    rotation: this.getRotation()
	  });
	};
	
	
	/**
	 * Draws a rounded rectangle using the current state of the canvas. Draw a rectangle if the radius is null.
	 * 
	 * @param {Number} x The top left x coordinate
	 * @param {Number} y The top left y coordinate
	 * @param {Number} width The width of the rectangle
	 * @param {Number} height The height of the rectangle
	 * @param {Number} radius The corner radius.
	 */
	CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
	  if (!r) {
	    this.rect(x,y,w,h);
	  } else {
	    if (w < 2 * r) r = w / 2;
	    if (h < 2 * r) r = h / 2;
	    this.beginPath();
	    this.moveTo(x+r, y);
	    this.arcTo(x+w, y, x+w, y+h, r);
	    this.arcTo(x+w, y+h, x, y+h, r);
	    this.arcTo(x, y+h, x, y, r);
	    this.arcTo(x, y, x+w, y, r);
	    this.closePath();
	  }
	  return this;
	};
	
	
	/**
	 * Draw the form without the image
	 * 
	 * @private
	 */
	ol.style.Photo.prototype.drawBack_ = function(context, color, strokeWidth) {
	  var canvas = context.canvas;
	  context.beginPath();
	  context.fillStyle = color;
	  context.clearRect(0, 0, canvas.width, canvas.height);
	  switch (this.kind_) {
	    case 'square': {
	      context.rect(0,0,canvas.width-this.shadow_, canvas.height-this.shadow_);
	      break;
	    }
	    case 'circle': {
	      context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_+strokeWidth, 0, 2 * Math.PI, false);
	      break;
	    }
	    case 'folio': {
	      var offset = 6;
	      strokeWidth -= offset;
	      context.strokeStyle = 'rgba(0,0,0,0.5)';
	      var w = canvas.width-this.shadow_-2*offset;
	      var a = Math.atan(6/w);
	      context.save();
	      context.rotate(-a);
	      context.translate(-6,2);
	      context.beginPath();
	      context.rect(offset,offset,w,w);
	      context.stroke();
	      context.fill();
	      context.restore();
	      context.save();
	      context.translate(6,-1);
	      context.rotate(a);
	      context.beginPath();
	      context.rect(offset,offset,w,w);
	      context.stroke();
	      context.fill();
	      context.restore();
	      context.beginPath();
	      context.rect(offset,offset,w,w);
	      context.stroke();
	      break;
	    }
	    case 'anchored': {
	      context.roundRect(this.sanchor_/2,0,canvas.width-this.sanchor_-this.shadow_, canvas.height-this.sanchor_-this.shadow_, strokeWidth);
	      context.moveTo(canvas.width/2-this.sanchor_-this.shadow_/2,canvas.height-this.sanchor_-this.shadow_);
	      context.lineTo(canvas.width/2+this.sanchor_-this.shadow_/2,canvas.height-this.sanchor_-this.shadow_);
	      context.lineTo(canvas.width/2-this.shadow_/2,canvas.height-this.shadow_);break;
	    }
	    default: {
	      // roundrect
	      context.roundRect(0,0,canvas.width-this.shadow_, canvas.height-this.shadow_, strokeWidth);
	      break;
	    }
	  }
	  context.closePath();
	};
	
	
	/**
	 * @private
	 */
	ol.style.Photo.prototype.renderPhoto_ = function() {
	  var strokeStyle;
	  var strokeWidth = 0;
	  if (this.stroke_) {
	    strokeStyle = ol.color.asString(this.stroke_.getColor());
	    strokeWidth = this.stroke_.getWidth();
	  }
	  var canvas = this.getImage();
	  // Draw hitdetection image
	  var context = this.hitDetectionCanvas_.getContext('2d');
	  this.drawBack_(context,"#000",strokeWidth);
	  context.fill();
	  // Draw the image
	  context = canvas.getContext('2d');
	  this.drawBack_(context,strokeStyle,strokeWidth);
	  // Draw a shadow
	  if (this.shadow_) {
	    context.shadowColor = 'rgba(0,0,0,0.5)';
	    context.shadowBlur = this.shadow_/2;
	    context.shadowOffsetX = this.shadow_/2;
	    context.shadowOffsetY = this.shadow_/2;
	  }
	  context.fill();
	  context.shadowColor = 'transparent';
	  var self = this;
	  var img = this.img_ = new Image();
	  if (this.crossOrigin_) img.crossOrigin = this.crossOrigin_;
	  img.src = this.src_;
	  // Draw image
	  if (img.width) {
	    self.drawImage_(img);
	  } else {
	    img.onload = function() {
	      self.drawImage_(img);
	      // Force change (?!)
	      // self.setScale(1);
	      if (self.onload_) self.onload_();
	    };
	  }
	  // Set anchor
	  var a = this.getAnchor();
	  a[0] = (canvas.width - this.shadow_)/2;
	  a[1] = (canvas.height - this.shadow_)/2;
	  if (this.sanchor_) {
	    a[1] = canvas.height - this.shadow_;
	  }
	};
	
	
	/**
	 * Draw an timage when loaded
	 * 
	 * @private
	 */
	ol.style.Photo.prototype.drawImage_ = function(img) {
	  var canvas = this.getImage();
	  // Remove the circle on the canvas
	  var context = (canvas.getContext('2d'));
	  var strokeWidth = 0;
	  if (this.stroke_) strokeWidth = this.stroke_.getWidth();
	  var size = 2*this.radius_;
	  context.save();
	  if (this.kind_=='circle') {
	    context.beginPath();
	    context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_, 0, 2 * Math.PI, false);
	    context.clip();
	  }
	  var s, x, y, w, h, sx, sy, sw, sh;
	  // Crop the image to a square vignette
	  if (this.crop_) {
	    s = Math.min (img.width/size, img.height/size);
	    sw = sh = s*size;
	    sx = (img.width-sw)/2;
	    sy = (img.height-sh)/2;
	    x = y = 0;
	    w = h = size+1;
	  } else {
	    // Fit the image to the size
	    s = Math.min (size/img.width, size/img.height);
	    sx = sy = 0;
	    sw = img.width;
	    sh = img.height;
	    w = s*sw;
	    h = s*sh;
	    x = (size-w)/2;
	    y = (size-h)/2;
	  }
	  x += strokeWidth + this.sanchor_/2;
	  y += strokeWidth;
	  context.drawImage(img, sx, sy, sw, sh, x, y, w, h);
	  context.restore();
	  // Draw a circle to avoid aliasing on clip
	  if (this.kind_=='circle' && strokeWidth) {
	    context.beginPath();
	    context.strokeStyle = ol.color.asString(this.stroke_.getColor());
	    context.lineWidth = strokeWidth/4;
	    context.arc(this.radius_+strokeWidth, this.radius_+strokeWidth, this.radius_, 0, 2 * Math.PI, false);
	    context.stroke();
	  }
	};
	
} )();

( function() {
	"use strict";

	ol.interaction.MouseWheelZoom.handleEvent = function(mapBrowserEvent) {
		var targetMap = this.getMap();
		var type = mapBrowserEvent.type;
		if ( type !== ol.events.EventType.WHEEL && type !== ol.events.EventType.MOUSEWHEEL ) {
			return true;
		}

		if ( targetMap.scrollCallBack ) {
			if ( targetMap.scrollCallBack.getAltKeyOnly() && !ol.events.condition.altKeyOnly( mapBrowserEvent ) ) {
				targetMap.scrollCallBack.run();
				return true;
			} else {
				targetMap.scrollCallBack.clear();
				mapBrowserEvent.originalEvent.preventDefault();
				mapBrowserEvent.originalEvent.stopPropagation();
			}
		} else {
			mapBrowserEvent.originalEvent.preventDefault();
			mapBrowserEvent.originalEvent.stopPropagation();
		}

		var map = mapBrowserEvent.map;
		var wheelEvent = /** @type {WheelEvent} */
		( mapBrowserEvent.originalEvent );

		if ( this.useAnchor_ ) {
			this.lastAnchor_ = mapBrowserEvent.coordinate;
		}

		// Delta normalisation inspired by
		// https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
		var delta;
		if ( mapBrowserEvent.type == ol.events.EventType.WHEEL ) {
			delta = wheelEvent.deltaY;
			if ( ol.has.FIREFOX && wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL ) {
				delta /= ol.has.DEVICE_PIXEL_RATIO;
			}
			if ( wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE ) {
				delta *= 40;
			}
		} else if ( mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL ) {
			delta = -wheelEvent.wheelDeltaY;
			if ( ol.has.SAFARI ) {
				delta /= 3;
			}
		}

		if ( delta === 0 ) {
			return false;
		}

		var now = Date.now();

		if ( this.startTime_ === undefined ) {
			this.startTime_ = now;
		}

		if ( !this.mode_ || now - this.startTime_ > this.trackpadEventGap_ ) {
			this.mode_ = Math.abs( delta ) < 4 ? ol.interaction.MouseWheelZoom.Mode_.TRACKPAD : ol.interaction.MouseWheelZoom.Mode_.WHEEL;
		}

		if ( this.mode_ === ol.interaction.MouseWheelZoom.Mode_.TRACKPAD ) {
			var view = map.getView();
			if ( this.trackpadTimeoutId_ ) {
				clearTimeout( this.trackpadTimeoutId_ );
			} else {
				view.setHint( ol.ViewHint.INTERACTING, 1 );
			}
			this.trackpadTimeoutId_ = setTimeout( this.decrementInteractingHint_.bind( this ), this.trackpadEventGap_ );
			var resolution = view.getResolution() * Math.pow( 2, delta / this.trackpadDeltaPerZoom_ );
			var minResolution = view.getMinResolution();
			var maxResolution = view.getMaxResolution();
			var rebound = 0;
			if ( resolution < minResolution ) {
				resolution = Math.max( resolution, minResolution / this.trackpadZoomBuffer_ );
				rebound = 1;
			} else if ( resolution > maxResolution ) {
				resolution = Math.min( resolution, maxResolution * this.trackpadZoomBuffer_ );
				rebound = -1;
			}
			if ( this.lastAnchor_ ) {
				var center = view.calculateCenterZoom( resolution, this.lastAnchor_ );
				view.setCenter( view.constrainCenter( center ) );
			}
			view.setResolution( resolution );

			if ( rebound === 0 && this.constrainResolution_ ) {
				view.animate( {
					resolution : view.constrainResolution( resolution, delta > 0 ? -1 : 1 ),
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : this.duration_
				} );
			}

			if ( rebound > 0 ) {
				view.animate( {
					resolution : minResolution,
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : 500
				} );
			} else if ( rebound < 0 ) {
				view.animate( {
					resolution : maxResolution,
					easing : ol.easing.easeOut,
					anchor : this.lastAnchor_,
					duration : 500
				} );
			}
			this.startTime_ = now;
			return false;
		}

		this.delta_ += delta;

		var timeLeft = Math.max( this.timeout_ - ( now - this.startTime_ ), 0 );

		clearTimeout( this.timeoutId_ );
		this.timeoutId_ = setTimeout( this.handleWheelZoom_.bind( this, map ), timeLeft );

		return false;
	};

} )();

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

/**
 * JavasScript Extensions
 * 
 * Author : LeeJaeHyuk
 */
( function(window) {

	/**
	 * element resize 감지 이벤트
	 */
	( function($) {
		var attachEvent = document.attachEvent, stylesCreated = false;

		var jQuery_resize = $.fn.resize;

		$.fn.resize = ( function(callback) {
			return this.each( function() {
				if ( this == window ) jQuery_resize.call( jQuery( this ), callback );
				else addResizeListener( this, callback );
			} );
		} );

		$.fn.removeResize = ( function(callback) {
			return this.each( function() {
				removeResizeListener( this, callback );
			} );
		} );

		if ( !attachEvent ) {
			var requestFrame = ( function() {
				var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) {
					return window.setTimeout( fn, 20 );
				};
				return function(fn) {
					return raf( fn );
				};
			} )();

			var cancelFrame = ( function() {
				var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
				return function(id) {
					return cancel( id );
				};
			} )();

			function resetTriggers(element) {
				var triggers = element.__resizeTriggers__, expand = triggers.firstElementChild, contract = triggers.lastElementChild, expandChild = expand.firstElementChild;
				contract.scrollLeft = contract.scrollWidth;
				contract.scrollTop = contract.scrollHeight;
				expandChild.style.width = expand.offsetWidth + 1 + 'px';
				expandChild.style.height = expand.offsetHeight + 1 + 'px';
				expand.scrollLeft = expand.scrollWidth;
				expand.scrollTop = expand.scrollHeight;
			}

			function checkTriggers(element) {
				return element.offsetWidth != element.__resizeLast__.width || element.offsetHeight != element.__resizeLast__.height;
			}

			function scrollListener(e) {
				var element = this;
				resetTriggers( this );
				if ( this.__resizeRAF__ ) cancelFrame( this.__resizeRAF__ );
				this.__resizeRAF__ = requestFrame( function() {
					if ( checkTriggers( element ) ) {
						element.__resizeLast__.width = element.offsetWidth;
						element.__resizeLast__.height = element.offsetHeight;
						element.__resizeListeners__.forEach( function(fn) {
							if ( fn ) {
								fn.call( element, e );
							}
						} );
					}
				} );
			}

			/* Detect CSS Animations support to detect element display/re-attach */
			var animation = false, animationstring = 'animation', keyframeprefix = '', animationstartevent = 'animationstart', domPrefixes = 'Webkit Moz O ms'
					.split( ' ' ), startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split( ' ' ), pfx = '';
			{
				var elm = document.createElement( 'fakeelement' );
				if ( elm.style.animationName !== undefined ) {
					animation = true;
				}

				if ( animation === false ) {
					for ( var i = 0; i < domPrefixes.length; i++ ) {
						if ( elm.style[ domPrefixes[ i ] + 'AnimationName' ] !== undefined ) {
							pfx = domPrefixes[ i ];
							animationstring = pfx + 'Animation';
							keyframeprefix = '-' + pfx.toLowerCase() + '-';
							animationstartevent = startEvents[ i ];
							animation = true;
							break;
						}
					}
				}
			}

			var animationName = 'resizeanim';
			var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
			var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
		}

		function createStyles() {
			if ( !stylesCreated ) {
				// opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
				var css = ( animationKeyframes ? animationKeyframes : '' )
						+ '.resize-triggers { '
						+ ( animationStyle ? animationStyle : '' )
						+ 'visibility: hidden; opacity: 0; } '
						+ '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }', head = document.head
						|| document.getElementsByTagName( 'head' )[ 0 ], style = document.createElement( 'style' );

				style.type = 'text/css';
				if ( style.styleSheet ) {
					style.styleSheet.cssText = css;
				} else {
					style.appendChild( document.createTextNode( css ) );
				}

				head.appendChild( style );
				stylesCreated = true;
			}
		}

		window.addResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.attachEvent( 'onresize', fn );
			else {
				if ( !element.__resizeTriggers__ ) {
					if ( getComputedStyle( element ).position == 'static' ) element.style.position = 'relative';
					createStyles();
					element.__resizeLast__ = {};
					element.__resizeListeners__ = [];
					( element.__resizeTriggers__ = document.createElement( 'div' ) ).className = 'resize-triggers';
					element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' + '<div class="contract-trigger"></div>';
					element.appendChild( element.__resizeTriggers__ );
					resetTriggers( element );
					element.addEventListener( 'scroll', scrollListener, true );

					/* Listen for a css animation to detect element display/re-attach */
					animationstartevent && element.__resizeTriggers__.addEventListener( animationstartevent, function(e) {
						if ( e.animationName == animationName ) resetTriggers( element );
					} );
				}
				element.__resizeListeners__.push( fn );
			}
		} );

		window.removeResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.detachEvent( 'onresize', fn );
			else {
				element.__resizeListeners__.splice( element.__resizeListeners__.indexOf( fn ), 1 );
				if ( !element.__resizeListeners__.length ) {
					element.removeEventListener( 'scroll', scrollListener );
					element.__resizeTriggers__ = !element.removeChild( element.__resizeTriggers__ );
				}
			}
		} );
	}( jQuery ) );

} )( window );

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지도 캡쳐 객체.
	 * 
	 * 배경지도 및 uGisMap에 등록된 레이어를 캡쳐할 수 있다.
	 * 
	 * ※`useSync(동기화)`는 같은 Document일 경우 사용 가능하며 새창으로 띄울 경우 `false`로 설정해야한다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugCapture = new ugmp.uGisCapture( {
	 * 	useSync : true,
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	uGisBaseMap : new ugmp.baseMap.uGisBaseMap({...}),
	 * 	uGisLayerManager : new ugmp.manager.uGisLayerManager({...}),
	 * 	appendElement : document.getElementById('map'),
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useSync {Boolean} 캡쳐 대상 지도 연동 사용 여부. Default is `false`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisBaseMap {ugmp.baseMap.uGisBaseMap} {@link ugmp.baseMap.uGisBaseMap} 객체.
	 * @param opt_options.uGisLayerManager {ugmp.manager.uGisLayerManager} {@link ugmp.manager.uGisLayerManager} 객체.
	 * @param opt_options.appendElement {Element} 캡쳐 대상 지도 Element를 추가할 Element.
	 * 
	 * @class
	 */
	ugmp.uGisCapture = ( function(opt_options) {
		var _self = this;

		this.useSync = null;
		this.origin_ugMap = null;
		this.appendElement = null;
		this.origin_ugBaseMap = null;
		this.origin_ugLayerManager = null;

		this.captureDivId = null;
		this.captureMapId = null;
		this.readyFunction = null;
		this.captureUgMap = null;
		this.captureElement = null;
		this.arrDeferred_ready = null;
		this.captureBaseMapId = null;
		this.captureUgBaseMap = null;
		this.captureLayerManager = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.useSync = ( typeof ( options.useSync ) === "boolean" ) ? options.useSync : false;
			_self.origin_ugMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.origin_ugBaseMap = ( options.uGisBaseMap !== undefined ) ? options.uGisBaseMap : undefined;
			_self.origin_ugLayerManager = ( options.uGisLayerManager !== undefined ) ? options.uGisLayerManager : undefined;
			_self.appendElement = ( options.appendElement !== undefined ) ? options.appendElement : undefined;
			_self.readyFunction = ( typeof options.readyFunction === "function" ) ? options.readyFunction : undefined;

			_self.arrDeferred_ready = [];

			if ( !_self.origin_ugMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			var uuid = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
			_self.captureDivId = "captureDiv_" + uuid;
			_self.captureMapId = "captureMap_" + uuid;
			_self.captureBaseMapId = "captureBaseMap_" + uuid;

			_self._createCaptureElement();
			_self._setCaptureMap();
			_self._setCaptureLayer();

		} )();
		// END initialize


		return {
			_this : _self,
			ready : _self.ready,
			destroy : _self.destroy,
			runCapture : _self.runCapture,
			getUgisMap : _self.getUgisMap,
			getUgisBaseMap : _self.getUgisBaseMap,
			setBaseMapVisible : _self.setBaseMapVisible,
			getUgisLayerManager : _self.getUgisLayerManager,
			baseMapVisibleToggle : _self.baseMapVisibleToggle
		}

	} );


	/**
	 * Capture DIV Element를 생성한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._createCaptureElement = function() {
		var _self = this._this || this;

		var mapMainDIV = document.createElement( "div" );
		mapMainDIV.id = _self.captureDivId;
		mapMainDIV.style.width = "100%";
		mapMainDIV.style.height = "100%";
		mapMainDIV.style.overflow = "hidden";
		mapMainDIV.style.position = "relative";
		mapMainDIV.style.backgroundColor = "white";

		var baseMapDIV = document.createElement( "div" );
		baseMapDIV.id = _self.captureBaseMapId;
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "z-Index", "20" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "position", "absolute !important" );
		ugmp.util.uGisUtil.setCssTextStyle( baseMapDIV, "background-color", "rgb(255, 255, 254)" );

		var mapDIV = document.createElement( "div" );
		mapDIV.id = _self.captureMapId;
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "z-Index", "30" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "width", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "height", "100%" );
		ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "position", "absolute !important" );
		// ugmp.util.uGisUtil.setCssTextStyle( mapDIV, "background-color", "rgba(255, 255, 255, 0)" );

		mapMainDIV.appendChild( baseMapDIV );
		mapMainDIV.appendChild( mapDIV );

		_self.captureElement = mapMainDIV;
	};


	/**
	 * Capture할 배경지도, 지도를 설정한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._setCaptureMap = function() {
		var _self = this._this || this;

		_self.appendElement.insertBefore( _self.captureElement, _self.appendElement.firstChild );

		// 캡쳐 지도 생성
		_self.captureUgMap = new ugmp.uGisMap( {
			target : document.getElementById( _self.captureMapId ),
			crs : _self.origin_ugMap.getCRS(),
			center : _self.origin_ugMap.getMap().getView().getCenter(),
			useMaxExtent : true,
			useAltKeyOnly : false
		} );

		// 캡쳐 기본 컨트롤 모두 제거
		var controls = _self.captureUgMap.getMap().getControls().getArray();
		for ( var i = controls.length - 1; i >= 0; i-- ) {
			_self.captureUgMap.getMap().removeControl( controls[ i ] );
		}

		// 캡쳐 기본 상호작용 모두 제거
		var interactions = _self.captureUgMap.getMap().getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( interactions[ i ] instanceof ol.interaction.DragRotate ) {
				_self.captureUgMap.getMap().removeInteraction( interactions[ i ] );
				break;
			}
		}

		// 드래그 패닝
		var ugDragPan = new ugmp.control.uGisDragPan( {
			uGisMap : _self.captureUgMap,
			useDragPan : false,
			cursorCssName : "cursor-default",
			activeChangeListener : function(state_) {
				console.log( "uGisDragPan : " + state_ );
			}
		} );

		ugDragPan.setActive( true );


		// 캡쳐 배경 지도 설정 및 생성
		if ( _self.origin_ugBaseMap ) {
			_self.captureUgBaseMap = new ugmp.baseMap.uGisBaseMap( {
				target : _self.captureBaseMapId,
				uGisMap : _self.captureUgMap,
				baseMapKey : "osm_none",
				useElementMargin : false
			} );

			var baseMapDIV = document.getElementById( _self.captureBaseMapId );
			baseMapDIV.firstElementChild.style.top = null;
			baseMapDIV.firstElementChild.style.left = null;
			baseMapDIV.firstElementChild.style.overflow = null;
			baseMapDIV.firstElementChild.style.width = "100%";
			baseMapDIV.firstElementChild.style.height = "100%";

			_self.captureUgBaseMap.setVisible( _self.origin_ugBaseMap.getVisible() );
			_self.captureUgBaseMap.setOpacity( _self.origin_ugBaseMap.getOpacity() );

			var baseMapKey = _self.origin_ugBaseMap.getSelectedBaseMap();

			if ( baseMapKey.indexOf( "custom" ) > -1 ) {
				var originObj = _self.origin_ugBaseMap._this.baseMapList[ baseMapKey ].object;
				var uWMTSLayer = originObj._this.uWMTSLayer;

				var cWMTSLyer = new ugmp.layer.uGisWMTSLayer( {
					useProxy : true,
					serviceURL : uWMTSLayer.getServiceURL(),
					layer : uWMTSLayer.layer,
					version : uWMTSLayer.version,
					matrixSet : uWMTSLayer.matrixSet,
					wmtsCapabilities : uWMTSLayer.getWmtsCapabilities(),
					originExtent : uWMTSLayer.getOriginExtent()
				} );

				var bKey = "custom_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
				var custom = new ugmp.baseMap.uGisBaseMapCustom( {
					baseMapKey : bKey,
					uWMTSLayer : cWMTSLyer,
					capabilities : uWMTSLayer.getWmtsCapabilities(),
					isWorld : originObj.isWorlds(),
					isFactor : originObj.isFactors()
				} );

				custom._this.resolutions = originObj._this.resolutions;
				custom._this.mapTypes[ bKey ].maxZoom = originObj._this.mapTypes[ baseMapKey ].maxZoom;
				custom._this.mapTypes[ bKey ].resolutions = originObj._this.mapTypes[ baseMapKey ].resolutions;

				_self.captureUgBaseMap.addBaseMapType( bKey, custom );
				_self.captureUgBaseMap.changeBaseMap( bKey );
			} else if ( baseMapKey.indexOf( "TMS" ) > -1 ) {
				var code = baseMapKey.split( "_" )[ 0 ];

				var tms = new ugmp.baseMap.uGisBaseMapTMS_vWorld( {
					baseCode : code,
					projection : _self.origin_ugBaseMap.getApiMap().getView().getProjection().getCode()
				} );

				_self.captureUgBaseMap.addBaseMapType( code, tms );
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

				for ( var i in layers ) {
					var urls = layers[ i ].getSource().getUrls();
					var reUrls = [];
					for ( var u in urls ) {
						reUrls.push( ugmp.uGisConfig.getProxy() + urls[ u ] );
					}
					layers[ i ].getSource().setUrls( reUrls );
				}
			} else {
				_self.captureUgBaseMap.changeBaseMap( baseMapKey );

				if ( baseMapKey === "osm_gray" ) {
					var layers = _self.captureUgBaseMap.getApiMap().getLayers().getArray();

					for ( var i in layers ) {
						layers[ i ].getSource().setUrl( ugmp.uGisConfig.getProxy() + "https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png" );
					}
				}
			}
		}

		// 캡쳐 지도 ol.View 설정
		var originView = _self.origin_ugMap.getMap().getView();
		originView.setRotation( 0 );
		_self.captureUgMap.getMap().setView( new ol.View( {
			zoom : originView.getZoom(),
			center : originView.getCenter(),
			extent : ol.proj.get( _self.origin_ugMap.getCRS() ).getExtent(),
			projection : originView.getProjection().getCode(),
			maxZoom : originView.getMaxZoom(),
			minZoom : originView.getMinZoom(),
			resolution : originView.getResolution(),
			resolutions : originView.getResolutions(),
			rotation : 0
		} ) );

		// 대상 지도와 캡쳐 지도 동기화
		if ( _self.useSync ) {
			_self.captureUgMap.getMap().setView( originView );
		}
	};


	/**
	 * Capture할 레이어를 설정한다.
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._setCaptureLayer = function() {
		var _self = this._this || this;

		var ugLayers = [];

		// uGisLayerManager 사용 여부에 따른 레이어 설정
		if ( _self.origin_ugLayerManager ) {
			_self.captureLayerManager = new ugmp.manager.uGisLayerManager( {
				uGisMap : _self.captureUgMap,
				useMinMaxZoom : true
			} );

			ugLayers = _self.origin_ugLayerManager.getAll( true );
		} else {
			var orginUgLayers = _self.origin_ugMap.getLayers();
			for ( var i in orginUgLayers ) {
				ugLayers.push( {
					uGisLayer : orginUgLayers[ i ]
				} );
			}
		}

		// 레이어 순차 동기화로 추가
		( function loop(i) {
			if ( i < ugLayers.length ) {
				var addObject;
				var ugLayer = ugLayers[ i ][ "uGisLayer" ];

				if ( !ugLayer.getVisible() ) {
					loop( i + 1 );
					return false;
				}

				if ( ugLayer.getLayerType() === "WMS" ) {
					addObject = _self._addUGisLayer().addWMSLayer;
				} else if ( ugLayer.getLayerType() === "WFS" ) {
					addObject = _self._addUGisLayer().addWFSLayer;
				} else if ( ugLayer.getLayerType() === "Vector" ) {
					addObject = _self._addUGisLayer().addVectorLayer;
				} else if ( ugLayer.getLayerType() === "Vector3D" ) {
					addObject = _self._addUGisLayer().addVector3DLayer;
				} else if ( ugLayer.getLayerType() === "Cluster" ) {
					addObject = _self._addUGisLayer().addClusterLayer;
				} else if ( ugLayer.getLayerType() === "WMTS" ) {
					addObject = _self._addUGisLayer().addWMTSLayer;
				} else if ( ugLayer.getLayerType() === "WCS" ) {
					addObject = _self._addUGisLayer().addWCSLayer;
				}

				// 레이어 visible, zIndex, opacity 설정
				var addedUgLayer = addObject.create( ugLayer );
				addedUgLayer.setLayerVisible( ugLayer.getVisible() );
				addedUgLayer.getOlLayer().setZIndex( ugLayer.getOlLayer().getZIndex() );
				addedUgLayer.getOlLayer().setOpacity( ugLayer.getOlLayer().getOpacity() );

				// uGisLayerManager 사용 시 대상 지도에서 설정된 Zoom 설정
				if ( _self.captureLayerManager ) {
					addedUgLayer.setMinZoom( ugLayer.getMinZoom() );
					addedUgLayer.setMaxZoom( ugLayer.getMaxZoom() );
				}

				// 대상 지도에서 uGisWMSToc 객체 사용 시 생성
				if ( _self.origin_ugLayerManager && addedUgLayer.getLayerType() === "WMS" ) {
					var ugToc = ugLayers[ i ][ "uGisToc" ];

					// WMS Capabilities 요청
					var ugGetCapabilitiesWMS = new ugmp.service.uGisGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : addedUgLayer.getServiceURL(),
						dataViewId : _self.captureUgMap.getDataViewId()
					} );

					_self.arrDeferred_ready.push( ugGetCapabilitiesWMS );

					ugGetCapabilitiesWMS.then( function() {
						var toc = addObject.toc( {
							key : ugToc.tocKey,
							addLayer : addedUgLayer,
							saveData : JSON.parse( JSON.stringify( ugToc.getSaveData() ) ),
							capabilities : ugGetCapabilitiesWMS.data
						} );
						if ( _self.captureLayerManager ) {
							_self.captureLayerManager.add( {
								uGisToc : toc,
								uGisLayer : addedUgLayer
							} );
						}
					} );
				} else {
					if ( _self.captureLayerManager ) {
						_self.captureLayerManager.add( {
							uGisLayer : addedUgLayer
						} );
					}
				}

				var def_add = addObject.add( addedUgLayer );
				_self.arrDeferred_ready.push( def_add );
				def_add.then( function(res) {
				} );
				loop( i + 1 );
			} else {
				_self.ready();
			}
		} )( 0 );
	};


	/**
	 * 등록된 레이어를 순차 비동기로 추가한다.
	 * 
	 * @param ugLayer {ugmp.layer} {@link ugmp.layer}객체.
	 * 
	 * @return {Object}
	 * 
	 * @private
	 */
	ugmp.uGisCapture.prototype._addUGisLayer = function(ugLayer_) {
		var _self = this._this || this;

		var addWMSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWMSLayer( {
					useProxy : true,
					singleTile : ugLayer_._this.singleTile,
					serviceURL : ugLayer_.getServiceURL(),
					ogcParams : ugLayer_.getOlLayer().getSource().getParams()
				} );
			},
			add : function(ugWmsLayer_) {
				return _self.captureUgMap.addWMSLayer( {
					uWMSLayer : ugWmsLayer_,
					useExtent : false,
					extent : null,
					resolution : null
				} );
			},
			toc : function(options_) {
				return new ugmp.toc.uGisWMSToc( {
					tocKey : options_.key,
					uGisMap : _self.captureUgMap,
					uGisLayer : options_.addLayer,
					loadData : options_.saveData,
					capabilities : options_.capabilities
				} );
			}
		};

		var addWFSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWFSLayer( {
					useProxy : true,
					serviceURL : ugLayer_.getServiceURL(),
					layerName : ugLayer_.layerName,
					srsName : _self.captureUgMap.getCRS(),
					maxFeatures : ugLayer_._this.maxFeatures,
					style : ugLayer_._this.style,
					filter : ugLayer_._this.filter
				} );
			},
			add : function(ugWfsLayer_) {
				return _self.captureUgMap.addWFSLayer( {
					uWFSLayer : ugWfsLayer_,
					useExtent : false
				} );
			}
		};

		var addVectorLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = ugmp.util.uGisUtil.cloneStyle( style );
				}

				return new ugmp.layer.uGisVectorLayer( {
					style : style,
					features : ugLayer_.getFeatures(),
					srsName : ugLayer_._this.srsName,
				} );
			},
			add : function(ugVectorLayer_) {
				return _self.captureUgMap.addVectorLayer( {
					uVectorLayer : ugVectorLayer_,
					useExtent : false
				} );
			}
		};

		var addVector3DLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;

				if ( typeof style !== "function" && typeof style !== "undefined" ) {
					style = ugmp.util.uGisUtil.cloneStyle( style );
				}

				return new ugmp.layer.uGisVector3DLayer( {
					style : style,
					features : ugLayer_.getFeatures(),
					initBuild : ugLayer_._this.initBuild,
					srsName : ugLayer_._this.srsName,
					labelColumn : ugLayer_._this.labelColumn,
					heightColumn : ugLayer_._this.heightColumn,
					maxResolution : ugLayer_._this.maxResolution					
				} );
			},
			add : function(ugVector3DLayer_) {
				return _self.captureUgMap.addVector3DLayer( {
					uVector3DLayer : ugVector3DLayer_,
					useExtent : false
				} );
			}
		};

		var addClusterLayer = {
			create : function(ugLayer_) {
				var style = ugLayer_._this.style;
				return new ugmp.layer.uGisClusterLayer( {
					style : ( typeof style === "function" ) ? style : ugmp.util.uGisUtil.cloneStyle( style ),
					features : ugmp.util.uGisUtil.cloneFeatures( ugLayer_.getFeatures() ),
					distance : ugLayer_._this.distance,
					useAnimation : ugLayer_._this.useAnimation
				} );
			},
			add : function(ugClusterLayer_) {
				return _self.captureUgMap.addClusterLayer( {
					uClusterLayer : ugClusterLayer_,
					useExtent : false
				} );
			}
		};

		var addWMTSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWMTSLayer( {
					useProxy : true,
					serviceURL : ugLayer_.getServiceURL(),
					layer : ugLayer_.layer,
					version : ugLayer_.version,
					matrixSet : ugLayer_.matrixSet,
					wmtsCapabilities : ugLayer_.getWmtsCapabilities(),
					originExtent : ugLayer_.getOriginExtent()
				} );
			},
			add : function(ugWmtsLayer_) {
				return _self.captureUgMap.addWMTSLayer( {
					uWMTSLayer : ugWmtsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		var addWCSLayer = {
			create : function(ugLayer_) {
				return new ugmp.layer.uGisWCSLayer( {
					useProxy : true,
					version : ugLayer_.version,
					identifier : ugLayer_.identifier,
					format : ugLayer_._this.format,
					serviceURL : ugLayer_.getServiceURL(),
					boundingBox : ugLayer_.getBoundingBox(),
					useScaleRefresh : ugLayer_.useScaleRefresh
				} );
			},
			add : function(ugWcsLayer_) {
				return _self.captureUgMap.addWCSLayer( {
					uWCSLayer : ugWcsLayer_,
					useExtent : false,
					extent : null
				} );
			}
		};

		return {
			addWFSLayer : addWFSLayer,
			addWCSLayer : addWCSLayer,
			addWMSLayer : addWMSLayer,
			addWMTSLayer : addWMTSLayer,
			addVectorLayer : addVectorLayer,
			addClusterLayer : addClusterLayer,
			addVector3DLayer : addVector3DLayer
		}
	};


	/**
	 * 캡쳐 지도 {ugmp.uGisMap} 객체를 가져온다.
	 * 
	 * @return captureUgMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisMap = function() {
		var _self = this._this || this;
		return _self.captureUgMap;
	};


	/**
	 * 캡쳐 배경 지도 {ugmp.uGisBaseMap} 객체를 가져온다.
	 * 
	 * @return captureBaseMapId {ugmp.uGisBaseMap} {@link ugmp.uGisBaseMap} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisBaseMap = function() {
		var _self = this._this || this;
		return _self.captureUgBaseMap;
	};


	/**
	 * 캡쳐 레이어 매니저 {ugmp.manager.uGisLayerManager} 객체를 가져온다.
	 * 
	 * @return captureLayerManager {ugmp.manager.uGisLayerManager} {@link ugmp.manager.uGisLayerManager} 객체.
	 */
	ugmp.uGisCapture.prototype.getUgisLayerManager = function() {
		var _self = this._this || this;
		return _self.captureLayerManager;
	};


	/**
	 * Capture 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF.
	 */
	ugmp.uGisCapture.prototype.setBaseMapVisible = function(visible_) {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.setVisible( visible_ );
		}
	};


	/**
	 * Capture 배경지도의 ON/OFF 상태를 토글한다.
	 */
	ugmp.uGisCapture.prototype.baseMapVisibleToggle = function() {
		var _self = this._this || this;

		if ( _self.captureUgBaseMap ) {
			_self.captureUgBaseMap.visibleToggle();
		}
	};


	/**
	 * 지도 캡쳐를 시작한다.
	 * 
	 * @param callBack {Function} 콜백 함수.
	 */
	ugmp.uGisCapture.prototype.runCapture = function(callBack_) {
		var _self = this._this || this;

		document.getElementById( _self.captureBaseMapId ).style.overflow = "";
		document.getElementById( _self.captureBaseMapId ).firstElementChild.style.overflow = "";

		if ( typeof callBack_ !== "function" ) {
			return false;
		}

		var baseMapCode = "none";

		if ( _self.origin_ugBaseMap ) {
			baseMapCode = _self.origin_ugBaseMap.getSelectedBaseMap().split( "_" )[ 0 ];
		}

		if ( baseMapCode.indexOf( "naver" ) > -1 || baseMapCode.indexOf( "daum" ) > -1 || baseMapCode.indexOf( "baroEmap" ) > -1 ) {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_etc( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				logging : false,
				proxy : ugmp.uGisConfig.getProxy()
			} ).then( function(canvas) {
				callBack_.call( this, canvas );
			} );
		} else {
			document.getElementById( _self.captureDivId ).scrollIntoView( false );
			html2canvas_google( document.getElementById( _self.captureDivId ), {
				useCORS : true,
				proxy : ugmp.uGisConfig.getProxy(),
				onrendered : function(canvas) {
					callBack_.call( this, canvas );
				}
			} );
		}
	};


	/**
	 * 생성된 Capture 객체를 destroy 한다.
	 */
	ugmp.uGisCapture.prototype.destroy = function(callBack_) {
		var _self = this._this || this;

		_$( "#" + _self.captureBaseMapId ).empty();
		_self.captureUgMap.getMap().setTarget( null );
	};


	/**
	 * setLayer Ready Success
	 */
	ugmp.uGisCapture.prototype.ready = function() {
		var _self = this._this || this;

		$.when.apply( $, _self.arrDeferred_ready ).then( function() {
			if ( _self.readyFunction ) {
				_self.readyFunction.call( _self );
			}

			_self.captureUgMap.refresh();
		} );
	};

} )();

/**
 * @namespace ugmp
 */

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm에서 사용할 config를 설정한다.
	 * 
	 * 프록시 주소, 에러 알림창 함수, 로딩 심볼 표시 사용 여부, 로딩 심볼 이미지 경로를 설정할 수 있으며, 한 번 설정하면 공통으로 사용할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * ugmp.uGisConfig.init( {
	 * 	proxy : '/proxy.do', // 프록시 설정
	 * 	useLoading : true, // 로딩 심볼 표시 사용 여부
	 * 	loadingImg : 'https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif', // 로딩 심볼 이미지
	 * 	alert_Error : function(msg) { // 에러 알림창 함수
	 * 		alert( 'Error : ' + msg );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	ugmp.uGisConfig = ( function(opt_options) {
		var _self = this;

		this.proxy = null;
		this.mobile = null;
		this.loading = null;
		this.browser = null;
		this.progress = null;
		this.flag_Proxy = null;
		this.alert_Error = null;
		this.loadingImg = null;
		this.useLoading = null;
		this.useMapProxy = null;

		this.progressObj = {};

		_self._checkMobile();
		_self._checkBrowser();
		_self._setIeCursor();

		return {
			_this : _self,
			init : this.init,
			isMobile : this.isMobile,
			getProxy : this.getProxy,
			loading : this.getLoading,
			isMapProxy : this.isMapProxy,
			getBrowser : this.getBrowser,
			alert_Error : this.getAlert_Error,
			addProgress : this.addProgress,
			resetLoading : this.resetLoading,
			isUseLoading : this.isUseLoading,
			getLoadingImg : this.getLoadingImg,
			addLoadEventListener : this.addLoadEventListener
		}

	} );


	/**
	 * Initialize
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.proxy {String} 프록시 주소.
	 * @param opt_options.useLoading {Boolean} 로딩 심볼 표시 사용 여부. Default is `true`.
	 * @param opt_options.alert_Error {Function} 에러 알림창 함수 msg {String}. Default is `alert`.
	 * @param opt_options.loadingImg {String} 로딩 심볼 이미지 경로 또는 base64. Default is `icon_loading.gif`.
	 */
	ugmp.uGisConfig.prototype.init = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		if ( options.proxy !== undefined && typeof options.proxy === "string" ) {
			_self.proxy = options.proxy;
			_self.flag_Proxy = true;
		} else {
			_self.proxy = "";
			_self.flag_Proxy = false;
		}

		if ( options.alert_Error !== undefined && typeof options.alert_Error === "function" ) {
			_self.alert_Error = options.alert_Error;
		} else {
			_self.alert_Error = _self._defaultAlert_Error;
		}

		if ( options.loadingImg !== undefined && typeof options.loadingImg === "string" ) {
			_self.loadingImg = options.loadingImg;
		} else {
			var defaultLoadingImg = ugmp.contextPath + "/uGisMapPlatForm/images/icon_loading.gif";
			_self.loadingImg = _self.defaultLoadingImg;
		}

		_self.useLoading = ( options.useLoading !== undefined ) ? options.useLoading : true;
		_self.useMapProxy = ( options.useMapProxy !== undefined ) ? options.useMapProxy : false;
	};


	/**
	 * 현재 브라우저가 모바일이면 `true`.
	 * 
	 * @return mobile {Boolean} 모바일 여부.
	 */
	ugmp.uGisConfig.prototype.isMobile = function() {
		var _self = this._this || this;
		return _self.mobile;
	};


	/**
	 * URL 레이어 Proxy 사용 여부를 가져온다.
	 * 
	 * @return useMapProxy {Boolean} URL 레이어 Proxy 사용 여부.
	 */
	ugmp.uGisConfig.prototype.isMapProxy = function() {
		var _self = this._this || this;
		return _self.useMapProxy;
	};


	/**
	 * 현재 브라우저 타입을 가져온다.
	 * 
	 * @return browser {String} 브라우저 타입.
	 */
	ugmp.uGisConfig.prototype.getBrowser = function() {
		var _self = this._this || this;
		return _self.browser;
	};


	/**
	 * 설정된 프록시 주소를 가져온다.
	 * 
	 * @return proxy {String} 프록시 주소.
	 */
	ugmp.uGisConfig.prototype.getProxy = function() {
		var _self = this._this || this;

		if ( _self.flag_Proxy !== undefined ) {
			return _self.proxy;
		} else {
			return "";
		}
	};


	/**
	 * 설정된 에러 알림 함수를 호출한다.
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	ugmp.uGisConfig.prototype.getAlert_Error = function(msg_) {
		var _self = this._this || this;
		_self.alert_Error( msg_ );
	};


	/**
	 * 에러 발생 시 기본 호출 함수
	 * 
	 * @private
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	ugmp.uGisConfig.prototype._defaultAlert_Error = function(msg_) {
		alert( msg_ );
	};


	/**
	 * 로딩 심볼 표시 사용 여부를 가져온다.
	 * 
	 * @return useLoading {Boolean} 로딩 심볼 표시 사용 여부.
	 */
	ugmp.uGisConfig.prototype.isUseLoading = function() {
		var _self = this._this || this;
		return _self.useLoading;
	};


	/**
	 * 로딩 심볼을 리셋 시킨다.
	 * 
	 * @param key {String} 지도의 View ID.
	 */
	ugmp.uGisConfig.prototype.resetLoading = function(key_) {
		var _self = this._this || this;

		if ( _self.progressObj[ key_ ] ) {
			_self.progressObj[ key_ ].reset();
		}
	};


	/**
	 * 로딩 심볼 표시 함수.
	 * 
	 * @param key {String} 지도의 View ID.
	 * @param state {Boolean} 사용 여부.
	 */
	ugmp.uGisConfig.prototype.getLoading = function(key_, state_) {
		var _self = this._this || this;

		if ( state_ ) {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoading();
			}
		} else {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoaded();
			}
		}
	};


	/**
	 * 로딩 심볼 표시 연동 함수.
	 * 
	 * @private
	 * 
	 * @return loadingFunc {Function} 로딩 심볼 표시 함수.
	 */
	ugmp.uGisConfig.prototype._Progress = function(key_, loadingFunc_) {
		var _self = this;

		this.key = null;
		this.loaded = null;
		this.loading = null;
		this.interval = null;
		this.timeOut = null;
		this.loadingFunc = null;


		( function() {
			_self.key = key_;
			_self.loaded = 0;
			_self.loading = 0;
			_self.loadingFunc = loadingFunc_;
		} )();


		this.addLoading = ( function() {
			if ( _self.loading === 0 ) {
				_self.loadingFunc( true );

				_$( document ).trigger( "loadChangeEvent_" + _self.key, false );
			}
			++_self.loading;
			_self.update();
		} );


		this.addLoaded = ( function() {
			setTimeout( function() {
				++_self.loaded;
				_self.update();
			}, 100 );
		} );


		this.update = ( function() {
			if ( ( _self.loading !== 0 && _self.loaded !== 0 ) && ( _self.loading <= _self.loaded ) ) {
				_self.loading = 0;
				_self.loaded = 0;

				clearInterval( _self.interval );

				// _self.timeOut = setTimeout( function() {
				_self.loadingFunc( false );

				$( document ).trigger( "loadChangeEvent_" + _self.key, true );
				// }, 999 );
			} else {
				clearTimeout( _self.timeOut );
			}
		} );


		this.reset = ( function() {
			clearInterval( _self.interval );
			_self.interval = setInterval( _self.update, 1000 );
		} );


		return {
			reset : _self.reset,
			addLoaded : _self.addLoaded,
			addLoading : _self.addLoading
		}
	};


	/**
	 * 웹, 모바일 여부 체크.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._checkMobile = function() {
		var _self = this._this || this;

		var filter = "win16|win32|win64|mac";
		if ( navigator.platform ) {
			if ( 0 > filter.indexOf( navigator.platform.toLowerCase() ) ) {
				_self.mobile = true;
			} else {
				_self.mobile = false;
			}
		}
	};


	/**
	 * 브라우저 종류 체크.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._checkBrowser = function() {
		var _self = this._this || this;

		var browser;
		var name = navigator.appName;
		var agent = navigator.userAgent.toLowerCase();

		// MS 계열 브라우저를 구분하기 위함.
		if ( name === 'Microsoft Internet Explorer' || agent.indexOf( 'trident' ) > -1 || agent.indexOf( 'edge/' ) > -1 ) {
			browser = 'ie';
			if ( name === 'Microsoft Internet Explorer' ) { // IE old version (IE 10 or Lower)
				agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec( agent );
				browser += parseInt( agent[ 1 ] );
			} else { // IE 11+
				if ( agent.indexOf( 'trident' ) > -1 ) { // IE 11
					browser += 11;
				} else if ( agent.indexOf( 'edge/' ) > -1 ) { // Edge
					browser = 'edge';
				}
			}
		} else if ( agent.indexOf( 'safari' ) > -1 ) { // Chrome or Safari
			if ( agent.indexOf( 'opr' ) > -1 ) { // Opera
				browser = 'opera';
			} else if ( agent.indexOf( 'chrome' ) > -1 ) { // Chrome
				browser = 'chrome';
			} else { // Safari
				browser = 'safari';
			}
		} else if ( agent.indexOf( 'firefox' ) > -1 ) { // Firefox
			browser = 'firefox';
		}

		// IE: ie7~ie11, Edge: edge, Chrome: chrome, Firefox: firefox, Safari: safari, Opera: opera
		_self.browser = browser;
	};


	/**
	 * 브라우저가 IE인 경우 마우스 커서 설정.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._setIeCursor = function() {
		var _self = this._this || this;

		if ( _self.browser && _self.browser.indexOf( "ie" ) > -1 ) {
			var style = document.createElement( 'style' );
			style.type = 'text/css';
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );

			var cursorList = [ 'default', 'closeHand', 'identify', 'measureArea', 'measureDistance', 'zoomIn', 'zoomOut', 'zoomOut', 'point', 'line',
					'polygon', 'rectangle', 'circle' ];

			for ( var i in cursorList ) {
				var cursor = cursorList[ i ];
				var url = "../images/cursor/cursor_" + cursor + ".cur";

				var name = '.cursor-' + cursor;
				var rule = "cursor: url(" + url + "), auto !important;";

				if ( !( style.sheet || {} ).insertRule ) {
					( style.styleSheet || style.sheet ).addRule( name, rule );
				} else {
					style.sheet.insertRule( name + "{" + rule + "}", 0 );
				}
			}
		}
	};


	/**
	 * 설정된 로딩 심볼 이미지를 가져온다.
	 * 
	 * @return loadingImg {String} 이미지 경로 또는 base64.
	 */
	ugmp.uGisConfig.prototype.getLoadingImg = function() {
		var _self = this._this || this;

		if ( !_self.loadingImg ) {
			var defaultLoadingImg = ugmp.contextPath + "/uGisMapPlatForm/images/icon_loading.gif";
			_self.loadingImg = defaultLoadingImg;
		}
		return _self.loadingImg;
	};


	/**
	 * 데이터 로딩 프로그레스를 추가한다.
	 * 
	 * @param key {String} View ID.
	 * @param loadFunction {Function} 로딩 심볼 표시 함수.
	 */
	ugmp.uGisConfig.prototype.addProgress = function(key_, loadFunction_) {
		var _self = this._this || this;
		_self.progressObj[ key_ ] = new _self._Progress( key_, loadFunction_ );
	};


	/**
	 * 데이터 로딩 시작/완료 이벤트를 추가한다.
	 * 
	 * ※로드가 시작되거나 로딩 중이면 `false` 로딩이 완료 되면 `true`를 반환한다.
	 * 
	 * @param key {String} View ID.
	 * @param eventListener {Function} {jQuery.Event, Boolean} 시작/완료 함수.
	 */
	ugmp.uGisConfig.prototype.addLoadEventListener = function(key_, eventListener_) {
		var _self = this._this || this;
		setTimeout( function() {
			$( document ).on( "loadChangeEvent_" + key_, eventListener_ );
		}, 10 )
	};


	ugmp.uGisConfig = new ugmp.uGisConfig();

} )();

( function() {
	"use strict";

	/**
	 * HTTP ajax 통신.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugHttp = ugmp.uGisHttp.requestData( {
	 * 	url : '/sampleXML.xml',
	 * 	type : 'GET',
	 * 	dataType : 'XML',
	 * 	contentType : 'text/xml',
	 * 	data : {
	 * 		param1 : '1',
	 * 		param2 : '2'
	 * 	}
	 * } );
	 * 
	 * ugHttp.then( function(res) {
	 * 	console.log( res );
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	ugmp.uGisHttp = ( function() {

		return {
			requestData : this.requestData
		}

	} );


	/**
	 * Request Data.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.url {String} URL 주소.
	 * 
	 * @param opt_options.type {String} GET or POST. Default is `GET`.
	 * @param opt_options.data {Object} 서버에 전송할 데이터.
	 * @param opt_options.contentType {String} contentType 유형. Default is `application/x-www-form-urlencoded; charset=UTF-8`.
	 * @param opt_options.dataType {String} dataType 유형. Default is `XML`.
	 * @param opt_options.dataViewId {String} 지도의 View ID.
	 * 
	 * @return deferred.promise {jQuery.deferred.promise}
	 */
	ugmp.uGisHttp.prototype.requestData = function(opt_options) {
		var _this = this;
		var options = opt_options || {};

		this.isUseLoading = ugmp.uGisConfig.isUseLoading();

		this.deferred = _$.Deferred();

		this.url = ( options.url !== undefined ) ? options.url : "";
		this.type = ( options.type !== undefined ) ? options.type : "GET";
		this.data = ( options.data !== undefined ) ? options.data : {};
		this.contentType = ( options.contentType !== undefined ) ? options.contentType : "application/x-www-form-urlencoded; charset=UTF-8";
		this.dataType = ( options.dataType !== undefined ) ? options.dataType : "XML";
		this.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		_$.ajax( {
			url : _this.url,
			type : _this.type,
			data : _this.data,
			dataType : _this.dataType,
			contentType : _this.contentType,
			beforeSend : function() {
				if ( _this.isUseLoading ) {
					ugmp.uGisConfig.loading( _this.dataViewId, true );
				}
			},
			complete : function() {
				if ( _this.isUseLoading ) {
					ugmp.uGisConfig.loading( _this.dataViewId, false );
				}
			},
			success : function(response_) {
				_this.deferred.resolve( response_ );
			},
			error : function(response_) {
				_this.deferred.reject( response_ );
			}
		} );

		return _this.deferred.promise();
	};


	ugmp.uGisHttp = new ugmp.uGisHttp();

} )();

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지도 객체.
	 * 
	 * 다양한 타입의 레이어({@link ugmp.layer})를 추가할 수 있으며, 지도의 기본 객체이다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugMap = new ugmp.uGisMap( {
	 * 	target : 'map',
	 * 	crs : 'EPSG:3857',
	 * 	center : [ 0, 0 ],
	 * 	useMaxExtent : true,
	 * 	useAltKeyOnly : false
	 * } );
	 * 
	 * // ol.Map 객체에 직접 접근
	 * ugMap.getMap().addLayer( new ol.layer.Tile( {
	 * 	source : new ol.source.OSM()
	 * } ) );
	 * 
	 * // uGisMap에 WMS 레이어 추가
	 * ugMap.addWMSLayer( {
	 * 	uWMSLayer : new ugmp.layer.uGisWMSLayer( {...} )
	 * 	...
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.crs {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.center {Array.<Number>} 중심점. Default is `[0, 0]`.
	 * @param opt_options.target {String} 지도가 그려질 DIV ID.
	 * @param opt_options.useAltKeyOnly {Boolean} 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부.
	 * 
	 * `true`면 AltKey를 누를 상태에서만 마우스 휠줌 스크롤 사용이 가능하다. Default is `false`.
	 * 
	 * @param opt_options.useMaxExtent {Boolean} 이동할 수 있는 영역을 해당 좌표계의 최대 영역으로 한정한다. Default is `false`.
	 * 
	 * @class
	 */
	ugmp.uGisMap = ( function(opt_options) {
		var _self = this;

		this.olMap = null;
		this.mapCRS = null;
		this.useAltKeyOnly = null;

		this.layers = null;
		this.dataViewId = null;
		this.loadingSrcDiv = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.layers = [];
			_self.mapCRS = ( options.crs !== undefined ) ? options.crs.toUpperCase() : "EPSG:3857";
			_self.useAltKeyOnly = ( typeof ( options.useAltKeyOnly ) === "boolean" ) ? options.useAltKeyOnly : false;

			var center = options.center;
			if ( !Array.isArray( center ) ) {
				center = [ 0, 0 ];
			}

			var maxExtent = ( options.useMaxExtent ) ? ol.proj.get( _self.mapCRS ).getExtent() : undefined;

			var view = new ol.View( {
				zoom : 2,
				center : center,
				extent : maxExtent,
				projection : _self.mapCRS
			} );

			_self.dataViewId = ol.getUid( view );

			_self.olMap = new ol.Map( {
				target : options.target,
				layers : [],
				renderer : "canvas",
				controls : _self._createDefaultControls(),
				interactions : _self._createDefaultInteractions(),
				view : view
			} );

			_self._createScrollElement();
			_self._createLoadingElement();

			/**
			 * view 변경 시 overlay transform
			 * 
			 * 로딩 심볼 초기화
			 */
			_self.olMap.on( "change:view", function() {
				var newProjection = _self.olMap.getView().getProjection().getCode();
				_self.mapCRS = newProjection;

				var overlays = _self.olMap.getOverlays().getArray();
				for ( var i = overlays.length - 1; i >= 0; i-- ) {
					var origin = overlays[ i ].get( "origin" );
					if ( origin ) {
						var position = ol.proj.transform( origin[ "position" ], origin[ "projection" ], _self.mapCRS );
						overlays[ i ].setPosition( position );
						overlays[ i ].set( "CRS", _self.mapCRS );
					}
				}

				ugmp.uGisConfig.resetLoading( _self.dataViewId );
			} );


			var tag = ( options.target instanceof Element ) ? options.target : "#" + options.target;

			_$( tag ).resize( function() {
				_self.refresh();
			} );

			_$( window ).resize( function() {
				_self.refresh();
			} );

			console.log( "####### uGisMap Init #######" );
			console.log( "Projection : " + _self.mapCRS );
		} )();
		// END initialize


		return {
			_this : _self,
			refresh : _self.refresh,
			getCRS : _self.getCRS,
			getMap : _self.getMap,
			setExtent : _self.setExtent,
			getLayers : _self.getLayers,
			setAltKeyOnly : _self.setAltKeyOnly,
			removeLayer : _self.removeLayer,
			addWMSLayer : _self.addWMSLayer,
			addWFSLayer : _self.addWFSLayer,
			addWCSLayer : _self.addWCSLayer,
			addWMTSLayer : _self.addWMTSLayer,
			addVectorLayer : _self.addVectorLayer,
			addClusterLayer : _self.addClusterLayer,
			addVector3DLayer : _self.addVector3DLayer,
			calculateScale : _self.calculateScale,
			getDataViewId : _self.getDataViewId,
			getScaleForZoom : _self.getScaleForZoom,
			setLoadingVisible : _self.setLoadingVisible,
			removeAllListener : _self.removeAllListener,
			removeAllInteraction : _self.removeAllInteraction,
			setActiveAllInteraction : _self.setActiveAllInteraction
		}

	} );


	/**
	 * 지도 영역 스크롤 이벤트 Element
	 * 
	 * @private
	 */
	ugmp.uGisMap.prototype._createScrollElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var altEmpty = document.createElement( "div" );
		altEmpty.setAttribute( "altText", "" );
		altEmpty.style.top = "0px";
		altEmpty.style.zIndex = 2;
		altEmpty.style.opacity = 0;
		altEmpty.style.width = "100%";
		altEmpty.style.height = "100%";
		altEmpty.style.position = "absolute";
		altEmpty.style.pointerEvents = "none";
		altEmpty.style.transitionDuration = "1s";
		altEmpty.style.backgroundColor = "rgba( 0, 0, 0, 0.5 )";

		var text = document.createElement( "p" );
		text.textContent = "지도를 확대/축소하려면 Alt를 누른 채 스크롤하세요.";
		text.style.left = "0px";
		text.style.right = "0px";
		text.style.top = "50%";
		text.style.color = "white";
		text.style.fontSize = "25px";
		text.style.margin = "0 auto";
		text.style.textAlign = "center";
		text.style.position = "absolute";
		text.style.transform = "translateY(-50%)";

		altEmpty.appendChild( text );

		element.insertBefore( altEmpty, element.firstChild );

		_self.olMap.scrollCallBack = new _scrollCallBack( altEmpty, function() {
			return _self.useAltKeyOnly
		} );

		function _scrollCallBack(altElement_, getAltKeyOnly_) {
			var _this = this;

			this.tId = null;
			this.altElement = null;
			this.getAltKeyOnly = null;

			( function(altElement_, getAltKeyOnly_) {
				_this.altElement = altElement_;
				_this.getAltKeyOnly = getAltKeyOnly_;
			} )( altElement_, getAltKeyOnly_ );

			function _none() {
				_this.altElement.style.opacity = 0;
				_this.altElement.style.transitionDuration = "0.8s";
			}

			this.run = function() {
				_this.altElement.style.opacity = 1;
				_this.altElement.style.transitionDuration = "0.3s";

				window.clearTimeout( _this.tId );

				_this.tId = window.setTimeout( function() {
					_none();
				}, 1500 );
			};

			this.clear = function() {
				window.clearTimeout( _this.tId );
				_none();
			};


			return {
				run : _this.run,
				clear : _this.clear,
				getAltKeyOnly : _this.getAltKeyOnly
			}
		}
	};


	/**
	 * 로딩 심볼 Element
	 * 
	 * @private
	 */
	ugmp.uGisMap.prototype._createLoadingElement = function() {
		var _self = this._this || this;

		var selector = '.ol-viewport[data-view="' + _self.dataViewId + '"]';
		var element = document.querySelector( selector );

		var loadingDiv = document.createElement( "div" );
		loadingDiv.id = "loadingDIV";
		loadingDiv.style.zIndex = 1;
		loadingDiv.style.top = "0px";
		loadingDiv.style.left = "0px";
		loadingDiv.style.right = "0px";
		loadingDiv.style.bottom = "0px";
		loadingDiv.style.display = "none";
		loadingDiv.style.margin = "auto";
		loadingDiv.style.position = "absolute";
		loadingDiv.style.pointerEvents = "none";

		_self.loadingSrcDiv = new Image();
		_self.loadingSrcDiv.src = ugmp.uGisConfig.getLoadingImg();
		_self.loadingSrcDiv.onload = function(evt) {
			loadingDiv.style.width = evt.target.width + "px";
			loadingDiv.style.height = evt.target.height + "px";

			loadingDiv.appendChild( _self.loadingSrcDiv );
			element.insertBefore( loadingDiv, element.firstChild );
		};


		ugmp.uGisConfig.addProgress( _self.dataViewId, function(state_) {
			if ( state_ ) {
				loadingDiv.style.display = "block";
			} else {
				loadingDiv.style.display = "none";
			}
		} );
	};


	/**
	 * Default Interactions 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Interaction의 기본 효과 제거.
	 * 
	 * -모든 Intercation 삭제 시 꼭 필요한 Interaction은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return interactions {Array.<ol.interaction.Interaction>}
	 */
	ugmp.uGisMap.prototype._createDefaultInteractions = function() {
		var interactions = [ new ol.interaction.DragPan( {
			kinetic : false
		} ), new ol.interaction.DragZoom( {
			duration : 0,
			condition : ol.events.condition.shiftKeyOnly
		} ), new ol.interaction.DragRotate( {
			duration : 0
		} ), new ol.interaction.DoubleClickZoom( {
			duration : 0
		} ), new ol.interaction.MouseWheelZoom( {
			duration : 0,
			constrainResolution : true
		} ), new ol.interaction.PinchZoom( {
			duration : 0,
			constrainResolution : true
		} ), new ol.interaction.PinchRotate( {
			duration : 0
		} ) ];

		for ( var i in interactions ) {
			interactions[ i ].set( "necessary", true );
		}

		return interactions;
	};


	/**
	 * Default Controls 설정.
	 * 
	 * -베이스맵(배경지도)과 자연스러운 싱크를 맞추기 위해 각 Control의 기본 효과 제거.
	 * 
	 * -모든 Control 삭제 시 꼭 필요한 Control은 제외하기 위해 속성값 추가.
	 * 
	 * @private
	 * 
	 * @return controls {Array.<ol.control.Control>}
	 */
	ugmp.uGisMap.prototype._createDefaultControls = function() {
		var controls = [ new ol.control.Rotate(), new ol.control.Zoom( {
			duration : 0
		} ) ];

		for ( var i in controls ) {
			controls[ i ].set( "necessary", true );
		}

		return controls;
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 설정된 ol.Map 객체를 가져온다.
	 * 
	 * @return olMap {ol.Map} ol.Map 객체.
	 */
	ugmp.uGisMap.prototype.getMap = function() {
		var _self = this._this || this;
		return _self.olMap;
	};


	/**
	 * 현재 지도 좌표계를 가져온다.
	 * 
	 * @return mapCRS {String} 현재 지도 좌표계.
	 */
	ugmp.uGisMap.prototype.getCRS = function() {
		var _self = this._this || this;
		return _self.mapCRS;
	};


	/**
	 * 지정된 Extent로 지도 영역 맞추기.
	 * 
	 * @param envelop {Array.<Double>} Extent.
	 */
	ugmp.uGisMap.prototype.setExtent = function(envelop_) {
		var _self = this._this || this;
		_self.olMap.getView().fit( envelop_ );
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 추가된 {@link ugmp.layer} 목록을 가져온다.
	 * 
	 * @param layerType {String} 레이어 타입. (WMS, WFS, WMTS, Vector...)
	 * 
	 * @return layers {Array.<ugmp.layer>} 레이어 목록.
	 */
	ugmp.uGisMap.prototype.getLayers = function(layerType_) {
		var _self = this._this || this;

		var layers = [];

		if ( _self.layers && layerType_ ) {
			for ( var i in _self.layers ) {
				var layer = _self.layers[ i ];
				if ( layer.getLayerType() === layerType_ ) {
					layers.push( layer );
				}
			}
		} else {
			layers = _self.layers;
		}

		return layers;
	};


	/**
	 * WMS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWMSLayer {ugmp.layer.uGisWMSLayer} {@link ugmp.layer.uGisWMSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.resolution {Float} 레이어 추가 후 설정될 resolution.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWMS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWMSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWMSLayer = ( options.uWMSLayer !== undefined ) ? options.uWMSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;
		var resolution = ( options.resolution !== undefined ) ? options.resolution : undefined;

		var deferred = _$.Deferred();

		try {
			_self.olMap.addLayer( uWMSLayer.getOlLayer() );
			_self.layers.push( uWMSLayer );

			var source = uWMSLayer.getOlLayer().getSource();
			source.on( [ "imageloadstart", "tileloadstart" ], function(evt) {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( [ "imageloadend", "tileloadend" ], function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( [ "imageloaderror", "tileloaderror" ], function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );


			/**
			 * extent로 이동
			 */
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent ) ) {
					for ( var i in extent ) {
						extent[ i ] = parseFloat( extent[ i ] );
					}

					_self.setExtent( extent );

					if ( resolution ) {
						_olMap.getView().setResolution( resolution );
					}
				} else {
					var capabilities = new ugmp.service.uGisGetCapabilitiesWMS( {
						useProxy : true,
						version : "1.3.0",
						serviceURL : uWMSLayer.getServiceURL(),
						dataViewId : _self.dataViewId
					} );

					capabilities.then(
							function(result_) {

								if ( result_.state ) {
									var transExtent = ol.proj.transformExtent( capabilities.data.serviceMetaData.maxExtent,
											capabilities.data.serviceMetaData.crs, _self.mapCRS );
									_self.setExtent( transExtent );
								} else {
									ugmp.uGisConfig.alert_Error( result_.message );
									deferred.reject( result_.message );
									return deferred.promise();
								}

							} ).fail( function(e) {
						ugmp.uGisConfig.alert_Error( "Error : " + e );
						deferred.reject( false );
						return deferred.promise();
					} );
				}

			}

			deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WFS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWFSLayer {ugmp.layer.uGisWFSLayer} {@link ugmp.layer.uGisWFSLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWFSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWFSLayer = ( options.uWFSLayer !== undefined ) ? options.uWFSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olWFSLayer = uWFSLayer.getOlLayer();
			_self.olMap.addLayer( olWFSLayer );
			_self.layers.push( uWFSLayer );

			var uFeatures = uWFSLayer.getFeatures( _self.dataViewId );

			uFeatures.then( function(result_) {

				if ( result_.state ) {
					olWFSLayer.getSource().addFeatures( result_.features );

					if ( useExtent ) {
						var transExtent = ol.proj.transformExtent( olWFSLayer.getSource().getExtent(), uWFSLayer.srsName, _self.mapCRS );
						_self.setExtent( transExtent );
					}

					deferred.resolve( true );
				} else {
					ugmp.uGisConfig.alert_Error( result_.message );
					deferred.reject( result_.message );
					return deferred.promise();
				}

			} ).fail( function(e) {
				ugmp.uGisConfig.alert_Error( "Error : " + e );
				deferred.reject( false );
				return deferred.promise();
			} );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * WCS 레이어 추가
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWCSLayer {ugmp.layer.uGisWCSLayer} {@link ugmp.layer.uGisWCSLayer} 객체.
	 * @param opt_options.extent {Array} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부. Default is `false`.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWCS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWCSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWCSLayer = ( options.uWCSLayer !== undefined ) ? options.uWCSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWCSLayer = uWCSLayer.getOlLayer();

			if ( uWCSLayer.getBoundingBox() && uWCSLayer.getBoundingBox().length > 3 ) {

				_self.olMap.addLayer( olWCSLayer );
				_self.layers.push( uWCSLayer );

				uWCSLayer.setMap( _self.olMap, _load );

				var extent = ol.proj.transformExtent( uWCSLayer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				deferred.resolve( true );
			} else {
				var capabilities = new ugmp.service.uGisGetCapabilitiesWCS( {
					useProxy : true,
					version : uWCSLayer.version,
					serviceURL : uWCSLayer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var serviceMetaData = capabilities.data.serviceMetaData;
						var coverageList = serviceMetaData.coverages;

						for ( var i in coverageList ) {
							if ( coverageList[ i ][ "Identifier" ] === uWCSLayer.identifier ) {
								uWCSLayer.setBoundingBox( coverageList[ i ][ "BBOX" ] );
								break;
							}
						}

						_self.olMap.addLayer( olWCSLayer );
						_self.layers.push( uWCSLayer );

						uWCSLayer.setMap( _self.olMap, _load );

						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( uWCSLayer.getBoundingBox(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						deferred.resolve( true );

					} else {
						ugmp.uGisConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}


		function _load(state_) {
			if ( ugmp.uGisConfig.isUseLoading() ) {
				ugmp.uGisConfig.loading( _self.dataViewId, state_ );
			}
		}

		return deferred.promise();
	};


	/**
	 * WMTS 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uWMTSLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.extent {Array.<Number>} 레이어 추가 후 설정될 extent.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * ※`extent`가 정상적이지 않을 경우 {@link ugmp.service.uGisGetCapabilitiesWMTS}의 extent로 설정.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addWMTSLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uWMTSLayer = ( options.uWMTSLayer !== undefined ) ? options.uWMTSLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;
		var extent = ( options.extent !== undefined ) ? options.extent : undefined;

		var deferred = _$.Deferred();

		try {
			var olWMTSLayer = uWMTSLayer.getOlLayer();

			if ( uWMTSLayer.getWmtsCapabilities() && uWMTSLayer.getOriginExtent() ) {
				uWMTSLayer.update( true );
				_self.olMap.addLayer( olWMTSLayer );
				_self.layers.push( uWMTSLayer );
				var extent = ol.proj.transformExtent( uWMTSLayer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
				setExtent( extent );
				setOn();
				deferred.resolve( true );
			} else {
				var capabilities = new ugmp.service.uGisGetCapabilitiesWMTS( {
					useProxy : true,
					version : uWMTSLayer.version,
					serviceURL : uWMTSLayer.getServiceURL(),
					dataViewId : _self.dataViewId
				} );

				capabilities.then( function(result_) {

					if ( result_.state ) {

						var layers = capabilities.data.olJson.Contents.Layer;

						for ( var i in layers ) {
							if ( layers[ i ][ "Identifier" ] === uWMTSLayer.layer ) {
								uWMTSLayer.setOriginExtent( layers[ i ][ "WGS84BoundingBox" ] );
								break;
							}
						}

						uWMTSLayer.setWmtsCapabilities( capabilities.data );

						uWMTSLayer.update( true );

						_self.olMap.addLayer( olWMTSLayer );
						_self.layers.push( uWMTSLayer );

						if ( extent && Array.isArray( extent ) ) {
							setExtent( extent );
						} else {
							var extent = ol.proj.transformExtent( uWMTSLayer.getOriginExtent(), "EPSG:4326", _self.getCRS() );
							setExtent( extent );
						}

						setOn();

						deferred.resolve( true );

					} else {
						ugmp.uGisConfig.alert_Error( result_.message );
						_self.deferred.reject( result_.message );
						return deferred.promise();
					}

				} );
			}

			// deferred.resolve( true );

		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}


		function setExtent(extent_) {
			if ( useExtent ) {

				// extent 매개변수 값이 있으면
				if ( Array.isArray( extent_ ) ) {
					for ( var i in extent_ ) {
						extent_[ i ] = parseFloat( extent_[ i ] );
					}
					_self.setExtent( extent_ );
				}

			}
		}

		function setOn() {
			var source = uWMTSLayer.getOlLayer().getSource();
			source.on( "tileloadstart", function(evt) {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, true );
				}
			} );
			source.on( "tileloadend", function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
			source.on( "tileloaderror", function() {
				if ( ugmp.uGisConfig.isUseLoading() ) {
					ugmp.uGisConfig.loading( _self.dataViewId, false );
				}
			} );
		}

		return deferred.promise();
	};


	/**
	 * Vector 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uVectorLayer {ugmp.layer.uGisVectorLayer} {@link ugmp.layer.uGisVectorLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addVectorLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uVectorLayer = ( options.uVectorLayer !== undefined ) ? options.uVectorLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olVectorLayer = uVectorLayer.getOlLayer();
			_self.olMap.addLayer( olVectorLayer );
			_self.layers.push( uVectorLayer );

			if ( useExtent ) {
				var extent = olVectorLayer.getSource().getExtent();

				if ( extent && extent[ 0 ] !== Infinity ) {
					var transExtent = ol.proj.transformExtent( olVectorLayer.getSource().getExtent(), uVectorLayer.srsName, _self.mapCRS );
					_self.setExtent( transExtent );
				}
			}

			deferred.resolve( true );
		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};
	
	
	/**
	 * Vector3D 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uVector3DLayer {ugmp.layer.uGisVector3DLayer} {@link ugmp.layer.uGisVector3DLayer} 객체.
	 * @param opt_options.useExtent {Boolean} 레이어 추가 후 extent 설정 사용 여부.
	 * 
	 * `true`면 해당 레이어의 영역으로 지도 영역을 맞춘다. Default is `false`.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addVector3DLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uVector3DLayer = ( options.uVector3DLayer !== undefined ) ? options.uVector3DLayer : undefined;
		var useExtent = ( options.useExtent !== undefined ) ? options.useExtent : false;

		var deferred = _$.Deferred();

		try {
			var olVectorLayer = uVector3DLayer.getOlLayer();
			_self.olMap.addLayer( olVectorLayer );
			_self.layers.push( uVector3DLayer );

			if ( useExtent ) {
				var extent = olVectorLayer.getSource().getExtent();

				if ( extent && extent[ 0 ] !== Infinity ) {
					var transExtent = ol.proj.transformExtent( olVectorLayer.getSource().getExtent(), uVector3DLayer.srsName, _self.mapCRS );
					_self.setExtent( transExtent );
				}
			}

			deferred.resolve( true );
		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * Cluster 레이어를 추가한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uClusterLayer {ugmp.layer.uGisClusterLayer} {@link ugmp.layer.uGisClusterLayer} 객체.
	 * 
	 * @return promise {Object} jQuery.Deferred.promise.
	 */
	ugmp.uGisMap.prototype.addClusterLayer = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uClusterLayer = ( options.uClusterLayer !== undefined ) ? options.uClusterLayer : undefined;

		var deferred = _$.Deferred();

		try {
			var olClusterLayer = uClusterLayer.getOlLayer();
			_self.olMap.addLayer( olClusterLayer );
			_self.layers.push( uClusterLayer );

			deferred.resolve( true );
		} catch ( e ) {
			ugmp.uGisConfig.alert_Error( "Error : " + e );
			deferred.reject( false );
			return deferred.promise();
		}

		return deferred.promise();
	};


	/**
	 * 지도 새로고침.
	 */
	ugmp.uGisMap.prototype.refresh = function() {
		var _self = this._this || this;

		if ( _self.olMap ) {
			var view = _self.olMap.getView();
			view.dispatchEvent( {
				type : 'change:center'
			} );

			view.dispatchEvent( {
				type : 'change:rotation'
			} );

			view.dispatchEvent( {
				type : 'change:resolution'
			} );

			_self.olMap.updateSize();
		}
	};


	/**
	 * 현재 {@link ugmp.uGisMap}에 등록된 {@link ugmp.layer}를 삭제한다.
	 * 
	 * @param uGisLayerKey {String} 삭제할 {@link ugmp.layer}의 KEY.
	 */
	ugmp.uGisMap.prototype.removeLayer = function(uGisLayerKey_) {
		var _self = this._this || this;

		for ( var i = 0; i < _self.layers.length; i++ ) {
			var uGisLayer = _self.layers[ i ];

			if ( uGisLayer.getLayerKey() === uGisLayerKey_ ) {
				uGisLayer.destroy();
				_self.olMap.removeLayer( uGisLayer.getOlLayer() );
				_self.layers.splice( i, 1 );
			}
		}
	};


	/**
	 * Temp Scale -> Resolution
	 * 
	 * @param scale {Double} scale
	 * 
	 * @private
	 * 
	 * @return resolution {Double} resolution
	 */
	ugmp.uGisMap.prototype.getResolutionFromScale = function(scale_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return scale_ / ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * Temp Resolution -> Scale
	 * 
	 * @param resolution {Double} resolution
	 * 
	 * @private
	 * 
	 * @return scale {Double} scale
	 */
	ugmp.uGisMap.prototype.getScaleFromResolution = function(resolution_) {
		var projection = _self.olMap.getView().getProjection();
		var metersPerUnit = projection.getMetersPerUnit();
		var inchesPerMeter = 39.37;
		var dpi = 96;
		return resolution_ * ( metersPerUnit * inchesPerMeter * dpi );
	};


	/**
	 * 현재 지도에서 해당 Extent의 스케일을 계산한다.
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.extent {Array.<Number>} 스케일을 계산할 Extent. Default is 현재 지도 영역.
	 * @param opt_options.originCRS {String} 레이어 원본 좌표계. Default is 현재 지도 좌표계.
	 * 
	 * @return scale {Double} 스케일.
	 */
	ugmp.uGisMap.prototype.calculateScale = function(opt_options) {
		var _self = this._this || this;

		var scale = null;
		var extent = null;
		var viewCRS = null;
		var originCRS = null;
		var PPI = 0.000264583;

		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			viewCRS = _self.mapCRS;
			originCRS = ( options.originCRS !== undefined ) ? options.originCRS : _self.getCRS();
			extent = ( options.extent !== undefined ) ? options.extent : _self.olMap.getView().calculateExtent( _self.olMap.getSize() );

			var mapDistance;
			var canvasDistance;

			var eWidth = ol.extent.getWidth( extent );
			var eHeight = ol.extent.getHeight( extent );

			var pixelWidth = _self.olMap.getSize()[ 0 ];
			var pixelHeight = _self.olMap.getSize()[ 1 ];

			var resX = eWidth / pixelWidth;
			var resY = eHeight / pixelHeight;

			if ( resX >= resY ) {
				mapDistance = _getMapWidthInMeter();
				canvasDistance = pixelWidth * PPI;
				scale = mapDistance / canvasDistance;
			} else {
				mapDistance = _getMapHeightInMeter();
				canvasDistance = pixelHeight * PPI;
				scale = mapDistance / canvasDistance;
			}

		} )( opt_options );


		function _getMapWidthInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 2 ], extent[ 1 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getMapHeightInMeter() {
			var p1 = [ extent[ 0 ], extent[ 1 ] ];
			var p2 = [ extent[ 0 ], extent[ 3 ] ];

			return _getDistanceInMeter( p1, p2 );
		}


		function _getDistanceInMeter(p1_, p2_) {
			var latLon1 = _getLatLon( p1_ );
			var latLon2 = _getLatLon( p2_ );

			var dx = latLon2[ 0 ] - latLon1[ 0 ];
			var dy = latLon2[ 1 ] - latLon1[ 1 ];

			return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
		}


		function _getLatLon(p_) {
			var latLon = new Array( 2 );

			if ( viewCRS === null || ( viewCRS === originCRS ) ) {
				latLon[ 0 ] = p_[ 0 ];
				latLon[ 1 ] = p_[ 1 ];

				return latLon;
			}

			try {
				var np = ol.proj.transform( p_, viewCRS, originCRS );

				latLon[ 0 ] = np[ 0 ];
				latLon[ 1 ] = np[ 1 ];

				return latLon;
			} catch ( e ) {

			}
		}

		return scale;
	};


	/**
	 * 현재 지도에서 해당 줌 레벨의 스케일을 계산한다.
	 * 
	 * @param zoom {Integer} 줌 레벨.
	 * 
	 * @return scale {Double} 스케일.
	 */
	ugmp.uGisMap.prototype.getScaleForZoom = function(zoom_) {
		var _self = this._this || this;

		var resolution = _self.olMap.getView().getResolutionForZoom( zoom_ );

		var eWidth = resolution * _self.olMap.getSize()[ 0 ];
		var eHeight = resolution * _self.olMap.getSize()[ 1 ];

		var dummyExtent = [ 0, 0, eWidth, eHeight ];

		return _self.calculateScale( {
			extent : dummyExtent,
			originCRS : _self.getCRS()
		} );
	};


	/**
	 * 현재 지도에 등록된 모든 이벤트리스너를 제거한다.
	 * 
	 * @param type {String} 이벤트 타입
	 */
	ugmp.uGisMap.prototype.removeAllListener = function(type_) {
		var _self = this._this || this;

		var clickListeners = ol.events.getListeners( _self.olMap, type_ );
		for ( var i = clickListeners.length - 1; i >= 0; i-- ) {
			ol.Observable.unByKey( clickListeners[ i ] );
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction을 제거한다. (Default Interaction 제외)
	 */
	ugmp.uGisMap.prototype.removeAllInteraction = function() {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( !( interactions[ i ].get( "necessary" ) ) ) {
				_self.olMap.removeInteraction( interactions[ i ] );
			}
		}
	};


	/**
	 * 현재 지도에 등록된 모든 Interaction 사용 설정. (Default Interaction 포함)
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setActiveAllInteraction = function(state_) {
		var _self = this._this || this;

		var interactions = _self.olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			interactions[ i ].setActive( state_ );
		}
	};


	/**
	 * 마우스 휠줌 스크롤 시 AltKey 조합 설정 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setAltKeyOnly = function(state_) {
		var _self = this._this || this;

		if ( _self.useAltKeyOnly === state_ ) {
			return;
		}
		_self.useAltKeyOnly = state_;
	};


	/**
	 * 로딩 심볼 표시 여부를 설정한다.
	 * 
	 * @param state {Boolean} 사용 설정 값.
	 */
	ugmp.uGisMap.prototype.setLoadingVisible = function(state_) {
		var _self = this._this || this;

		if ( state_ ) {
			_self.loadingSrcDiv.style.display = "block";
		} else {
			_self.loadingSrcDiv.style.display = "none";
		}
	};


	/**
	 * 현재 지도의 View ID를 가져온다. View ID는 고유값이므로 해당 지도의 Key로 사용한다.
	 * 
	 * @return dataViewId {String} View ID.
	 */
	ugmp.uGisMap.prototype.getDataViewId = function() {
		var _self = this._this || this;
		return _self.dataViewId;
	};

} )();

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 팝업 객체.
	 * 
	 * 팝업을 생성하여 원하는 좌표에 나타낼 수 있으며, 끄고 켤 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugPopup = new ugmp.uGisPopup( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	position : [ 14679631.555732759, 4472532.067911336 ],
	 *	content : 'content',
	 *	show : true,
	 *	closeCallBack : function() {
	 *		alert( 'Popup Close !' );
	 *	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.closeCallBack {Function} 팝업 close 시 콜백 함수.
	 * 
	 * @class
	 */
	ugmp.uGisPopup = ( function(opt_options) {
		var _self = this;

		this.uGisMap = null;
		this.closeCallBack = null;

		this.content = null;
		this.removed = null;
		this.container = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			var html = ( options.content !== undefined ) ? options.content : "";
			var position = ( options.position !== undefined ) ? options.position : undefined;
			var show = ( typeof ( options.show ) === "boolean" ) ? options.show : false;
			_self.removed = false;
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.closeCallBack = ( typeof options.closeCallBack === "function" ) ? options.closeCallBack : undefined;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_self._init( position, html, show );

		} )( opt_options );
		// END initialize


		return {
			_this : _self,
			hide : _self.hide,
			show : _self.show,
			remove : _self.remove,
			setContent : _self.setContent,
			setPosition : _self.setPosition
		}

	} );


	ugmp.uGisPopup.prototype = Object.create( ol.Overlay.prototype );
	ugmp.uGisPopup.prototype.constructor = ugmp.uGisPopup;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.uGisPopup.prototype._init = function(position_, html_, show_) {
		var _self = this._this || this;

		var header = document.createElement( "div" );
		header.className = "ol-popup-header";

		var closer = document.createElement( "a" );
		closer.className = "ol-popup-closer";
		closer.href = "#";
		closer.addEventListener( "click", function(evt) {
			_self.container.style.display = "none";
			closer.blur();
			if ( _self.closeCallBack ) {
				_self.closeCallBack();
			}
			evt.preventDefault();
		}, false );
		header.appendChild( closer );

		_self.container = document.createElement( "div" );
		_self.container.className = "ol-popup";

		_self.container.style.transitionDuration = "0.5s";

		_self.container.addEventListener( "mouseover", function(event) {
			this.style.zIndex = 1;
		}, false );

		_self.container.addEventListener( "mouseout", function(event) {
			this.style.zIndex = "";
		}, false );


		_self.container.appendChild( header );

		_self.content = document.createElement( "div" );
		_self.content.className = "ol-popup-content";

		_self.container.appendChild( _self.content );

		ol.Overlay.call( _self, {
			insertFirst : false,
			element : _self.container,
			stopEvent : true
		} );

		_self.setContent( html_ );
		_self.setPosition( position_ );
		_self.uGisMap.getMap().addOverlay( _self );

		if ( show_ ) {
			_self._panIntoCenter();
		} else {
			_self.container.style.display = "none";
		}
	};


	/**
	 * 팝업의 위치를 지도 중앙에 표시한다.
	 * 
	 * @private
	 */
	ugmp.uGisPopup.prototype._panIntoCenter = function() {
		var _self = this._this || this;

		var olMap = _self.uGisMap.getMap();

		olMap.getView().animate( {
			center : _self.getPosition(),
			duration : 500
		} );
	};


	/**
	 * 팝업의 위치를 지도 뷰 화면에 표시한다.
	 * 
	 * @private
	 */
	ugmp.uGisPopup.prototype._panIntoView = function() {
		var _self = this._this || this;

		if ( !_self.getPosition() ) {
			return false;
		}

		var olMap = _self.uGisMap.getMap();
		var mapSize = olMap.getSize();
		var popSize = {
			width : _self.getElement().clientWidth + 20,
			height : _self.getElement().clientHeight + 20
		};

		var tailHeight = 20;
		var tailOffsetLeft = 60;
		var tailOffsetRight = popSize.width - tailOffsetLeft;
		var popOffset = _self.getOffset();
		var popPx = olMap.getPixelFromCoordinate( _self.getPosition() );

		var fromLeft = ( popPx[ 0 ] - tailOffsetLeft );
		var fromRight = mapSize[ 0 ] - ( popPx[ 0 ] + tailOffsetRight );

		var fromTop = popPx[ 1 ] - popSize.height + popOffset[ 1 ];
		var fromBottom = mapSize[ 1 ] - ( popPx[ 1 ] + tailHeight ) - popOffset[ 1 ];

		var center = olMap.getView().getCenter();
		var px = olMap.getPixelFromCoordinate( center );

		if ( fromRight < 0 ) {
			px[ 0 ] -= fromRight;
		} else if ( fromLeft < 0 ) {
			px[ 0 ] += fromLeft;
		}

		if ( fromTop < 0 ) {
			// px[1] = 170 + fromTop;
			px[ 1 ] += fromTop; // original
		} else if ( fromBottom < 0 ) {
			px[ 1 ] -= fromBottom;
		}

		olMap.getView().animate( {
			center : olMap.getCoordinateFromPixel( px ),
			duration : 500
		} );
	};


	/**
	 * 팝업을 표시한다.
	 * 
	 * @param panIntoCenter {Boolean} 지도 가운데 영역에 표시할지 사용 여부.
	 * 
	 * `true`면 팝업을 지도 가운데 영역에 표시한다.
	 */
	ugmp.uGisPopup.prototype.show = function(panIntoCenter_) {
		var _self = this._this || this;

		if ( _self.removed ) {
			return false;
		}
		_self.container.style.display = "block";

		var content = _self.content;

		window.setTimeout( function() {
			content.scrollTop = 0;
		}, 100 );

		if ( panIntoCenter_ ) {
			_self._panIntoCenter();
		} else {
			_self._panIntoView();
		}
	};


	/**
	 * 팝업을 숨긴다.
	 */
	ugmp.uGisPopup.prototype.hide = function() {
		var _self = this._this || this;

		if ( _self.removed ) {
			return false;
		}
		_self.container.style.display = "none";
		if ( _self.closeCallBack ) {
			_self.closeCallBack();
		}
	};


	/**
	 * 팝업 내용을 설정한다.
	 * 
	 * @param html {String} html 형태의 텍스트.
	 */
	ugmp.uGisPopup.prototype.setContent = function(html_) {
		var _self = this._this || this;

		if ( typeof html_ === "string" ) {
			_self.content.innerHTML = html_;
		}
	};


	/**
	 * 팝업의 위치를 설정한다.
	 * 
	 * @Extends {ol.Overlay.prototype.setPosition}
	 * 
	 * @param coordinate {ol.Coordinate} 팝업을 표시할 좌표.
	 * @param move {Boolean} 변경된 위치로 View 화면 이동 여부.
	 */
	ugmp.uGisPopup.prototype.setPosition = function(coordinate_, move_) {
		var _self = this._this || this;

		_self.set( "origin", {
			position : coordinate_,
			projection : _self.uGisMap.getCRS()
		} );

		ol.Overlay.prototype.setPosition.call( _self, coordinate_ );
		
		if ( move_ ) {
			_self.show( true );
		}
	};


	/**
	 * 팝업을 삭제한다.
	 */
	ugmp.uGisPopup.prototype.remove = function() {
		var _self = this._this || this;

		_self.hide();
		_self.removed = true;
		_self.uGisMap.getMap().removeOverlay( _self );
	};

} )();

/**
 * @namespace ugmp.etc
 */

( function() {
	"use strict";

	/**
	 * 지도 이동 기록 정보 객체 (NavigationHistory).
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugNavigationHistory = new ugmp.etc.uGisNavigationHistory( {
	 * 	uGisMap : ugMap,
	 * 	hasNext : function(state_) {
	 * 		console.log( state_ );
	 * 	},
	 * 	hasPrevious : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.hasNext {Function} 다음 영역 존재 여부 CallBack.
	 * @param opt_options.hasPrevious {Function} 이전 영역 존재 여부 CallBack.
	 * 
	 * @class
	 */
	ugmp.etc.uGisNavigationHistory = ( function(opt_options) {
		var _self = this;

		this.ugMap = null;
		this.hasNext = null;
		this.hasPrevious = null;

		this.state = null;
		this.current = null;
		this.nextStack = null;
		this.previousStack = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.state = true;
			_self.current = [];
			_self.nextStack = [];
			_self.previousStack = [];

			_self.ugMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.hasNext = ( typeof options.hasNext === "function" ) ? options.hasNext : undefined;
			_self.hasPrevious = ( typeof options.hasPrevious === "function" ) ? options.hasPrevious : undefined;


			if ( !_self.ugMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_self._init();

		} )();
		// END initialize

		return {
			_this : _self,
			clear : _self.clear,
			moveNext : _self.moveNext,
			movePrevious : _self.movePrevious
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.etc.uGisNavigationHistory.prototype._init = ( function() {
		var _self = this._this || this;

		var olMap = _self.ugMap.getMap();

		olMap.on( "change:view", function() {
			window.setTimeout( function() {
				_self.clear();
			}, 100 );
		} );

		olMap.on( "moveend", function(evt) {
			if ( _self.state ) {
				_self.nextStack = [];
				_self.previousStack.push( {
					zoom : evt.target.getView().getZoom(),
					center : evt.target.getView().getCenter()
				} );
				_self._historyCheckListener();
			}
		} );

		olMap.dispatchEvent( {
			type : "moveend"
		} );
	} );


	/**
	 * 이전 영역으로 이동.
	 */
	ugmp.etc.uGisNavigationHistory.prototype.movePrevious = ( function() {
		var _self = this._this || this;

		if ( _self.previousStack.length > 1 ) {
			var current = _self.previousStack.pop();
			var state = _self.previousStack.pop();
			_self.nextStack.push( current );
			_self.previousStack.push( state );
			_self._changeMapArea( state );
		}
	} );


	/**
	 * 다음 영역으로 이동.
	 */
	ugmp.etc.uGisNavigationHistory.prototype.moveNext = ( function() {
		var _self = this._this || this;

		if ( _self.nextStack.length > 0 ) {
			var state = _self.nextStack.pop();
			_self.previousStack.push( state );
			_self._changeMapArea( state );
		}
	} );


	/**
	 * 이전/이후 영역으로 이동한다.
	 * 
	 * @private
	 * 
	 * @param stack {Object} 이전/이후 영역 데이터.
	 */
	ugmp.etc.uGisNavigationHistory.prototype._changeMapArea = ( function(stack_) {
		var _self = this._this || this;

		var olMap = _self.ugMap.getMap();

		_self.state = false;
		olMap.getView().setZoom( stack_.zoom );
		olMap.getView().setCenter( stack_.center );

		_self._historyCheckListener();

		window.setTimeout( function() {
			_self.state = true;
		}, 500 );
	} );


	/**
	 * 이전/이후 영역 존재 여부를 체크하고 설정된 함수를 트리거한다.
	 * 
	 * @private
	 */
	ugmp.etc.uGisNavigationHistory.prototype._historyCheckListener = ( function() {
		var _self = this._this || this;

		if ( _self.hasNext ) {
			if ( _self.nextStack.length > 0 ) {
				_self.hasNext.call( this, true );
			} else {
				_self.hasNext.call( this, false );
			}
		}

		if ( _self.hasPrevious ) {
			if ( _self.previousStack.length > 1 ) {
				_self.hasPrevious.call( this, true );
			} else {
				_self.hasPrevious.call( this, false );
			}
		}
	} );


	/**
	 * 내용을 초기화 한다.
	 */
	ugmp.etc.uGisNavigationHistory.prototype.clear = ( function() {
		var _self = this._this || this;

		_self.state = true;
		_self.nextStack = [];
		_self.previousStack = [];

		_self.ugMap.getMap().dispatchEvent( {
			type : "moveend"
		} );
	} );

} )();

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
( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지형 공간 유틸리티.
	 * 
	 * 지형 공간 정보 처리에 필요한 유틸리티 객체.
	 * 
	 * @namespace
	 */
	ugmp.util.uGisGeoSpatialUtil = ( function() {

		return {
			toRadians : this.toRadians,
			toDegrees : this.toDegrees,
			getGeomCenter : this.getGeomCenter,
			getLargestPolygon : this.getLargestPolygon,
			getLargestLineString : this.getLargestLineString,
			lineToArcTransForm : this.lineToArcTransForm,
			getRadianBtwPoints : this.getRadianBtwPoints,
			getDegreeBtwPoints : this.getDegreeBtwPoints,
			getDistanceBtwPotins : this.getDistanceBtwPotins
		}

	} );


	/**
	 * Radian을 Degree로 변환한다.
	 * 
	 * @param degree {Number} Degree(도).
	 * 
	 * @return {Number} Radian(라디안).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.toRadians = function(degree_) {
		return degree_ / 180.0 * Math.PI;
	};


	/**
	 * Degree를 Radian으로 변환한다.
	 * 
	 * @param radian {Number} Radian(라디안).
	 * 
	 * @return {Number} Degree(도).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.toDegrees = function(radian_) {
		return radian_ * 180.0 / Math.PI;
	};


	/**
	 * 두 점 사이의 Radian(라디안)을 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Radian(라디안).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getRadianBtwPoints = function(coordinate1, coordinate2) {
		var pX1 = coordinate1[ 0 ];
		var pY1 = coordinate1[ 1 ];
		var pX2 = coordinate2[ 0 ];
		var pY2 = coordinate2[ 1 ];

		return Math.atan2( pY2 - pY1, pX2 - pX1 );
	};


	/**
	 * 두 점 사이의 Degree(도)를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Degree(도).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getDegreeBtwPoints = function(coordinate1, coordinate2) {
		var radian = this.getRadianBtwPoints( coordinate1, coordinate2 );

		return this.toDegrees( radian );
	};


	/**
	 * 두 점 사이의 거리를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 거리.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getDistanceBtwPotins = function(c1, c2) {
		return Math.sqrt( Math.pow( ( c1[ 0 ] - c2[ 0 ] ), 2 ) + Math.pow( ( c1[ 1 ] - c2[ 1 ] ), 2 ) );
	};


	/**
	 * 일반 라인을 호 형태의 라인으로 변환한다.
	 * 
	 * -featureList는 피처의 속성이 `ol.geom.LineString`또는 `ol.geom.MultiLineString`이다.
	 * 
	 * @param originCRS {String} 피처 원본 좌표계.
	 * @param featureList {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 변활할 피처 리스트.
	 * 
	 * @return reData {Array.<ol.Feature.<ol.geom.LineString>>} 변환된 호 형태의 피처 리스트.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.lineToArcTransForm = function(originCRS_, featureList_) {
		var _self = this;
		var reData = [];
		var transFormFeatures = [];

		( function() {
			var features = featureList_.slice();

			for ( var i = 0; i < features.length; i++ ) {
				var geom = features[ i ].getGeometry();

				if ( !geom ) {
					continue;
				}

				if ( geom instanceof ol.geom.LineString ) {
					transFormFeatures.push( new ol.Feature( {
						geometry : geom
					} ) );
				} else if ( geom instanceof ol.geom.MultiLineString ) {
					var lineStrings = geom.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						transFormFeatures.push( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				}
			}

			_transFormArc();

		} )();


		function _transFormArc() {
			for ( var j = 0; j < transFormFeatures.length; j++ ) {
				var customCoordinates = [];
				var coords = transFormFeatures[ j ].getGeometry().getCoordinates();

				for ( var i = 0; i < coords.length - 1; i++ ) {
					var from = coords[ i ];
					var to = coords[ i + 1 ];
					var dist = _self.getDistanceBtwPotins( from, to );
					var midPoint = _draw_curve( from, to, ( dist / 5 ) );

					var line = {
						type : "Feature",
						properties : {},
						geometry : {
							type : "LineString",
							coordinates : [ from, midPoint, to ]
						}
					};

					var curved = turf.bezier( line, 3000, 1.5 );
					customCoordinates = customCoordinates.concat( curved[ "geometry" ][ "coordinates" ] );
				}

				var newFeature = new ol.Feature( {
					geometry : new ol.geom.LineString( customCoordinates )
				} );

				reData.push( newFeature );
			}
		}


		function _draw_curve(from_, to_, dist_) {
			// Find midpoint J
			var Ax = from_[ 0 ];
			var Ay = from_[ 1 ];
			var Bx = to_[ 0 ];
			var By = to_[ 1 ];

			var Jx = Ax + ( Bx - Ax ) / 5 * 3;
			var Jy = Ay + ( By - Ay ) / 5 * 3;

			var a = Bx - Ax;
			var b = By - Ay;
			var asign = ( a < 0 ? -1 : 1 );
			var bsign = ( b < 0 ? -1 : 1 );
			var theta = Math.atan( b / a );

			// Find the point that's perpendicular to J on side
			var costheta = asign * Math.cos( theta );
			var sintheta = asign * Math.sin( theta );

			// Find c and d
			var c = dist_ * sintheta;
			var d = dist_ * costheta;

			// Use c and d to find Kx and Ky
			var Kx = Jx - c;
			var Ky = Jy + d;

			return [ Kx, Ky ];
		}

		return reData;
	};


	/**
	 * MultiLineString의 가장 큰 LineString을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiLineString} MultiLineString.
	 * 
	 * @return {LineString} 가장 큰 LineString.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getLargestLineString = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_LINE_STRING ) return false;

		return geom_.getLineStrings().reduce( function(left, right) {
			return left.getLength() > right.getLength() ? left : right;
		} );
	};


	/**
	 * MultiPolygon의 가장 큰 Polygon을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiPolygon} MultiPolygon.
	 * 
	 * @return {Polygon} 가장 큰 Polygon.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getLargestPolygon = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_POLYGON ) return false;

		return geom_.getPolygons().reduce( function(left, right) {
			return left.getArea() > right.getArea() ? left : right;
		} );
	};


	/**
	 * Geometry의 중심점을 가져온다.
	 * 
	 * @param geom {ol.geom.Geometry} Geometry.
	 * 
	 * @return {Array.<Number>} 중심점[x, y].
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getGeomCenter = function(geom_) {
		if ( !geom_ || !geom_ instanceof ol.geom.Geometry ) return false;

		var coordinate = [];
		var geometry = geom_;
		var geometryType = geometry.getType();

		switch ( geometryType ) {
			case ol.geom.GeometryType.POINT :
			case ol.geom.GeometryType.MULTI_POINT :
				coordinate = geometry.getFlatCoordinates();
				break;

			case ol.geom.GeometryType.CIRCLE :
				coordinate = geometry.getCenter();

				break;
			case ol.geom.GeometryType.LINE_STRING :
				coordinate = geometry.getFlatMidpoint();
				break;

			case ol.geom.GeometryType.MULTI_LINE_STRING :
				coordinate = this.getLargestLineString( geometry ).getFlatMidpoint();
				break;

			case ol.geom.GeometryType.POLYGON :
				coordinate = geometry.getFlatInteriorPoint();
				break;

			case ol.geom.GeometryType.MULTI_POLYGON :
				// coordinate = this.getLargestPolygon( geometry ).getInteriorPoint().getCoordinates();
				coordinate = this.getLargestPolygon( geometry ).getFlatInteriorPoint();
				break;
		}

		return coordinate;
	};


	ugmp.util.uGisGeoSpatialUtil = new ugmp.util.uGisGeoSpatialUtil();

} )();

/**
 * @namespace ugmp.util
 */

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 유틸리티.
	 * 
	 * uGisMapPlatForm에서 자주 사용하는 유틸리티 객체.
	 * 
	 * @namespace
	 */
	ugmp.util.uGisUtil = ( function() {

		return {
			isXMLDoc : this.isXMLDoc,
			xmlToJson : this.xmlToJson,
			objectMerge : this.objectMerge,
			cloneStyle : this.cloneStyle,
			cloneFeature : this.cloneFeature,
			cloneFeatures : this.cloneFeatures,
			cloneGeometry : this.cloneGeometry,
			generateUUID : this.generateUUID,
			appendParams : this.appendParams,
			setCssTextStyle : this.setCssTextStyle,
			numberWithCommas : this.numberWithCommas
		}

	} );


	/**
	 * 숫자 1000단위 콤마 표시.
	 * 
	 * @param num {Number|String} 숫자.
	 * 
	 * @return {String} 1000단위 (세 자리마다 콤마 표시).
	 */
	ugmp.util.uGisUtil.prototype.numberWithCommas = function(num_) {
		if ( !num_ ) return 0;
		var parts = num_.toString().split( "." );
		return parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," ) + ( parts[ 1 ] ? "." + parts[ 1 ] : "" );
	};


	/**
	 * XML을 JSON으로 변환한다.
	 * 
	 * @param xml {Document} XML.
	 * 
	 * @return obj {Object} JSON.
	 */
	ugmp.util.uGisUtil.prototype.xmlToJson = function(xml_) {

		// Create the return object
		var obj = {};

		if ( xml_.nodeType == 1 ) { // element
			// do attributes
			if ( xml_.attributes.length > 0 ) {
				obj[ "@attributes" ] = {};
				for ( var j = 0; j < xml_.attributes.length; j++ ) {
					var attribute = xml_.attributes.item( j );
					obj[ "@attributes" ][ attribute.nodeName ] = attribute.nodeValue;
				}
			}
		} else if ( xml_.nodeType == 3 ) { // text
			obj = xml_.nodeValue;
		}

		// do children
		if ( xml_.hasChildNodes() ) {
			for ( var i = 0; i < xml_.childNodes.length; i++ ) {
				var item = xml_.childNodes.item( i );
				var nodeName = item.nodeName;
				if ( typeof ( obj[ nodeName ] ) == "undefined" ) {
					obj[ nodeName ] = this.xmlToJson( item );
				} else {
					if ( typeof ( obj[ nodeName ].push ) == "undefined" ) {
						var old = obj[ nodeName ];
						obj[ nodeName ] = [];
						obj[ nodeName ].push( old );
					}
					obj[ nodeName ].push( this.xmlToJson( item ) );
				}
			}
		}

		return obj;
	};


	/**
	 * 객체가 Document인지 체크한다.
	 * 
	 * @param a {Object} 체크할 객체.
	 * 
	 * @return b {Boolean} 해당 객체가 Document면 `true` 아니면 `false`.
	 */
	ugmp.util.uGisUtil.prototype.isXMLDoc = function(a) {
		var b = a && ( a.ownerDocument || a ).documentElement;
		return !!b && "HTML" !== b.nodeName;
	};


	/**
	 * JSON 파라미터를 URI에 GET 방식으로 붙인다.
	 * 
	 * @param uri {String} URI.
	 * @param params {Object} 추가할 JSON 파라미터 객체.
	 * 
	 * @return uri {String} JSON 파라미터가 추가된 URI.
	 */
	ugmp.util.uGisUtil.prototype.appendParams = function(uri_, params_) {
		var keyParams = [];
		Object.keys( params_ ).forEach( function(k) {
			if ( params_[ k ] !== null && params_[ k ] !== undefined ) {
				keyParams.push( k + "=" + encodeURIComponent( params_[ k ] ) );
			}
		} );
		var qs = keyParams.join( "&" );
		uri_ = uri_.replace( /[?&]$/, "" );
		uri_ = uri_.indexOf( "?" ) === -1 ? uri_ + "?" : uri_ + "&";

		return uri_ + qs;
	};


	/**
	 * UUID 생성를 생성한다.
	 * 
	 * @return uuid {String} UUID.
	 */
	ugmp.util.uGisUtil.prototype.generateUUID = function() {
		var d = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function(c) {
			var r = ( d + Math.random() * 16 ) % 16 | 0;
			d = Math.floor( d / 16 );
			return ( c == "x" ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );
		} );

		return uuid;
	};


	/**
	 * 두 객체를 병합한다. 중복된 Key의 데이터일 경우 덮어쓴다.
	 * 
	 * @return object {Object} 병합된 Object.
	 */
	ugmp.util.uGisUtil.prototype.objectMerge = function() {
		var options, name, src, copy, copyIsArray, clone, target = arguments[ 0 ] || {}, i = 1, length = arguments.length, deep = false;

		if ( typeof target === "boolean" ) {
			deep = target;

			target = arguments[ i ] || {};
			i++;
		}

		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}

		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			if ( ( options = arguments[ i ] ) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					if ( target === copy ) {
						continue;
					}

					if ( deep && copy && ( jQuery.isPlainObject( copy ) || ( copyIsArray = Array.isArray( copy ) ) ) ) {

						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && Array.isArray( src ) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}

						target[ name ] = jQuery.extend( deep, clone, copy );

					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		return target;
	};


	/**
	 * DOM Element 스타일 추가/업데이트 한다.
	 * 
	 * @param el {Element} 대상 Element.
	 * @param style {String} 적용할 스타일명.
	 * @param value {String} 스타일 속성.
	 */
	ugmp.util.uGisUtil.prototype.setCssTextStyle = function(el, style, value) {
		var result = el.style.cssText.match( new RegExp( "(?:[;\\s]|^)(" + style.replace( "-", "\\-" ) + "\\s*:(.*?)(;|$))" ) ), idx;
		if ( result ) {
			idx = result.index + result[ 0 ].indexOf( result[ 1 ] );
			el.style.cssText = el.style.cssText.substring( 0, idx ) + style + ": " + value + ";" + el.style.cssText.substring( idx + result[ 1 ].length );
		} else {
			el.style.cssText += " " + style + ": " + value + ";";
		}
	};


	/**
	 * geometry 객체를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param geometry {ol.geom} 복사할 geometry 객체.
	 * 
	 * @return {ol.geom} 복사한 geometry 객체.
	 */
	ugmp.util.uGisUtil.prototype.cloneGeometry = function(geometry_) {
		return ol.geom[ geometry_.getType() ].prototype.clone.call( geometry_ );
	};


	/**
	 * 피처를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {ol.Feature} 복사할 피처 객체.
	 * 
	 * @return cloneFt {ol.Feature} 복사한 피처.
	 */
	ugmp.util.uGisUtil.prototype.cloneFeature = function(feature_) {
		var cloneFt = new ol.Feature( feature_.getProperties() );
		cloneFt.setGeometryName( feature_.getGeometryName() );

		var geometry = feature_.getGeometry();
		if ( geometry ) {
			cloneFt.setGeometry( this.cloneGeometry( geometry ) );
		}
		var style = feature_.getStyle();
		if ( style ) {
			cloneFt.setStyle( style );
		}
		return cloneFt;
	};


	/**
	 * 피처리스트를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {Array.<ol.Feature>} 복사할 피처리스트 객체.
	 * 
	 * @return array {Array.<ol.Feature>} 복사한 피처리스트.
	 */
	ugmp.util.uGisUtil.prototype.cloneFeatures = function(features_) {
		if ( !Array.isArray( features_ ) ) return false;

		var array = [];
		for ( var i in features_ ) {
			array.push( this.cloneFeature( features_[ i ] ) );
		}

		return array;
	};


	/**
	 * 스타일을 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param style {ol.style.Style} 복사할 스타일 객체.
	 * 
	 * @return style {ol.style.Style} 복사한 스타일.
	 */
	ugmp.util.uGisUtil.prototype.cloneStyle = function(style_) {
		var geometry = style_.getGeometry();

		if ( geometry && geometry.clone ) {
			geometry = this.cloneGeometry( geometry )
		}

		return new ol.style.Style( {
			geometry : geometry,
			fill : style_.getFill() ? style_.getFill().clone() : undefined,
			image : style_.getImage() ? style_.getImage().clone() : undefined,
			stroke : style_.getStroke() ? style_.getStroke().clone() : undefined,
			text : style_.getText() ? style_.getText().clone() : undefined,
			zIndex : style_.getZIndex()
		} );
	};


	ugmp.util.uGisUtil = new ugmp.util.uGisUtil();

} )();

( function() {
	"use strict";

	/**
	 * WFS DWithin filter
	 * 
	 * Initialize
	 * 
	 * @return ol.format.filter.DWithin
	 */
	ol.format.filter.dwithin = ( function(geometryName, geometry, opt_srsName, distance, opt_units) {
		var _self = this;


		/**
		 * Initialize
		 */
		( function() {

			ol.format.filter.DWithin = _DWithin;

			ol.inherits( ol.format.filter.DWithin, ol.format.filter.Spatial );

			ol.format.WFS.GETFEATURE_SERIALIZERS_[ "http://www.opengis.net/ogc" ][ "DWithin" ] = ol.xml.makeChildAppender( _writeWithinFilter );

		} )();
		// END initialize


		function _DWithin(geometryName, geometry, opt_srsName, distance, opt_units) {
			ol.format.filter.Spatial.call( this, "DWithin", geometryName, geometry, opt_srsName );

			this.distance = distance;
			this.units = opt_units || "m"; // http://www.opengeospatial.org/se/units/metre
		}


		function _writeWithinFilter(node, filter, objectStack) {
			var context = objectStack[ objectStack.length - 1 ];
			context[ "srsName" ] = filter.srsName;

			ol.format.WFS.writeOgcPropertyName_( node, filter.geometryName );
			ol.format.GML3.prototype.writeGeometryElement( node, filter.geometry, objectStack );

			var distanceNode = ol.xml.createElementNS( "http://www.opengis.net/ogc", "Distance" );
			distanceNode.setAttribute( "units", filter.units );
			ol.format.XSD.writeStringTextNode( distanceNode, filter.distance + "" );
			node.appendChild( distanceNode );
		}

		
		return new ol.format.filter.DWithin( geometryName, geometry, opt_srsName, distance, opt_units );
	} );

} )();

( function() {
	"use strict";

	/**
	 * WFS DescribeFeatureType 객체.
	 * 
	 * OGC 표준의 WFS DescribeFeatureType 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDescribeFeatureType = new ugmp.service.uGisDescribeFeatureType( {
	 * 	useProxy : true,
	 * 	version : '1.1.0',
	 * 	serviceURL : 'url',
	 * 	dataViewId : ugMap.getDataViewId(),
	 * 	typeName : 'LAYER_NAME'
	 * } );
	 * 
	 * ugDescribeFeatureType.then( function(res_) {
	 * 	if ( res_.state ) {
	 * 		console.log( res_.data );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전. Default is `1.1.0`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL. Default is `""`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	ugmp.service.uGisDescribeFeatureType = ( function(opt_options) {
		var _self = this;

		this.version = null;
		this.useProxy = null;
		this.typeName = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.0";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : "";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._callAjax();

		} )();
		// END Initialize


		return _self.promise;

	} );


	/**
	 * DescribeFeatureType OGC 표준 속성.
	 * 
	 * @private
	 * 
	 * @retrun attribute {Object}
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._getAttribute = function() {
		var attribute = {
			SERVICE : "WFS",
			VERSION : this.version,
			REQUEST : "DescribeFeatureType",
			TYPENAME : this.typeName
		};

		return attribute;
	};


	/**
	 * DescribeFeatureType 요청.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._callAjax = function() {
		var _self = this;

		_self.promise = _$.Deferred();

		var url = ugmp.util.uGisUtil.appendParams( _self.serviceURL, _self._getAttribute() );

		if ( _self.useProxy ) {
			url = ugmp.uGisConfig.getProxy() + url;
		}

		var response = new ugmp.uGisHttp.requestData( {
			url : url,
			type : "GET",
			loading : true,
			contentType : "",
			dataType : "XML",
			dataViewId : _self.dataViewId,
		} );

		response.then( function(response_) {
			// -To do : response가 text일 경우 처리.
			var resolveData = {
				state : false,
				message : undefined,
				data : {
					xmlJson : undefined,
					document : response_,
					serviceMetaData : undefined
				}
			};

			try {
				var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ServiceExceptionReport : \n" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					resolveData.state = false;
					resolveData.message = "ExceptionReport : \n" + message;
				} else {
					resolveData.state = true;
					resolveData.data.xmlJson = xmlJson;
					resolveData.data.serviceMetaData = _self._getServiceMetaData( xmlJson );
				}

				_self.promise.resolveData = resolveData;
				_self.promise.resolve( resolveData );

			} catch ( e ) {
				_self.promise.reject( e );
			}

		}, function(result_) {
			_self.promise.reject( result_ );
		} );
	};


	/**
	 * DescribeFeatureType 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} 메타데이터
	 */
	ugmp.service.uGisDescribeFeatureType.prototype._getServiceMetaData = function(xmlJson_) {
		var _self = this;

		var json = xmlJson_;

		var sequence = {};
		var findGeomType = false;
		var geometryName = "the_geom";
		var tempSequence = json[ "xsd:schema" ][ "xsd:complexType" ][ "xsd:complexContent" ][ "xsd:extension" ][ "xsd:sequence" ][ "xsd:element" ];

		for ( var i in tempSequence ) {
			var name = tempSequence[ i ][ "@attributes" ][ "name" ];
			var type = tempSequence[ i ][ "@attributes" ][ "type" ];

			if ( !findGeomType ) {
				if ( type.split( ":" )[ 0 ] === "gml" ) {
					findGeomType = true;
					geometryName = name;
					continue;
				}
			}

			sequence[ name ] = type.split( ":" )[ 1 ];
		}

		return {
			sequence : sequence,
			geometryName : geometryName
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS getFeature 서비스 객체.
	 * 
	 * OGC 표준의 WFS getFeature 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugFeatures = new ugmp.service.uGisGetFeature( {
	 * 	useProxy : true,
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 100,
	 * 	typeName : 'world_country',
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	filter : new ol.format.filter.like( 'NAME', 'South*' )
	 * } );
	 * 
	 * ugFeatures.then( function(res) {
	 * 	console.log( res.features );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.filter {ol.format.filter.Filter} 필터. Default is `undefined`.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL. Default is `""`.
	 * @param opt_options.typeName {String} 레이어명. Default is `""`.
	 * @param opt_options.maxFeatures {Boolean} 피쳐 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.outputFormat {String} outputFormat. Default is `text/xml; subtype=gml/3.1.1`.
	 * @param opt_options.dataViewId {String} View ID. Default is `""`.
	 * 
	 * @return {jQuery.Deferred} jQuery.Deferred.
	 * 
	 * @class
	 */
	ugmp.service.uGisGetFeature = ( function(opt_options) {
		var _self = this;

		this.filter = null;
		this.srsName = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.typeName = null;
		this.maxFeatures = null;
		this.outputFormat = null;
		this.dataViewId = null;

		this.deferred = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};
			_self.deferred = _$.Deferred();

			_self.filter = ( options.filter !== undefined ) ? options.filter : undefined;
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.typeName = ( options.typeName !== undefined ) ? options.typeName : [];
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;
			_self.outputFormat = ( options.outputFormat !== undefined ) ? options.outputFormat : "text/xml; subtype=gml/3.1.1";
			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

			var featureRequest = new ol.format.WFS().writeGetFeature( {
				filter : _self.filter,
				// featureNS : "",
				srsName : _self.srsName,
				featureTypes : [ _self.typeName ],
				maxFeatures : _self.maxFeatures,
				outputFormat : _self.outputFormat
			} );

			var url = _self.serviceURL;

			if ( _self.useProxy ) {
				url = ugmp.uGisConfig.getProxy() + url;
			}

			var response = new ugmp.uGisHttp.requestData( {
				url : url,
				dataType : "",
				type : "POST",
				contentType : "text/xml",
				dataViewId : _self.dataViewId,
				data : new XMLSerializer().serializeToString( featureRequest )
			} );

			response.then(
					function(response_) {
						// -To do : response가 text일 경우 처리.
						var data = {
							state : false,
							message : null,
							features : null,
							typeName : _self.typeName
						};

						try {
							if ( ugmp.util.uGisUtil.isXMLDoc( response_ ) ) {
								var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );
								if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
									var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
									data.state = false;
									data.message = "ServiceExceptionReport : " + "<br>" + message;
								} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport"
										|| response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
									var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
									data.state = false;
									data.message = "ExceptionReport : " + "<br>" + message;
								} else {
									data.state = true;
									data.features = new ol.format.WFS().readFeatures( response_ );
								}
							} else {
								data.state = true;
								data.features = new ol.format.GeoJSON().readFeatures( response_ );
							}

							_self.deferred.resolve( data );

						} catch ( e ) {
							_self.deferred.reject( e );
						}
					} ).fail( function(result_) {
				_self.deferred.reject( result_ );
			} );

		} )();
		// END initialize


		return _self.deferred.promise();

	} );

} )();

/**
 * @namespace ugmp.service
 */

( function() {
	"use strict";

	/**
	 * GetCapabilities 서비스 기본 객체.
	 * 
	 * OGC 표준의 GetCapabilities 서비스를 요청하는 객체로 도메인이 다를 경우 프록시로 요청하여야 한다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.service {String} 서비스 타입 (WMS, WFS, WFS, WCS, WMTS). Default is `WMS`.
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesDefault = ( function(opt_options) {
		var _self = this;

		this.service = null;
		this.version = null;
		this.useProxy = null;
		this.serviceURL = null;
		this.dataViewId = null;

		this.request = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.request = "GetCapabilities";
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : true;
			_self.service = ( typeof ( options.service ) === "string" ) ? options.service : "WMS";
			_self.serviceURL = ( typeof ( options.serviceURL ) === "string" ) ? options.serviceURL : "";

			_self._setVersion( options.version );

			_self.dataViewId = ( options.dataViewId !== undefined ) ? options.dataViewId : "";

		} )();
		// END Initialize


		return {
			getAttribute : _self.getAttribute
		}

	} );


	/**
	 * 타입별 버전 설정.
	 * 
	 * @private
	 * 
	 * @param version {String} 서비스 버전
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype._setVersion = function(version_) {
		var _self = this._this || this;

		if ( version_ ) {
			_self.version = version_;
		} else {
			switch ( _self.service ) {
				case "WMS" :
					_self.version = "1.3.0";
					break;
				case "WFS" :
					_self.version = "1.1.0";
					break;
				case "WCS" :
					_self.version = "1.1.1";
					break;
				case "WMTS" :
					_self.version = "1.0.0";
					break;
				default :
					_self.version = "1.3.0";
			}
		}
	};


	/**
	 * Capabilities OGC 표준 속성을 가져온다.
	 * 
	 * @retrun attribute {Object} OGC 표준 속성.
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype.getAttribute = function() {
		var _self = this._this || this;

		var attribute = {
			SERVICE : _self.service,
			VERSION : _self.version,
			REQUEST : _self.request
		};

		return attribute;
	};


	/**
	 * 해당 서비스 getCapabilities를 요청한다.
	 * 
	 * @private
	 * 
	 * @return promise
	 */
	ugmp.service.uGisGetCapabilitiesDefault.prototype.callAjax = function() {
		var _self = this._this || this;

		var deferred = _$.Deferred();

		var url = ugmp.util.uGisUtil.appendParams( _self.serviceURL, _self.getAttribute() );

		if ( _self.useProxy ) {
			url = ugmp.uGisConfig.getProxy() + url;
		}

		var response = new ugmp.uGisHttp.requestData( {
			url : url,
			type : "GET",
			loading : true,
			contentType : "",
			dataType : "XML",
			dataViewId : _self.dataViewId,
		} );

		response.then( function(response_) {
			// -To do : response가 text일 경우 처리.
			var data = {
				state : false,
				message : null,
				xmlJson : null,
				document : response_
			};

			try {
				var xmlJson = ugmp.util.uGisUtil.xmlToJson( response_ );
				data.xmlJson = xmlJson;

				if ( response_.childNodes[ 0 ].nodeName === "ogc:ServiceExceptionReport" || response_.childNodes[ 0 ].nodeName === "ServiceExceptionReport" ) {
					var message = xmlJson[ "ogc:ServiceExceptionReport" ][ "ogc:ServiceException" ][ "#text" ];
					data.state = false;
					data.message = "ServiceExceptionReport : " + "<br>" + message;
				} else if ( response_.childNodes[ 0 ].nodeName === "ows:ExceptionReport" || response_.childNodes[ 0 ].nodeName === "ExceptionReport" ) {
					var message = xmlJson[ "ows:ExceptionReport" ][ "ows:Exception" ][ "ows:ExceptionText" ][ "#text" ];
					data.state = false;
					data.message = "ExceptionReport : " + "<br>" + message;
				} else {
					data.state = true;
				}

				deferred.resolve( data );

			} catch ( e ) {
				deferred.reject( e );
			}
		} ).fail( function(result) {
			deferred.reject( result );
		} );

		return deferred.promise();
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WCS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWCS = new ugmp.service.uGisGetCapabilitiesWCS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	version : '2.0.1',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWCS.then( function() {
	 * 	console.log( ugGetCapabilitiesWCS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.service.uGisGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesWCS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WCS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : undefined,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWCS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWCS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWCS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWCS;
	
	
	/**
	 * WCS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWCS.prototype.getServiceMetaDataWCS = function(xmlJson_) {
    	var json = xmlJson_;
    	var version = json["wcs:Capabilities"]["@attributes"]["version"];
        var title = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Title"];
        title = ( title ) ? title["#text"] : "null";
		var abstract = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"];
		abstract = ( abstract ) ? abstract["#text"] : "null";
		var fees = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Fees"];
		fees = ( fees ) ? fees["#text"] : "null";
		var accessconstraints = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"];
		accessconstraints = ( accessconstraints ) ? accessconstraints["#text"] : "null";
        var crs = "EPSG:4326";
		
        var keywordList = [];
        var keywords = json["wcs:Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"];
        if ( keywords ) {
        	keywords = keywords["ows:Keyword"];
        	for(var i in keywords) {
                keywordList.push( keywords[i]["#text"] );
            }
        }        
        
        var providerName = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        providerName = ( providerName ) ? providerName["#text"] : "null";
        var providerSite = json["wcs:Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        providerSite = ( providerSite ) ? providerSite["#text"] : "null";
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];
        
        var tempSupportedFormat = json["wcs:Capabilities"]["wcs:Contents"]["wcs:SupportedFormat"];
        
        var supportedFormats = [];
        for(var i in tempSupportedFormat) {
            supportedFormats.push( tempSupportedFormat[i]["#text"] );
        }
        
        var tempCoverageSummary = json["wcs:Capabilities"]["wcs:Contents"]["wcs:CoverageSummary"];
        
        if ( !Array.isArray( tempCoverageSummary ) ) {
            tempCoverageSummary = [ tempCoverageSummary ];
        }
        
        var coverages = [];
        for(var i in tempCoverageSummary) {
            var lowerCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( lowerCorner ) {
            	lowerCorner = lowerCorner["ows:LowerCorner"]["#text"];
            } else {
            	lowerCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:LowerCorner"]["#text"];
            }
            
            var upperCorner = tempCoverageSummary[i]["ows:WGS84BoundingBox"];
            if ( upperCorner ) {
            	upperCorner = upperCorner["ows:UpperCorner"]["#text"];
            } else {
            	upperCorner = tempCoverageSummary[i]["ows:BoundingBox"]["ows:UpperCorner"]["#text"];
            }
            
            var extent = [];
            extent[0] = parseFloat( ( lowerCorner.split(" ") )[0] );
            extent[1] = parseFloat( ( lowerCorner.split(" ") )[1] );
            extent[2] = parseFloat( ( upperCorner.split(" ") )[0] );
            extent[3] = parseFloat( ( upperCorner.split(" ") )[1] );
            
            var identifier;
            if ( version === "2.0.1" ) {
            	identifier = tempCoverageSummary[i][ "wcs:CoverageId" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "CoverageId" ]["#text"];
            } else {
            	identifier = tempCoverageSummary[i][ "wcs:Identifier" ];
            	identifier = ( identifier ) ? identifier["#text"] : tempCoverageSummary[i][ "Identifier" ]["#text"];
            }
            
            coverages.push( {
                Identifier : identifier,
                BBOX : extent
            } );
        }
        
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            coverages : coverages,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            accessconstraints : accessconstraints,
            supportedFormats : supportedFormats
        };
        
        return metaData;
    };

} )();

( function() {
	"use strict";

	/**
	 * WFS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WFS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWFS = new ugmp.service.uGisGetCapabilitiesWFS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	version : '1.1.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWFS.then( function() {
	 * 	console.log( ugGetCapabilitiesWFS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.service.uGisGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesWFS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WFS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : _self.getServiceMetaDataWFS( result_.xmlJson )
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWFS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWFS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWFS;
	
	
	/**
	 * WFS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWFS.prototype.getServiceMetaDataWFS = function(xmlJson_) {
    	var json = xmlJson_;
        
        var title = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Title"]["#text"];
		var abstract = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Abstract"]["#text"];
		var fees = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Fees"]["#text"];
		var accessconstraints = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:AccessConstraints"]["#text"];
        var crs = "EPSG:4326";
        var keywordList = [];
        var keywords = json["wfs:WFS_Capabilities"]["ows:ServiceIdentification"]["ows:Keywords"]["ows:Keyword"];
        for(var i in keywords) {
            keywordList.push( keywords[i]["#text"] );
        }
        
        var providerName = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderName"];
        var providerSite = json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ProviderSite"];
        
        if ( providerName !== undefined ) {
            providerName = providerName["#text"];
        }
        if ( providerSite !== undefined ) {
            providerSite = providerSite["#text"];
        }
        // var serviceContact =
		// json["wfs:WFS_Capabilities"]["ows:ServiceProvider"]["ows:ServiceContact"]["#text"];

        var layers = [];
        var featureTypeList = json["wfs:WFS_Capabilities"]["FeatureTypeList"];
        
        if ( featureTypeList && featureTypeList["FeatureType"] ) {
        	var featureType = featureTypeList["FeatureType"];
        	
        	if ( Array.isArray( featureType ) ) {
    			crs = featureType[0]["DefaultSRS"]["#text"];
                
                for (var i in featureType) {
                    var temp = {
                        Title : featureType[i]["Title"]["#text"],
                        Name : featureType[i]["Name"]["#text"]
                    }
                    layers.push( temp );
                }
                
    		} else {
    			crs = featureType["DefaultSRS"]["#text"];
                
                var temp = {
                    Title : featureType["Title"]["#text"],
                    Name : featureType["Name"]["#text"]
                }
                layers.push( temp );
    		}
    	}
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            providerSite : providerSite,
            providerName : providerName,
            // serviceContact : serviceContact,
            accessconstraints : accessconstraints,
            
            layers : layers
        };
        
        return metaData;
    };
	
} )();

( function() {
	"use strict";

	/**
	 * WMS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWMS = new ugmp.service.uGisGetCapabilitiesWMS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 * 	version : '1.3.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWMS.then( function() {
	 * 	console.log( ugGetCapabilitiesWMS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.service.uGisGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesWMS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMSCapabilities();
				var olJson = parser.read( result_.document );

				var data = {
					olJson : olJson,
					xmlJson : result_.xmlJson,
					document : result_.document,
					serviceMetaData : _self.getServiceMetaDataWMS( olJson )
				};

				_self.promise.data = data;
			} );

		} )();
		// END Initialize

		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWMS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWMS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWMS;
	
	
	/**
	 * WMS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWMS.prototype.getServiceMetaDataWMS = function(olJson_) {
        var json = olJson_;
        
        var service = json["Service"]["Name"];
        var version = json["version"];
        var getCapabilitiesFormat = "";
        var getCapabilitiesFormats = json["Capability"]["Request"]["GetCapabilities"]["Format"];
		for(var i in getCapabilitiesFormats) {
			getCapabilitiesFormat += ( getCapabilitiesFormats[i] +( (getCapabilitiesFormats.length-1) == i ? "" : ", " ) );
		}
		var getMapFormat = "";
		var getMapFormats = json["Capability"]["Request"]["GetMap"]["Format"];
		for(var i in getMapFormats) {
			getMapFormat += ( getMapFormats[i] +( (getMapFormats.length-1) == i ? "" : ", " ) );
		}
		var getFeatureInfoFormat = "";
		var getFeatureInfoFormats = json["Capability"]["Request"]["GetFeatureInfo"]["Format"];
		for(var i in getFeatureInfoFormats) {
			getFeatureInfoFormat += ( getFeatureInfoFormats[i] +( (getFeatureInfoFormats.length-1) == i ? "" : ", " ) );
		}
		var exceptionFormat = "";
		var exceptionFormats = json["Capability"]["Exception"];
		for(var i in exceptionFormats) {
			exceptionFormat += ( exceptionFormats[i] +( (exceptionFormats.length-1) == i ? "" : ", " ) );
		}
        var WGS84 = json["Capability"]["Layer"]["EX_GeographicBoundingBox"];
        var maxExtent = json["Capability"]["Layer"]["BoundingBox"][0]["extent"];
		var crs = json["Capability"]["Layer"]["BoundingBox"][0]["crs"];		
		var title = json["Service"]["Title"];
		var onlineResource = json["Service"]["OnlineResource"];
        var abstract = json["Service"]["Abstract"];
        var fees = json["Service"]["Fees"];
        var accessConstraints = json["Service"]["AccessConstraints"];
        var contactPerson;
        var contactOrganization;
        
        if ( json["Service"]["ContactInformation"] !== undefined ) {
            contactPerson = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactPerson"];
            contactOrganization = json["Service"]["ContactInformation"]["ContactPersonPrimary"]["ContactOrganization"];
        }
        
        var keywordList = json["Service"]["KeywordList"];
        
        
        if ( crs === "CRS:84" || crs === "EPSG:4326" ) {
            // maxExtent = [ maxExtent[1], maxExtent[0], maxExtent[3], maxExtent[2] ];
            maxExtent = [-185.8007812499999, -46.07323062540835, 472.67578125000006, 65.94647177615741];
        }
        
        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            WGS84 : WGS84,
            service : service,
            version : version,
            keywordList : keywordList,
            abstract : abstract,
            maxExtent : maxExtent,
            getMapFormat : getMapFormat,
            contactPerson : contactPerson,
            onlineResource : onlineResource,                        
            exceptionFormat : exceptionFormat,
            accessConstraints : accessConstraints,
            contactOrganization : contactOrganization,
            getFeatureInfoFormat : getFeatureInfoFormat,
            getCapabilitiesFormat : getCapabilitiesFormat
        };
        
        return metaData;
    };

} )();

( function() {
	"use strict";

	/**
	 * WMTS GetCapabilities 객체.
	 * 
	 * OGC 표준의 WMTS GetCapabilities 서비스를 요청하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugGetCapabilitiesWMTS = new ugmp.service.uGisGetCapabilitiesWMTS( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	version : '1.0.0',
	 * 	dataViewId : ugMap.getDataViewId()
	 * } );
	 * 
	 * ugGetCapabilitiesWMTS.then( function() {
	 * 	console.log( ugGetCapabilitiesWMTS.data );
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.version {String} 요청 버전.
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `true`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.dataViewId {String} View ID.
	 * 
	 * @Extends {ugmp.service.uGisGetCapabilitiesDefault}
	 * 
	 * @class
	 */
	ugmp.service.uGisGetCapabilitiesWMTS = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.promise = null;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};

			options.service = "WMTS";

			_super = ugmp.service.uGisGetCapabilitiesDefault.call( _self, options );

			_self.promise = _self.callAjax();

			_self.promise.then( function(result_) {
				var parser = new ol.format.WMTSCapabilities();
                var olJson = parser.read( result_.document );
                var xmlJson = result_.xmlJson;
                var serviceMetaData = _self.getServiceMetaDataWMTS( olJson );
                
                var capabilities = ( xmlJson["Capabilities"] ) ? xmlJson["Capabilities"] : xmlJson["wmts:Capabilities"];
				var style = capabilities["Contents"]["Layer"]["Style"];
				if ( style !== undefined ) {
					var legendURL = style["ows:LegendURL"];
					if ( legendURL !== undefined ) {
	    	            legendURL = legendURL["ows:OnlineResource"]["@attributes"]["xlink:href"];
	    	            serviceMetaData["legendURL"] = legendURL;
	    	        }
				}
				
    	        var extra_serviceIdentification = capabilities["ows:ServiceIdentification"];    	        
    	        
    	        if(extra_serviceIdentification  !== undefined ) {
    	        	if ( extra_serviceIdentification["ows:Abstract"] ) {
    	        		serviceMetaData["abstract"] = extra_serviceIdentification["ows:Abstract"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:AccessConstraints"] ) {
    	        		serviceMetaData["accessconstraints"] = extra_serviceIdentification["ows:AccessConstraints"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Fees"] ) {
    	        		serviceMetaData["fees"] = extra_serviceIdentification["ows:Fees"]["#text"];
    	        	}
    	        	if ( extra_serviceIdentification["ows:Keywords"] ) {
    	        		var keywords = extra_serviceIdentification["ows:Keywords"]["ows:Keyword"];
        	        	var keywordList = [];
        	        	
        	        	if ( keywords !== undefined ) {
        	                if ( Array.isArray( keywords ) ) {            
        	                    for(var i in keywords) {
        	                        keywordList.push( keywords[i]["#text"]);
        	                    }
        	                } else {
        	                    keywordList.push( keywords["#text"] );
        	                }
        	            }        	
        	        	serviceMetaData["keywords"] = keywordList; 
    	        	}
    	        }
                
                var data = {
                	olJson : olJson,
                	xmlJson : result_.xmlJson,
                    document : result_.document,
                    serviceMetaData : serviceMetaData
                };

				_self.promise.data = data;
			} );

		} )();
		// END Initialize
		
		
		return _self.promise;

	} );
	
	
	ugmp.service.uGisGetCapabilitiesWMTS.prototype = Object.create(ugmp.service.uGisGetCapabilitiesDefault.prototype);
	ugmp.service.uGisGetCapabilitiesWMTS.prototype.constructor = ugmp.service.uGisGetCapabilitiesWMTS;
	
	
	/**
	 * WMTS 서비스 메타데이터.
	 * 
	 * @private
	 * 
	 * @return metaData {Object} metaData.
	 */
	ugmp.service.uGisGetCapabilitiesWMTS.prototype.getServiceMetaDataWMTS = function(xmlJson_) {
    	var json = xmlJson_;  
        
        var crs = json["Contents"]["TileMatrixSet"];
        if ( Array.isArray( crs ) ) {
            crs = crs[0]["SupportedCRS"];
        } else {
            crs = crs["SupportedCRS"];
        }
        
        var title = json["ServiceIdentification"]["Title"];
		var abstract = json["ServiceIdentification"]["Abstract"];
		var fees = json["ServiceIdentification"]["Fees"];
		var accessconstraints = json["ServiceIdentification"]["AccessConstraints"];
        
        var keywordList = [];
        var keywords = json["ServiceIdentification"]["Keywords"];
        if ( keywords !== undefined ) {
            if ( Array.isArray( keywords ) ) {            
                for(var i in keywords) {
                    keywordList.push( keywords[i]["Keyword"] );
                }
            } else {
                keywordList.push( keywords["Keyword"] );
            }
        }

        var metaData = {
            crs : crs,
            fees : fees,
            title : title,
            abstract : abstract,
            keywords : keywordList,
            accessconstraints : accessconstraints
        };
        
        return metaData;
    };

} )();

/**
 * @namespace ugmp.layer
 */

( function() {
	"use strict";

	/**
	 * 레이어의 기본 객체. 공통으로 서비스 URL, 프록시, GetFeature 사용 여부를 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} 서비스 URL.
	 * @param opt_options.useGetFeature {Boolean} GetFeature 사용 여부. Default is `false`.
	 * 
	 * @class
	 */
	ugmp.layer.uGisLayerDefault = ( function(opt_options) {
		var _self = this;

		this.useProxy = null;
		this.serviceURL = null;
		this.useGetFeature = null;

		this.olLayer = null;
		this.layerKey = null;
		this.layerType = null;
		this.isUseLoading = null;
		this.tocVisibleFlag = null;
		this.layerVisibleFlag = null;
		this.scaleVisibleFlag = null;

		this.minZoom = null;
		this.maxZoom = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.isUseLoading = ugmp.uGisConfig.isUseLoading();
			_self.useProxy = ( options.useProxy !== undefined ) ? options.useProxy : false;
			_self.serviceURL = ( options.serviceURL !== undefined ) ? options.serviceURL : "";
			_self.useGetFeature = ( options.useGetFeature !== undefined ) ? options.useGetFeature : false;

			_self.layerKey = ugmp.util.uGisUtil.generateUUID();
			_self.layerType = ( options.layerType !== undefined ) ? options.layerType : "";
			_self.tocVisibleFlag = true;
			_self.layerVisibleFlag = true;
			_self.scaleVisibleFlag = true;

			_self.minZoom = 0;
			_self.maxZoom = 21;

		} )();
		// END Initialize


		return {
			destroy : _self.destroy,
			setMinZoom : _self.setMinZoom,
			setMaxZoom : _self.setMaxZoom,
			getMinZoom : _self.getMinZoom,
			getMaxZoom : _self.getMaxZoom,

			getVisible : _self.getVisible,
			getOlLayer : _self.getOlLayer,
			getLayerKey : _self.getLayerKey,
			getLayerType : _self.getLayerType,
			getServiceURL : _self.getServiceURL,

			visibleToggle : _self.visibleToggle,
			setTocVisible : _self.setTocVisible,
			setScaleVisible : _self.setScaleVisible,
			setLayerVisible : _self.setLayerVisible,

			getUseGetFeature : _self.getUseGetFeature,
			setUseGetFeature : _self.setUseGetFeature
		}

	} );


	/**
	 * 서비스 URL을 가져온다.
	 * 
	 * @return serviceURL {String} 서비스 URL.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getServiceURL = function() {
		var _self = this._this || this;
		return _self.serviceURL;
	};


	/**
	 * 레이어 키를 가져온다.
	 * 
	 * @return layerKey {String} 레이어 키.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getLayerKey = function() {
		var _self = this._this || this;
		return _self.layerKey;
	};


	/**
	 * 레이어 타입을 가져온다.
	 * 
	 * @return layerType {String} 레이어 타입.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getLayerType = function() {
		var _self = this._this || this;
		return _self.layerType;
	};


	/**
	 * OpenLayers의 `ol.layer` 객체를 가져온다.
	 * 
	 * @return olLayer {ol.layer} OpenLayers의 `ol.layer` 객체
	 */
	ugmp.layer.uGisLayerDefault.prototype.getOlLayer = function() {
		var _self = this._this || this;
		return _self.olLayer;
	};


	/**
	 * 레이어 visible 상태를 가져온다.
	 * 
	 * 1. 오픈레이어스 레이어 상태
	 * 
	 * 2. 레이어 visible상태
	 * 
	 * 3. TOC visible 상태
	 * 
	 * 4. 스케일 visible 상태
	 * 
	 * 모든 항목의 visible 상태가 `true`일 경우에만 `true`.
	 * 
	 * @return visible {Boolean} visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getVisible = function() {
		var _self = this._this || this;
		return ( _self.olLayer.getVisible() && _self.layerVisibleFlag && _self.tocVisibleFlag && _self.scaleVisibleFlag );
	};


	/**
	 * 레이어 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 레이어 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setLayerVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.tocVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.layerVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어 visible 상태를 토글한다.
	 */
	ugmp.layer.uGisLayerDefault.prototype.visibleToggle = function() {
		var _self = this._this || this;

		_self.setLayerVisible( !_self.layerVisibleFlag );
	};


	/**
	 * TOC visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} TOC visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setTocVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.scaleVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.tocVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 스케일 visible 상태를 설정한다.
	 * 
	 * @param visible {Boolean} 스케일 visible 상태.
	 * 
	 * @return {Object} 각 항목별 visible 상태.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setScaleVisible = function(visible_) {
		var _self = this._this || this;

		if ( typeof visible_ !== "boolean" ) {
			return false;
		}

		if ( visible_ ) {
			if ( _self.layerVisibleFlag && _self.tocVisibleFlag ) {
				_self.olLayer.setVisible( true );
			}
		} else {
			_self.olLayer.setVisible( false );
		}

		_self.scaleVisibleFlag = visible_;

		return {
			"OpenLayersVisible" : _self.olLayer.getVisible(),
			"LayerVisible" : _self.layerVisibleFlag,
			"TocVisible" : _self.tocVisibleFlag,
			"ScaleVisible" : _self.scaleVisibleFlag
		}
	};


	/**
	 * 레이어의 MinZoom을 설정한다.
	 * 
	 * @param minZoom {Integer} MinZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setMinZoom = function(minZoom_) {
		var _self = this._this || this;
		_self.minZoom = minZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MaxZoom을 설정한다.
	 * 
	 * @param maxZoom {Integer} MaxZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setMaxZoom = function(maxZoom_) {
		var _self = this._this || this;
		_self.maxZoom = maxZoom_;

		_self.olLayer.dispatchEvent( {
			type : 'change:zoom'
		} );
	};


	/**
	 * 레이어의 MinZoom 값을 가져온다.
	 * 
	 * @return minZoom {Integer} MinZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getMinZoom = function() {
		var _self = this._this || this;
		return _self.minZoom;
	};


	/**
	 * 레이어의 MaxZoom 값을 가져온다.
	 * 
	 * @return maxZoom {Integer} MaxZoom 값.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getMaxZoom = function() {
		var _self = this._this || this;
		return _self.maxZoom;
	};


	/**
	 * GetFeature 사용 여부를 가져온다.
	 * 
	 * @return useGetFeature {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisLayerDefault.prototype.getUseGetFeature = function() {
		var _self = this._this || this;
		return _self.useGetFeature;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisLayerDefault.prototype.setUseGetFeature = function(state_) {
		var _self = this._this || this;

		if ( typeof state_ === "boolean" ) {
			_self.useGetFeature = state_;
		} else {
			_self.useGetFeature = false;
		}
	};
	
	
	/**
	 * 레이어를 destroy한다.
	 * 
	 * @abstract
	 */
	ugmp.layer.uGisLayerDefault.prototype.destroy = function() {
		var _self = this._this || this;
	};

} )();

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

( function() {
	"use strict";

	/**
	 * Vector3D 레이어 객체.
	 * 
	 * 벡터데이터를 3D로 표현할 수 있는 레이어 객체.
	 * 
	 * ※도형의 Z값으로 렌더링하는 것은 아니며, 해당 피처의 높이 값 컬럼 설정을 통해 건물의 대략적인 높이만 표현할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugVector3DLayer = new ugmp.layer.uGisVector3DLayer( {
	 * 	srsName :'EPSG:3857',
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.style {ol.style.Style} 스타일.
	 * 
	 * @param opt_options.initBuild {Boolean} 초기 3D 렌더링 사용 여부.
	 * @param opt_options.labelColumn {String} 피처에 표시할 라벨 컬럼명.
	 * @param opt_options.heightColumn {String} 피처의 높이를 참조할 컬럼명.
	 * @param opt_options.maxResolution {Number} 3D 렌더링 최대 Resolution. Default is `0.6`.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisVector3DLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.initBuild = null;
		this.features = null;
		this.srsName = null;
		this.labelColumn = null;
		this.heightColumn = null;
		this.maxResolution = null;

		this.ugRender3D = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector3D";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.labelColumn = ( options.labelColumn !== undefined ) ? options.labelColumn : "";
			_self.initBuild = ( typeof ( options.initBuild ) === "boolean" ) ? options.initBuild : true;
			_self.heightColumn = ( options.heightColumn !== undefined ) ? options.heightColumn : "";
			_self.maxResolution = ( typeof ( options.maxResolution ) === "number" ) ? options.maxResolution : 0.6;

			_self._init();

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures,
			getRender3D : _self.getRender3D
		} );

	} );


	ugmp.layer.uGisVector3DLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisVector3DLayer.prototype.constructor = ugmp.layer.uGisVector3DLayer;


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.layer.uGisVector3DLayer.prototype._init = ( function() {
		var _self = this._this || this;

		_self.olLayer = new ol.layer.Vector( {
			// zIndex : 8999,
			declutter : true,
			// style : _self.style,
			source : new ol.source.Vector( {
				features : _self.features
			} )
		} );

		_self.ugRender3D = new ugmp.etc.uGisRender3D( {
			style : _self.style,
			layer : _self.olLayer,
			initBuild : _self.initBuild,
			labelColumn : _self.labelColumn,
			heightColumn : _self.heightColumn,
			maxResolution : _self.maxResolution
		} );
	} );


	/**
	 * uGisRender3D 객체를 가져온다.
	 * 
	 * @return ugRender3D {@link ugmp.etc.uGisRender3D} 객체.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.getRender3D = ( function() {
		var _self = this._this || this;
		return _self.ugRender3D;
	} );


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.addFeatures = ( function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	} );


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.getFeatures = ( function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	} );


	/**
	 * 레이어의 Feature를 지운다.
	 */
	ugmp.layer.uGisVector3DLayer.prototype.clear = ( function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	} );

} )();

( function() {
	"use strict";

	/**
	 * Vector 레이어 객체.
	 * 
	 * 벡터데이터를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugVectorLayer = new ugmp.layer.uGisVectorLayer( {
	 * 	declutter : true, 
	 * 	srsName : 'EPSG:3857',
	 * 	style : new ol.style.Style({...}),
	 * 	features : [ new ol.Feature( {
	 * 	 	geometry : new ol.geom.Polygon({...})
	 * 	} ) ]
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.features {Array<ol.Feature>|ol.Collection} 피처.
	 * @param opt_options.declutter {Boolean} 디클러터링 설정 (이미지, 텍스트). Default is `true`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisVectorLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.style = null;
		this.features = null;
		this.srsName = null;
		this.declutter = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "Vector";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.features = ( options.features !== undefined ) ? options.features : [];
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.declutter = ( typeof ( options.declutter ) === "boolean" ) ? options.declutter : true;

			_self.olLayer = new ol.layer.Vector( {
				// zIndex : 8999,
				declutter : false,
				style : _self.style,
				source : new ol.source.Vector( {
					features : _self.features
				} )
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			clear : _self.clear,
			srsName : _self.srsName,
			getFeatures : _self.getFeatures,
			addFeatures : _self.addFeatures
		} );

	} );


	ugmp.layer.uGisVectorLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisVectorLayer.prototype.constructor = ugmp.layer.uGisVectorLayer;


	/**
	 * 레이어에 Feature를 추가한다.
	 * 
	 * @param features {Array.<ol.Feature>} 추가할 피처 리스트.
	 */
	ugmp.layer.uGisVectorLayer.prototype.addFeatures = function(features_) {
		var _self = this._this || this;
		_self.olLayer.getSource().addFeatures( features_ );
	};


	/**
	 * 레이어의 Feature 리스트를 가져온다.
	 * 
	 * @return features {Array.<ol.Feature>} 피처 리스트.
	 */
	ugmp.layer.uGisVectorLayer.prototype.getFeatures = function() {
		var _self = this._this || this;
		return _self.olLayer.getSource().getFeatures();
	};


	/**
	 * 레이어의 Feature를 지운다.
	 */
	ugmp.layer.uGisVectorLayer.prototype.clear = function() {
		var _self = this._this || this;
		_self.olLayer.getSource().clear();
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS 레이어 객체.
	 * 
	 * WCS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWcsLayer = new ugmp.layer.uGisWCSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wcs?KEY=key',
	 * 	format : 'image/jpeg',
	 * 	version : '2.0.1',
	 * 	identifier : 'LAYER_ID',
	 * 	boundingBox : [...],
	 * 	useScaleRefresh : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WCS 서비스 URL.
	 * 
	 * @param opt_options.format {String} 이미지 포맷. Default is `image/jpeg`.
	 * @param opt_options.version {String} WCS 버전. Default is `1.1.1`.
	 * @param opt_options.identifier {String} 레이어 아이디.
	 * @param opt_options.boundingBox {Array} boundingBox. `※EPSG:4326`.
	 * @param opt_options.useScaleRefresh {Boolean} 이미지 해상도 자동 새로고침 사용 여부. Default is `false`.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWCSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.format = null;
		this.version = null;
		this.identifier = null;
		this.coverageId = null;
		this.boundingBox = null;
		this.useScaleRefresh = null;

		this.key_moveEnd = null;
		this.key_changeView = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WCS";
			options.useGetFeature = false;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.1.1";
			_self.format = ( options.format !== undefined ) ? options.format : "image/jpeg";
			_self.identifier = ( options.identifier !== undefined ) ? options.identifier : "";
			_self.coverageId = ( options.coverageId !== undefined ) ? options.coverageId : "";
			_self.useScaleRefresh = ( typeof ( options.useScaleRefresh ) === "boolean" ) ? options.useScaleRefresh : false;

			_self.boundingBox = _self._setBoundingBox( options.boundingBox );

			_self.olLayer = new ol.layer.Image( {} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setMap : _self.setMap,
			update : _self._update,
			version : _self.version,
			identifier : _self.identifier,
			useScaleRefresh : _self.useScaleRefresh,
			setBoundingBox : _self._setBoundingBox,
			getBoundingBox : _self.getBoundingBox
		} );

	} );


	ugmp.layer.uGisWCSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWCSLayer.prototype.constructor = ugmp.layer.uGisWCSLayer;


	/**
	 * BoundingBox를 설정한다.
	 * 
	 * @private
	 * 
	 * @param boundingBox {Array.<Double>} boundingBox.
	 */
	ugmp.layer.uGisWCSLayer.prototype._setBoundingBox = function(boundingBox_) {
		var _self = this._this || this;

		if ( boundingBox_ && boundingBox_.length > 3 ) {
			_self.boundingBox = boundingBox_.slice();
			if ( !boundingBox_[ 4 ] ) {
				_self.boundingBox.push( "EPSG:4326" );
			}
		} else {
			_self.boundingBox = undefined;
		}

		return _self.boundingBox;
	};


	/**
	 * Map을 설정한다. 해당 Map을 통해 Coverage의 BOUNDINGBOX를 갱신한다.
	 * 
	 * @param olMap {ol.Map}
	 * @param load {Function} 로드 함수.
	 */
	ugmp.layer.uGisWCSLayer.prototype.setMap = function(olMap_, load_) {
		var _self = this._this || this;

		_self._update( olMap_.getView(), load_ );

		if ( olMap_ && _self.useScaleRefresh ) {
			ol.Observable.unByKey( _self.key_moveEnd );

			_self.key_moveEnd = olMap_.on( "moveend", function() {
				_self._update( olMap_.getView(), load_ );
			} );
		}

		_self.key_changeView = olMap_.once( "change:view", function() {
			_self.setMap( olMap_, load_ );
		} );
	};


	/**
	 * WCS Param을 설정하고 갱신한다.
	 * 
	 * @private
	 * 
	 * @param view {ol.View} View 객체.
	 * @param load {Function} 로드 함수.
	 */
	ugmp.layer.uGisWCSLayer.prototype._update = function(view_, load_) {
		var _self = this._this || this;

		var viewExtent = view_.calculateExtent();
		viewExtent = ol.proj.transformExtent( viewExtent, view_.getProjection(), "EPSG:4326" );

		if ( !ol.extent.intersects( viewExtent, _self.boundingBox ) ) {
			return false;
		}

		var params = {
			SERVICE : "WCS",
			REQUEST : "GetCoverage",
			FORMAT : _self.format,
			VERSION : _self.version,
			IDENTIFIER : _self.identifier,
			COVERAGEID : _self.identifier,
			BOUNDINGBOX : _self.boundingBox
		};

		if ( _self.version === "2.0.1" ) {
			delete params.IDENTIFIER;
		} else {
			delete params.COVERAGEID;
		}

		if ( _self.useScaleRefresh ) {
			var poly1 = turf.polygon( [ [ [ viewExtent[ 0 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 3 ] ], [ viewExtent[ 2 ], viewExtent[ 3 ] ],
					[ viewExtent[ 2 ], viewExtent[ 1 ] ], [ viewExtent[ 0 ], viewExtent[ 1 ] ] ] ] );

			var poly2 = turf.polygon( [ [ [ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ], [ _self.boundingBox[ 0 ], _self.boundingBox[ 3 ] ],
					[ _self.boundingBox[ 2 ], _self.boundingBox[ 3 ] ], [ _self.boundingBox[ 2 ], _self.boundingBox[ 1 ] ],
					[ _self.boundingBox[ 0 ], _self.boundingBox[ 1 ] ] ] ] );

			var intersection = turf.intersect( poly1, poly2 );
			var intersectCoordinate = intersection.geometry.coordinates[ 0 ];
			var intersectExtent = [ intersectCoordinate[ 0 ][ 0 ], intersectCoordinate[ 0 ][ 1 ], intersectCoordinate[ 2 ][ 0 ], intersectCoordinate[ 2 ][ 1 ] ];

			if ( intersectExtent[ 0 ] > intersectExtent[ 2 ] ) {
				var temp = intersectExtent[ 2 ];
				intersectExtent[ 2 ] = intersectExtent[ 0 ];
				intersectExtent[ 0 ] = temp;
			}

			if ( intersectExtent[ 1 ] > intersectExtent[ 3 ] ) {
				var temp = intersectExtent[ 3 ];
				intersectExtent[ 3 ] = intersectExtent[ 1 ];
				intersectExtent[ 1 ] = temp;
			}

			params.BOUNDINGBOX = intersectExtent;
		}

		params.BOUNDINGBOX.push( "EPSG:4326" );

		if ( _self.useProxy ) {
			_self.getGetCoverageURL = ugmp.uGisConfig.getProxy() + ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		} else {
			_self.getGetCoverageURL = ugmp.util.uGisUtil.appendParams( _self.getServiceURL(), params );
		}

		load_( true );

		_self.olLayer.setSource( new ol.source.ImageStatic( {
			url : _self.getGetCoverageURL,
			// projection : view_.getProjection(),
			projection : "EPSG:4326",
			imageExtent : params.BOUNDINGBOX,
			imageLoadFunction : function(image, src) {
				var imageElement = image.getImage();
				imageElement.onload = function() {
					load_( false );
				};
				imageElement.onerror = function() {
					load_( false );
				};

				imageElement.src = src;
			}
		} ) );
	};


	/**
	 * BoundingBox를 가져온다.
	 * 
	 * @return BoundingBox {Array.<Double>} BoundingBox.
	 */
	ugmp.layer.uGisWCSLayer.prototype.getBoundingBox = function() {
		var _self = this._this || this;
		return _self.boundingBox;
	};


	/**
	 * GetFeature 사용 여부를 설정한다.
	 * 
	 * @override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부.
	 */
	ugmp.layer.uGisWCSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};


	/**
	 * 레이어를 destroy한다.
	 * 
	 * @override
	 */
	ugmp.layer.uGisWCSLayer.prototype.destroy = function() {
		var _self = this._this || this;

		ol.Observable.unByKey( _self.key_moveEnd );
		ol.Observable.unByKey( _self.key_changeView );
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS 레이어 객체.
	 * 
	 * WFS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @todo ★View 좌표계 변경에 따른 피처 좌표계 변환★
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWfsLayer = new ugmp.layer.uGisWFSLayer( {
	 * 	useProxy : true,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wfs?KEY=key',
	 * 	layerName : 'world_country',
	 * 	srsName : 'EPSG:3857',
	 * 	maxFeatures : 300,
	 * 	style : new ol.style.Style({...}),
	 * 	filter : new ol.format.filter.like( 'NAME', 'South*' )
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WFS 서비스 URL.
	 * 
	 * @param opt_options.layerName {String} 레이어명.
	 * @param opt_options.srsName {String} 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.filter {ol.format.filter.Filter} 필터. Default is `undefined`.
	 * @param opt_options.maxFeatures {Number} 피처 최대 요청 갯수. Default is `1000`.
	 * @param opt_options.style {ol.style.Style|Array.<ol.style.Style>|ol.StyleFunction} 스타일.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWFSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.filter = null;
		this.style = null;
		this.srsName = null;
		this.layerName = null;
		this.maxFeatures = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WFS";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.filter = ( options.filter !== undefined ) ? options.filter : undefined;
			_self.style = ( options.style !== undefined ) ? options.style : undefined;
			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.srsName = ( options.srsName !== undefined ) ? options.srsName : "EPSG:3857";
			_self.maxFeatures = ( options.maxFeatures !== undefined ) ? options.maxFeatures : 1000;

			_self.olLayer = new ol.layer.Vector( {
				declutter : true,
				style : _self.style,
				source : new ol.source.Vector()
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			srsName : _self.srsName,
			layerName : _self.layerName,
			getFeatures : _self.getFeatures
		} );

	} );


	ugmp.layer.uGisWFSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWFSLayer.prototype.constructor = ugmp.layer.uGisWFSLayer;


	/**
	 * OGC WFS getFeatures를 요청한다.
	 * 
	 * @param filter {ol.format.filter.Filter} 필터
	 * 
	 * @return uFeatures {@link ugmp.service.uGisGetFeature} ugmp.service.uGisGetFeature.
	 */
	ugmp.layer.uGisWFSLayer.prototype.getFeatures = function(dataViewId_) {
		var _self = this._this || this;

		var uFeatures = new ugmp.service.uGisGetFeature( {
			srsName : _self.srsName,
			useProxy : _self.useProxy,
			serviceURL : _self.getServiceURL(),
			typeName : _self.layerName,
			maxFeatures : _self.maxFeatures,
			outputFormat : "application/json",
			filter : _self.filter,
			dataViewId : dataViewId_,
		} );

		return uFeatures;
	};

} )();

( function() {
	"use strict";

	/**
	 * WMS 레이어 객체.
	 * 
	 * WMS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugWmsLayer = new ugmp.layer.uGisWMSLayer( {
	 *	useProxy : false,
	 *	singleTile : false,
	 *	serviceURL : 'http://mapstudio.uitgis.com/ms/wms?KEY=key',
	 *	ogcParams : {
	 *		LAYERS : 'ROOT',
	 *		CRS : ugMap.getCRS(),
	 *		VERSION : '1.3.0';
	 *		...
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMS 서비스 URL.
	 * @param opt_options.wfsServiceURL {String} WFS 서비스 URL (GetFeature).
	 * 
	 * @param opt_options.singleTile {Boolean} 싱글 타일 설정. Default is `false`.
	 * @param opt_options.ogcParams {Object} WMS OGC 표준 속성.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWMSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.singleTile = null;
		this.ogcParams = null;
		this.wfsServiceURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMS";
			options.useGetFeature = true;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			if ( options.wfsServiceURL ) {
				_self.wfsServiceURL = options.wfsServiceURL;
			} else {
				_self.wfsServiceURL = _self.serviceURL.replace( "/wms", "/wfs" );
			}

			_self.singleTile = ( options.singleTile !== undefined ) ? options.singleTile : false;
			_self.ogcParams = ( options.ogcParams !== undefined ) ? options.ogcParams : {};

			var serviceURL = _self.serviceURL;
			if ( _self.useProxy ) {
				if ( serviceURL.indexOf( "?" ) === -1 ) {
					serviceURL += "??";
				} else if ( serviceURL.indexOf( "?" ) === serviceURL.length - 1 ) {
					serviceURL = serviceURL.replace( "?", "??" );
				}

				serviceURL = ugmp.uGisConfig.getProxy() + serviceURL;
			}

			if ( _self.singleTile ) {
				var source = new ol.source.ImageWMS( {
					url : serviceURL,
					params : _self.ogcParams,
					// ratio : 1
				} );

				_self.olLayer = new ol.layer.Image( {
					source : source
				} );
			} else {
				var source = new ol.source.TileWMS( {
					url : serviceURL,
					params : _self.ogcParams
				} );

				_self.olLayer = new ol.layer.Tile( {
					source : source
				} );
			}

		} )();


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			ogcParams : _self.ogcParams,
			getWFSServiceURL : _self.getWFSServiceURL
		} );

	} );


	ugmp.layer.uGisWMSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	ugmp.layer.uGisWMSLayer.prototype.constructor = ugmp.layer.uGisWMSLayer;


	/**
	 * WFS 서비스 URL을 가져온다.
	 * 
	 * @return wfsServiceURL {String} WFS 서비스 URL.
	 */
	ugmp.layer.uGisWMSLayer.prototype.getWFSServiceURL = function() {
		var _self = this._this || this;
		return _self.wfsServiceURL;
	};

} )();

( function() {
	"use strict";

	/**
	 * WMTS 레이어 객체.
	 * 
	 * WMTS 서비스를 표현할 수 있는 레이어 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uWmtsLayer = new ugmp.layer.uGisWMTSLayer( {
	 * 	useProxy : false,
	 * 	serviceURL : 'http://mapstudio.uitgis.com/ms/wmts?KEY=key',
	 * 	layer : 'LAYER',
	 * 	matrixSet : 'MATRIXSET',
	 * 	projection : 'EPSG:3857',
	 * 	version : '1.0.0',
	 * 	wmtsCapabilities : null,
	 * 	originExtent : []
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.useProxy {Boolean} 프록시 사용 여부. Default is `false`.
	 * @param opt_options.serviceURL {String} WMTS 서비스 URL.
	 * 
	 * @param opt_options.layer {String} 레이어 이름.
	 * @param opt_options.style {String} 스타일 이름.
	 * @param opt_options.version {String} WMTS 버전. Default is `1.0.0`.
	 * @param opt_options.matrixSet {String} matrixSet.
	 * @param opt_options.originExtent {Array.<Number>} originExtent.
	 * @param opt_options.wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS} {@link ugmp.service.uGisGetCapabilitiesWMTS} WMTS
	 *            Capabilities 객체.
	 * 
	 * @Extends {ugmp.layer.uGisLayerDefault}
	 * 
	 * @class
	 */
	ugmp.layer.uGisWMTSLayer = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layer = null;
		this.style = null;
		this.version = null;
		this.matrixSet = null;
		this.originExtent = null;
		this.wmtsCapabilities = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.layerType = "WMTS";
			options.useGetFeature = false;

			_super = ugmp.layer.uGisLayerDefault.call( _self, options );

			_self.version = ( options.version !== undefined ) ? options.version : "1.0.0";
			_self.layer = ( options.layer !== undefined ) ? options.layer : "";
			_self.style = ( options.style !== undefined ) ? options.style : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.originExtent = _self._setOriginExtent( options.originExtent );
			_self.wmtsCapabilities = _self._setWmtsCapabilities( options.wmtsCapabilities );

			_self._update( false );

			_self.olLayer = new ol.layer.Tile( {
				// originCRS : "EPSG:4326",
				// originExtent : ( _self.originExtent !== undefined ) ? options.originExtent : [],
				source : null
			} );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			layer : _self.layer,
			version : _self.version,
			update : _self._update,
			matrixSet : _self.matrixSet,
			getOriginExtent : _self.getOriginExtent,
			setOriginExtent : _self._setOriginExtent,
			getWmtsCapabilities : _self.getWmtsCapabilities,
			setWmtsCapabilities : _self._setWmtsCapabilities,
		} );

	} );


	var uGisWMTSLayer = ugmp.layer.uGisWMTSLayer;
	uGisWMTSLayer.prototype = Object.create( ugmp.layer.uGisLayerDefault.prototype );
	uGisWMTSLayer.prototype.constructor = uGisWMTSLayer;


	/**
	 * OriginExtent 설정
	 * 
	 * @param originExtent {Array.<Double>} originExtent
	 */
	uGisWMTSLayer.prototype._setOriginExtent = function(originExtent_) {
		var _self = this._this || this;

		if ( originExtent_ && originExtent_.length > 3 ) {
			_self.originExtent = originExtent_;
		} else {
			_self.originExtent = undefined;
		}

		return _self.originExtent;
	};


	/**
	 * WMTS capabilities 설정
	 * 
	 * @param wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS} WMTS capabilities
	 */
	uGisWMTSLayer.prototype._setWmtsCapabilities = function(wmtsCapabilities_) {
		var _self = this._this || this;

		if ( wmtsCapabilities_ ) {
			_self.wmtsCapabilities = wmtsCapabilities_;
		} else {
			_self.wmtsCapabilities = undefined;
		}

		return _self.wmtsCapabilities;
	};


	/**
	 * WMTS Param 설정
	 * 
	 * @param use {Boolean}
	 */
	uGisWMTSLayer.prototype._update = function(use_) {
		var _self = this._this || this;

		if ( _self.olLayer && use_ ) {
			var WMTSOptions = new ol.source.WMTS.optionsFromCapabilities( _self.wmtsCapabilities.olJson, {
				layer : _self.layer,
				style : _self.style,
				matrixSet : _self.matrixSet
			} );

			if ( _self.useProxy ) {
				for ( var i in WMTSOptions.urls ) {
					WMTSOptions.urls[ i ] = ugmp.uGisConfig.getProxy() + WMTSOptions.urls[ i ];
				}
			}

			_self.olLayer.setSource( new ol.source.WMTS( WMTSOptions ) );
		}
	};


	/**
	 * OriginExtent 가져오기
	 * 
	 * @return OriginExtent {Array}
	 */
	uGisWMTSLayer.prototype.getOriginExtent = function() {
		var _self = this._this || this;
		return _self.originExtent;
	};


	/**
	 * WMTS Capabilities 가져오기
	 * 
	 * @return wmtsCapabilities {ugmp.service.uGisGetCapabilitiesWMTS}
	 */
	uGisWMTSLayer.prototype.getWmtsCapabilities = function() {
		var _self = this._this || this;
		return _self.wmtsCapabilities;
	};


	/**
	 * GetFeature 사용 여부 설정
	 * 
	 * @Override
	 * 
	 * @param state {Boolean} GetFeature 사용 여부
	 */
	uGisWMTSLayer.prototype.setUseGetFeature = function() {
		var _self = this._this || this;
		_self.useGetFeature = false;
	};

} )();

/**
 * @namespace ugmp.toc
 */

( function() {
	"use strict";

	/**
	 * TOC 기본 객체.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer} {@link ugmp.layer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * @param opt_options.menuOpen {Boolean} 메뉴 초기 Open 여부.
	 * @param opt_options.groupOpen {Boolean} 그룹레이어(폴더) 초기 Open 여부.
	 * @param opt_options.legendOpen {Boolean} 범례 이미지 초기 Open 여부.
	 * 
	 * ※`tocListDivId`가 없을 시 body에 임시로 DIV를 생성한다.
	 * 
	 * @class
	 */
	ugmp.toc.uGisTocDefault = ( function(opt_options) {
		var _self = this;

		this.tocKey = null;
		this.tocTitle = null;
		this.uGisMap = null;
		this.uGisLayer = null;
		this.menuOpen = null;
		this.groupOpen = null;
		this.legendOpen = null;
		this.tocListDivId = null;

		this.tocDivId = null;
		this.tocAccorId = null;
		this.zTreeAttribute = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.uGisLayer = ( options.uGisLayer !== undefined ) ? options.uGisLayer : undefined;
			_self.tocKey = ( options.tocKey !== undefined ) ? options.tocKey : undefined;
			_self.tocTitle = ( options.tocTitle !== undefined ) ? options.tocTitle : undefined;
			_self.tocListDivId = ( options.tocListDivId !== undefined ) ? options.tocListDivId : undefined;
			_self.menuOpen = ( typeof ( options.menuOpen ) === "boolean" ) ? options.menuOpen : true;
			_self.groupOpen = ( typeof ( options.groupOpen ) === "boolean" ) ? options.groupOpen : true;
			_self.legendOpen = ( typeof ( options.legendOpen ) === "boolean" ) ? options.legendOpen : true;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			if ( !_self.uGisLayer ) {
				ugmp.uGisConfig.alert_Error( "uGisLayer undefined" );
				return false;
			}

			// tocListDivId가 없을 시 body에 임시로 DIV 생성
			if ( !_self.tocListDivId ) {
				_self.tocListDivId = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];

				_$( "body" ).append( _$( "<div/>", {
					id : _self.tocListDivId,
					css : {
						display : "none"
					}
				} ) );
			}

		} )();
		// END Initialize


		return {
			tocKey : _self.tocKey,
			remove : _self.remove,
			uGisMap : _self.uGisMap,
			uGisLayer : _self.uGisLayer,
			getTocDivId : _self.getTocDivId,
			tocExpandAll : _self.tocExpandAll,
			tocCheckAllNodes : _self.tocCheckAllNodes
		}

	} );


	/**
	 * TOC DIV 생성를 생성한다.
	 * 
	 * @param type {String} TOC 타입 (WMS, WebWMS, WFS, WCS, WMTS).
	 * @param title {String} TOC 타이틀.
	 * 
	 * @private
	 */
	ugmp.toc.uGisTocDefault.prototype.createTocDiv = function(type_, title_) {
		var _self = this._this || this;

		var _iconSRC = null;
		var _tocDiv = null;
		var _tocHead = null;
		var _collapseId = null;
		var _collapseDiv;
		var _title = null;

		_self.tocDivId = "TOC_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_self.tocAccorId = "accor_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_collapseId = "collapse_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_iconSRC = '<img class="' + 'tocIMG_' + type_ + '">';

		_tocDiv = _$( "<div/>", {
			id : _self.tocAccorId
		} );

		_tocDiv.addClass( "panel-group" );
		_tocDiv.html(
			'<div class="panel-group" >' +
				'<div class="panel panel-default">' +
					'<div class="panel-heading" onclick="javascript:_$(\'#collapseOne\').collapse(\'toggle\');">' + 
						/* '<div class="panel-heading">'+ */
						'<h4 class="panel-title">' +
							'<a class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion1" href="#collapseOne" aria-expanded="false">' +
								'sampleTOC_1' +
							'</a><i class="indicator glyphicon glyphicon-chevron-down pull-right"></i>' +
						'</h4>' +
					'</div>' +
					'<div id="collapseOne" class="panel-collapse collapse" aria-expanded="false" style="height: 0px;">' +
						'<div class="panel-body" style="padding: 5px;">' +
							//'<div style="overflow: auto; width: 100%; background-color: white;height:340px" class="ztree" id="TOC_1"></div>' +
							'<div style="overflow: auto; width: 100%;" class="ztree" id="TOC_1"></div>' +
							'<div class="tocEventDIV">' +
								'<div class="tocEventDIV sub">' +
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + true + ');">' +
										'<span class="glyphicon glyphicon-check"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + false + ');">' +
										'<span class="glyphicon glyphicon-unchecked"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + true + ');">' +
										'<span class="glyphicon glyphicon-resize-full"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + false + ');">' +
										'<span class="glyphicon glyphicon-resize-small"></span>' +
									'</a>'+
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +	
				'</div>' +
			'</div>');
		
		
		var table = 
			'<table class="table" style="border: 1px solid #cecece; margin-bottom: 10px;">' +
				'<tbody>' +
					'<tr>' +
						//'<td style="background-color:#cecece;" >CRS</td>' +
						'<td>CRS</td>' +
						'<td id="CRS_TEXT"></td>' +
					'</tr>' +      
					'<tr>' +
						//'<td style="background-color:#cecece;">BBOX</td>' +
						'<td>BBOX</td>' +
						'<td id="BBOX_TEXT" style="word-break: break-all; white-space:pre-line;"></td>' +
					'</tr>' +
				'</tbody>' +
			'</table>';

		if ( type_ === "WMS" || type_ === "WebWMS" ) {
			_tocDiv.find( ".panel-body" ).prepend( table );
		}

		_tocHead = _tocDiv.find( ".panel-heading" );
		_tocHead.attr( "onclick", _tocHead.attr( "onclick" ).replace( "collapseOne", _collapseId ) );
		_tocHead.find( ".accordion-toggle" ).attr( "data-parent", "#" + _self.tocAccorId );
		_tocHead.find( ".accordion-toggle" ).attr( "href", "#" + _collapseId );
		_tocHead.find( ".accordion-toggle" ).text( " " + title_ );
		_tocHead.find( ".accordion-toggle" ).prepend( _$( _iconSRC ) );

		_collapseDiv = _tocDiv.find( ".panel-collapse" ).attr( "id", _collapseId );
		_collapseDiv.find( ".ztree" ).attr( "id", _self.tocDivId );

		_$( "#" + _self.tocListDivId ).prepend( _tocDiv );
		
		if ( _self.menuOpen ) {
			$( "#" + _collapseId ).collapse( "show" );
		}
	};


	/**
	 * zTree 속성 정보를 가져온다.
	 * 
	 * @param layerSetVisible {Function} 레이어 체크 이벤트.
	 * @param layerOrderChange {Function} 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 * 
	 * @return zTreeSetting {Object} zTree 속성 정보.
	 */
	ugmp.toc.uGisTocDefault.prototype.zTreeAttribute_Legend = function(options_) {
		var _self = this._this || this;

		var funcs = new _self._zTreeFuncs();

		var zTreeSetting = {
			view : {
				selectedMulti : false,
				expandSpeed : "fast",
				addDiyDom : funcs.addDIYDom_Legend
			},
			check : {
				autoCheckTrigger : true,
				enable : true,
				chkboxType : {
					"Y" : "",
					"N" : ""
				}
			},
			data : {
				simpleData : {
					enable : true
				}
			},
			edit : {
				enable : true,
				showRemoveBtn : false,
				showRenameBtn : false,
				drag : {
					autoExpandTrigger : true,
					prev : funcs.dropPrev,
					inner : funcs.dropInner,
					next : funcs.dropNext
				}
			},
			callback : {
				onCheck : options_.layerSetVisible,
				beforeDrop : options_.layerOrderChange,
				beforeDrag : funcs.beforeDrag
			},
			async : {
				enable : true
			}
		};

		return zTreeSetting;
	};


	/**
	 * TOC 전체 펼치기.
	 * 
	 * @param state {Boolean} 펼치기 상태.
	 */
	ugmp.toc.uGisTocDefault.prototype.tocExpandAll = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).expandAll( state_ );
	};


	/**
	 * TOC 전체 체크.
	 * 
	 * @param state {Boolean} 체크 상태.
	 */
	ugmp.toc.uGisTocDefault.prototype.tocCheckAllNodes = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).checkAllNodes( state_ );
	};


	/**
	 * TOC DIV ID를 가져온다.
	 * 
	 * @return tocDivId {String} TOC DIV ID.
	 */
	ugmp.toc.uGisTocDefault.prototype.getTocDivId = function() {
		var _self = this._this || this;
		return _self.tocDivId;
	};


	/**
	 * TOC를 삭제한다.
	 */
	ugmp.toc.uGisTocDefault.prototype.remove = function() {
		var _self = this._this || this;
		
		_$.fn.zTree.destroy( _self.tocDivId );
		_$( "#" + _self.tocAccorId ).remove();
	};


	/**
	 * zTree 이벤트.
	 * 
	 * @private
	 * 
	 * @return {Object} zTree 이벤트 리스트.
	 */
	ugmp.toc.uGisTocDefault.prototype._zTreeFuncs = function() {
		var _this = this;

		_this.curDragNodes = null;

		// dropPrev
		function _dropPrev(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropInner
		function _dropInner(treeId, nodes, targetNode) {
			if ( targetNode && targetNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					if ( !targetNode && _this.curDragNodes[ i ].dropRoot === false ) {
						return false;
					} else if ( _this.curDragNodes[ i ].parentTId && _this.curDragNodes[ i ].getParentNode() !== targetNode
							&& _this.curDragNodes[ i ].getParentNode().childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropNext
		function _dropNext(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// beforeDrag
		function _beforeDrag(treeId, treeNodes) {
			for ( var i = 0 , l = treeNodes.length; i < l; i++ ) {
				if ( treeNodes[ i ].drag === false ) {
					_this.curDragNodes = null;
					return false;
				} else if ( treeNodes[ i ].parentTId && treeNodes[ i ].getParentNode().childDrag === false ) {
					_this.curDragNodes = null;
					return false;
				}
			}

			_this.curDragNodes = treeNodes;
			return true;
		}


		// 범례이미지 추가
		function _addDIYDom_Legend(treeId, treeNode) {
			if ( treeNode[ "parentNode" ] && treeNode[ "parentNode" ][ "id" ] !== 2 ) return;

			var aObj = _$( "#" + treeNode.tId + "_a" );
			if ( treeNode[ "isLegend" ] && treeNode[ "LegendURL" ] ) {
				aObj.empty();
				aObj.css( "height", "auto" );
				aObj.append( "<img src='" + treeNode[ "LegendURL" ] + "' title='" + treeNode[ "name" ] +"'>" );
			}
		}

		return {
			dropPrev : _dropPrev,
			dropInner : _dropInner,
			dropNext : _dropNext,
			beforeDrag : _beforeDrag,
			addDIYDom_Legend : _addDIYDom_Legend
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * WCS TOC 객체.
	 * 
	 * WCS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWCSLayer} {@link ugmp.layer.uGisWCSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.coverage {String} 레이어 이름.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWCSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.coverage = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.coverage = ( options.coverage !== undefined ) ? options.coverage : "";

			_self.createTocDiv( "WCS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( _layerSetVisible );

			_self._createWCSToc();

		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.uGisLayer.setTocVisible( check );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.toc.uGisWCSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWCSToc.prototype.constructor = ugmp.toc.uGisWCSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWCSToc.prototype._createWCSToc = function() {
		var _self = this._this || this;

		var wcsZtreeLayer;
		var originWCSztreeLayer = _self._getWCSNodeTozTree( _self._getWCSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wcsZtreeLayer = originWCSztreeLayer;
		} else {
			wcsZtreeLayer = originWCSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wcsZtreeLayer );

		return wcsZtreeLayer;
	};


	/**
	 * _getWCSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wcsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWCSToc.prototype._getWCSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "Coverage" ],
			name : node_[ "Coverage" ],
			// title : null,
			children : [],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			Coverage : node_[ "Coverage" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "root",
			name : node_[ "Coverage" ],
			// title : null,
			children : [ layer ],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false
		};

		return root;
	};


	/**
	 * 해당 WCS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wcsLayerData
	 */
	ugmp.toc.uGisWCSToc.prototype._getWCSLayerData = function() {
		var _self = this._this || this;

		var wcsLayerData = {
			KEY : _self.tocKey,
			Coverage : _self.coverage
		};

		return wcsLayerData;
	};

} )();

( function() {
	"use strict";

	/**
	 * WFS TOC 객체.
	 * 
	 * WFS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWfsToc = new ugmp.toc.uGisWFSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWFSLayer({...}),
	 *	tocKey : 'wfs_key',
	 *	tocTitle : 'WFS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'world_country',
	 *	layerTitle : 'world_country Title'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWFSLayer} {@link ugmp.layer.uGisWFSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.layerTitle {String} 레이어 이름.
	 * @param opt_options.layerName {String} 레이어 원본 이름.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWFSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layerTitle = null;
		this.layerName = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.layerTitle = ( options.layerTitle !== undefined ) ? options.layerTitle : "";
			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";

			_self.createTocDiv( "WFS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWFSToc();

		} )( opt_options );
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.uGisLayer.setTocVisible( check );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.toc.uGisWFSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWFSToc.prototype.constructor = ugmp.toc.uGisWFSToc;


	/**
	 * TOC 생성
	 */
	ugmp.toc.uGisWFSToc.prototype._createWFSToc = function() {
		var _self = this._this || this;

		var wfsZtreeLayer;
		var originWFSztreeLayer = _self._getWFSNodeTozTree( _self._getWFSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wfsZtreeLayer = originWFSztreeLayer;
		} else {
			wfsZtreeLayer = originWFSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wfsZtreeLayer );

		return wfsZtreeLayer;
	};


	/**
	 * _getWFSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wfsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWFSToc.prototype._getWFSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerTitle" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerTitle" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WFS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wfsLayerData
	 */
	ugmp.toc.uGisWFSToc.prototype._getWFSLayerData = function() {
		var _self = this._this || this;

		var wfsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerTitle
		};

		return wfsLayerData;
	};

} )();

( function() {
	"use strict";

	/**
	 * WMS TOC 객체.
	 * 
	 * WMS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWmsToc = new ugmp.toc.uGisWMSToc( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	uGisLayer : new ugmp.layer.uGisWMSLayer({...}),
	 * 	capabilities : new ugmp.service.uGisGetCapabilitiesWMS({...}).data,
	 * 	tocKey : 'wms_key',
	 * 	tocTitle : 'WMS TOC Title',
	 * 	tocListDivId : 'toc',
	 * 	symbolSize : [20, 20],
	 * 	visibleState : { 'LAYER_NAME1' : false, 'LAYER_NAME2' : false }
	 * 	loadData : { 'LayerName' : 'ROOT', 'checked' : false, 'open' : true }
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWMSLayer} {@link ugmp.layer.uGisWMSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.symbolSize {Array.<Number>} 범례 심볼 간격. Default is `[20, 20]`.
	 * @param opt_options.visibleState {Object} { layerName : Boolean } 형태로 초기 체크 상태 설정.
	 * @param opt_options.capabilities {ugmp.service.uGisGetCapabilitiesWMS} {@link ugmp.service.uGisGetCapabilitiesWMS} WMS capabilities
	 *            객체.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWMSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.loadData = null;
		this.symbolSize = null;
		this.capabilities = null;
		this.visibleState = null;

		this.key_zoomEnd = null;
		this.showLayerNames = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			var symbolSize = options.symbolSize;
			if ( !Array.isArray( symbolSize ) ) {
				_self.symbolSize = [ 20, 20 ];
			} else {
				_self.symbolSize = symbolSize;
			}

			_self.loadData = ( options.loadData !== undefined ) ? options.loadData : undefined;
			_self.visibleState = ( options.visibleState !== undefined ) ? options.visibleState : {};
			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;

			if ( !_self.capabilities ) {
				ugmp.uGisConfig.alert_Error( "capabilities undefined" );
				return false;
			}

			_self.createTocDiv( "WMS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible,
				layerOrderChange : _layerOrderChange
			} );

			_self._createWMSToc( false );

			_self._createReloadBtn();

			_self._activeChangeResolution();

			_$( "#" + _self.tocAccorId ).find( "#CRS_TEXT" ).text( _self.capabilities.serviceMetaData[ "crs" ] );
			_$( "#" + _self.tocAccorId ).find( "#BBOX_TEXT" ).text( _self.capabilities.serviceMetaData[ "maxExtent" ].toString() );

			_self.uGisMap.getMap().getView().dispatchEvent( {
				type : "change:resolution"
			} );
		} )( opt_options );
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			_self._olWMSLayerRefresh( false );
		}


		/**
		 * TOC 레이어 순서 변경 이벤트
		 */
		function _layerOrderChange(treeId, treeNodes, targetNode, moveType) {
			var state = false;

			if ( treeNodes[ 0 ] ) {
				var tocID = treeNodes[ 0 ][ "tId" ].split( "_" )[ 1 ];
				if ( treeId.split( "_" )[ 1 ] !== tocID ) {
					return false;
				}
			} else {
				return false;
			}

			if ( targetNode[ "isGroupLayer" ] ) {
				state = ( targetNode[ "drop" ] ) ? true : false;
				if ( targetNode[ "LayerName" ] === "ROOT" && moveType !== "inner" ) {
					state = false;
				}
			} else {
				state = ( moveType !== "inner" ) ? true : false;
			}

			return _self._layerOrderChangeListener( state );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			reLoad : _self.reLoad,
			getSaveData : _self.getSaveData,
			getShowLayerNames : _self.getShowLayerNames
		} );

	} );


	ugmp.toc.uGisWMSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWMSToc.prototype.constructor = ugmp.toc.uGisWMSToc;


	/**
	 * 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMSToc.prototype._layerOrderChangeListener = function(state) {
		var _self = this._this || this;

		if ( state ) {
			_self._olWMSLayerRefresh( true );
			setTimeout( function() {
				_self._olWMSLayerRefresh( true );
			}, 100 );
		}
		return state;
	};


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMSToc.prototype._createWMSToc = function(reload_) {
		var _self = this._this || this;

		var wmsZtreeLayer = _self._getWMSNodeTozTree( _self._getWMSLayerData()[ "Layers" ] );

		// 저장된 데이터 불러오기 (open, order, checked)
		if ( !reload_ && _self.loadData ) {
			var layerDataObject = _self._getLayerDataObject( wmsZtreeLayer, {} );
			wmsZtreeLayer = _self._setLoadData( layerDataObject, _$.extend( true, {}, _self.loadData ) );
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmsZtreeLayer );

		return wmsZtreeLayer;
	};


	/**
	 * _getWMSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node_ {Object} wmsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWMSToc.prototype._getWMSNodeTozTree = function(node_) {
		var _self = this._this || this;

		var layer = {
			id : null,
			name : null,
			children : [],
			drop : true,
			drag : true,
			open : true,
			checked : true,
			dropInner : true,
			chkDisabled : false,

			Extent : null,
			LayerName : null,
			LegendURL : null,
			MinScale : 0,
			MaxScale : Infinity,
			scaleVisible : true,
			isGroupLayer : false
		};


		for ( var i = 0; i < node_.length; i++ ) {
			layer[ "name" ] = node_[ i ][ "Title" ];
			layer[ "id" ] = node_[ i ][ "LayerName" ];
			layer[ "LayerName" ] = node_[ i ][ "LayerName" ];

			if ( typeof _self.visibleState[ layer[ "LayerName" ] ] === 'boolean' ) {
				layer[ "checked" ] = _self.visibleState[ layer[ "LayerName" ] ];
			}

			layer[ "LegendURL" ] = node_[ i ][ "LegendURL" ];

			var minScale = node_[ i ][ "MinScale" ];
			if ( typeof minScale !== "undefined" ) {
				layer[ "MinScale" ] = minScale;
			}

			var maxScale = node_[ i ][ "MaxScale" ];
			if ( typeof maxScale !== "undefined" ) {
				layer[ "MaxScale" ] = maxScale;
			}

			layer[ "Extent" ] = node_[ i ][ "Extent" ];
			layer[ "isGroupLayer" ] = node_[ i ][ "isGroupLayer" ];

			// 그룹레이어 오픈
			if ( layer[ "isGroupLayer" ] ) {
				layer[ "open" ] = ( _self.groupOpen ? true : false );
			}

			if ( layer[ "id" ] === "ROOT" ) {
				layer[ "open" ] = true;
				layer[ "drag" ] = false;
			}

			var childLayers = node_[ i ][ "ChildLayers" ];
			if ( childLayers.length > 0 ) {
				for ( var j = 0; j < childLayers.length; j++ ) {
					layer[ "children" ].push( _self._getWMSNodeTozTree( [ childLayers[ j ] ] ) );
				}
			} else {
				layer[ "drop" ] = false;
				layer[ "dropInner" ] = false;
				layer[ "iconSkin" ] = "pIconFeatureLayer";

				// 범례 오픈
				if ( !_self.legendOpen ) {
					layer[ "open" ] = false;
				}

				if ( layer[ "LayerName" ] && layer[ "LegendURL" ] ) {
					layer[ "children" ].push( {
						drag : false,
						drop : false,
						open : false,
						nocheck : true,
						isLegend : true,
						dropInner : false,
						name : layer[ "LayerName" ],
						LayerName : "leg_" + layer[ "LayerName" ],
						LegendURL : layer[ "LegendURL" ]
					} );
				}
			}

		}

		return layer;
	};


	/**
	 * 해당 WMS 서비스의 capabilities를 통해 레이어 정보를 가져온다.
	 * 
	 * @private
	 * 
	 * @return wmsLayerData
	 */
	ugmp.toc.uGisWMSToc.prototype._getWMSLayerData = function() {
		var _self = this._this || this;

		var wmsLayerData = {
			CRS : _self.capabilities.serviceMetaData.crs,
			MaxExtent : _self.capabilities.serviceMetaData.maxExtent,
			Layers : []
		};

		var capabilitiesJSON = _self.capabilities.xmlJson[ "WMS_Capabilities" ][ "Capability" ][ "Layer" ];
		var layers = _self._getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
		wmsLayerData[ "Layers" ].push( layers );

		return wmsLayerData;
	};


	/**
	 * 해당 WMS 서비스의 capabilitie에서 TOC 생성에 필요한 데이터를 가져온다.
	 * 
	 * @private
	 * 
	 * @return layerData
	 */
	ugmp.toc.uGisWMSToc.prototype._getWMSCapabilitieLayerData = function(node_) {
		var _self = this._this || this;

		var layerData = {
			LayerName : null,
			Title : null,
			Extent : null,
			MinScale : null,
			MaxScale : null,
			LegendURL : null,
			isGroupLayer : false,
			isVisible : true,
			ChildLayers : []
		};

		for ( var i in node_ ) {
			var title = node_[ i ][ "Title" ];
			if ( typeof title !== "undefined" ) {
				title = title[ "#text" ];
			}
			var layerName = node_[ i ][ "Name" ];
			if ( typeof layerName !== "undefined" ) {
				layerName = layerName[ "#text" ];
			}
			var extent = node_[ i ][ "BoundingBox" ];
			if ( typeof extent !== "undefined" ) {
				if ( Array.isArray( extent ) ) {
					extent = extent[ 0 ];
				}
				extent = extent[ "@attributes" ];
				extent = [ parseFloat( extent[ "minx" ] ), parseFloat( extent[ "miny" ] ), parseFloat( extent[ "maxx" ] ), parseFloat( extent[ "maxy" ] ) ];
			}
			var minScale = node_[ i ][ "MinScaleDenominator" ];
			if ( typeof minScale !== "undefined" ) {
				minScale = parseFloat( minScale[ "#text" ] );
			}
			var maxScale = node_[ i ][ "MaxScaleDenominator" ];
			if ( typeof maxScale !== "undefined" ) {
				maxScale = parseFloat( maxScale[ "#text" ] );
			}
			var style = node_[ i ][ "Style" ];
			var legendURL;
			if ( typeof style !== "undefined" ) {

				if ( Array.isArray( style ) ) {
					style = style[ 0 ];
				}

				if ( typeof style[ "LegendURL" ] !== "undefined" ) {
					legendURL = style[ "LegendURL" ][ "OnlineResource" ][ "@attributes" ][ "xlink:href" ];
					legendURL += "&SYMBOL_WIDTH=" + _self.symbolSize[ 0 ];
					legendURL += "&SYMBOL_HEIGHT=" + _self.symbolSize[ 1 ];
				}
			}

			var childLayer = node_[ i ][ "Layer" ];

			if ( !Array.isArray( childLayer ) && typeof childLayer !== "undefined" ) {
				childLayer = [ childLayer ];
			}

			if ( Array.isArray( childLayer ) ) {
				layerData[ "isGroupLayer" ] = true;
				for ( var j = childLayer.length; --j >= 0; ) {
					layerData[ "ChildLayers" ].push( _self._getWMSCapabilitieLayerData( [ childLayer[ j ] ] ) );
				}
			}

			layerData[ "LayerName" ] = layerName;
			layerData[ "Title" ] = title;
			layerData[ "Extent" ] = extent;
			layerData[ "MinScale" ] = minScale;
			layerData[ "MaxScale" ] = maxScale;
			layerData[ "LegendURL" ] = legendURL;
		}

		return layerData;
	};


	/**
	 * 레이어 그룹해제.
	 * 
	 * @private
	 * 
	 * @return noneGroupLayers
	 */
	ugmp.toc.uGisWMSToc.prototype._getNoneGroupLayers = function(layers_, noneGroupLayers_) {
		var _self = this._this || this;

		layers_ = [ layers_ ];
		for ( var i in layers_ ) {
			var layer = layers_[ i ];

			if ( layer.isGroupLayer ) {
				var childs = layer[ "children" ];
				for ( var j in childs ) {
					var child = childs[ j ];
					_self._getNoneGroupLayers( child, noneGroupLayers_ );
				}
			} else {
				noneGroupLayers_.push( layer );
			}
		}

		return noneGroupLayers_;
	};


	/**
	 * 스케일 변경 이벤트 활성화 설정.
	 * 
	 * @param baseMap {ugmp.baseMap} baseMap.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMSToc.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.uGisMap.getMap().getView();

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			_self.key_changeResolution = view_.on( "change:resolution", function() {
				_changeResolution();
			} );
		}


		// 스케일 변경 이벤트
		function _changeResolution() {
			var scale = _self.uGisMap.calculateScale( {
				extent : _self.uGisMap.getMap().getView().calculateExtent( _self.uGisMap.getMap().getSize() ),
				originCRS : _self.capabilities.serviceMetaData[ "crs" ]
			} );

			scale = Math.ceil( scale );

			var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
			_updateScale( layers, scale );
			_$.fn.zTree.getZTreeObj( _self.tocDivId ).refresh();
			_self._olWMSLayerRefresh( false );
		}


		// 스케일 변경 시 해당 레이어의 MinScale, MaxScale 값에 따른 View 상태 처리
		function _updateScale(layer, scale) {
			if ( !layer[ "isLegend" ] ) {
				if ( ( layer[ "MinScale" ] <= scale ) && ( scale < layer[ "MaxScale" ] ) ) {
					layer.scaleVisible = true;
					layer.chkDisabled = false;
				} else {
					layer.scaleVisible = false;
					layer.chkDisabled = true;
				}
			}

			var children = layer.children;

			if ( Array.isArray( children ) ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[ i ];
					_updateScale( child, scale );
				}
			}
		}

	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 설정.
	 * 
	 * @private
	 * 
	 * @return layerNames {String} 레이어 리스트 toString
	 */
	ugmp.toc.uGisWMSToc.prototype.setZtreeLayerData = function() {
		var _self = this._this || this;

		var layerNames = [];
		var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
		layerNames = _self._getZtreeLayerData( layers, layerNames, "show" );
		layerNames = ( typeof layerNames === "undefined" ) ? "" : layerNames.toString();
		_self.showLayerNames = layerNames;
		return layerNames;
	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 가져오기
	 * 
	 * @private
	 * 
	 * @return names {Array.<String>}
	 */
	ugmp.toc.uGisWMSToc.prototype._getZtreeLayerData = function(layers, names, type) {
		var _self = this._this || this;

		var layer = [ layers ];
		for ( var i in layer ) {
			var data = layer[ i ];

			if ( ( type === "show" && data[ "checked" ] === false ) || ( type === "show" && data[ "chkDisabled" ] === true ) ) {
				return;
			}

			if ( data.isGroupLayer ) {
				var childs = data[ "children" ];
				for ( var j = childs.length; --j >= 0; ) {
					var child = childs[ j ];
					_self._getZtreeLayerData( child, names, type );
				}
			} else {
				names.push( data[ "LayerName" ] );
			}
		}

		return names;
	};


	/**
	 * 레이어 새로고침.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMSToc.prototype._olWMSLayerRefresh = function(cacheClear_) {
		var _self = this._this || this;

		var olLayer = _self.uGisLayer.getOlLayer();

		olLayer.getSource().getParams().LAYERS = _self.setZtreeLayerData();
		if ( cacheClear_ ) {
			olLayer.getSource().getParams().refTime = new Date().getMilliseconds();
		}
		olLayer.getSource().updateParams( olLayer.getSource().getParams() );

		if ( olLayer.getSource().getParams().LAYERS === "" ) {
			_self.uGisLayer.setTocVisible( false );
		} else {
			if ( !( _self.uGisLayer.getVisible() ) ) {
				_self.uGisLayer.setTocVisible( true );
			}
		}
	};


	/**
	 * TOC의 모든 레이어를 { Key : Value } 형태로 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWMSToc.prototype._getLayerDataObject = function(layer_, layerDataObj_) {
		var _self = this._this || this;

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
				_self._getLayerDataObject( child, layerDataObj_ );
			}
		} else {
			layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
		}

		return layerDataObj_;
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWMSToc.prototype.getSaveData = function() {
		var _self = this._this || this;

		var zTreeNodes = $.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];

		return _self._getSaveData( _$.extend( true, {}, zTreeNodes ) );
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWMSToc.prototype._getSaveData = function(layer_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children", "LayerName" ];

		for ( var key in layer_ ) {
			if ( layer_.hasOwnProperty( key ) ) {
				if ( _$.inArray( key, ignores ) === -1 ) {
					delete layer_[ key ];
				}
			}
		}

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._getSaveData( child );
			}
		}

		return layer_;
	};


	/**
	 * 로드할 TOC 목록 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWMSToc.prototype._setLoadData = function(layerDataObj_, loadData_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children" ];

		var data = layerDataObj_[ loadData_[ "LayerName" ] ];

		for ( var key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				if ( $.inArray( key, ignores ) === -1 ) {
					loadData_[ key ] = data[ key ];
				}
			}
		}


		var children = loadData_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._setLoadData( layerDataObj_, child );
			}
		}

		return loadData_;
	};


	/**
	 * TOC Reload 버튼 생성.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMSToc.prototype._createReloadBtn = function() {
		var _self = this._this || this;

		var $btn = $( '<a/>', {
			click : function() {
				_self.reLoad();
			}
		} ).append( $( '<span/>', {
			'class' : 'glyphicon glyphicon-refresh',
			'title' : '새로고침'
		} ) );

		_$( "#" + _self.tocDivId ).parent().find( ".tocEventDIV.sub" ).prepend( $btn );
	};


	/**
	 * 현재 보여지고 있는 레이어 목록 가져오기.
	 * 
	 * uniq가 true면 중복된 레이어를 제거한다.
	 * 
	 * @return showLayerList {Array.<String>} 현재 보여지고 있는 레이어 목록.
	 */
	ugmp.toc.uGisWMSToc.prototype.getShowLayerNames = function(uniq_) {
		var _self = this._this || this;

		var showLayerList = _self.showLayerNames.split( ',' );

		if ( uniq_ ) {
			showLayerList = showLayerList.reduce( function(a, b) {
				if ( a.indexOf( b ) < 0 ) a.push( b );
				return a;
			}, [] );
		}

		return showLayerList;
	};


	/**
	 * TOC를 다시 로드한다.
	 * 
	 * ※설정된 {@link ugmp.service.uGisGetCapabilitiesWMS}를 기준으로 다시 로드한다.
	 */
	ugmp.toc.uGisWMSToc.prototype.reLoad = function() {
		var _self = this._this || this;

		$.fn.zTree.destroy( _self.tocDivId );
		_self._createWMSToc( true );

		_self.uGisMap.getMap().getView().dispatchEvent( {
			type : "change:resolution"
		} );
	};


	/**
	 * TOC를 삭제한다.
	 * 
	 * @override {ugmp.toc.uGisTocDefault.prototype.remove}
	 */
	ugmp.toc.uGisWMSToc.prototype.remove = function() {
		var _self = this._this || this;

		ugmp.toc.uGisTocDefault.prototype.remove.call( this );

		ol.Observable.unByKey( _self.key_changeResolution );
	};

} )();

( function() {
	"use strict";

	/**
	 * WMTS TOC 객체.
	 * 
	 * WMTS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWmtsToc = new ugmp.toc.uGisWMTSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWMSLayer({...}),
	 *	capabilities : new ugmp.service.uGisGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'LAYER_NAME',
	 *	matrixSet : 'MATRIXSET'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.matrixSet {String} matrixSet 이름.
	 * @param opt_options.layerName {String} 레이어 이름.
	 * @param opt_options.legendURL {String} 범례 URL.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWMTSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.matrixSet = null;
		this.layerName = null;
		this.legendURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.legendURL = ( options.legendURL !== undefined ) ? options.legendURL : "";

			_self.createTocDiv( "WMTS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWMTSToc();

		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.uGisLayer.setTocVisible( check );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.toc.uGisWMTSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWMTSToc.prototype.constructor = ugmp.toc.uGisWMTSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMTSToc.prototype._createWMTSToc = function() {
		var _self = this._this || this;

		var wmtsZtreeLayer;
		var originWMTSztreeLayer = _self._getWMTSNodeTozTree( _self._getWMTSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wmtsZtreeLayer = originWMTSztreeLayer;
		} else {
			wmtsZtreeLayer = originWMTSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmtsZtreeLayer );

		return wmtsZtreeLayer;
	};


	/**
	 * _getWMTSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wmtsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWMTSToc.prototype._getWMTSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerName" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			MatrixSet : node_[ "MatrixSet" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false,
			LegendURL : node_[ "LegendURL" ]
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerName" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			isGroupLayer : true,
			LegendURL : null,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WMTS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wmtsLayerData
	 */
	ugmp.toc.uGisWMTSToc.prototype._getWMTSLayerData = function() {
		var _self = this._this || this;

		var wmtsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerName,
			MatrixSet : _self.matrixSet,
			LegendURL : _self.legendURL
		};

		return wmtsLayerData;
	};

} )();

( function() {
	"use strict";

	/**
	 * Web WMS TOC 객체.
	 * 
	 * WMS 서비스의 TOC를 표현하는 객체. 원하는 레이어만 표현할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWebWmsToc = new ugmp.toc.uGisWebWMSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWMSLayer({...}),
	 *	capabilities : new ugmp.service.uGisGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	symbolSize : [20, 20],
	 *	visibleState : { 'LAYER_NAME1' : false, 'LAYER_NAME2' : false },
	 *	loadData : { 'LayerName' : 'ROOT', 'checked' : false, 'open' : true }
	 *	selectLayers : [ 'LAYER_NAME1', 'LAYER_NAME2' ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWMSLayer} {@link ugmp.layer.uGisWMSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.symbolSize {Array.<Number>} 범례 심볼 간격. Default is `[20, 20]`.
	 * @param opt_options.visibleState {Object} { layerName : Boolean } 형태로 초기 체크 상태 설정.
	 * @param opt_options.capabilities {ugmp.service.uGisGetCapabilitiesWMS} {@link ugmp.service.uGisGetCapabilitiesWMS} WMS capabilities.
	 * @param opt_options.selectLayers {Array.<String>} TOC에 추가할 레이어 리스트.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWebWMSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.symbolSize = null;
		this.capabilities = null;
		this.visibleState = null;
		this.selectLayers = null;

		this.key_zoomEnd = null;
		this.showLayerNames = null;
		this.key_changeResolution = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			var symbolSize = options.symbolSize;
			if ( !Array.isArray( symbolSize ) ) {
				_self.symbolSize = [ 20, 20 ];
			} else {
				_self.symbolSize = symbolSize;
			}

			_self.loadData = ( options.loadData !== undefined ) ? options.loadData : undefined;
			_self.visibleState = ( options.visibleState !== undefined ) ? options.visibleState : {};
			_self.selectLayers = ( options.selectLayers !== undefined ) ? options.selectLayers : [];
			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;

			if ( !_self.capabilities ) {
				ugmp.uGisConfig.alert_Error( "capabilities undefined" );
				return false;
			}

			_self.createTocDiv( "WebWMS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible,
				layerOrderChange : _layerOrderChange
			} );

			_self._createWMSToc( false );

			_self._createReloadBtn();

			_self._activeChangeResolution();

			_$( "#" + _self.tocAccorId ).find( "#CRS_TEXT" ).text( _self.capabilities.serviceMetaData[ "crs" ] );
			_$( "#" + _self.tocAccorId ).find( "#BBOX_TEXT" ).text( _self.capabilities.serviceMetaData[ "maxExtent" ].toString() );

			_self.uGisMap.getMap().getView().dispatchEvent( {
				type : "change:resolution"
			} );
		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			_self._olWMSLayerRefresh();
		}


		/**
		 * TOC 레이어 순서 변경 이벤트
		 */
		function _layerOrderChange(treeId, treeNodes, targetNode, moveType) {
			var state = false;

			if ( treeNodes[ 0 ] ) {
				var tocID = treeNodes[ 0 ][ "tId" ].split( "_" )[ 1 ];
				if ( treeId.split( "_" )[ 1 ] !== tocID ) {
					return false;
				}
			} else {
				return false;
			}

			if ( targetNode[ "isGroupLayer" ] ) {
				state = ( targetNode[ "drop" ] ) ? true : false;
				if ( targetNode[ "LayerName" ] === "ROOT" && moveType !== "inner" ) {
					state = false;
				}
			} else {
				state = ( moveType !== "inner" ) ? true : false;
			}

			return _self._layerOrderChangeListener( state );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			reLoad : _self.reLoad,
			getSaveData : _self.getSaveData,
			getShowLayerNames : _self.getShowLayerNames
		} );

	} );


	ugmp.toc.uGisWebWMSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWebWMSToc.prototype.constructor = ugmp.toc.uGisWebWMSToc;


	/**
	 * 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._layerOrderChangeListener = function(state) {
		var _self = this._this || this;

		if ( state ) {
			_self._olWMSLayerRefresh();
			setTimeout( function() {
				_self._olWMSLayerRefresh();
			}, 100 );
		}
		return state;
	};


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._createWMSToc = function(reload_ ) {
		var _self = this._this || this;

		var wmsZtreeLayer = _self._getWMSNodeTozTree( _self._getWMSLayerData()[ "Layers" ] );

		// 저장된 데이터 불러오기 (open, order, checked)
		if ( !reload_ && _self.loadData ) {
			var layerDataObject = _self._getLayerDataObject( wmsZtreeLayer, {} );
			wmsZtreeLayer = _self._setLoadData( layerDataObject, _$.extend( true, {}, _self.loadData ) );
		}

		if ( _self.selectLayers !== undefined ) {
			wmsZtreeLayer = _self._getSelectLayers( wmsZtreeLayer, _self.selectLayers );
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmsZtreeLayer );

		return wmsZtreeLayer;
	};


	/**
	 * 선택된 레이어 정보를 추출한다.
	 * 
	 * @param originWebWMSztreeLayer {Object} 원본 zTree 데이터.
	 * @param selectLayers {Array.<String>} 추가할 레이어 리스트.
	 * 
	 * @private
	 * 
	 * @return {Object} wmsZtreeLayer
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getSelectLayers = function(originWebWMSztreeLayer_, selectLayers_) {
		var _self = this._this || this;

		var reLoadData = [];
		var noneGroupLayers_origin = [];
		noneGroupLayers_origin = _self._getNoneGroupLayers( originWebWMSztreeLayer_, noneGroupLayers_origin );

		var temp = [];
		for ( var i in selectLayers_ ) {
			var selectLayerName = selectLayers_[ i ];
			for ( var j in noneGroupLayers_origin ) {
				var originLayer = noneGroupLayers_origin[ j ];
				if ( originLayer[ "LayerName" ] === selectLayerName ) {
					// originLayer["checked"] = false;
					temp.push( noneGroupLayers_origin.slice( j, j + 1 )[ 0 ] );
					noneGroupLayers_origin.splice( j, 1 );
				}
			}
		}

		// reLoadData = noneGroupLayers_origin.concat( temp );
		reLoadData = temp;

		originWebWMSztreeLayer_[ "children" ] = reLoadData;

		return originWebWMSztreeLayer_;
	};


	/**
	 * _getWMSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node_ {Object} wmsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSNodeTozTree = function(node_) {
		var _self = this._this || this;

		var layer = {
			id : null,
			name : null,
			children : [],
			drop : true,
			drag : true,
			open : true,
			checked : true,
			dropInner : true,
			chkDisabled : false,

			Extent : null,
			LayerName : null,
			LegendURL : null,
			MinScale : 0,
			MaxScale : Infinity,
			scaleVisible : true,
			isGroupLayer : false
		};


		for ( var i = 0; i < node_.length; i++ ) {
			layer[ "name" ] = node_[ i ][ "Title" ];
			layer[ "id" ] = node_[ i ][ "LayerName" ];
			layer[ "LayerName" ] = node_[ i ][ "LayerName" ];

			if ( typeof _self.visibleState[ layer[ "LayerName" ] ] === 'boolean' ) {
				layer[ "checked" ] = _self.visibleState[ layer[ "LayerName" ] ];
			}

			layer[ "LegendURL" ] = node_[ i ][ "LegendURL" ];

			var minScale = node_[ i ][ "MinScale" ];
			if ( typeof minScale !== "undefined" ) {
				layer[ "MinScale" ] = minScale;
			}

			var maxScale = node_[ i ][ "MaxScale" ];
			if ( typeof maxScale !== "undefined" ) {
				layer[ "MaxScale" ] = maxScale;
			}

			layer[ "Extent" ] = node_[ i ][ "Extent" ];
			layer[ "isGroupLayer" ] = node_[ i ][ "isGroupLayer" ];

			// 그룹레이어
			if ( layer[ "isGroupLayer" ] ) {
				layer[ "open" ] = ( _self.groupOpen ? true : false );
			}

			if ( layer[ "id" ] === "ROOT" ) {
				layer[ "open" ] = true;
				layer[ "drag" ] = false;
			}

			var childLayers = node_[ i ][ "ChildLayers" ];
			if ( childLayers.length > 0 ) {
				for ( var j = 0; j < childLayers.length; j++ ) {
					layer[ "children" ].push( _self._getWMSNodeTozTree( [ childLayers[ j ] ] ) );
				}
			} else {
				layer[ "drop" ] = false;
				layer[ "dropInner" ] = false;
				layer[ "iconSkin" ] = "pIconFeatureLayer";

				// 범례 오픈
				if ( !_self.legendOpen ) {
					layer[ "open" ] = false;
				}

				layer[ "children" ].push( {
					drag : false,
					drop : false,
					open : false,
					nocheck : true,
					isLegend : true,
					dropInner : false,
					LayerName : "leg_" + layer[ "LayerName" ],
					LegendURL : layer[ "LegendURL" ]
				} );
			}

		}

		return layer;
	};


	/**
	 * 해당 WMS 서비스의 capabilities를 통해 레이어 정보를 가져온다.
	 * 
	 * @private
	 * 
	 * @return wmsLayerData
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSLayerData = function() {
		var _self = this._this || this;

		var wmsLayerData = {
			CRS : _self.capabilities.serviceMetaData.crs,
			MaxExtent : _self.capabilities.serviceMetaData.maxExtent,
			Layers : []
		};

		var capabilitiesJSON = _self.capabilities.xmlJson[ "WMS_Capabilities" ][ "Capability" ][ "Layer" ];
		var layers = _self._getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
		wmsLayerData[ "Layers" ].push( layers );

		return wmsLayerData;
	};


	/**
	 * 해당 WMS 서비스의 capabilitie에서 TOC 생성에 필요한 데이터를 가져온다.
	 * 
	 * @private
	 * 
	 * @return layerData
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSCapabilitieLayerData = function(node_) {
		var _self = this._this || this;

		var layerData = {
			LayerName : null,
			Title : null,
			Extent : null,
			MinScale : null,
			MaxScale : null,
			LegendURL : null,
			isGroupLayer : false,
			isVisible : true,
			ChildLayers : []
		};

		for ( var i in node_ ) {
			var title = node_[ i ][ "Title" ];
			if ( typeof title !== "undefined" ) {
				title = title[ "#text" ];
			}
			var layerName = node_[ i ][ "Name" ];
			if ( typeof layerName !== "undefined" ) {
				layerName = layerName[ "#text" ];
			}
			var extent = node_[ i ][ "BoundingBox" ];
			if ( typeof extent !== "undefined" ) {
				if ( Array.isArray( extent ) ) {
					extent = extent[ 0 ];
				}
				extent = extent[ "@attributes" ];
				extent = [ parseFloat( extent[ "minx" ] ), parseFloat( extent[ "miny" ] ), parseFloat( extent[ "maxx" ] ), parseFloat( extent[ "maxy" ] ) ];
			}
			var minScale = node_[ i ][ "MinScaleDenominator" ];
			if ( typeof minScale !== "undefined" ) {
				minScale = parseFloat( minScale[ "#text" ] );
			}
			var maxScale = node_[ i ][ "MaxScaleDenominator" ];
			if ( typeof maxScale !== "undefined" ) {
				maxScale = parseFloat( maxScale[ "#text" ] );
			}
			var style = node_[ i ][ "Style" ];
			var legendURL;
			if ( typeof style !== "undefined" ) {

				if ( Array.isArray( style ) ) {
					style = style[ 0 ];
				}

				if ( typeof style[ "LegendURL" ] !== "undefined" ) {
					legendURL = style[ "LegendURL" ][ "OnlineResource" ][ "@attributes" ][ "xlink:href" ];
					legendURL += "&SYMBOL_WIDTH=" + _self.symbolSize[ 0 ];
					legendURL += "&SYMBOL_HEIGHT=" + _self.symbolSize[ 1 ];
				}
			}

			var childLayer = node_[ i ][ "Layer" ];

			if ( !Array.isArray( childLayer ) && typeof childLayer !== "undefined" ) {
				childLayer = [ childLayer ];
			}

			if ( Array.isArray( childLayer ) ) {
				layerData[ "isGroupLayer" ] = true;
				for ( var j = childLayer.length; --j >= 0; ) {
					layerData[ "ChildLayers" ].push( _self._getWMSCapabilitieLayerData( [ childLayer[ j ] ] ) );
				}
			}

			layerData[ "LayerName" ] = layerName;
			layerData[ "Title" ] = title;
			layerData[ "Extent" ] = extent;
			layerData[ "MinScale" ] = minScale;
			layerData[ "MaxScale" ] = maxScale;
			layerData[ "LegendURL" ] = legendURL;

		}

		return layerData;
	};


	/**
	 * 레이어 그룹해제
	 * 
	 * @private
	 * 
	 * @return noneGroupLayers
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getNoneGroupLayers = function(layers_, noneGroupLayers_) {
		var _self = this._this || this;

		layers_ = [ layers_ ];
		for ( var i in layers_ ) {
			var layer = layers_[ i ];

			if ( layer.isGroupLayer ) {
				var childs = layer[ "children" ];
				for ( var j in childs ) {
					var child = childs[ j ];
					_self._getNoneGroupLayers( child, noneGroupLayers_ );
				}
			} else {
				noneGroupLayers_.push( layer );
			}
		}

		return noneGroupLayers_;
	};


	/**
	 * 스케일 변경 이벤트 활성화 설정
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.uGisMap.getMap().getView();

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			_self.key_changeResolution = view_.on( "change:resolution", function() {
				_changeResolution();
			} );
		}


		// 스케일 변경 이벤트
		function _changeResolution() {
			var scale = _self.uGisMap.calculateScale( {
				extent : _self.uGisMap.getMap().getView().calculateExtent( _self.uGisMap.getMap().getSize() ),
				originCRS : _self.capabilities.serviceMetaData[ "crs" ]
			} );

			scale = Math.ceil( scale );

			var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
			_updateScale( layers, scale );
			_$.fn.zTree.getZTreeObj( _self.tocDivId ).refresh();
			_self._olWMSLayerRefresh();
		}


		// 스케일 변경 시 해당 레이어의 MinScale, MaxScale 값에 따른 View 상태 처리
		function _updateScale(layer, scale) {
			if ( !layer[ "isLegend" ] ) {
				if ( ( layer[ "MinScale" ] <= scale ) && ( scale < layer[ "MaxScale" ] ) ) {
					layer.scaleVisible = true;
					layer.chkDisabled = false;
				} else {
					layer.scaleVisible = false;
					layer.chkDisabled = true;
				}
			}

			var children = layer.children;

			if ( Array.isArray( children ) ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[ i ];
					_updateScale( child, scale );
				}
			}
		}

	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 설정
	 * 
	 * @private
	 * 
	 * @return layerNames {String<String>} 레이어 리스트 toString
	 */
	ugmp.toc.uGisWebWMSToc.prototype.setZtreeLayerData = function() {
		var _self = this._this || this;

		var layerNames = [];
		var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
		layerNames = _self._getZtreeLayerData( layers, layerNames, "show" );
		layerNames = ( typeof layerNames === "undefined" ) ? "" : layerNames.toString();
		_self.showLayerNames = layerNames;
		return layerNames;
	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 가져오기
	 * 
	 * @private
	 * 
	 * @return names {Array.<String>}
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getZtreeLayerData = function(layers, names, type) {
		var _self = this._this || this;

		var layer = [ layers ];
		for ( var i in layer ) {
			var data = layer[ i ];

			if ( ( type === "show" && data[ "checked" ] === false ) || ( type === "show" && data[ "chkDisabled" ] === true ) ) {
				return;
			}

			if ( data.isGroupLayer ) {
				var childs = data[ "children" ];
				for ( var j = childs.length; --j >= 0; ) {
					var child = childs[ j ];
					_self._getZtreeLayerData( child, names, type );
				}
			} else {
				names.push( data[ "LayerName" ] );
			}
		}

		return names;
	};


	/**
	 * 레이어 새로고침.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._olWMSLayerRefresh = function() {
		var _self = this._this || this;

		var olLayer = _self.uGisLayer.getOlLayer();

		olLayer.getSource().getParams().LAYERS = _self.setZtreeLayerData();
		olLayer.getSource().getParams().refTime = new Date().getMilliseconds();
		olLayer.getSource().updateParams( olLayer.getSource().getParams() );

		if ( olLayer.getSource().getParams().LAYERS === "" ) {
			_self.uGisLayer.setTocVisible( false );
		} else {
			if ( !( _self.uGisLayer.getVisible() ) ) {
				_self.uGisLayer.setTocVisible( true );
			}
		}
	};


	/**
	 * TOC의 모든 레이어를 { Key : Value } 형태로 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getLayerDataObject = function(layer_, layerDataObj_) {
		var _self = this._this || this;

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
				_self._getLayerDataObject( child, layerDataObj_ );
			}
		} else {
			layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
		}

		return layerDataObj_;
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.getSaveData = function() {
		var _self = this._this || this;

		var zTreeNodes = $.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];

		return _self._getSaveData( _$.extend( true, {}, zTreeNodes ) );
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getSaveData = function(layer_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children", "LayerName" ];

		for ( var key in layer_ ) {
			if ( layer_.hasOwnProperty( key ) ) {
				if ( _$.inArray( key, ignores ) === -1 ) {
					delete layer_[ key ];
				}
			}
		}

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._getSaveData( child );
			}
		}

		return layer_;
	};


	/**
	 * 로드할 TOC 목록 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._setLoadData = function(layerDataObj_, loadData_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children" ];

		var data = layerDataObj_[ loadData_[ "LayerName" ] ];

		for ( var key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				if ( $.inArray( key, ignores ) === -1 ) {
					loadData_[ key ] = data[ key ];
				}
			}
		}


		var children = loadData_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._setLoadData( layerDataObj_, child );
			}
		}

		return loadData_;
	};


	/**
	 * TOC Reload 버튼 생성.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._createReloadBtn = function() {
		var _self = this._this || this;

		var $btn = $( '<a/>', {
			click : function() {
				_self.reLoad();
			}
		} ).append( $( '<span/>', {
			'class' : 'glyphicon glyphicon-refresh',
			'title' : '새로고침'
		} ) );

		_$( "#" + _self.tocDivId ).parent().find( ".tocEventDIV.sub" ).prepend( $btn );
	};


	/**
	 * 현재 보여지고 있는 레이어 목록 가져오기.
	 * 
	 * uniq가 true면 중복된 레이어를 제거한다.
	 * 
	 * @return showLayerList {Array.<String>} 현재 보여지고 있는 레이어 목록.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.getShowLayerNames = function(uniq_) {
		var _self = this._this || this;

		var showLayerList = _self.showLayerNames.split( ',' );

		if ( uniq_ ) {
			showLayerList = showLayerList.reduce( function(a, b) {
				if ( a.indexOf( b ) < 0 ) a.push( b );
				return a;
			}, [] );
		}

		return showLayerList;
	};


	/**
	 * TOC를 다시 로드한다.
	 * 
	 * ※설정된 {@link ugmp.service.uGisGetCapabilitiesWMS}를 기준으로 다시 로드한다.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.reLoad = function() {
		var _self = this._this || this;

		$.fn.zTree.destroy( _self.tocDivId );
		_self._createWMSToc( true );

		_self.uGisMap.getMap().getView().dispatchEvent( {
			type : "change:resolution"
		} );
	};


	/**
	 * TOC를 삭제한다.
	 * 
	 * @override
	 */
	ugmp.toc.uGisWebWMSToc.prototype.remove = function() {
		var _self = this._this || this;

		ugmp.toc.uGisTocDefault.prototype.remove.call( this );

		ol.Observable.unByKey( _self.key_changeResolution );
	};

} )();

/**
 * @namespace ugmp.baseMap
 */

( function() {
	"use strict";

	/**
	 * uGisBaseMap 기본 객체.
	 * 
	 * 배경지도의 기본 객체로 배경지도의 코드값은 언더바(_) 기준으로 나눈다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.isWorld {Boolean} 세계 좌표 여부. Default is `true`.
	 * @param opt_options.isFactor {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부. Default is `true`.
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `custom_code`.
	 * @param opt_options.mapTypes {Object} 베이스맵 타입 별 속성 정보.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * @param opt_options.maxExtent {Array.<Double>} 베이스맵 최대 영역. Default is `EPSG:3857 Extent`.
	 * @param opt_options.isAvailable {Boolean} 베이스맵 사용 가능 여부.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapDefault = ( function(opt_options) {
		var _self = this;

		this.target = null;

		this.apiMap = null;
		this.isWorld = null;
		this.isFactor = null;
		this.baseCode = null;
		this.mapTypes = null;
		this.projection = null;
		this.maxExtent = null;
		this.isAvailable = null;
		this.resolutions = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
			_self.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
			_self.apiMap = ( options.apiMap !== undefined ) ? options.apiMap : undefined;
			_self.mapTypes = ( options.mapTypes !== undefined ) ? options.mapTypes : {};
			_self.projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";
			_self.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "custom_code";
			_self.resolutions = ( options.resolutions !== undefined ) ? options.resolutions : undefined;
			_self.maxExtent = ( options.maxExtent !== undefined ) ? options.maxExtent : ol.proj.get( "EPSG:3857" ).getExtent();

		} )();
		// END initialize


		return {
			isWorlds : _self.isWorlds,
			isFactors : _self.isFactors,
			getApiMap : _self.getApiMap,
			updateSize : _self.updateSize,
			setMapType : _self.setMapType,
			isAvailables : _self.isAvailables,
			syncMapZoom : _self.syncMapZoom,
			syncMapCenter : _self.syncMapCenter,
			syncMapRotation : _self.syncMapRotation,
			getUsableKeys : _self.getUsableKeys,
			createBaseMap : _self.createBaseMap,
			getTypeProperties : _self.getTypeProperties
		}

	} );


	/**
	 * 지도 API 맵을 생성한다.
	 * 
	 * @abstract
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.createBaseMap = function(target_, type_) {
	};


	/**
	 * 지도 줌 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:resolution>
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.syncMapZoom = function(evt_) {
	};


	/**
	 * 지도 화면 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:center>
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.syncMapCenter = function(evt_) {
	};


	/**
	 * 지도 회전 이동 이벤트 동기화.
	 * 
	 * @abstract
	 * 
	 * @param evt {Function} <change:resolution|change:center>
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.syncMapRotation = function(evt_) {
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.setMapType = function(type_) {
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @abstract
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.updateSize = function() {
	};


	/**
	 * 타입에 해당하는 속성 정보 가져온다.
	 * 
	 * @abstract
	 * 
	 * @param type {String} 배경지도 타입.
	 * 
	 * @return {Object} 해당 타입 속성
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getTypeProperties = function(type_) {
		var _self = this._this || this;

		var minZoom = _self.mapTypes[ type_ ][ "minZoom" ];
		var maxZoom = _self.mapTypes[ type_ ][ "maxZoom" ];

		return {
			minZoom : minZoom,
			maxZoom : maxZoom,
			baseCode : _self.baseCode,
			projection : _self.projection,
			maxExtent : _self.maxExtent,
			resolutions : _self.resolutions,
			id : _self.mapTypes[ type_ ][ "id" ]
		}
	};


	/**
	 * API 사용 가능 여부를 설정한다.
	 * 
	 * @param script {String} API 사용 테스트 스크립트.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.checkIsAvailable = function(script_) {
		var _self = this._this || this;

		try {
			new Function( script_.toString() )();
			_self.isAvailable = true;
		} catch ( e ) {
			_self.isAvailable = false;
		}
	};


	/**
	 * 사용 가능한 타입(키) 리스트를 가져온다.
	 * 
	 * @return {Array.<String>} 사용 가능한 타입(키) 리스트를.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getUsableKeys = function() {
		var _self = this._this || this;

		var usableKeys = [];
		var types = _self.mapTypes;
		for ( var i in types ) {
			if ( i.indexOf( "custom_" ) > -1 ) {
				usableKeys.push( _self.baseCode );
			} else {
				usableKeys.push( _self.baseCode + "_" + i );
			}
		}

		return usableKeys;
	};


	/**
	 * 동기화 데이터.
	 * 
	 * @param evt {Function} ol3 change:resolution, change:center
	 * 
	 * @return {Object} 현재 View의 동기화 데이터.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getSyncData = function(evt_) {
		var _self = this._this || this;

		var view = evt_.target;

		if ( view instanceof ol.Map ) {
			view = view.getView();
		}

		return {
			view : view,
			center : view.getCenter(),
			rotation : view.getRotation(),
			projection : view.getProjection(),
			resolution : view.getResolution(),
			zoom : Math.round( view.getZoom() )
		};
	};


	/**
	 * 베이스맵 사용 가능 여부.
	 * 
	 * @return {Boolean} 베이스맵 사용 가능 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isAvailables = function() {
		var _self = this._this || this;
		return _self.isAvailable;
	};


	/**
	 * 세계 좌표 여부.
	 * 
	 * @return {Boolean} 세계 좌표 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isWorlds = function() {
		var _self = this._this || this;
		return _self.isWorld;
	};


	/**
	 * 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 * 
	 * @return {Boolean} 좌표계 별 zoomFactor 차이를 맞추기 위한 factor 사용 여부.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.isFactors = function() {
		var _self = this._this || this;
		return _self.isFactor;
	};


	/**
	 * 배경지도의 API 객체를 가져온다.
	 * 
	 * @return apiMap {Object} 배경지도의 API 객체.
	 */
	ugmp.baseMap.uGisBaseMapDefault.prototype.getApiMap = function() {
		var _self = this._this || this;
		return _self.apiMap;
	};

} )();

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 배경지도 객체.
	 * 
	 * 다양하게 제공되는 지도 API나 WMTS 서비스를 배경지도로 사용할 수 있다.
	 * 
	 * uGisMapPlatForm에서 기본적으로 내장한 배경지도 API는 다음과 같으며, API KEY가 정상적인 경우에만 사용할 수 있다.
	 * 
	 * 1. Google(normal, terrain, satellite, hybrid) : 월 28,500건 무료.
	 * 
	 * 2. OpenStreetMap(normal, gray) : 무제한 무료.
	 * 
	 * 3. Stamen(toner, terrain) : 무제한 무료.
	 * 
	 * 4. vWorld(normal, gray, satellite, hybrid, midnight) : 무제한 무료.
	 * 
	 * 5. 바로E맵(normal, white, colorVision) : 무제한 무료.
	 * 
	 * 6. 네이버(normal, satellite, hybrid, terrain) : 무료.
	 * 
	 * 7. 다음(normal, satellite, hybrid) : 월 300,000건 무료.
	 * 
	 * 8. Bing(normal, aerial, hybrid, dark) : 1년 125,000건 무료.
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugBaseMap = new ugmp.baseMap.uGisBaseMap( {
	 * 	target : 'base',
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	baseMapKey : 'google_normal'
	 * 	useElementMargin : false
	 * } );
	 * </pre>
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.target {String} 배경지도 DIV ID.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.baseMapKey {String} 배경지도 Key ( _로 구분 ). Default is `osm_normal`.
	 * @param opt_options.useElementMargin {Boolean} 배경지도 회전 시 공백 처리를 위한 element의 여백 사이즈 사용 유무 . Default is `true`.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMap = ( function(opt_options) {
		var _self = this;

		this.target = null;
		this.uGisMap = null;
		this.useElementMargin = null;

		this.UUID = null;
		this.nowMapView = null;
		this.baseMapList = null;
		this.nowBaseMapKey = null;

		this.key_changeCenter = null;
		this.key_elementResize = null;
		this.key_changeRotation = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.UUID = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
			_self.target = ( options.target !== undefined ) ? options.target : undefined;
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.nowBaseMapKey = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "osm_normal";
			_self.useElementMargin = ( options.useElementMargin !== undefined ) ? options.useElementMargin : true;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_self.addBaseMapType( "osm", new ugmp.baseMap.uGisBaseMapOSM() );
			_self.addBaseMapType( "bing", new ugmp.baseMap.uGisBaseMapBing() );
			_self.addBaseMapType( "daum", new ugmp.baseMap.uGisBaseMapDaum() );
			_self.addBaseMapType( "naver", new ugmp.baseMap.uGisBaseMapNaver() );
			_self.addBaseMapType( "google", new ugmp.baseMap.uGisBaseMapGoogle() );
			_self.addBaseMapType( "vWorld", new ugmp.baseMap.uGisBaseMapVWorld() );
			_self.addBaseMapType( "stamen", new ugmp.baseMap.uGisBaseMapStamen() );
			_self.addBaseMapType( "baroEmap", new ugmp.baseMap.uGisBaseMapBaroEmap() );

			_self._callBaseMapType( _self.nowBaseMapKey );

			_self.setVisible( true );
		} )();
		// END initialize


		return {
			_this : _self,
			remove : _self.remove,
			setVisible : _self.setVisible,
			getVisible : _self.getVisible,
			getApiMap : _self.getApiMap,
			setOpacity : _self.setOpacity,
			getOpacity : _self.getOpacity,
			visibleToggle : _self.visibleToggle,
			changeBaseMap : _self.changeBaseMap,
			addBaseMapType : _self.addBaseMapType,
			getSelectedBaseMap : _self.getSelectedBaseMap,
			getUsableBaseMapList : _self.getUsableBaseMapList
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._callBaseMapType = function(baseMapKey_) {
		var _self = this._this || this;

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			ugmp.uGisConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		$( "#" + _self.target ).prepend( $( "<div>", {
			'id' : _self.UUID,
			'style' : "width: 100%; height: 100%; position: relative; overflow: hidden"
		} ) );

		ugmp.util.uGisUtil.setCssTextStyle( $( "#" + _self.target )[ 0 ], "overflow", "hidden !important" );

		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];
		var properties = baseMap.getTypeProperties( type );

		baseMap.createBaseMap( _self.UUID, type, function(state_) {
			ugmp.uGisConfig.loading( _self.uGisMap.getDataViewId(), state_ );
		} );

		var view = _self._createView( baseMap, type );

		_self._activeChangeResolution( baseMap );

		_self._transformLayerProjection( _self.uGisMap.getMap().getView().getProjection().getCode(), properties[ "projection" ] );

		_self.uGisMap.getMap().setView( view );

		_self._setElementMargin();

		_self.uGisMap.refresh();

		_$( "#" + _self.target ).resize( function() {
			if ( _self._updateSize ) {
				_self._setElementMargin();
				_self._updateSize();
			}
		} );

		_$( window ).resize( function() {
			if ( _self._updateSize ) {
				_self._setElementMargin();
				_self._updateSize();
			}
		} );
	};


	/**
	 * uGisMap <==> uGisBaseMap 동기화 설정 사용
	 * 
	 * @param baseMap {ugmp.baseMap} 배경지도 객체
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var view = _self.uGisMap.getMap().getView();

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeCenter );
			ol.Observable.unByKey( _self.key_changeRotation );
			ol.Observable.unByKey( _self.key_changeResolution );

			_self.key_changeCenter = evt1_.target.getView().on( "change:center", baseMap_.syncMapCenter );
			_self.key_changeRotation = evt1_.target.getView().on( "change:rotation", baseMap_.syncMapRotation );
			_self.key_changeResolution = evt1_.target.getView().on( "change:resolution", baseMap_.syncMapZoom );
		} );
	};


	/**
	 * 배경지도를 추가한다.
	 * 
	 * {@link ugmp.baseMap.uGisBaseMapDefault ugmp.baseMap.uGisBaseMapDefault}를 확장한 배경지도 객체 또는 사용자 정의 배경지도(WMTS)를 추가할 수 있다.
	 * 
	 * 사용자 정의 배경지도(WMTS)를 추가하기 위해서는 {@link ugmp.baseMap.uGisBaseMapCustom ugmp.baseMap.uGisBaseMapCustom}를 사용한다.
	 * 
	 * 기본 내장 배경지도 코드. ["osm", "daum", "naver", "vWorld", "baroEmap", "stamen", "google"]
	 * 
	 * @param code {String} 배경지도 코드.
	 * @param obj {Object} etc -> uGisBaseMapCustom.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.addBaseMapType = function(code_, obj_) {
		var _self = this._this || this;

		_self.baseMapList = _self.baseMapList || {};

		if ( obj_ && obj_.isAvailables() ) {
			_self.baseMapList[ code_ ] = {
				code : code_,
				object : obj_
			}
		}
	};


	/**
	 * View 생성
	 * 
	 * @param baseMap {String} 배경지도
	 * @param type {String} 배경지도 타입
	 * 
	 * @return nowMapView {ol.View} 현재 Map의 View
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._createView = function(baseMap_, type_) {
		var _self = this._this || this;

		var properties = baseMap_.getTypeProperties( type_ );
		var oldView = _self.uGisMap.getMap().getView();

		var viewData = {
			projection : properties[ "projection" ],
			extent : properties[ "maxExtent" ],
			center : ol.proj.transform( oldView.getCenter(), oldView.getProjection(), properties[ "projection" ] ),
			zoom : oldView.getZoom(),
			rotation : oldView.getRotation(),
			minZoom : properties[ "minZoom" ],
			maxZoom : properties[ "maxZoom" ]
		};

		if ( type_.indexOf( "custom" ) > -1 ) {
			// delete viewData.minZoom;
			// delete viewData.maxZoom;
		}

		if ( properties[ "resolutions" ] ) {
			viewData.resolutions = properties[ "resolutions" ]
		}

		_self.nowMapView = new ol.View( viewData );

		return _self.nowMapView;
	};


	/**
	 * 피처 좌표계 변경
	 * 
	 * View가 변경 됨에 따라 좌표계가 변경 되므로 해당 좌표계에 맞게 레이어 정보 변경
	 * 
	 * @param source {String} 원본 좌표계
	 * @param destination {String} 변경 좌표계
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._transformLayerProjection = function(source_, destination_) {
		var _self = this._this || this;

		var layers = _self.uGisMap.getMap().getLayers().getArray();
		for ( var idx_layer in layers ) {

			if ( layers[ idx_layer ] instanceof ol.layer.Group ) {
				var orderGroupLayers = layers[ idx_layer ].getLayersArray();
				for ( var i in orderGroupLayers ) {
					transform( orderGroupLayers[ i ], source_, destination_ );
				}

			} else {
				transform( layers[ idx_layer ], source_, destination_ );
			}

		}


		function transform(layer_, source_, destination_) {
			var source = layer_.getSource();
			if ( source instanceof ol.source.TileWMS || source instanceof ol.source.ImageWMS ) {
				if ( destination_ === "EPSG:4326" ) {
					// source.getParams().CRS = "EPSG:4326";
					source.getParams().VERSION = "1.1.0";
					source.updateParams( source.getParams() );
				}
			} else if ( source instanceof ol.source.Vector ) {
				/**
				 * ★ - To do : 피처 좌표변경 추가 작업 필요.
				 */

				if ( source instanceof ol.source.Cluster ) return false;

				var features = source.getFeatures();
				for ( var idx_feature in features ) {
					features[ idx_feature ].getGeometry().transform( source_, destination_ );
				}
			}
		}
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._updateSize = function() {
		var _self = this._this || this;

		var code = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var type = _self.nowBaseMapKey.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = _self.nowBaseMapKey;
			type = _self.nowBaseMapKey;
		}

		var baseMap = _self.baseMapList[ code ][ "object" ];

		baseMap.updateSize();
	};


	/**
	 * 해당 배경지도가 사용 가능한지 확인한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._isBaseMapUsable = function(baseMapKey_) {
		var _self = this._this || this;

		var usable = true;
		var code = baseMapKey_.split( "_" )[ 0 ];
		var type = baseMapKey_.split( "_" )[ 1 ];

		if ( code.indexOf( "custom" ) > -1 ) {
			code = baseMapKey_;
			type = baseMapKey_;
		}

		if ( _self.baseMapList[ code ] ) {
			var baseMap = _self.baseMapList[ code ][ "object" ];
			var usableKeys = baseMap.getUsableKeys();
			if ( !( usableKeys.indexOf( baseMapKey_ ) !== -1 ) ) {
				usable = false;
			}

		} else {
			usable = false;
		}

		return usable;
	};


	/**
	 * 배경지도를 변경한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 */
	ugmp.baseMap.uGisBaseMap.prototype.changeBaseMap = function(baseMapKey_) {
		var _self = this._this || this;

		if ( baseMapKey_ === _self.nowBaseMapKey ) {
			return false;
		}

		if ( !_self._isBaseMapUsable( baseMapKey_ ) ) {
			ugmp.uGisConfig.alert_Error( baseMapKey_ + " undefined" );
			return false;
		}

		var beforeBMCode = _self.nowBaseMapKey.split( "_" )[ 0 ];
		var beforeBMType = _self.nowBaseMapKey.split( "_" )[ 1 ];
		var afterBMCode = baseMapKey_.split( "_" )[ 0 ];
		var afterBMType = baseMapKey_.split( "_" )[ 1 ];

		if ( beforeBMCode.indexOf( "custom" ) > -1 ) {
			beforeBMCode = _self.nowBaseMapKey;
			beforeBMType = _self.nowBaseMapKey;
		}
		if ( afterBMCode.indexOf( "custom" ) > -1 ) {
			afterBMCode = baseMapKey_;
			afterBMType = baseMapKey_;
		}

		var beforeBaseMap = _self.baseMapList[ beforeBMCode ][ "object" ];
		var afterBaseMap = _self.baseMapList[ afterBMCode ][ "object" ];

		var beforeProperties = beforeBaseMap.getTypeProperties( beforeBMType );
		var afterProperties = afterBaseMap.getTypeProperties( afterBMType );


		// 배경지도 코드가 같으면서 타입이 다를 때
		if ( ( beforeBMCode === afterBMCode ) && ( beforeBMType !== afterBMType ) ) {
			afterBaseMap.setMapType( afterBMType, function(state_) {
				ugmp.uGisConfig.loading( _self.uGisMap.getDataViewId(), state_ );
			} );
			var view = _self.nowMapView;

			view.setMinZoom( afterProperties.minZoom );
			view.setMaxZoom( afterProperties.maxZoom );
		} else {
			// 배경지도 코드가 다를 때
			var viewExtent = _self.nowMapView.calculateExtent( _self.uGisMap.getMap().getSize() );
			var beforeProjection = beforeProperties[ "projection" ];
			var afterProjection = afterProperties[ "projection" ];
			var beforeZoomCount = beforeProperties[ "zoomCount" ];
			var afterZoomCount = afterProperties[ "zoomCount" ];

			document.getElementById( _self.UUID ).innerHTML = "";
			document.getElementById( _self.UUID ).style.background = "";

			afterBaseMap.createBaseMap( _self.UUID, afterBMType, function(state_) {
				ugmp.uGisConfig.loading( _self.uGisMap.getDataViewId(), state_ );
			} );

			var view = _self._createView( afterBaseMap, afterBMType );

			_self._activeChangeResolution( afterBaseMap );

			if ( !( ol.proj.equivalent( ol.proj.get( beforeProjection ), ol.proj.get( afterProjection ) ) ) ) {
				_self._transformLayerProjection( beforeProjection, afterProjection );
			}

			_self.uGisMap.getMap().setView( view );

			if ( beforeBaseMap.isWorlds() ) {

				if ( !afterBaseMap.isWorlds() ) {
					// 세계 좌표계에서 변경될 때
					var afterExtent = afterProperties.maxExtent;
					afterExtent = ol.proj.transformExtent( afterExtent, afterProjection, "EPSG:3857" );
					viewExtent = ol.proj.transformExtent( viewExtent, beforeProjection, "EPSG:3857" );

					// 현재 영역이 변경되는 배경지도의 좌표계에 포함될 때
					if ( ol.extent.containsExtent( afterExtent, viewExtent ) ) {
						view.fit( ol.proj.transformExtent( viewExtent, "EPSG:3857", afterProjection ) );
						if ( afterBaseMap.isFactors() ) {
							view.setZoom( view.getZoom() + 1 );
						}
					} else {
						// 포함되지 않으면 변경되는 배경지도의 FullExtent로 설정
						view.fit( afterProperties.maxExtent );
					}
				}

			} else {
				view.fit( ol.proj.transformExtent( viewExtent, beforeProjection, afterProjection ) );

				if ( afterBaseMap.isFactors() ) {
					view.setZoom( view.getZoom() + 1 );
				}
			}

		}

		_self.setVisible( true );

		_self.uGisMap.refresh();

		_self.nowBaseMapKey = baseMapKey_;

		console.log( "####### changeBaseMap #######" );
		console.log( "baseMapType : " + _self.nowBaseMapKey );
	};


	/**
	 * 사용 가능한 배경지도 타입(키) 목록을 가져온다.
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getUsableBaseMapList = function() {
		var _self = this._this || this;

		var usableBaseMapList = [];

		for ( var i in _self.baseMapList ) {
			usableBaseMapList = usableBaseMapList.concat( _self.baseMapList[ i ][ "object" ].getUsableKeys() );
		}

		return usableBaseMapList;
	};


	/**
	 * 배경지도를 삭제한다.
	 * 
	 * @param baseMapKey {String} 배경지도 키 (_로 구분).
	 * 
	 * @return {Array.<String>} 배경지도 키 목록.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.remove = function(baseMapKey_) {
		var _self = this._this || this;

		var code = baseMapKey_.split( "_" )[ 0 ];

		// 사용자 정의 배경지도만 삭제
		if ( code.indexOf( "custom" ) > -1 ) {
			// 활성화된 배경지도 삭제 시
			if ( _self.nowBaseMapKey === baseMapKey_ ) {
				for ( var base in _self.baseMapList ) {
					if ( _self.baseMapList.hasOwnProperty( base ) ) {
						var tempBaseMap = _self.baseMapList[ base ][ "object" ].getUsableKeys()[ 0 ];
						_self.changeBaseMap( tempBaseMap );
						break;
					}
				}
			}

			delete _self.baseMapList[ baseMapKey_ ];
		}

		return _self.getUsableBaseMapList();
	};


	/**
	 * 현재 선택된 배경지도의 키를 가져온다.
	 * 
	 * @return nowBaseMapKey {String} 현재 선택된 배경지도 키.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getSelectedBaseMap = function() {
		var _self = this._this || this;
		return _self.nowBaseMapKey;
	};


	/**
	 * 배경지도의 불투명도를 가져온다.
	 * 
	 * @return opacity {Double} 배경지도 불투명도 값.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		return element.style.opacity;
	};


	/**
	 * 배경지도의 불투명도를 설정할 수 있다.
	 * 
	 * 0.0 ~ 1.0 사이의 숫자. 0.0 = 투명, 1.0 = 불투명
	 * 
	 * @param opacity {Double} 배경지도 불투명도 값.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.setOpacity = function(opacity_) {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		if ( typeof opacity_ === 'number' ) {
			element.style.opacity = opacity_;
		}
	};


	/**
	 * 배경지도의 ON/OFF 상태를 가져온다.
	 * 
	 * @return visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getVisible = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );

		return ( element.style.visibility === 'visible' ) ? true : false;
	};


	/**
	 * 배경지도를 끄거나 켤 수 있다.
	 * 
	 * @param visible {Boolean} 배경지도 ON/OFF 상태.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.setVisible = function(visible_) {
		var _self = this._this || this;

		var visibility = 'visible';
		var element = document.getElementById( _self.UUID );

		if ( typeof visible_ === 'boolean' ) {
			if ( !visible_ ) {
				visibility = 'hidden';
			}
		}

		element.style.visibility = visibility;
	};


	/**
	 * 배경지도의 ON/OFF 상태를 토글한다.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.visibleToggle = function() {
		var _self = this._this || this;

		var element = document.getElementById( _self.UUID );
		var visibility = element.style.visibility;

		if ( visibility === 'visible' ) {
			_self.setVisible( false );
		} else {
			_self.setVisible( true );
		}
	};


	/**
	 * 현재 배경지도의 API 객체를 가져온다.
	 * 
	 * @return apiMap {Object} 현재 배경지도의 API 객체.
	 */
	ugmp.baseMap.uGisBaseMap.prototype.getApiMap = function() {
		var _self = this._this || this;
		return _self.baseMapList[ _self.nowBaseMapKey.split( "_" )[ 0 ] ][ "object" ].getApiMap();
	};


	/**
	 * 배경지도 회전 시 공백 처리를 위한 element의 여백 사이즈를 설정한다.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMap.prototype._setElementMargin = ( function() {
		var _self = this._this || this;

		if ( !_self.useElementMargin ) return false;

		var $target = $( "#" + _self.target );
		var $base = $( "#" + _self.UUID );

		var originWidth = $target.width();
		var originHeight = $target.height();
		var diagonalLength = Math.round( Math.sqrt( Math.pow( $target.width(), 2 ) + Math.pow( $target.height(), 2 ) ) );
		var interval_width = Math.round( diagonalLength - originWidth );
		var interval_height = Math.round( diagonalLength - originHeight );
		if ( interval_width % 2 === 1 ) ++interval_width;
		if ( interval_height % 2 === 1 ) ++interval_height;

		$base.css( "width", 'calc(100% + ' + interval_width + 'px)' );
		$base.css( "height", 'calc(100% + ' + interval_height + 'px)' );
		$base.css( "left", -( interval_width / 2 ) );
		$base.css( "top", -( interval_height / 2 ) );
	} );

} )();

( function() {
	"use strict";

	/**
	 * 바로E맵 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.resolutions = [ 1954.597389, 977.2986945, 488.64934725, 244.324673625, 122.1623368125, 61.08116840625, 30.540584203125, 15.2702921015625,
					7.63514605078125, 3.817573025390625, 1.9087865126953125, 0.9543932563476563, 0.47719662817382813, 0.23859831408691406 ];

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "baroEmap";
			options.projection = "EPSG:5179";
			options.maxExtent = ol.proj.get( "EPSG:5179" ).getExtent();
			options.mapTypes = {
				normal : {
					id : 0,
					minZoom : 0,
					maxZoom : 12
				},
				white : {
					id : 4,
					minZoom : 0,
					maxZoom : 12
				},
				colorVision : {
					id : 1,
					minZoom : 0,
					maxZoom : 12
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ngii.version" );

			if ( !_self.isAvailables() ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var baroEmapCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var baroEmapLevel = syncData[ "zoom" ];
			_self.apiMap.setCenter( baroEmapCenter, baroEmapLevel, false, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var baroEmapCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var baroEmapLevel = syncData[ "zoom" ];
			_self.apiMap.setCenter( baroEmapCenter, baroEmapLevel, false, false );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapBaroEmap.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.constructor = ugmp.baseMap.uGisBaseMapBaroEmap;


	/**
	 * 바로E맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;
		_self.apiMap = new ngii.map( target_ );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입 설정
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap._setMapMode( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapBaroEmap.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layer = _self.apiMap._getMap().baseLayer;
		layer.events.register( "loadstart", layer, function() {
			loadEvents_.call( this, true );
		} );
		layer.events.register( "loadend", layer, function() {
			loadEvents_.call( this, false );
		} );
		layer.events.register( "tileloadstart", layer, function() {
			loadEvents_.call( this, true );
		} );
		layer.events.register( "tileloaded", layer, function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * Bing 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapBing = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "bing";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'RoadOnDemand'
							} )
						} )
					},
					minZoom : 0,
					maxZoom : 19
				},
				aerial : {
					id : "aerial",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'Aerial'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				},
				hybrid : {
					id : "hybrid",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'AerialWithLabelsOnDemand'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				},
				dark : {
					id : "dark",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.BingMaps( {
								culture : 'ko-KR',
								key : window.API_KEY_BING,
								imagerySet : 'CanvasDark'
							} )
						} )
					},
					minZoom : 1,
					maxZoom : 19
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "new ol.layer.Tile" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapBing.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapBing.prototype.constructor = ugmp.baseMap.uGisBaseMapBing;


	/**
	 * Bing 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 * @param loadEvents {Function} tile load events 함수.
	 */
	ugmp.baseMap.uGisBaseMapBing.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입
	 * @param loadEvents {Function} tile load events 함수.
	 */
	ugmp.baseMap.uGisBaseMapBing.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapBing.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapBing.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapBing.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();
		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * 사용자 정의 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var custom = new ugmp.baseMap.uGisBaseMapCustom( {
	 * 	baseMapKey : 'custom_code1',
	 * 	uWMTSLayer : new ugmp.layer.uGisWMTSLayer({...}),
	 * 	capabilities : new ugmp.service.uGisGetCapabilitiesWMTS({...}).data,
	 * 	isWorld : true,
	 * 	isFactor : false
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseMapKey {String} 베이스맵 코드명 (custom_XXX).
	 * @param opt_options.uWMTSLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.capabilities {ugmp.service.uGisGetCapabilitiesWMTS} {@link ugmp.service.uGisGetCapabilitiesWMTS} WMTS capabilities
	 *            객체.
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapCustom = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.resolutions = null;
		this.capabilities = null;
		this.uWMTSLayer = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;
			_self.uWMTSLayer = ( options.uWMTSLayer !== undefined ) ? options.uWMTSLayer : undefined;

			if ( !_self.capabilities ) {
				ugmp.uGisConfig.alert_Error( "capabilities undefined" );
				_self.isAvailable = false;
				return false;
			}

			if ( !_self.uWMTSLayer ) {
				ugmp.uGisConfig.alert_Error( "uWMTSLayer undefined" );
				_self.isAvailable = false;
				return false;
			}

			options.isWorld = ( options.isWorld !== undefined ) ? options.isWorld : true;
			options.isFactor = ( options.isFactor !== undefined ) ? options.isFactor : true;
			options.baseCode = ( options.baseMapKey !== undefined ) ? options.baseMapKey : "custom_code";
			options.projection = _self.capabilities.serviceMetaData.crs;

			if ( options.projection.indexOf( "urn:ogc:def:crs:EPSG:" ) > -1 ) {
				options.projection = options.projection.replace( "urn:ogc:def:crs:EPSG:", "EPSG" );
			}

			var layers = _self.capabilities.olJson.Contents.Layer;
			for ( var i in layers ) {
				if ( layers[ i ][ "Identifier" ] === _self.uWMTSLayer.layer ) {
					options.maxExtent = ol.proj.transformExtent( layers[ i ][ "WGS84BoundingBox" ], "EPSG:4326", options.projection );
					break;
				}
			}

			var tilems = _self.capabilities.olJson.Contents.TileMatrixSet;

			for ( var i in tilems ) {
				if ( tilems[ i ][ "Identifier" ] === _self.uWMTSLayer.matrixSet ) {
					_self.resolutions = [];
					var tileMatrixs = tilems[ i ][ "TileMatrix" ];
					for ( var j in tileMatrixs ) {
						_self.resolutions.push( tileMatrixs[ j ][ "ScaleDenominator" ] * 0.000264583 );
					}

					options.mapTypes = {};
					options.mapTypes[ options.baseCode ] = {
						id : options.baseCode,
						minZoom : 0,
						resolutions : _self.resolutions,
						maxZoom : tilems[ i ][ "TileMatrix" ].length - 1
					};
					break;
				}
			}

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapCustom.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapCustom.prototype.constructor = ugmp.baseMap.uGisBaseMapCustom;


	/**
	 * Customize Map 맵을 생성한다.
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			projection : _self.projection,
			view : new ol.View( {
				zoom : 2,
				center : [ 0, 0 ],
				projection : _self.projection,
				minZoom : _self.mapTypes[ type_ ][ "minZoom" ],
				maxZoom : _self.mapTypes[ type_ ][ "maxZoom" ],
				resolutions : _self.mapTypes[ type_ ][ "resolutions" ]
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		_self.uWMTSLayer.setWmtsCapabilities( _self.capabilities );
		_self.uWMTSLayer.update( true );
		_self.apiMap.addLayer( _self.uWMTSLayer.getOlLayer() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapCustom.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * 다음 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapDaum = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = false;
			options.baseCode = "daum";
			options.projection = "EPSG:5181";
			options.maxExtent = ol.proj.get( "EPSG:5181" ).getExtent();
			options.mapTypes = {
				normal : {
					id : 1, // daum.maps.MapTypeId[ "NORMAL" ]
					minZoom : 1,
					maxZoom : 14
				},
				satellite : {
					id : 2, // daum.maps.MapTypeId[ "SKYVIEW" ]
					minZoom : 1,
					maxZoom : 15
				},
				hybrid : {
					id : 3, // daum.maps.MapTypeId[ "HYBRID" ]
					minZoom : 1,
					maxZoom : 15
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "daum.maps.MapTypeId" );

			if ( !_self.isAvailable ) {
				return false;
			}
			
		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var daumLevel = ( 15 - syncData[ "zoom" ] );
			_self.apiMap.setLevel( daumLevel );
			_self.apiMap.relayout();
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var daumCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( new daum.maps.LatLng( daumCenter[ 1 ], daumCenter[ 0 ] ) );
			_self.apiMap.relayout();
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapDaum.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapDaum.prototype.constructor = ugmp.baseMap.uGisBaseMapDaum;


	/**
	 * 다음 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var mapContainer = document.getElementById( target_ );
		var daumMapOptions = {
			center : new daum.maps.LatLng( 33.450701, 126.570667 ),
			level : 3
		};

		_self.apiMap = new daum.maps.Map( mapContainer, daumMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.relayout();
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapDaum.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 다음 지도 API events tilesloadstart 미지원
		kakao.maps.event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		kakao.maps.event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * 구글 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapGoogle = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "google";
			options.projection = "EPSG:900913";
			options.maxExtent = ol.proj.get( "EPSG:900913" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "roadmap", // google.maps.MapTypeId.ROADMAP
					minZoom : 0,
					maxZoom : 21
				},
				satellite : {
					id : "satellite", // google.maps.MapTypeId.SATELLITE
					minZoom : 0,
					maxZoom : 19
				},
				hybrid : {
					id : "hybrid", // google.maps.MapTypeId.HYBRID
					minZoom : 0,
					maxZoom : 19
				},
				terrain : {
					id : "terrain", // google.maps.MapTypeId.TERRAIN
					minZoom : 0,
					maxZoom : 19
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "google.maps.MapTypeId" );

			if ( !_self.isAvailables() ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var googleLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( googleLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var googleCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( {
				lat : googleCenter[ 1 ],
				lng : googleCenter[ 0 ]
			} );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapGoogle.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapGoogle.prototype.constructor = ugmp.baseMap.uGisBaseMapGoogle;


	/**
	 * 구글 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var googleMapOptions = {
			zoom : 4,
			center : {
				lat : -33,
				lng : 151
			},
			disableDefaultUI : true
		};

		_self.apiMap = new google.maps.Map( document.getElementById( target_ ), googleMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype.updateSize = function() {
		var _self = this._this || this;
		google.maps.event.trigger( _self.apiMap, "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapGoogle.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 구글 지도 API events tilesloadstart 미지원
		google.maps.event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		google.maps.event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * 네이버 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapNaver = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.baseCode = "naver";
			options.projection = "EPSG:3857";
			options.maxExtent = [ 13833615.936057687, 3779460.9620584883, 14690783.774134403, 4666706.57663997 ];
			options.mapTypes = {
				normal : {
					id : "normal", // naver.maps.MapTypeId[ "NORMAL" ]
					minZoom : 6,
					maxZoom : 21
				},
				satellite : {
					id : "satellite", // naver.maps.MapTypeId[ "SATELLITE" ]
					minZoom : 6,
					maxZoom : 21
				},
				hybrid : {
					id : "hybrid", // naver.maps.MapTypeId[ "HYBRID" ]
					minZoom : 6,
					maxZoom : 21
				},
				terrain : {
					id : "terrain", // naver.maps.MapTypeId[ "TERRAIN" ]
					minZoom : 6,
					maxZoom : 21
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "naver.maps.MapTypeId" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var naverLevel = syncData[ "zoom" ];
			_self.apiMap.setZoom( naverLevel, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var naverCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:4326" );
			_self.apiMap.setCenter( new naver.maps.LatLng( naverCenter[ 1 ], naverCenter[ 0 ] ) );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapNaver.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapNaver.prototype.constructor = ugmp.baseMap.uGisBaseMapNaver;


	/**
	 * 네이버 지도 API 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var naverMapOptions = {
			center : new naver.maps.LatLng( 37.3595704, 127.105399 ),
			level : 3
		};

		_self.apiMap = new naver.maps.Map( target_, naverMapOptions );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self.apiMap.setMapTypeId( _self.mapTypes[ type ][ "id" ] );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.trigger( "resize" );
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapNaver.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		// 네이버 지도 API events tilesloadstart 미지원
		naver.maps.Event.addListener( _self.apiMap, "bounds_changed", function() {
			loadEvents_.call( this, true );

			window.setTimeout( function() {
				loadEvents_.call( this, false );
			}, 500 );
		} );

		naver.maps.Event.trigger( _self.apiMap, "bounds_changed" );
	};

} )();

( function() {
	"use strict";

	/**
	 * OpenStreet 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapOSM = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			var grayURL = "http://{a-c}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png";

			if ( ugmp.uGisConfig.isMapProxy() ) {
				grayURL = ugmp.uGisConfig.getProxy() + grayURL;
			}
			
			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "osm";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.OSM()
						} )
					},
					minZoom : 0,
					maxZoom : 21
				},
				gray : {
					id : "gray",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : grayURL,
								attributions : [ ol.source.OSM.ATTRIBUTION ]
							} )
						} )
					},
					minZoom : 0,
					maxZoom : 18
				},
				none : {
					id : "none",
					layer : function() {
						return new ol.layer.Tile()
					},
					minZoom : 0,
					maxZoom : 21
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "new ol.layer.Tile" );

			if ( !_self.isAvailable ) {
				return false;
			}
			
		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapOSM.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapOSM.prototype.constructor = ugmp.baseMap.uGisBaseMapOSM;


	/**
	 * OpenStreetMap 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [ new ol.control.Attribution( {
				collapsible : false
			} ) ],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapOSM.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * Stamen 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapStamen = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "stamen";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				toner : {
					id : "toner",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "toner"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 20
				},
				terrain : {
					id : "terrain",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "terrain"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 18
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ol.source.Stamen" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapStamen.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapStamen.prototype.constructor = ugmp.baseMap.uGisBaseMapStamen;


	/**
	 * Stamen 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [ new ol.control.Attribution( {
				collapsible : false
			} ) ],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "toner";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * TMS_vWorld 배경지도 객체.
	 * 
	 * vWorld 배경지도를 특정 좌표계로 설정하여 TMS 배경지도로 사용할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.baseCode {String} 베이스맵의 코드명 (언더바 기준). Default is `TMS`.
	 * @param opt_options.projection {String} 베이스맵 좌표계. Default is `EPSG:3857`.
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.projection = options.projection;
			options.baseCode = ( options.baseCode !== undefined ) ? options.baseCode : "TMS";
			options.maxExtent = ol.proj.get( options.projection ).getExtent();
			options.mapTypes = {
				normal : {
					id : "normal",
					layer : function() {
						var base = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Base/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ base ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						return [ satellite ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var satellite = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Satellite/service/{z}/{x}/{y}.jpeg'
							} )
						} );
						var hybrid = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/Hybrid/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ satellite, hybrid ];
					},
					minZoom : 0,
					maxZoom : 20 // 13
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						var gray = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/gray/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ gray ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						var midnight = new ol.layer.Tile( {
							source : new ol.source.XYZ( {
								url : 'http://xdworld.vworld.kr:8080/2d/midnight/service/{z}/{x}/{y}.png'
							} )
						} );
						return [ midnight ];
					},
					minZoom : 0,
					maxZoom : 20 // 12
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			var projection = ( options.projection !== undefined ) ? options.projection : "EPSG:3857";

			_self.checkIsAvailable( "" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			// var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], _self.projection );
			var osmCenter = syncData[ "center" ];
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.constructor = ugmp.baseMap.uGisBaseMapTMS_vWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				projection : _self.projection,
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.getLayers().getArray() );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		for ( var i = layers_.length - 1; i >= 0; i-- ) {
			_self.apiMap.removeLayer( layers_[ i ] );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapTMS_vWorld.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layers = _self.apiMap.getLayers().getArray();

		for ( var i in layers ) {
			var source = layers[ i ].getSource();
			source.on( [ "tileloadstart" ], function() {
				loadEvents_.call( this, true );
			} );
			source.on( [ "tileloadend" ], function() {
				loadEvents_.call( this, false );
			} );
			source.on( [ "tileloaderror" ], function() {
				loadEvents_.call( this, false );
			} );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * vWorld 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapVWorld = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = false;
			options.isFactor = true;
			options.baseCode = "vWorld";
			options.projection = "EPSG:900913";
			options.maxExtent = [ 12873319.534819111, 3857406.4178978344, 15494719.534819111, 5166406.417897834 ];
			options.mapTypes = {
				normal : {
					id : "VBASE",
					layer : function() {
						return [ new vworld.Layers.Base( "VBASE" ) ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				satellite : {
					id : "SATELLITE",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						vSat.max_level = 19;
						return [ vSat ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				hybrid : {
					id : "VHYBRID",
					layer : function() {
						var vSat = new vworld.Layers.Satellite( "VSAT" );
						var vHybrid = new vworld.Layers.Hybrid( "VHYBRID" );
						vSat.max_level = 19;
						vHybrid.max_level = 19;
						return [ vSat, vHybrid ];
					},
					minZoom : 6,
					maxZoom : 19
				},
				gray : {
					id : "VGRAY",
					layer : function() {
						return [ new vworld.Layers.Gray( "VGRAY" ) ];
					},
					minZoom : 6,
					maxZoom : 18
				},
				midnight : {
					id : "VMIDNIGHT",
					layer : function() {
						return [ new vworld.Layers.Midnight( "VMIDNIGHT" ) ];
					},
					minZoom : 6,
					maxZoom : 18
				}
			};

			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "vworld.Layers.Base" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var vWorldCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:900913" );
			vWorldCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var vWorldLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( vWorldCenter, vWorldLevel, false, false );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );

			var vWorldCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:900913" );
			vWorldCenter = new OpenLayers.LonLat( syncData[ "center" ][ 0 ], syncData[ "center" ][ 1 ] );
			var vWorldLevel = syncData[ "zoom" ];

			_self.apiMap.setCenter( vWorldCenter, vWorldLevel, false, false );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapVWorld.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapVWorld.prototype.constructor = ugmp.baseMap.uGisBaseMapVWorld;


	/**
	 * vWorld 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		var options = {
			units : "m",
			controls : [],
			numZoomLevels : 21,
			projection : new OpenLayers.Projection( "EPSG:900913" ),
			displayProjection : new OpenLayers.Projection( "EPSG:900913" )
		};

		_self.apiMap = new OpenLayers.Map( target_, options );
		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "normal";
		}

		_self._removeAllLayer( _self.apiMap.layers );

		var layers = _self.mapTypes[ type ][ "layer" ]();
		for ( var i in layers ) {
			_self.apiMap.addLayer( layers[ i ] );
		}

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.layers.length > 0 ) {
			_self._removeAllLayer( _self.apiMap.layers );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapVWorld.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var layers = _self.apiMap.layers;

		for ( var i in layers ) {
			layers[ i ].events.register( "loadstart", layers[ i ], function() {
				loadEvents_.call( this, true );
			} );
			layers[ i ].events.register( "loadend", layers[ i ], function() {
				loadEvents_.call( this, false );
			} );
			layers[ i ].events.register( "tileloadstart", layers[ i ], function() {
				loadEvents_.call( this, true );
			} );
			layers[ i ].events.register( "tileloaded", layers[ i ], function() {
				loadEvents_.call( this, false );
			} );
		}
	};

} )();

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

( function() {
	"use strict";

	/**
	 * bounceAnimation 객체.
	 * 
	 * 피처를 상,하로 튕기는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var bounceAni = new ugmp.animation.bounceAnimation( {
	 * 	duration : 2000,
	 * 	repeat : 100,
	 * 	amplitude : 40,
	 * 	bounce : 5,
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.bounce {Integer} 바운스. Default is `3`.
	 * @param opt_options.amplitude {Integer} 높이. Default is `40`.
	 * 
	 * @Extends {ugmp.animation.featureAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.bounceAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.bounce = null;
		this.amplitude = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "bounce";

			_self.setBounce( options.bounce );
			_self.setAmplitude( options.amplitude );

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setBounce : _self.setBounce,
			setAmplitude : _self.setAmplitude
		} );

	} );


	ugmp.animation.bounceAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.bounceAnimation.prototype.constructor = ugmp.animation.bounceAnimation;


	/**
	 * 바운스를 설정한다.
	 * 
	 * @param bounce {Number.<Integer>} 바운스.
	 */
	ugmp.animation.bounceAnimation.prototype.setBounce = function(bounce_) {
		var _self = this._this || this;
		_self.bounce = ( typeof ( bounce_ ) === "number" ) ? ( bounce_ >= 0 ? bounce_ : 3 ) : 3;
	};


	/**
	 * 높이를 설정한다.
	 * 
	 * @param easing {Number.<Integer>} 높이
	 */
	ugmp.animation.bounceAnimation.prototype.setAmplitude = function(amplitude_) {
		var _self = this._this || this;
		_self.amplitude = ( typeof ( amplitude_ ) === "number" ) ? ( amplitude_ >= 0 ? amplitude_ : 40 ) : 40;
	};


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.bounceAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var bounce = -Math.PI * ( _self.bounce );
			var flashGeom = e.geom.clone();
			var t = Math.abs( Math.sin( bounce * e.elapsed ) ) * _self.amplitude * ( 1 - _self.easing( e.elapsed ) ) * e.frameState.viewState.resolution;
			flashGeom.translate( 0, t );
			_self.drawGeom( e, flashGeom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.bounceAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			bounce : _self.bounce,
			amplitude : _self.amplitude
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * dropAnimation 객체.
	 * 
	 * 피처를 위에서 아래로 또는 아래에서 위로 떨어트리는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var dropAni = new ugmp.animation.dropAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	side : 'top',
	 * 	useFade : true
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.repeat {Integer} 반복 횟수. Default is `10000`.
	 * @param opt_options.useFade {Boolean} 투명도 효과 사용 여부. Default is `true`.
	 * @param opt_options.duration {Integer} 지연 시간. Default is `2000`.
	 * 
	 * @param opt_options.side {String} 시작 위치 (top, bottom). Default is `top`.
	 * 
	 * @class
	 */
	ugmp.animation.dropAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.side = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "drop";

			_self.setSide( options.side );

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setSide : _self.setSide
		} );

	} );


	ugmp.animation.dropAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.dropAnimation.prototype.constructor = ugmp.animation.dropAnimation;


	/**
	 * 시작 위치를 설정한다.
	 * 
	 * @param side side {String} 시작 위치 (top, bottom).
	 */
	ugmp.animation.dropAnimation.prototype.setSide = function(side_) {
		var _self = this._this || this;
		_self.side = ( typeof ( side_ ) === "string" ) ? side_ : "top";
	};


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.dropAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			var dy;
			if ( _self.side == 'top' ) {
				dy = e.extent[ 3 ] - e.bbox[ 1 ];
			} else if ( _self.side == 'bottom' ) {
				dy = e.extent[ 1 ] - e.bbox[ 3 ];
			}

			var flashGeom = e.geom.clone();
			flashGeom.translate( 0, dy * ( 1 - _self.easing( e.elapsed ) ) );
			_self.drawGeom( e, flashGeom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.dropAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			side : _self.side
		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * lineDashMoveAnimation 객체.
	 * 
	 * 라인 형태의 피처를 라인 대시 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var lineDashMoveAni = new ugmp.animation.lineDashMoveAnimation( {
	 * 	duration : 1000,
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
	ugmp.animation.lineDashMoveAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.reverse = null;

		this.currentOffset = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "lineDashMove";

			_self.currentOffset = 0;

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setReverse : _self.setReverse
		} );

	} );


	ugmp.animation.lineDashMoveAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.lineDashMoveAnimation.prototype.constructor = ugmp.animation.lineDashMoveAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		if ( _self.repeat < e.nowNB ) {
			return true;
		}

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			if ( !( e.time <= _self.duration ) ) {
				_self.moveLineDash();
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
	ugmp.animation.lineDashMoveAnimation.prototype.customDrawGeom = function(e, geom) {
		var _self = this._this || this;

		if ( _self.useFade ) {
			e.context.globalAlpha = ol.easing.easeIn( e.elapsed );
		} else {
			e.context.globalAlpha = 1;
		}

		var vectorContext = e.vectorContext;
		var frameState = e.frameState;

		vectorContext.setStyle( _self.lineDashStyle() );
		vectorContext.drawGeometry( geom );
	};


	/**
	 * 라인 대시 스타일.
	 * 
	 * @private
	 * 
	 * @return style {ol.style.Stroke} 라인 대시 스타일.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.lineDashStyle = function() {
		var _self = this._this || this;

		var style = _self.strokeStyle;

		style.getStroke().setLineDashOffset( _self.currentOffset );

		return style;
	};


	/**
	 * 라인 대시 offset 조정.
	 * 
	 * @private
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.moveLineDash = function() {
		var _self = this._this || this;

		if ( _self.reverse ) {
			_self.currentOffset -= 10;
			if ( _self.currentOffset <= -100 ) {
				_self.currentOffset = 0;
			}
		} else {
			_self.currentOffset += 10;

			if ( _self.currentOffset >= 100 ) {
				_self.currentOffset = 0;
			}
		}
	};


	/**
	 * 방향을 전환한다.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.setReverse = function() {
		var _self = this._this || this;
		_self.reverse = !_self.reverse;
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.lineDashMoveAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {
			reverse : _self.reverse
		} );
	};

} )();

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

( function() {
	"use strict";

	/**
	 * showAnimation 객체.
	 * 
	 * 피처를 나타내는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var showAni = new ugmp.animation.showAnimation( {
	 * 	duration : 2500,
	 * 	repeat : 100,
	 * 	useFade : true
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
	ugmp.animation.showAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "show";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.showAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.showAnimation.prototype.constructor = ugmp.animation.showAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.showAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var viewExtent = e.frameState.extent;

		// 현재 view 영역에 포함되어 있는 피쳐만 작업.
		if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
			_self.drawGeom( e, e.geom );
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.showAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * teleportAnimation 객체.
	 * 
	 * 피처를 순간 이동하여 나타내는 것처럼 보이는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var teleportAni = new ugmp.animation.teleportAnimation( {
	 * 	duration : 2000,
	 * 	repeat : 100,
	 * 	useFade : true
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
	ugmp.animation.teleportAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "teleport";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.teleportAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.teleportAnimation.prototype.constructor = ugmp.animation.teleportAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.teleportAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var sc = _self.easing( e.elapsed );
		if ( sc ) {
			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				e.context.globalAlpha = sc;
				e.context.scale( sc, 1 / sc );
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / sc - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( sc - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();
		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.teleportAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * zoomInAnimation 객체.
	 * 
	 * 피처를 확대하는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var zoomInAni = new ugmp.animation.zoomInAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	useFade : true
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
	ugmp.animation.zoomInAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "zoomIn";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.zoomInAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.zoomInAnimation.prototype.constructor = ugmp.animation.zoomInAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.zoomInAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var fac = _self.easing( e.elapsed );

		if ( fac ) {
			var style = _self.style;
			var imgs, sc = []
			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) {
					sc[ i ] = imgs.getScale();
					imgs.setScale( sc[ i ] * fac );
				}
			}

			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / fac - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( 1 / fac - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.scale( fac, fac );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();

			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) imgs.setScale( sc[ i ] );
			}

		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보
	 */
	ugmp.animation.zoomInAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();

( function() {
	"use strict";

	/**
	 * zoomOutAnimation 객체.
	 * 
	 * 피처를 축소하는 효과를 줄 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var zoomOutAni = new ugmp.animation.zoomOutAnimation( {
	 * 	duration : 3000,
	 * 	repeat : 100,
	 * 	useFade : true
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
	ugmp.animation.zoomOutAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "zoomOut";

			_super = ugmp.animation.featureAnimationDefault.call( _self, options );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.animation.zoomOutAnimation.prototype = Object.create( ugmp.animation.featureAnimationDefault.prototype );
	ugmp.animation.zoomOutAnimation.prototype.constructor = ugmp.animation.zoomOutAnimation;


	/**
	 * 애니메이션
	 * 
	 * @override
	 * 
	 * @param e {Object} animateFeature 옵션.
	 * 
	 * @return {Boolean}
	 */
	ugmp.animation.zoomOutAnimation.prototype.animate = function(e) {
		var _self = this._this || this;

		var fac = _self.easing( e.elapsed );

		if ( fac ) {
			fac = 1 / fac;
			var style = _self.style;
			var imgs, sc = []
			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) {
					sc[ i ] = imgs.getScale();
					imgs.setScale( sc[ i ] * fac );
				}
			}

			e.context.save();

			var viewExtent = e.frameState.extent;

			// 현재 view 영역에 포함되어 있는 피쳐만 작업.
			if ( ( ol.extent.intersects( viewExtent, e.bbox ) ) ) {
				var ratio = e.frameState.pixelRatio;
				var m = e.frameState.coordinateToPixelTransform;
				var dx = ( 1 / fac - 1 ) * ratio * ( m[ 0 ] * e.coord[ 0 ] + m[ 1 ] * e.coord[ 1 ] + m[ 4 ] );
				var dy = ( 1 / fac - 1 ) * ratio * ( m[ 2 ] * e.coord[ 0 ] + m[ 3 ] * e.coord[ 1 ] + m[ 5 ] );
				e.context.scale( fac, fac );
				e.context.translate( dx, dy );
				_self.drawGeom( e, e.geom );
			}

			e.context.restore();

			for ( var i = 0; i < style.length; i++ ) {
				imgs = style[ i ].getImage();
				if ( imgs ) imgs.setScale( sc[ i ] );
			}

		}

		return ( e.time <= _self.duration );
	};


	/**
	 * 현재 설정된 속성 정보를 가져온다.
	 * 
	 * @override {ugmp.animation.featureAnimationDefault.prototype.getProperties}
	 * 
	 * @return {Object} 현재 설정된 속성 정보.
	 */
	ugmp.animation.zoomOutAnimation.prototype.getProperties = function() {
		var _self = this._this || this;

		var superProperties = ugmp.animation.featureAnimationDefault.prototype.getProperties.call( this );

		return ugmp.util.uGisUtil.objectMerge( superProperties, {

		} );
	};

} )();

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

( function() {
	"use strict";

	/**
	 * uGisCircleAnimation 객체.
	 * 
	 * Circle(원) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.Circle
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGcircleAni = new ugmp.animation.uGisCircleAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Circle({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Circle} Circle 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisCircleAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisCircleAnimation";

			_super = ugmp.animation.uGisShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	ugmp.animation.uGisCircleAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisCircleAnimation.prototype.constructor = ugmp.animation.uGisCircleAnimation;


	/**
	 * Circle 애니메이션 스타일을 설정한다.
	 * 
	 * @param circleStyle {ol.style.Circle} Circle 스타일.
	 */
	ugmp.animation.uGisCircleAnimation.prototype.setStyle = function(circleStyle_) {
		var _self = this._this || this;

		var style = [ new ol.style.Style( {
			image : circleStyle_
		} ) ];

		_self.setStyles( style );
	};

} )();

( function() {
	"use strict";

	/**
	 * uGisLineAnimation 객체.
	 * 
	 * Line(선) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
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
	 * var uGLineAni = new ugmp.animation.uGisLineAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.LineString({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Stroke({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트.
	 * @param opt_options.style {ol.style.Stroke} Line Stroke 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisLineAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisLineAnimation";

			_super = ugmp.animation.uGisShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	ugmp.animation.uGisLineAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisLineAnimation.prototype.constructor = ugmp.animation.uGisLineAnimation;


	/**
	 * Line Stroke 애니메이션 스타일을 설정한다.
	 * 
	 * @param strokeStyle {ol.style.Stroke} Line Stroke 스타일.
	 */
	ugmp.animation.uGisLineAnimation.prototype.setStyle = function(strokeStyle_) {
		var _self = this._this || this;

		var strokeStyle = strokeStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} )
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : strokeStyle
		} ) ];

		_self.setStrokeStyle( strokeStyle );
		_self.setStyles( style );
	};

} )();

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

( function() {
	"use strict";

	/**
	 * uGisPolygonAnimation 객체.
	 * 
	 * Polygon(폴리곤) 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Polygon 또는 ol.geom.MultiPolygon
	 * 
	 * ※스타일 타입 : ol.style.Style
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGPolygonAni = new ugmp.animation.uGisPolygonAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Polygon({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.Style({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Polygon|ol.geom.MultiPolygon>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.Style} Polygon 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisPolygonAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisPolygonAnimation";

			_super = ugmp.animation.uGisShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	ugmp.animation.uGisPolygonAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisPolygonAnimation.prototype.constructor = ugmp.animation.uGisPolygonAnimation;


	/**
	 * Polygon 애니메이션 스타일을 설정한다.
	 * 
	 * @param polyonStyle {ol.style.Style} Polygon 스타일.
	 */
	ugmp.animation.uGisPolygonAnimation.prototype.setStyle = function(polyonStyle_) {
		var _self = this._this || this;

		var polyStyle = polyonStyle_;

		var style = [ new ol.style.Style( {
			stroke : new ol.style.Stroke( {
				color : [ 0, 0, 0, 0 ],
				width : 0
			} ),
			fill : new ol.style.Fill( {
				color : [ 0, 0, 0, 0 ]
			} ),
		} ), new ol.style.Style( {
			image : new ol.style.RegularShape( {} ),
			stroke : polyStyle.getStroke(),
			fill : polyStyle.getFill()
		} ) ];

		_self.setStyles( style );
	};

} )();

( function() {
	"use strict";

	/**
	 * uGisRegularShapeAnimation 객체.
	 * 
	 * RegularShape 형태의 피처에 애니메이션 효과를 줄 수 있는 객체이다.
	 * 
	 * ※피처 타입 : ol.geom.Point 또는 ol.geom.MultiPoint
	 * 
	 * ※스타일 타입 : ol.style.RegularShape
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGregularShapeAni = new ugmp.animation.uGisCircleAnimation( {
	 * 	uGisMap : new ugmp.uGisMap( {...} ),
	 * 	features : [ new ol.Feature({
	 * 		geometry: new ol.geom.Point({...}),
	 * 		...
	 * 	) ],
	 * 	originCRS : 'EPSG:4326',
	 * 	sync : false,
	 * 	animations : [ new ugmp.animation.showAnimation({...}) ],
	 * 	style : new ol.style.RegularShape({...})
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.sync {Boolean} 동기화 사용 여부. Default is `true`.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.features {Array.<ol.Feature.<ol.geom.Point|ol.geom.MultiPoint>>} 대상 피처 리스트.
	 * @param opt_options.originCRS {String} 대상 피쳐 원본 좌표계. Default is `EPSG:4326`.
	 * @param opt_options.animations {Array.<ugmp.animation>} 애니메이션 효과 리스트. *
	 * @param opt_options.style {ol.style.RegularShape} RegularShape 스타일.
	 * 
	 * @Extends {ugmp.animation.uGisShapeAnimationDefault}
	 * 
	 * @class
	 */
	ugmp.animation.uGisRegularShapeAnimation = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.animationType = "uGisRegularShapeAnimation";

			_super = ugmp.animation.uGisShapeAnimationDefault.call( _self, options );

			_self.init();

			_self.setStyle( options.style );

		} )();
		// END Initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			setStyle : _self.setStyle
		} );

	} );


	ugmp.animation.uGisRegularShapeAnimation.prototype = Object.create( ugmp.animation.uGisShapeAnimationDefault.prototype );
	ugmp.animation.uGisRegularShapeAnimation.prototype.constructor = ugmp.animation.uGisRegularShapeAnimation;


	/**
	 * RegularShape 애니메이션 스타일을 설정한다.
	 * 
	 * @param regularShapeStyle {ol.style.RegularShape} RegularShape 애니메이션 스타일.
	 */
	ugmp.animation.uGisRegularShapeAnimation.prototype.setStyle = function(regularShapeStyle_) {
		var _self = this._this || this;

		var regularShapeStyle = regularShapeStyle_;

		var style = [ new ol.style.Style( {
			image : regularShapeStyle
		} ) ];

		_self.setStyles( style );
	};

} )();

/**
 * @namespace ugmp.control
 */

( function() {
	"use strict";

	/**
	 * 컨트롤 기본 객체.
	 * 
	 * 컨트롤의 기본 객체. 공통으로 지도 이동 사용 여부, 마우스 커서, 컨트롤 상태 변경 이벤트를 설정할 수 있다.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @class
	 */
	ugmp.control.uGisControlDefault = ( function(opt_options) {
		var _self = this;

		this.uGisMap = null;
		this.useDragPan = null;
		this.cursorCssName = null;
		this.activeChangeListener = null;

		this.controlKey = null;
		this.interaction = null;
		this.compatibleDragPan = null;
		this.key_activeChangeListener = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.useDragPan = ( typeof ( options.useDragPan ) === "boolean" ) ? options.useDragPan : false;
			_self.cursorCssName = ( options.cursorCssName !== undefined ) ? options.cursorCssName : undefined;
			_self.activeChangeListener = ( typeof options.activeChangeListener === "function" ) ? options.activeChangeListener : undefined;
			_self.controlKey = ugmp.util.uGisUtil.generateUUID();

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

		} )();
		// END initialize


		return {
			destroy : _self.destroy,
			setActive : _self.setActive,
			getActive : _self.getActive,
			getControlKey : _self.getControlKey,
			getInteraction : _self.getInteraction,
			setActiveChangeListener : _self.setActiveChangeListener
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.control.uGisControlDefault.prototype._init = function() {
		var _self = this._this || this;

		var olMap = _self.uGisMap.getMap();

		// ol.Map에 DragPan 전체 삭제.
		var interactions = olMap.getInteractions().getArray();
		for ( var i = interactions.length - 1; i >= 0; i-- ) {
			if ( interactions[ i ] instanceof ol.interaction.DragPan ) {
				if ( !( interactions[ i ].get( "uGisDragPan" ) ) ) {
					olMap.removeInteraction( interactions[ i ] );
				}
			}
		}

		_self.setActiveChangeListener( _self.activeChangeListener );

		olMap.addInteraction( _self.interaction );
	};


	/**
	 * 컨트롤 키를 가져온다.
	 * 
	 * @return getControlKey {String} 컨트롤 키.
	 */
	ugmp.control.uGisControlDefault.prototype.getControlKey = function() {
		var _self = this._this || this;
		return _self.controlKey;
	};


	/**
	 * Interaction을 가져온다.
	 * 
	 * @return interaction {ol.interaction.Interaction} Draw Interaction.
	 */
	ugmp.control.uGisControlDefault.prototype.getInteraction = function() {
		var _self = this._this || this;
		return _self.interaction;
	};


	/**
	 * Interaction 활성화 상태를 가져온다.
	 * 
	 * @return {Boolean} Interaction 활성화 상태.
	 */
	ugmp.control.uGisControlDefault.prototype.getActive = function() {
		var _self = this._this || this;
		return _self.interaction.getActive();
	};


	/**
	 * Interaction 활성화를 설정한다.
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	ugmp.control.uGisControlDefault.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.interaction.getActive() && state_ === true ) {
			return false;
		}

		var viewPort = _self.uGisMap.getMap().getViewport();

		var list = viewPort.classList;
		for ( var i = 0; i < list.length; i++ ) {
			var name = list[ i ];
			if ( name.indexOf( "cursor" ) === 0 ) {
				viewPort.classList.remove( name );
			}
		}

		if ( state_ ) {
			viewPort.classList.add( _self.cursorCssName );

			if ( _self.useDragPan ) {
				if ( !_self.compatibleDragPan ) {
					_self.compatibleDragPan = new ol.interaction.DragPan( {
						kinetic : false
					} );

					_self.compatibleDragPan.set( "uGisDragPan", true );

					_self.uGisMap.getMap().getInteractions().insertAt( 0, _self.compatibleDragPan );
				} else {
					_self.compatibleDragPan.setActive( true );
				}
			}

		} else {
			viewPort.classList.add( "cursor-default" );
			// _self.uGisMap.getMap().removeInteraction( _self.compatibleDragPan );
			if ( _self.compatibleDragPan ) {
				_self.compatibleDragPan.setActive( false );
			}
		}

		_self.interaction.setActive( state_ );
	};


	/**
	 * 컨트롤의 상태 변경 CallBack.
	 * 
	 * @param activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 */
	ugmp.control.uGisControlDefault.prototype.setActiveChangeListener = function(listener_) {
		var _self = this._this || this;

		if ( _self.interaction && typeof listener_ === "function" ) {
			ol.Observable.unByKey( _self.key_activeChangeListener );

			_self.activeChangeListener = listener_;

			_self.key_activeChangeListener = _self.interaction.on( "change:active", function(e_) {
				_self.activeChangeListener.call( this, e_.target.getActive() );
			} );
		}
	};


	/**
	 * 컨트롤을 초기화한다.
	 */
	ugmp.control.uGisControlDefault.prototype.destroy = function() {
		var _self = this._this || this;

		_self.setActive( false );

		_self.uGisMap.getMap().removeInteraction( _self.interaction );
	};

} )();

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

( function() {
	"use strict";

	/**
	 * 면적 측정 객체.
	 * 
	 * 마우스로 지도상에서 면적을 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugAreaMeasure = new ugmp.control.uGisAreaMeasure( {
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
	ugmp.control.uGisAreaMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};
			
			options.drawType = "Polygon";
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

	
	ugmp.control.uGisAreaMeasure.prototype = Object.create( ugmp.control.uGisMeasureDefault.prototype );
	ugmp.control.uGisAreaMeasure.prototype.constructor = ugmp.control.uGisAreaMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisAreaMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		ugmp.control.uGisMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "면적 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatArea( geom );
				tooltipCoord = geom.getInteriorPoint().getCoordinates();

				_self.measureTooltipElement.innerHTML = output;
				_self.measureTooltip.setPosition( tooltipCoord );
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
	 * @param {ol.geom.Polygon} polygon The polygon.
	 * 
	 * @private
	 * 
	 * @return {String} Formatted area.
	 */
	ugmp.control.uGisAreaMeasure.prototype._formatArea = function(polygon_) {
		var _self = this._this || this;
		
		var area = ol.Sphere.getArea( polygon_, {
			projection : _self.uGisMap.getCRS()
		} );
		
		var output;
		
		if ( area > 10000 ) {
			output = ( Math.round(area / 1000000 * 100) / 100 ) + " " + "km<sup>2</sup>";
		} else {
			output = ( Math.round(area * 100) / 100 ) + " " + "m<sup>2</sup>";
        }
		
        return output;
	};
	
} )();

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

( function() {
	"use strict";

	/**
	 * 마우스 드래그 팬 객체.
	 * 
	 * 마우스로 지도를 패닝하여 이동하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDragPan = new ugmp.control.uGisDragPan( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-default',
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
	 * @Extends {ugmp.control.uGisControlDefault}
	 */
	ugmp.control.uGisDragPan = ( function(opt_options) {
		var _self = this;
		var _super;

		this.key_pointerup = null;
		this.key_pointerdrag = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.control.uGisControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.control.uGisDragPan.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisDragPan.prototype.constructor = ugmp.control.uGisDragPan;


	/**
	 * 초기화
	 * 
	 * @overide {ugmp.control.uGisControlDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisDragPan.prototype._init = function() {
		var _self = this._this || this;

		var olMap = _self.uGisMap.getMap();

		_self.interaction = new ol.interaction.DragPan( {
			kinetic : false
		} );

		_self.interaction.set( "uGisDragPan", true );

		_self.interaction.setActive( false );

		ugmp.control.uGisControlDefault.prototype._init.call( this );
	};


	/**
	 * Interaction 활성화를 설정한다.
	 * 
	 * @overide {ugmp.control.uGisControlDefault.prototype.setActive}
	 * 
	 * @param state {Boolean} 활성화 여부.
	 */
	ugmp.control.uGisDragPan.prototype.setActive = function(state_) {
		var _self = this._this || this;

		if ( _self.interaction.getActive() && state_ === true ) {
			return false;
		}

		ugmp.control.uGisControlDefault.prototype.setActive.call( this, state_ );

		if ( state_ ) {
			var olMap = _self.uGisMap.getMap();
			var viewPort = olMap.getViewport();
			var startCenter = olMap.getView().getCenter();

			_self.key_pointerdrag = olMap.on( "pointerdrag", function(evt) {
				var viewCenter = evt.frameState.viewState.center;

				if ( startCenter[ 0 ] !== viewCenter[ 0 ] || startCenter[ 1 ] !== viewCenter[ 1 ] ) {
					viewPort.classList.remove( "cursor-default" );
					viewPort.classList.add( "cursor-closeHand" );
				}
			} );

			_self.key_pointerup = olMap.on( "pointerup", function(evt) {
				viewPort.classList.remove( "cursor-closeHand" );
				viewPort.classList.add( "cursor-default" );
			} );
		} else {
			ol.Observable.unByKey( _self.key_pointerup );
			ol.Observable.unByKey( _self.key_pointerdrag );
		}
	};

} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 줌인 객체.
	 * 
	 * 마우스로 드래깅하여 해당 영역으로 확대하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDragZoomIn = new ugmp.control.uGisDragZoomIn( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-zoomIn',
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
	 * @Extends {ugmp.control.uGisControlDefault}
	 */
	ugmp.control.uGisDragZoomIn = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.control.uGisControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.control.uGisDragZoomIn.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisDragZoomIn.prototype.constructor = ugmp.control.uGisDragZoomIn;


	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisControlDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisDragZoomIn.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.DragZoom( {
			condition : ol.events.condition.always,
			duration : 0,
			out : false
		} );

		_self.interaction.setActive( false );

		ugmp.control.uGisControlDefault.prototype._init.call( this );
	};

} )();

( function() {
	"use strict";

	/**
	 * 마우스 드래그 줌아웃 객체.
	 * 
	 * 마우스로 드래깅하여 해당 영역으로 축소하는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugDragZoomOut = new ugmp.control.uGisDragZoomOut( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-zoomOut',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {ugmp.control.uGisControlDefault}
	 */
	ugmp.control.uGisDragZoomOut = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.control.uGisControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.control.uGisDragZoomOut.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisDragZoomOut.prototype.constructor = ugmp.control.uGisDragZoomOut;


	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisControlDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisDragZoomOut.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.DragZoom( {
			condition : ol.events.condition.always,
			duration : 0,
			out : true
		} );

		_self.interaction.setActive( false );

		ugmp.control.uGisControlDefault.prototype._init.call( this );
	};

} )();

( function() {
	"use strict";

	/**
	 * 길이 측정 객체.
	 * 
	 * 마우스로 지도상에서 거리를 측정할 수 있는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugLengthMeasure = new ugmp.control.uGisLengthMeasure( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useSnap : true,
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-measureDistance',
	 * 	activeChangeListener : function(state_) {
	 * 		console.log( state_ );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap ugmp.uGisMap} 객체.
	 * @param opt_options.useDragPan {Boolean} 지도 이동 사용 여부. Default is `false`.
	 * @param opt_options.cursorCssName {String} 마우스 커서 CSS Class Name.
	 * @param opt_options.activeChangeListener {Function} 컨트롤의 상태 변경 CallBack.
	 * 
	 * @Extends {ugmp.control.uGisMeasureDefault}
	 */
	ugmp.control.uGisLengthMeasure = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {
			
			var options = opt_options || {};
						
			options.drawType = "LineString";
			options.useDrawEndDisplay = true;
			
			options.featureStyle = new ol.style.Style( {
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

	
	ugmp.control.uGisLengthMeasure.prototype = Object.create( ugmp.control.uGisMeasureDefault.prototype );
	ugmp.control.uGisLengthMeasure.prototype.constructor = ugmp.control.uGisLengthMeasure;
	
	
	/**
	 * 초기화
	 * 
	 * @override {ugmp.control.uGisMeasureDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisLengthMeasure.prototype._init = function() {
		var _self = this._this || this;
		
		ugmp.control.uGisMeasureDefault.prototype._init.call( this );
		
		_self.continueMsg = "길이 측정";
		
		_self.interaction.on( "drawstart", function(evt) {
			_self.sketch = evt.feature;

			/** @type {ol.Coordinate|undefined} */
			var tooltipCoord = evt.coordinate;

			_self.sketchChangeListener = _self.sketch.getGeometry().on( "change", function(evt) {
				var geom = evt.target;
				var output = _self._formatLength( geom );
				tooltipCoord = geom.getLastCoordinate();

				_self.measureTooltipElement.innerHTML = output;
				_self.measureTooltip.setPosition( tooltipCoord );
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
	};


	/**
	 * Format length output.
	 * 
	 * @param {ol.geom.LineString} line The line.
	 * 
	 * @private
	 * 
	 * @return {String} The formatted length.
	 */
	ugmp.control.uGisLengthMeasure.prototype._formatLength = function(line_) {
		var _self = this._this || this;
		
		var length = ol.Sphere.getLength( line_, {
			projection : _self.uGisMap.getCRS()
		} );
		
        var output;
        
        if ( length > 100 ) {
    		output = ( Math.round(length / 1000 * 100) / 100 ) + " " + "km";
        } else {
        	output = ( Math.round(length * 100) / 100 ) + " " + "m";
        }
        
        return output;
	};
	
} )();

( function() {
	"use strict";

	/**
	 * 지도 마우스 클릭 객체.
	 * 
	 * 마우스로 지도를 클릭하여 좌표를 가져오는 컨트롤 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugMapClick = new ugmp.control.uGisMapClick( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useDragPan : true,
	 * 	cursorCssName : 'cursor-identify',
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
	 * @Extends {ugmp.control.uGisControlDefault}
	 */
	ugmp.control.uGisMapClick = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.control.uGisControlDefault.call( _self, options );

			_self._init();

		} )();
		// END initialize


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.control.uGisMapClick.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisMapClick.prototype.constructor = ugmp.control.uGisMapClick;


	/**
	 * 초기화
	 * 
	 * @overide {ugmp.control.uGisControlDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisMapClick.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.Interaction( {
			handleEvent : _handleEvent
		} );

		_self.interaction.setActive( false );


		function _handleEvent(mapBrowserEvent) {
			var stopEvent = false;
			var browserEvent = mapBrowserEvent.originalEvent;

			if ( mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK ) {
				var map = mapBrowserEvent.map;

				mapBrowserEvent.preventDefault();
				// stopEvent = true;

				_self.interaction.dispatchEvent( {
					type : 'singleClick',
					coordinate : mapBrowserEvent.coordinate
				} );
			}

			return !stopEvent;
		}

		ugmp.control.uGisControlDefault.prototype._init.call( this );
	};

} )();

/**
 * @namespace ugmp.manager
 */

( function() {
	"use strict";

	/**
	 * 지도상에서 마우스와 상호작용하는 컨트롤을 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugControlManager = new ugmp.manager.uGisControlManager( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	controls : [ new ugmp.control.uGisDragPan({...}), new ugmp.control.uGisDrawFeature({...}) ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * 
	 * @class
	 */
	ugmp.manager.uGisControlManager = ( function(opt_options) {
		var _self = this;

		this.uGisMap = null;

		this.activeControl = null;
		this.uGisContrlObjects = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisContrlObjects = {};
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_self._init( options.controls );

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add
		}

	} );


	/**
	 * 초기화
	 * 
	 * @private
	 */
	ugmp.manager.uGisControlManager.prototype._init = function(controls_) {
		var _self = this._this || this;

		if ( Array.isArray( controls_ ) ) {
			for ( var i in controls_ ) {
				_self.add( controls_[ i ] );
			}
		}
	};


	/**
	 * 컨트롤 객체를 추가한다.
	 * 
	 * -컨트롤은 키로 관리한다.
	 * 
	 * @param uGisControl {ugmp.control} {@link ugmp.control ugmp.control} 객체.
	 */
	ugmp.manager.uGisControlManager.prototype.add = function(uGisControl_) {
		var _self = this._this || this;

		if ( !( uGisControl_._this instanceof ugmp.control.uGisControlDefault ) ) {
			return false;
		}

		if ( uGisControl_.getActive() ) {
			_self.activeControl = uGisControl_;
		}


		function _setActive(state_) {
			if ( uGisControl_.getInteraction().getActive() && state_ === true ) {
				return false;
			}

			if ( state_ ) {
				if ( _self.activeControl ) {
					_self.activeControl.setActive( false );
				}

				_self.activeControl = uGisControl_;
			}

			uGisControl_._this.setActive( state_ );
		}

		uGisControl_.setActive = _setActive;

		_self.uGisContrlObjects[ uGisControl_.getControlKey() ] = uGisControl_;
	};


	/**
	 * 컨트롤 키에 해당하는 컨트롤 객체를 가져온다.
	 * 
	 * @param controlKey {String} 컨트롤 키.
	 * 
	 * @return uGisControl {ugmp.control} {@link ugmp.control ugmp.control} 객체.
	 */
	ugmp.manager.uGisControlManager.prototype.get = function(controlKey_) {
		var _self = this._this || this;
		return _self.uGisContrlObjects[ controlKey_ ];
	};

} )();

( function() {
	"use strict";

	/**
	 * 레이어 및 TOC를 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugLayerManager = new ugmp.manager.uGisLayerManager( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useMinMaxZoom : true
	 * } );
	 * </pre>
	 * 
	 * @param uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param useMinMaxZoom {Boolean} MinZoom, MaxZoom 사용 여부. Default is `true`.
	 * 
	 * @class
	 */
	ugmp.manager.uGisLayerManager = ( function(opt_options) {
		var _self = this;

		this.uGisMap = null;
		this.useMinMaxZoom = null;

		this.uGisLayerNTocObjects = null;
		this.key_changeResolution = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.useMinMaxZoom = ( options.useMinMaxZoom !== undefined ) ? options.useMinMaxZoom : true;

			_self.uGisLayerNTocObjects = {};

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			if ( _self.useMinMaxZoom ) {
				_self._activeMinMaxZoom();
			}

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add,
			getAll : _self.getAll,
			remove : _self.remove,
			getUgisMap : _self.getUgisMap,
			scaleVisibleRefresh : _self._scaleVisibleRefresh
		}

	} );


	/**
	 * MinZoom, MaxZoom 설정 사용
	 * 
	 * @private
	 */
	ugmp.manager.uGisLayerManager.prototype._activeMinMaxZoom = function() {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var tempZoomEnd = null;

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			_self.key_changeResolution = evt1_.target.getView().on( "change:resolution", function(evt_) {
				_self._scaleVisibleRefresh();
			} );
		} );

		_self.key_changeResolution = _self.uGisMap.getMap().getView().on( "change:resolution", function(evt_) {
			_self._scaleVisibleRefresh();
		} );
	};


	/**
	 * 레이어 및 TOC 객체를 추가한다. (레이어 키로 관리)
	 * 
	 * @param uGisLayer {ugmp.layer} {@link ugmp.layer} 객체.
	 * @param uGisToc {ugmp.toc} {@link ugmp.toc} 객체.
	 */
	ugmp.manager.uGisLayerManager.prototype.add = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uGisLayer = ( options.uGisLayer !== undefined ) ? options.uGisLayer : undefined;
		var uGisToc = ( options.uGisToc !== undefined ) ? options.uGisToc : undefined;

		var layerKey = uGisLayer.getLayerKey();

		var zoomChangeListenerKey;

		if ( _self.useMinMaxZoom ) {
			zoomChangeListenerKey = uGisLayer.getOlLayer().on( "change:zoom", function(e_) {
				var targetView = _self.uGisMap.getMap().getView();

				if ( ( uGisLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= uGisLayer.getMaxZoom() ) ) {
					uGisLayer.setScaleVisible( true );
				} else {
					uGisLayer.setScaleVisible( false );
				}
			} );
		}

		_self.uGisLayerNTocObjects[ layerKey ] = {
			zoomChangeListenerKey : zoomChangeListenerKey,
			uGisLayer : uGisLayer,
			uGisToc : uGisToc
		};

		_self._scaleVisibleRefresh();
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 가져온다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 * 
	 * @return uGisLayerNTocObject {Object}
	 */
	ugmp.manager.uGisLayerManager.prototype.get = function(layerKey_) {
		var _self = this._this || this;
		return _self.uGisLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * 레이어, TOC 객체 리스트를 가져온다.
	 * 
	 * @param all {Boolean} 모든 객체 리스트를 가져올지 여부를 설정한다.
	 * 
	 * `false`면 {@link ugmp.layer} 객체 리스트만 가져온다.
	 * 
	 * @return uGisLayerNTocObject {Object}
	 */
	ugmp.manager.uGisLayerManager.prototype.getAll = function(all_) {
		var _self = this._this || this;

		var list = [];

		for ( var key in _self.uGisLayerNTocObjects ) {
			if ( _self.uGisLayerNTocObjects.hasOwnProperty( key ) ) {
				if ( all_ ) {
					list.push( _self.uGisLayerNTocObjects[ key ] );
				} else {
					list.push( _self.uGisLayerNTocObjects[ key ][ "uGisLayer" ] );
				}
			}
		}

		return list;
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 제거한다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 */
	ugmp.manager.uGisLayerManager.prototype.remove = function(layerKey_) {
		var _self = this._this || this;

		var object = _self.uGisLayerNTocObjects[ layerKey_ ];

		_self.uGisMap.removeLayer( layerKey_ );

		if ( object.uGisToc ) {
			object.uGisToc.remove();
		}

		if ( object.zoomChangeListenerKey ) {
			ol.Observable.unByKey( object.zoomChangeListenerKey );
		}

		delete _self.uGisLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * uGisMap 객체를 가져온다.
	 * 
	 * @return uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 */
	ugmp.manager.uGisLayerManager.prototype.getUgisMap = function() {
		var _self = this._this || this;
		return _self.uGisMap;
	};


	/**
	 * 스케일 visible 새로고침.
	 * 
	 * @private
	 */
	ugmp.manager.uGisLayerManager.prototype._scaleVisibleRefresh = function() {
		var _self = this._this || this;

		var targetView = _self.uGisMap.getMap().getView();

		for ( var key in _self.uGisLayerNTocObjects ) {
			if ( _self.uGisLayerNTocObjects.hasOwnProperty( key ) ) {
				var uGisLayer = _self.uGisLayerNTocObjects[ key ][ "uGisLayer" ];

				if ( ( uGisLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= uGisLayer.getMaxZoom() ) ) {
					uGisLayer.setScaleVisible( true );
				} else {
					uGisLayer.setScaleVisible( false );
				}
			}
		}
	};

} )();
