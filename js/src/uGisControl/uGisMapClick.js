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
				stopEvent = true;

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
