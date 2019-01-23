( function() {
	"use strict";

	/**
	 * WMTS TOC 객체.
	 * 
	 * WMTS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWmtsToc = new ugmp.toc.uGisWMTSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWMSLayer({...}),
	 *	capabilities : new ugmp.service.uGisGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'LAYER_NAME',
	 *	matrixSet : 'MATRIXSET'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWMTSLayer} {@link ugmp.layer.uGisWMTSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.matrixSet {String} matrixSet 이름.
	 * @param opt_options.layerName {String} 레이어 이름.
	 * @param opt_options.legendURL {String} 범례 URL.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWMTSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.matrixSet = null;
		this.layerName = null;
		this.legendURL = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";
			_self.matrixSet = ( options.matrixSet !== undefined ) ? options.matrixSet : "";
			_self.legendURL = ( options.legendURL !== undefined ) ? options.legendURL : "";

			_self.createTocDiv( "WMTS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWMTSToc();

		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			var check;
			if ( treeNode.isGroupLayer ) {
				check = ( treeNode.checked && treeNode.children[ 0 ].checked ) ? true : false;
			} else {
				check = ( treeNode.checked && treeNode.getParentNode().checked ) ? true : false;
			}
			_self.uGisLayer.setTocVisible( check );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self
		} );

	} );


	ugmp.toc.uGisWMTSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWMTSToc.prototype.constructor = ugmp.toc.uGisWMTSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWMTSToc.prototype._createWMTSToc = function() {
		var _self = this._this || this;

		var wmtsZtreeLayer;
		var originWMTSztreeLayer = _self._getWMTSNodeTozTree( _self._getWMTSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wmtsZtreeLayer = originWMTSztreeLayer;
		} else {
			wmtsZtreeLayer = originWMTSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmtsZtreeLayer );

		return wmtsZtreeLayer;
	};


	/**
	 * _getWMTSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wmtsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWMTSToc.prototype._getWMTSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerName" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			MatrixSet : node_[ "MatrixSet" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false,
			LegendURL : node_[ "LegendURL" ]
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerName" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			isGroupLayer : true,
			LegendURL : null,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WMTS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wmtsLayerData
	 */
	ugmp.toc.uGisWMTSToc.prototype._getWMTSLayerData = function() {
		var _self = this._this || this;

		var wmtsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerName,
			MatrixSet : _self.matrixSet,
			LegendURL : _self.legendURL
		};

		return wmtsLayerData;
	};

} )();
