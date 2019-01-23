( function() {
	"use strict";

	ugmp.control.uGisClickInfo = ( function(opt_options) {
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


	ugmp.control.uGisClickInfo.prototype = Object.create( ugmp.control.uGisControlDefault.prototype );
	ugmp.control.uGisClickInfo.prototype.constructor = ugmp.control.uGisClickInfo;


	/**
	 * 초기화
	 * 
	 * @overide {ugmp.control.uGisControlDefault.prototype._init}
	 * 
	 * @private
	 */
	ugmp.control.uGisClickInfo.prototype._init = function() {
		var _self = this._this || this;

		_self.interaction = new ol.interaction.Interaction( {
			handleEvent : _self._handleEvent
		} );

		_self.interaction.setActive( false );

		ugmp.control.uGisControlDefault.prototype._init.call( this );
	};


	ugmp.control.uGisClickInfo.prototype._handleEvent = function(mapBrowserEvent) {
		var _self = this._this || this;

		var stopEvent = false;
		var browserEvent = mapBrowserEvent.originalEvent;

		if ( mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK ) {
			var map = mapBrowserEvent.map;
			var anchor = mapBrowserEvent.coordinate;

			mapBrowserEvent.preventDefault();
			stopEvent = true;

			console.log( mapBrowserEvent );
		}

		return false;
	};


} )();
