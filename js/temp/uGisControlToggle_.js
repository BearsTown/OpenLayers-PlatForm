( function() {
	"use strict";

	/**
	 * 컨트롤 토글 버튼 객체.
	 * 
	 * @param uGisMap {uGisMap} uGisMap 객체
	 */
	uGisMapPlatForm.control.uGisControlToggle = ( function(opt_options) {
		var _self = this;
		var _super;

		this.active = null;
		this.disable = null;
		this.onToggle = null;
		this.interaction = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			debugger

			var options = opt_options || {};

			_self.active = ( options.active !== undefined ) ? options.active : false;
			_self.disable = ( options.disable !== undefined ) ? options.disable : false;
			_self.onToggle = ( typeof ( options.onToggle ) === "function" ) ? options.onToggle : undefined;
			_self.interaction = ( options.interaction !== undefined ) ? options.interaction : undefined;

			options.className = ( options.className !== undefined ) ? options.className : "";
			options.className += " ol-toggle";

			options.handleClick = function() {
				_self.toggle();

				if ( _self.onToggle ) {
					_self.onToggle.call( _self, _self.getActive() );
				}
			};


			if ( _self.interaction ) {
				_self.interaction.on( "change:active", function(e_) {
					_self.setActive( !e_.oldValue );
				} );
			}


			_super = uGisMapPlatForm.control.uGisControlButton.call( _self, options );


			// _super.set( "title", options.title );

			_self.set( "autoActivate", options.autoActivate );

			// if ( options.bar ) {
			// this.subbar_ = options.bar;
			// this.subbar_.setTarget( this.element );
			// $( this.subbar_.element ).addClass( "ol-option-bar" );
			// }

			_setActive( _self.active );
			_setDisable( _self.disable );

		} )( opt_options );
		// END initialize


		function _setDisable(b_) {
			if ( _getDisable() == b_ ) return;
			$( "button", _self.element ).prop( "disabled", b_ );
			if ( b_ && _self.getActive() ) _setActive( false );

			_self.dispatchEvent( {
				type : 'change:disable',
				key : 'disable',
				oldValue : !b_,
				disable : b_
			} );
		}


		function _getDisable() {
			return $( "button", _self.element ).prop( "disabled" );
		}


		function _getActive() {
			return $( _self.element ).hasClass( "ol-active" );
		}


		function _setActive(b_) {
			if ( _getActive() == b_ ) return;

			if ( b_ ) {
				$( _self.element ).addClass( "ol-active" );
			} else {
				$( _self.element ).removeClass( "ol-active" );
			}

			if ( _self.interaction ) {
				_self.interaction.setActive( b_ );
			}

			// if ( _self.subbar_ ) {
			// _self.subbar_.setActive( b_ );
			// }

			_self.dispatchEvent( {
				type : 'change:active',
				key : 'active',
				oldValue : !b_,
				active : b_
			} );
		}
		this.setActive = _setActive;


		return uGisMapPlatForm.util.uGisUtil.objectMerge( _super.publicFuncs, {
			setActive : _self.setActive
		} );

	} );

	ol.inherits( uGisMapPlatForm.control.uGisControlToggle, uGisMapPlatForm.control.uGisControlButton );

} )();
