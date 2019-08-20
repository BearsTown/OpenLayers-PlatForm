/**
 * JavasScript ExtensionsFunction
 * 
 * Author : LeeJaeHyuk
 */
( function(window) {
	"use strict";

	window.eF = {};

	/**
	 * Javascript HashMap
	 */
	window.eF.HashMap = ( function(opt_options) {
		var _self = this;

		this.keyArray = null;
		this.valArray = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_self.keyArray = new Array();
			_self.valArray = new Array();

		} )( opt_options );
		// END Initialize


		/**
		 * set
		 * 
		 * @param key {} Key
		 * @param val {} Value
		 */
		this.set = function(key_, val_) {
			var elementIndex = _self.findIt( key_ );

			if ( elementIndex == ( -1 ) ) {
				_self.keyArray.push( key_ );
				_self.valArray.push( val_ );
			} else {
				_self.valArray[ elementIndex ] = val_;
			}
		};


		/**
		 * get
		 * 
		 * @param key {} Key
		 * 
		 * @return result {} Value
		 */
		this.get = function(key_) {
			var result = null;
			var elementIndex = _self.findIt( key_ );

			if ( elementIndex != ( -1 ) ) {
				result = _self.valArray[ elementIndex ];
			}

			return result;
		};


		/**
		 * remove
		 * 
		 * @param key {} Key
		 */
		this.remove = function(key_) {
			var result = null;
			var elementIndex = _self.findIt( key_ );

			if ( elementIndex != ( -1 ) ) {
				var part1 = _self.keyArray.slice( 0, elementIndex );
				var part2 = _self.keyArray.slice( elementIndex + 1 );
				_self.keyArray = part1.concat( part2 );

				var part3 = _self.valArray.slice( 0, elementIndex );
				var part4 = _self.valArray.slice( elementIndex + 1 );
				_self.valArray = part3.concat( part4 );
			}

			return;
		};


		/**
		 * size
		 * 
		 * @return length {Number<Integer>} HashMap Size
		 */
		this.size = function() {
			return _self.keyArray.length;
		};


		/**
		 * clear
		 */
		this.clear = function() {
			for ( var i = 0; i < _self.keyArray.length; i++ ) {
				_self.keyArray.pop();
				_self.valArray.pop();
			}
		};


		/**
		 * KeySet
		 * 
		 * @return keyArray {Array} KeySet
		 */
		this.keySet = function() {
			return _self.keyArray;
		};


		/**
		 * ValueSet
		 * 
		 * @return valArray {Array} ValueSet
		 */
		this.valSet = function() {
			return _self.valArray;
		};


		/**
		 * showMe
		 * 
		 * @return result {String} Key&Value Set
		 */
		this.showMe = function() {
			var result = "";

			for ( var i = 0; i < _self.keyArray.length; i++ ) {
				result += "Key: " + _self.keyArray[ i ] + "\tValues: " + _self.valArray[ i ] + "\n";
			}
			return result;
		};


		/**
		 * findIt
		 * 
		 * @param key {} Key
		 * 
		 * @return result {Number<Integer>} findIt
		 */
		this.findIt = function(key_) {
			var result = ( -1 );

			for ( var i = 0; i < _self.keyArray.length; i++ ) {
				if ( _self.keyArray[ i ] == key_ ) {
					result = i;
					break;
				}
			}
			return result;
		};


		/**
		 * findCount
		 * 
		 * @param key {} Key
		 * 
		 * @return result {Number<Integer>} findCount
		 */
		this.findCount = function(key_) {
			var result = 0;

			for ( var i = 0; i < _self.keyArray.length; i++ ) {
				if ( _self.keyArray[ i ] == key_ ) {
					result = result++;
				}
			}

			return result;
		};


		return {
			get : _self.get,
			set : _self.set,
			size : _self.size,
			clear : _self.clear,
			findIt : _self.findIt,
			valSet : _self.valSet,
			keySet : _self.keySet,
			remove : _self.remove,
			showMe : _self.showMe,
			findCount : _self.findCount
		}

	} );


	/**
	 * Javascript isDefined
	 */
	window.eF.isDefined = function(value_) {
		return typeof value_ !== 'undefined';
	};


	/**
	 * Javascript isUnDefined
	 */
	window.eF.isUnDefined = function(value_) {
		return typeof value_ === 'undefined';
	};


	/**
	 * 상속
	 */
	window.eF.inherits = function(childCtor, parentCtor) {
		childCtor.prototype = Object.create( parentCtor.prototype );
		childCtor.prototype.constructor = childCtor;
	};


	/**
	 * 숫자 앞에 0 표시
	 * 
	 * @param n {} 대상 숫자
	 * @param digits {} 자릿수
	 * 
	 * @return num {} 숫자
	 */
	window.eF.leadingZeros = function(n, digits) {
		var zero = '';
		n = n.toString();

		if ( n.length < digits ) {
			for ( var i = 0; i < digits - n.length; i++ )
				zero += '0';
		}

		return zero + n;
	};
	
	
	
	
	
	
	
	window.eF.elementResizeListener = ( function(opt_options) {
		var _self = this;

		/**
		 * Initialize
		 */
		( function() {
			
			_self._init();

		} )();
		
		return {
			_this : _self
		}

	} )();
	
	
	window.eF.elementResizeListener.prototype._init = ( function() {
		var _self = this._this || this;
		
		
	} );
	
	
	
	
	
	
	
	
	/**
	 * element resize 감지 이벤트
	 */
	( function($) {
		var attachEvent = document.attachEvent, stylesCreated = false;

		var jQuery_resize = $.fn.resize;

		$.fn.resize = ( function(callback) {
			return this.each( function() {
				if ( this == window ) jQuery_resize.call( jQuery( this ), callback );
				else addResizeListener( this, callback );
			} );
		} );

		$.fn.removeResize = ( function(callback) {
			return this.each( function() {
				removeResizeListener( this, callback );
			} );
		} );

		if ( !attachEvent ) {
			var requestFrame = ( function() {
				var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(fn) {
					return window.setTimeout( fn, 20 );
				};
				return function(fn) {
					return raf( fn );
				};
			} )();

			var cancelFrame = ( function() {
				var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
				return function(id) {
					return cancel( id );
				};
			} )();

			function resetTriggers(element) {
				var triggers = element.__resizeTriggers__, expand = triggers.firstElementChild, contract = triggers.lastElementChild, expandChild = expand.firstElementChild;
				contract.scrollLeft = contract.scrollWidth;
				contract.scrollTop = contract.scrollHeight;
				expandChild.style.width = expand.offsetWidth + 1 + 'px';
				expandChild.style.height = expand.offsetHeight + 1 + 'px';
				expand.scrollLeft = expand.scrollWidth;
				expand.scrollTop = expand.scrollHeight;
			}

			function checkTriggers(element) {
				return element.offsetWidth != element.__resizeLast__.width || element.offsetHeight != element.__resizeLast__.height;
			}

			function scrollListener(e) {
				var element = this;
				resetTriggers( this );
				if ( this.__resizeRAF__ ) cancelFrame( this.__resizeRAF__ );
				this.__resizeRAF__ = requestFrame( function() {
					if ( checkTriggers( element ) ) {
						element.__resizeLast__.width = element.offsetWidth;
						element.__resizeLast__.height = element.offsetHeight;
						element.__resizeListeners__.forEach( function(fn) {
							fn.call( element, e );
						} );
					}
				} );
			}

			/* Detect CSS Animations support to detect element display/re-attach */
			var animation = false, animationstring = 'animation', keyframeprefix = '', animationstartevent = 'animationstart', domPrefixes = 'Webkit Moz O ms'
					.split( ' ' ), startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split( ' ' ), pfx = '';
			{
				var elm = document.createElement( 'fakeelement' );
				if ( elm.style.animationName !== undefined ) {
					animation = true;
				}

				if ( animation === false ) {
					for ( var i = 0; i < domPrefixes.length; i++ ) {
						if ( elm.style[ domPrefixes[ i ] + 'AnimationName' ] !== undefined ) {
							pfx = domPrefixes[ i ];
							animationstring = pfx + 'Animation';
							keyframeprefix = '-' + pfx.toLowerCase() + '-';
							animationstartevent = startEvents[ i ];
							animation = true;
							break;
						}
					}
				}
			}

			var animationName = 'resizeanim';
			var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
			var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
		}

		function createStyles() {
			if ( !stylesCreated ) {
				// opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
				var css = ( animationKeyframes ? animationKeyframes : '' )
						+ '.resize-triggers { '
						+ ( animationStyle ? animationStyle : '' )
						+ 'visibility: hidden; opacity: 0; } '
						+ '.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }', head = document.head
						|| document.getElementsByTagName( 'head' )[ 0 ], style = document.createElement( 'style' );

				style.type = 'text/css';
				if ( style.styleSheet ) {
					style.styleSheet.cssText = css;
				} else {
					style.appendChild( document.createTextNode( css ) );
				}

				head.appendChild( style );
				stylesCreated = true;
			}
		}

		window.addResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.attachEvent( 'onresize', fn );
			else {
				if ( !element.__resizeTriggers__ ) {
					if ( getComputedStyle( element ).position == 'static' ) element.style.position = 'relative';
					createStyles();
					element.__resizeLast__ = {};
					element.__resizeListeners__ = [];
					( element.__resizeTriggers__ = document.createElement( 'div' ) ).className = 'resize-triggers';
					element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' + '<div class="contract-trigger"></div>';
					element.appendChild( element.__resizeTriggers__ );
					resetTriggers( element );
					element.addEventListener( 'scroll', scrollListener, true );

					/* Listen for a css animation to detect element display/re-attach */
					animationstartevent && element.__resizeTriggers__.addEventListener( animationstartevent, function(e) {
						if ( e.animationName == animationName ) resetTriggers( element );
					} );
				}
				element.__resizeListeners__.push( fn );
			}
		} );

		window.removeResizeListener = ( function(element, fn) {
			if ( attachEvent ) element.detachEvent( 'onresize', fn );
			else {
				element.__resizeListeners__.splice( element.__resizeListeners__.indexOf( fn ), 1 );
				if ( !element.__resizeListeners__.length ) {
					element.removeEventListener( 'scroll', scrollListener );
					element.__resizeTriggers__ = !element.removeChild( element.__resizeTriggers__ );
				}
			}
		} );
	}( jQuery ) );
	
	

} )( window );
