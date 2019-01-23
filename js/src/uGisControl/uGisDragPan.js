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
