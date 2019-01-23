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
