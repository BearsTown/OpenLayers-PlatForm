( function() {
	"use strict";

	/**
	 * 컨트롤 버튼 객체.
	 * 
	 * @param uGisMap {uGisMap} uGisMap 객체
	 */
	uGisMapPlatForm.control.uGisControlButton = ( function(opt_options) {
		var _self = this;
		var _super;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};
			_super = uGisMapPlatForm.control.uGisControlButtonDefault.call( _self, options );

		} )( opt_options );
		// END initialize


		return uGisMapPlatForm.util.uGisUtil.objectMerge( _super.publicFuncs, {
			
		} );

	} );

	ol.inherits( uGisMapPlatForm.control.uGisControlButton, uGisMapPlatForm.control.uGisControlButtonDefault );

} )();
