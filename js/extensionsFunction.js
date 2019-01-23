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

} )( window );
