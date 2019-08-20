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
