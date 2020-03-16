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
