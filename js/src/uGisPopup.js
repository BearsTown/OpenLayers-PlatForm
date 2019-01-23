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
