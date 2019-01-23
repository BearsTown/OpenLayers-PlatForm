( function() {
	"use strict";

	/**
	 * WCS TOC 객체.
	 * 
	 * WCS 서비스의 TOC를 표현하는 객체.
	 * 
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWCSLayer} {@link ugmp.layer.uGisWCSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.coverage {String} 레이어 이름.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWCSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.coverage = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			_self.coverage = ( options.coverage !== undefined ) ? options.coverage : "";

			_self.createTocDiv( "WCS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( _layerSetVisible );

			_self._createWCSToc();

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


	ugmp.toc.uGisWCSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWCSToc.prototype.constructor = ugmp.toc.uGisWCSToc;


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWCSToc.prototype._createWCSToc = function() {
		var _self = this._this || this;

		var wcsZtreeLayer;
		var originWCSztreeLayer = _self._getWCSNodeTozTree( _self._getWCSLayerData() );

		// 웹맵일 경우 그룹없이
		if ( _self.isWebMap ) {
			wcsZtreeLayer = originWCSztreeLayer;
		} else {
			wcsZtreeLayer = originWCSztreeLayer;
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wcsZtreeLayer );

		return wcsZtreeLayer;
	};


	/**
	 * _getWCSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node {Object} wcsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWCSToc.prototype._getWCSNodeTozTree = function(node_) {
		var layer = {
			id : node_[ "Coverage" ],
			name : node_[ "Coverage" ],
			// title : null,
			children : [],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			Coverage : node_[ "Coverage" ],
			isGroupLayer : false,
			Extent : null,
			chkDisabled : false
		};

		var root = {
			id : "root",
			name : node_[ "Coverage" ],
			// title : null,
			children : [ layer ],
			open : true,
			drop : false,
			inner : false,
			checked : true,
			isGroupLayer : true,
			Extent : null,
			chkDisabled : false
		};

		return root;
	};


	/**
	 * 해당 WCS 서비스의 레이어 정보
	 * 
	 * @private
	 * 
	 * @return wcsLayerData
	 */
	ugmp.toc.uGisWCSToc.prototype._getWCSLayerData = function() {
		var _self = this._this || this;

		var wcsLayerData = {
			KEY : _self.tocKey,
			Coverage : _self.coverage
		};

		return wcsLayerData;
	};

} )();
