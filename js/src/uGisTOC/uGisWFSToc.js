( function() {
	"use strict";

	/**
	 * WFS TOC 객체.
	 * 
	 * WFS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWfsToc = new ugmp.toc.uGisWFSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWFSLayer({...}),
	 *	tocKey : 'wfs_key',
	 *	tocTitle : 'WFS TOC Title',
	 *	tocListDivId : 'toc',
	 *	layerName : 'world_country',
	 *	layerTitle : 'world_country Title'
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWFSLayer} {@link ugmp.layer.uGisWFSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.layerTitle {String} 레이어 이름.
	 * @param opt_options.layerName {String} 레이어 원본 이름.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWFSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.layerTitle = null;
		this.layerName = null;


		/**
		 * Initialize
		 */
		( function(opt_options) {
			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.layerTitle = ( options.layerTitle !== undefined ) ? options.layerTitle : "";
			_self.layerName = ( options.layerName !== undefined ) ? options.layerName : "";

			_self.createTocDiv( "WFS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible
			} );

			_self._createWFSToc();

		} )( opt_options );
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


	ugmp.toc.uGisWFSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWFSToc.prototype.constructor = ugmp.toc.uGisWFSToc;


	/**
	 * TOC 생성
	 */
	ugmp.toc.uGisWFSToc.prototype._createWFSToc = function() {
		var _self = this._this || this;

		var wfsZtreeLayer;
		var originWFSztreeLayer = _self._getWFSNodeTozTree( _self._getWFSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wfsZtreeLayer = originWFSztreeLayer;
		} else {
			wfsZtreeLayer = originWFSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wfsZtreeLayer );

		return wfsZtreeLayer;
	};


	/**
	 * _getWFSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wfsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWFSToc.prototype._getWFSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "LayerName" ],
			name : node_[ "LayerTitle" ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "ROOT",
			name : node_[ "LayerTitle" ],
			children : [ layer ],
			open : true,
			drag : false,
			drop : false,
			checked : true,
			LayerName : node_[ "LayerName" ],
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false,
			iconSkin : "pIconFeatureLayer"
		};

		return root;
	};


	/**
	 * 해당 WFS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wfsLayerData
	 */
	ugmp.toc.uGisWFSToc.prototype._getWFSLayerData = function() {
		var _self = this._this || this;

		var wfsLayerData = {
			KEY : _self.tocKey,
			LayerName : _self.layerName,
			LayerTitle : _self.layerTitle
		};

		return wfsLayerData;
	};

} )();
