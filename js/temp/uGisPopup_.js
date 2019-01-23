( function() {
	"use strict";

	/**
	 * uGisPopup
	 * 
	 * @param uGisMap {uGisMap} uGisMap 객체
	 * @param closeCallBack {function} 팝업 close 시 콜백
	 */
	uGisMapPlatForm.uGisPopup = ( function(opt_options) {
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
				uGisMapPlatForm.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			_init( position, html, show );

		} )( opt_options );
		// END initialize


		/**
		 * 초기화
		 */
		function _init(position_, html_, show_) {
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

			_setContent( html_ );
			_setPosition( position_ );
			_self.uGisMap.getMap().addOverlay( _self );

			if ( show_ ) {
				_panIntoCenter();
			} else {
				_self.container.style.display = "none";
			}
		}

		/**
		 * 팝업의 위치를 지도 중앙에 표시
		 */
		function _panIntoCenter() {
			var olMap = _self.uGisMap.getMap();

			olMap.getView().animate( {
				center : _self.getPosition(),
				duration : 500
			} );
		}


		/**
		 * 팝업의 위치를 지도 뷰 화면에 표시
		 */
		function _panIntoView() {
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
		}


		/**
		 * 팝업 표시
		 * 
		 * @param panIntoCenter {Boolean} 가운데 영역으로 이동 사용 여부
		 */
		this.show = function(panIntoCenter_) {
			if ( _self.removed ) {
				return false;
			}
			_self.container.style.display = "block";

			var content = _self.content;

			window.setTimeout( function() {
				content.scrollTop = 0;
			}, 100 );

			if ( panIntoCenter_ ) {
				_panIntoCenter();
			} else {
				_panIntoView();
			}
		};


		/**
		 * 팝업 숨기기
		 */
		this.hide = function() {
			if ( _self.removed ) {
				return false;
			}
			_self.container.style.display = "none";
			if ( _self.closeCallBack ) {
				_self.closeCallBack();
			}
		};


		/**
		 * 팝업 내용 설정
		 * 
		 * @param html {String} html형태의 텍스트
		 */
		function _setContent(html_) {
			if ( typeof html_ === "string" ) {
				_self.content.innerHTML = html_;
			}
		}
		this.setContent = _setContent;


		/**
		 * 팝업 위치 설정
		 * 
		 * @param coordinate {ol.Coordinate{Array.<number>}} 좌표
		 */
		function _setPosition(coordinate_) {
			_self.set( "origin", {
				position : coordinate_,
				projection : _self.uGisMap.getCRS()
			} );

			_self.setPosition( coordinate_ );
		}
		this._setPosition = _setPosition;


		/**
		 * 팝업 삭제
		 */
		this.remove = function() {
			_self.hide();
			_self.removed = true;
			_self.uGisMap.getMap().removeOverlay( _self );
		};


		return {
			hide : _self.hide,
			show : _self.show,
			remove : _self.remove,
			setContent : _self.setContent,
			setPosition : _self._setPosition
		}

	} );

	ol.inherits( uGisMapPlatForm.uGisPopup, ol.Overlay );
} )();
