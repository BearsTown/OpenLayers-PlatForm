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
