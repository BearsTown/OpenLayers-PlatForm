/**
 * @namespace ugmp.util
 */

( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 유틸리티.
	 * 
	 * uGisMapPlatForm에서 자주 사용하는 유틸리티 객체.
	 * 
	 * @namespace
	 */
	ugmp.util.uGisUtil = ( function() {

		return {
			isXMLDoc : this.isXMLDoc,
			xmlToJson : this.xmlToJson,
			objectMerge : this.objectMerge,
			cloneStyle : this.cloneStyle,
			cloneFeature : this.cloneFeature,
			cloneFeatures : this.cloneFeatures,
			cloneGeometry : this.cloneGeometry,
			generateUUID : this.generateUUID,
			appendParams : this.appendParams,
			setCssTextStyle : this.setCssTextStyle,
			numberWithCommas : this.numberWithCommas
		}

	} );


	/**
	 * 숫자 1000단위 콤마 표시.
	 * 
	 * @param num {Number|String} 숫자.
	 * 
	 * @return {String} 1000단위 (세 자리마다 콤마 표시).
	 */
	ugmp.util.uGisUtil.prototype.numberWithCommas = function(num_) {
		if ( !num_ ) return 0;
		var parts = num_.toString().split( "." );
		return parts[ 0 ].replace( /\B(?=(\d{3})+(?!\d))/g, "," ) + ( parts[ 1 ] ? "." + parts[ 1 ] : "" );
	};


	/**
	 * XML을 JSON으로 변환한다.
	 * 
	 * @param xml {Document} XML.
	 * 
	 * @return obj {Object} JSON.
	 */
	ugmp.util.uGisUtil.prototype.xmlToJson = function(xml_) {

		// Create the return object
		var obj = {};

		if ( xml_.nodeType == 1 ) { // element
			// do attributes
			if ( xml_.attributes.length > 0 ) {
				obj[ "@attributes" ] = {};
				for ( var j = 0; j < xml_.attributes.length; j++ ) {
					var attribute = xml_.attributes.item( j );
					obj[ "@attributes" ][ attribute.nodeName ] = attribute.nodeValue;
				}
			}
		} else if ( xml_.nodeType == 3 ) { // text
			obj = xml_.nodeValue;
		}

		// do children
		if ( xml_.hasChildNodes() ) {
			for ( var i = 0; i < xml_.childNodes.length; i++ ) {
				var item = xml_.childNodes.item( i );
				var nodeName = item.nodeName;
				if ( typeof ( obj[ nodeName ] ) == "undefined" ) {
					obj[ nodeName ] = this.xmlToJson( item );
				} else {
					if ( typeof ( obj[ nodeName ].push ) == "undefined" ) {
						var old = obj[ nodeName ];
						obj[ nodeName ] = [];
						obj[ nodeName ].push( old );
					}
					obj[ nodeName ].push( this.xmlToJson( item ) );
				}
			}
		}

		return obj;
	};


	/**
	 * 객체가 Document인지 체크한다.
	 * 
	 * @param a {Object} 체크할 객체.
	 * 
	 * @return b {Boolean} 해당 객체가 Document면 `true` 아니면 `false`.
	 */
	ugmp.util.uGisUtil.prototype.isXMLDoc = function(a) {
		var b = a && ( a.ownerDocument || a ).documentElement;
		return !!b && "HTML" !== b.nodeName;
	};


	/**
	 * JSON 파라미터를 URI에 GET 방식으로 붙인다.
	 * 
	 * @param uri {String} URI.
	 * @param params {Object} 추가할 JSON 파라미터 객체.
	 * 
	 * @return uri {String} JSON 파라미터가 추가된 URI.
	 */
	ugmp.util.uGisUtil.prototype.appendParams = function(uri_, params_) {
		var keyParams = [];
		Object.keys( params_ ).forEach( function(k) {
			if ( params_[ k ] !== null && params_[ k ] !== undefined ) {
				keyParams.push( k + "=" + encodeURIComponent( params_[ k ] ) );
			}
		} );
		var qs = keyParams.join( "&" );
		uri_ = uri_.replace( /[?&]$/, "" );
		uri_ = uri_.indexOf( "?" ) === -1 ? uri_ + "?" : uri_ + "&";

		return uri_ + qs;
	};


	/**
	 * UUID 생성를 생성한다.
	 * 
	 * @return uuid {String} UUID.
	 */
	ugmp.util.uGisUtil.prototype.generateUUID = function() {
		var d = new Date().getTime();
		var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g, function(c) {
			var r = ( d + Math.random() * 16 ) % 16 | 0;
			d = Math.floor( d / 16 );
			return ( c == "x" ? r : ( r & 0x3 | 0x8 ) ).toString( 16 );
		} );

		return uuid;
	};


	/**
	 * 두 객체를 병합한다. 중복된 Key의 데이터일 경우 덮어쓴다.
	 * 
	 * @return object {Object} 병합된 Object.
	 */
	ugmp.util.uGisUtil.prototype.objectMerge = function() {
		var options, name, src, copy, copyIsArray, clone, target = arguments[ 0 ] || {}, i = 1, length = arguments.length, deep = false;

		if ( typeof target === "boolean" ) {
			deep = target;

			target = arguments[ i ] || {};
			i++;
		}

		if ( typeof target !== "object" && !jQuery.isFunction( target ) ) {
			target = {};
		}

		if ( i === length ) {
			target = this;
			i--;
		}

		for ( ; i < length; i++ ) {

			if ( ( options = arguments[ i ] ) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					if ( target === copy ) {
						continue;
					}

					if ( deep && copy && ( jQuery.isPlainObject( copy ) || ( copyIsArray = Array.isArray( copy ) ) ) ) {

						if ( copyIsArray ) {
							copyIsArray = false;
							clone = src && Array.isArray( src ) ? src : [];

						} else {
							clone = src && jQuery.isPlainObject( src ) ? src : {};
						}

						target[ name ] = jQuery.extend( deep, clone, copy );

					} else if ( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}

		return target;
	};


	/**
	 * DOM Element 스타일 추가/업데이트 한다.
	 * 
	 * @param el {Element} 대상 Element.
	 * @param style {String} 적용할 스타일명.
	 * @param value {String} 스타일 속성.
	 */
	ugmp.util.uGisUtil.prototype.setCssTextStyle = function(el, style, value) {
		var result = el.style.cssText.match( new RegExp( "(?:[;\\s]|^)(" + style.replace( "-", "\\-" ) + "\\s*:(.*?)(;|$))" ) ), idx;
		if ( result ) {
			idx = result.index + result[ 0 ].indexOf( result[ 1 ] );
			el.style.cssText = el.style.cssText.substring( 0, idx ) + style + ": " + value + ";" + el.style.cssText.substring( idx + result[ 1 ].length );
		} else {
			el.style.cssText += " " + style + ": " + value + ";";
		}
	};


	/**
	 * geometry 객체를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param geometry {ol.geom} 복사할 geometry 객체.
	 * 
	 * @return {ol.geom} 복사한 geometry 객체.
	 */
	ugmp.util.uGisUtil.prototype.cloneGeometry = function(geometry_) {
		return ol.geom[ geometry_.getType() ].prototype.clone.call( geometry_ );
	};


	/**
	 * 피처를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {ol.Feature} 복사할 피처 객체.
	 * 
	 * @return cloneFt {ol.Feature} 복사한 피처.
	 */
	ugmp.util.uGisUtil.prototype.cloneFeature = function(feature_) {
		var cloneFt = new ol.Feature( feature_.getProperties() );
		cloneFt.setGeometryName( feature_.getGeometryName() );

		var geometry = feature_.getGeometry();
		if ( geometry ) {
			cloneFt.setGeometry( this.cloneGeometry( geometry ) );
		}
		var style = feature_.getStyle();
		if ( style ) {
			cloneFt.setStyle( style );
		}
		return cloneFt;
	};


	/**
	 * 피처리스트를 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param feature {Array.<ol.Feature>} 복사할 피처리스트 객체.
	 * 
	 * @return array {Array.<ol.Feature>} 복사한 피처리스트.
	 */
	ugmp.util.uGisUtil.prototype.cloneFeatures = function(features_) {
		if ( !Array.isArray( features_ ) ) return false;

		var array = [];
		for ( var i in features_ ) {
			array.push( this.cloneFeature( features_[ i ] ) );
		}

		return array;
	};


	/**
	 * 스타일을 복사한다.
	 * 
	 * ※window 객체가 다를 경우(window.open) 생성자가 다르므로 instanceof 가 성립되지 않는 문제 해결 방안.
	 * 
	 * @param style {ol.style.Style} 복사할 스타일 객체.
	 * 
	 * @return style {ol.style.Style} 복사한 스타일.
	 */
	ugmp.util.uGisUtil.prototype.cloneStyle = function(style_) {
		var geometry = style_.getGeometry();

		if ( geometry && geometry.clone ) {
			geometry = this.cloneGeometry( geometry )
		}

		return new ol.style.Style( {
			geometry : geometry,
			fill : style_.getFill() ? style_.getFill().clone() : undefined,
			image : style_.getImage() ? style_.getImage().clone() : undefined,
			stroke : style_.getStroke() ? style_.getStroke().clone() : undefined,
			text : style_.getText() ? style_.getText().clone() : undefined,
			zIndex : style_.getZIndex()
		} );
	};


	ugmp.util.uGisUtil = new ugmp.util.uGisUtil();

} )();
