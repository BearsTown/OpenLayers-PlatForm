/**
 * @namespace ugmp
 */

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm에서 사용할 config를 설정한다.
	 * 
	 * 프록시 주소, 에러 알림창 함수, 로딩 심볼 표시 사용 여부, 로딩 심볼 이미지 경로를 설정할 수 있으며, 한 번 설정하면 공통으로 사용할 수 있다.
	 * 
	 * @example
	 * 
	 * <pre>
	 * ugmp.uGisConfig.init( {
	 * 	proxy : '/proxy.do', // 프록시 설정
	 * 	useLoading : true, // 로딩 심볼 표시 사용 여부
	 * 	loadingImg : 'https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif', // 로딩 심볼 이미지
	 * 	alert_Error : function(msg) { // 에러 알림창 함수
	 * 		alert( 'Error : ' + msg );
	 * 	}
	 * } );
	 * </pre>
	 * 
	 * @namespace
	 */
	ugmp.uGisConfig = ( function(opt_options) {
		var _self = this;

		this.proxy = null;
		this.mobile = null;
		this.loading = null;
		this.browser = null;
		this.progress = null;
		this.flag_Proxy = null;
		this.alert_Error = null;
		this.loadingImg = null;
		this.useLoading = null;
		this.useMapProxy = null;

		this.progressObj = {};

		_self._checkMobile();
		_self._checkBrowser();
		_self._setIeCursor();

		return {
			_this : _self,
			init : this.init,
			isMobile : this.isMobile,
			getProxy : this.getProxy,
			loading : this.getLoading,
			isMapProxy : this.isMapProxy,
			getBrowser : this.getBrowser,
			alert_Error : this.getAlert_Error,
			addProgress : this.addProgress,
			resetLoading : this.resetLoading,
			isUseLoading : this.isUseLoading,
			getLoadingImg : this.getLoadingImg,
			addLoadEventListener : this.addLoadEventListener
		}

	} );


	/**
	 * Initialize
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.proxy {String} 프록시 주소.
	 * @param opt_options.useLoading {Boolean} 로딩 심볼 표시 사용 여부. Default is `true`.
	 * @param opt_options.alert_Error {Function} 에러 알림창 함수 msg {String}. Default is `alert`.
	 * @param opt_options.loadingImg {String} 로딩 심볼 이미지 경로 또는 base64. Default is `icon_loading.gif`.
	 */
	ugmp.uGisConfig.prototype.init = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		if ( options.proxy !== undefined && typeof options.proxy === "string" ) {
			_self.proxy = options.proxy;
			_self.flag_Proxy = true;
		} else {
			_self.proxy = "";
			_self.flag_Proxy = false;
		}

		if ( options.alert_Error !== undefined && typeof options.alert_Error === "function" ) {
			_self.alert_Error = options.alert_Error;
		} else {
			_self.alert_Error = _self._defaultAlert_Error;
		}

		if ( options.loadingImg !== undefined && typeof options.loadingImg === "string" ) {
			_self.loadingImg = options.loadingImg;
		} else {
			var defaultLoadingImg = ugmp.contextPath + "/uGisMapPlatForm/images/icon_loading.gif";
			_self.loadingImg = _self.defaultLoadingImg;
		}

		_self.useLoading = ( options.useLoading !== undefined ) ? options.useLoading : true;
		_self.useMapProxy = ( options.useMapProxy !== undefined ) ? options.useMapProxy : false;
	};


	/**
	 * 현재 브라우저가 모바일이면 `true`.
	 * 
	 * @return mobile {Boolean} 모바일 여부.
	 */
	ugmp.uGisConfig.prototype.isMobile = function() {
		var _self = this._this || this;
		return _self.mobile;
	};


	/**
	 * URL 레이어 Proxy 사용 여부를 가져온다.
	 * 
	 * @return useMapProxy {Boolean} URL 레이어 Proxy 사용 여부.
	 */
	ugmp.uGisConfig.prototype.isMapProxy = function() {
		var _self = this._this || this;
		return _self.useMapProxy;
	};


	/**
	 * 현재 브라우저 타입을 가져온다.
	 * 
	 * @return browser {String} 브라우저 타입.
	 */
	ugmp.uGisConfig.prototype.getBrowser = function() {
		var _self = this._this || this;
		return _self.browser;
	};


	/**
	 * 설정된 프록시 주소를 가져온다.
	 * 
	 * @return proxy {String} 프록시 주소.
	 */
	ugmp.uGisConfig.prototype.getProxy = function() {
		var _self = this._this || this;

		if ( _self.flag_Proxy !== undefined ) {
			return _self.proxy;
		} else {
			return "";
		}
	};


	/**
	 * 설정된 에러 알림 함수를 호출한다.
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	ugmp.uGisConfig.prototype.getAlert_Error = function(msg_) {
		var _self = this._this || this;
		_self.alert_Error( msg_ );
	};


	/**
	 * 에러 발생 시 기본 호출 함수
	 * 
	 * @private
	 * 
	 * @param msg {String} 알림 메세지.
	 */
	ugmp.uGisConfig.prototype._defaultAlert_Error = function(msg_) {
		alert( msg_ );
	};


	/**
	 * 로딩 심볼 표시 사용 여부를 가져온다.
	 * 
	 * @return useLoading {Boolean} 로딩 심볼 표시 사용 여부.
	 */
	ugmp.uGisConfig.prototype.isUseLoading = function() {
		var _self = this._this || this;
		return _self.useLoading;
	};


	/**
	 * 로딩 심볼을 리셋 시킨다.
	 * 
	 * @param key {String} 지도의 View ID.
	 */
	ugmp.uGisConfig.prototype.resetLoading = function(key_) {
		var _self = this._this || this;

		if ( _self.progressObj[ key_ ] ) {
			_self.progressObj[ key_ ].reset();
		}
	};


	/**
	 * 로딩 심볼 표시 함수.
	 * 
	 * @param key {String} 지도의 View ID.
	 * @param state {Boolean} 사용 여부.
	 */
	ugmp.uGisConfig.prototype.getLoading = function(key_, state_) {
		var _self = this._this || this;

		if ( state_ ) {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoading();
			}
		} else {
			if ( _self.progressObj[ key_ ] ) {
				_self.progressObj[ key_ ].addLoaded();
			}
		}
	};


	/**
	 * 로딩 심볼 표시 연동 함수.
	 * 
	 * @private
	 * 
	 * @return loadingFunc {Function} 로딩 심볼 표시 함수.
	 */
	ugmp.uGisConfig.prototype._Progress = function(key_, loadingFunc_) {
		var _self = this;

		this.key = null;
		this.loaded = null;
		this.loading = null;
		this.interval = null;
		this.timeOut = null;
		this.loadingFunc = null;


		( function() {
			_self.key = key_;
			_self.loaded = 0;
			_self.loading = 0;
			_self.loadingFunc = loadingFunc_;
		} )();


		this.addLoading = ( function() {
			if ( _self.loading === 0 ) {
				_self.loadingFunc( true );

				_$( document ).trigger( "loadChangeEvent_" + _self.key, false );
			}
			++_self.loading;
			_self.update();
		} );


		this.addLoaded = ( function() {
			setTimeout( function() {
				++_self.loaded;
				_self.update();
			}, 100 );
		} );


		this.update = ( function() {
			if ( ( _self.loading !== 0 && _self.loaded !== 0 ) && ( _self.loading <= _self.loaded ) ) {
				_self.loading = 0;
				_self.loaded = 0;

				clearInterval( _self.interval );

				// _self.timeOut = setTimeout( function() {
				_self.loadingFunc( false );

				$( document ).trigger( "loadChangeEvent_" + _self.key, true );
				// }, 999 );
			} else {
				clearTimeout( _self.timeOut );
			}
		} );


		this.reset = ( function() {
			clearInterval( _self.interval );
			_self.interval = setInterval( _self.update, 1000 );
		} );


		return {
			reset : _self.reset,
			addLoaded : _self.addLoaded,
			addLoading : _self.addLoading
		}
	};


	/**
	 * 웹, 모바일 여부 체크.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._checkMobile = function() {
		var _self = this._this || this;

		var filter = "win16|win32|win64|mac";
		if ( navigator.platform ) {
			if ( 0 > filter.indexOf( navigator.platform.toLowerCase() ) ) {
				_self.mobile = true;
			} else {
				_self.mobile = false;
			}
		}
	};


	/**
	 * 브라우저 종류 체크.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._checkBrowser = function() {
		var _self = this._this || this;

		var browser;
		var name = navigator.appName;
		var agent = navigator.userAgent.toLowerCase();

		// MS 계열 브라우저를 구분하기 위함.
		if ( name === 'Microsoft Internet Explorer' || agent.indexOf( 'trident' ) > -1 || agent.indexOf( 'edge/' ) > -1 ) {
			browser = 'ie';
			if ( name === 'Microsoft Internet Explorer' ) { // IE old version (IE 10 or Lower)
				agent = /msie ([0-9]{1,}[\.0-9]{0,})/.exec( agent );
				browser += parseInt( agent[ 1 ] );
			} else { // IE 11+
				if ( agent.indexOf( 'trident' ) > -1 ) { // IE 11
					browser += 11;
				} else if ( agent.indexOf( 'edge/' ) > -1 ) { // Edge
					browser = 'edge';
				}
			}
		} else if ( agent.indexOf( 'safari' ) > -1 ) { // Chrome or Safari
			if ( agent.indexOf( 'opr' ) > -1 ) { // Opera
				browser = 'opera';
			} else if ( agent.indexOf( 'chrome' ) > -1 ) { // Chrome
				browser = 'chrome';
			} else { // Safari
				browser = 'safari';
			}
		} else if ( agent.indexOf( 'firefox' ) > -1 ) { // Firefox
			browser = 'firefox';
		}

		// IE: ie7~ie11, Edge: edge, Chrome: chrome, Firefox: firefox, Safari: safari, Opera: opera
		_self.browser = browser;
	};


	/**
	 * 브라우저가 IE인 경우 마우스 커서 설정.
	 * 
	 * @private
	 */
	ugmp.uGisConfig.prototype._setIeCursor = function() {
		var _self = this._this || this;

		if ( _self.browser && _self.browser.indexOf( "ie" ) > -1 ) {
			var style = document.createElement( 'style' );
			style.type = 'text/css';
			document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );

			var cursorList = [ 'default', 'closeHand', 'identify', 'measureArea', 'measureDistance', 'zoomIn', 'zoomOut', 'zoomOut', 'point', 'line',
					'polygon', 'rectangle', 'circle' ];

			for ( var i in cursorList ) {
				var cursor = cursorList[ i ];
				var url = "../images/cursor/cursor_" + cursor + ".cur";

				var name = '.cursor-' + cursor;
				var rule = "cursor: url(" + url + "), auto !important;";

				if ( !( style.sheet || {} ).insertRule ) {
					( style.styleSheet || style.sheet ).addRule( name, rule );
				} else {
					style.sheet.insertRule( name + "{" + rule + "}", 0 );
				}
			}
		}
	};


	/**
	 * 설정된 로딩 심볼 이미지를 가져온다.
	 * 
	 * @return loadingImg {String} 이미지 경로 또는 base64.
	 */
	ugmp.uGisConfig.prototype.getLoadingImg = function() {
		var _self = this._this || this;

		if ( !_self.loadingImg ) {
			var defaultLoadingImg = ugmp.contextPath + "/uGisMapPlatForm/images/icon_loading.gif";
			_self.loadingImg = defaultLoadingImg;
		}
		return _self.loadingImg;
	};


	/**
	 * 데이터 로딩 프로그레스를 추가한다.
	 * 
	 * @param key {String} View ID.
	 * @param loadFunction {Function} 로딩 심볼 표시 함수.
	 */
	ugmp.uGisConfig.prototype.addProgress = function(key_, loadFunction_) {
		var _self = this._this || this;
		_self.progressObj[ key_ ] = new _self._Progress( key_, loadFunction_ );
	};


	/**
	 * 데이터 로딩 시작/완료 이벤트를 추가한다.
	 * 
	 * ※로드가 시작되거나 로딩 중이면 `false` 로딩이 완료 되면 `true`를 반환한다.
	 * 
	 * @param key {String} View ID.
	 * @param eventListener {Function} {jQuery.Event, Boolean} 시작/완료 함수.
	 */
	ugmp.uGisConfig.prototype.addLoadEventListener = function(key_, eventListener_) {
		var _self = this._this || this;
		setTimeout( function() {
			$( document ).on( "loadChangeEvent_" + key_, eventListener_ );
		}, 10 )
	};


	ugmp.uGisConfig = new ugmp.uGisConfig();

} )();
