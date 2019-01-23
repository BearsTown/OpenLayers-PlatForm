( function() {
	"use strict";

	/**
	 * 컨트롤 버튼 기본 객체.
	 * 
	 * @param uGisMap {uGisMap} uGisMap 객체
	 */
	uGisMapPlatForm.control.uGisControlButtonDefault = ( function(opt_options) {
		var _self = this;

		this.title = null;
		this.html = null;
		this.uGisMap = null;
		this.className = null;
		this.handleClick = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_self.title = ( options.title !== undefined ) ? options.title : "";
			_self.html = ( options.html !== undefined ) ? options.html : "";
			_self.className = ( options.className !== undefined ) ? options.className : "";
			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.handleClick = ( options.handleClick !== undefined ) ? options.handleClick : undefined;

			if ( !_self.uGisMap ) {
				uGisMapPlatForm.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}


			var element = $( "<div>" ).addClass( _self.className + ' ol-button ol-unselectable ol-control' );
			var bt = $( "<button>" ).html( _self.html ).attr( 'type', 'button' ).attr( 'title', _self.title ).on( "click", function(e) {
				if ( e && e.preventDefault ) {
					e.preventDefault();
					e.stopPropagation();
				}
				if ( _self.handleClick ) {
					_self.handleClick.call( _self, e );
				}
			} ).appendTo( element );

			if ( !_self.title ) {
				bt.attr( "title", bt.children().first().attr( 'title' ) );
			}

			ol.control.Control.call( _self, {
				element : element.get( 0 ),
				target : options.target
			} );

			if ( _self.title ) {
				_self.set( "title", _self.title );
			}

		} )( opt_options );
		// END initialize


		this.getSuperObject = function() {
			return _self;
		};


		/**
		 * 상속 함수
		 */
		var superFuncs = {

		};


		/**
		 * 공통 외부 함수
		 */
		var publicFuncs = {
			getSuperObject : _self.getSuperObject
		};


		return {
			superFuncs : superFuncs,
			publicFuncs : publicFuncs
		}

	} );

	ol.inherits( uGisMapPlatForm.control.uGisControlButtonDefault, ol.control.Control );

} )();
