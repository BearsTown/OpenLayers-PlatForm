/**
 * @namespace ugmp.toc
 */

( function() {
	"use strict";

	/**
	 * TOC 기본 객체.
	 * 
	 * @abstract
	 * @constructor
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer} {@link ugmp.layer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * @param opt_options.menuOpen {Boolean} 메뉴 초기 Open 여부.
	 * @param opt_options.groupOpen {Boolean} 그룹레이어(폴더) 초기 Open 여부.
	 * @param opt_options.legendOpen {Boolean} 범례 이미지 초기 Open 여부.
	 * 
	 * ※`tocListDivId`가 없을 시 body에 임시로 DIV를 생성한다.
	 * 
	 * @class
	 */
	ugmp.toc.uGisTocDefault = ( function(opt_options) {
		var _self = this;

		this.tocKey = null;
		this.tocTitle = null;
		this.uGisMap = null;
		this.uGisLayer = null;
		this.menuOpen = null;
		this.groupOpen = null;
		this.legendOpen = null;
		this.tocListDivId = null;

		this.tocDivId = null;
		this.tocAccorId = null;
		this.zTreeAttribute = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.uGisLayer = ( options.uGisLayer !== undefined ) ? options.uGisLayer : undefined;
			_self.tocKey = ( options.tocKey !== undefined ) ? options.tocKey : undefined;
			_self.tocTitle = ( options.tocTitle !== undefined ) ? options.tocTitle : undefined;
			_self.tocListDivId = ( options.tocListDivId !== undefined ) ? options.tocListDivId : undefined;
			_self.menuOpen = ( typeof ( options.menuOpen ) === "boolean" ) ? options.menuOpen : true;
			_self.groupOpen = ( typeof ( options.groupOpen ) === "boolean" ) ? options.groupOpen : true;
			_self.legendOpen = ( typeof ( options.legendOpen ) === "boolean" ) ? options.legendOpen : true;

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			if ( !_self.uGisLayer ) {
				ugmp.uGisConfig.alert_Error( "uGisLayer undefined" );
				return false;
			}

			// tocListDivId가 없을 시 body에 임시로 DIV 생성
			if ( !_self.tocListDivId ) {
				_self.tocListDivId = ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];

				_$( "body" ).append( _$( "<div/>", {
					id : _self.tocListDivId,
					css : {
						display : "none"
					}
				} ) );
			}

		} )();
		// END Initialize


		return {
			tocKey : _self.tocKey,
			remove : _self.remove,
			uGisMap : _self.uGisMap,
			uGisLayer : _self.uGisLayer,
			getTocDivId : _self.getTocDivId,
			tocExpandAll : _self.tocExpandAll,
			tocCheckAllNodes : _self.tocCheckAllNodes
		}

	} );


	/**
	 * TOC DIV 생성를 생성한다.
	 * 
	 * @param type {String} TOC 타입 (WMS, WebWMS, WFS, WCS, WMTS).
	 * @param title {String} TOC 타이틀.
	 * 
	 * @private
	 */
	ugmp.toc.uGisTocDefault.prototype.createTocDiv = function(type_, title_) {
		var _self = this._this || this;

		var _iconSRC = null;
		var _tocDiv = null;
		var _tocHead = null;
		var _collapseId = null;
		var _collapseDiv;
		var _title = null;

		_self.tocDivId = "TOC_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_self.tocAccorId = "accor_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_collapseId = "collapse_" + ugmp.util.uGisUtil.generateUUID().split( "-" )[ 0 ];
		_iconSRC = '<img class="' + 'tocIMG_' + type_ + '">';

		_tocDiv = _$( "<div/>", {
			id : _self.tocAccorId
		} );

		_tocDiv.addClass( "panel-group" );
		_tocDiv.html(
			'<div class="panel-group" >' +
				'<div class="panel panel-default">' +
					'<div class="panel-heading" onclick="javascript:_$(\'#collapseOne\').collapse(\'toggle\');">' + 
						/* '<div class="panel-heading">'+ */
						'<h4 class="panel-title">' +
							'<a class="accordion-toggle collapsed" data-toggle="collapse" data-parent="#accordion1" href="#collapseOne" aria-expanded="false">' +
								'sampleTOC_1' +
							'</a><i class="indicator glyphicon glyphicon-chevron-down pull-right"></i>' +
						'</h4>' +
					'</div>' +
					'<div id="collapseOne" class="panel-collapse collapse" aria-expanded="false" style="height: 0px;">' +
						'<div class="panel-body" style="padding: 5px;">' +
							//'<div style="overflow: auto; width: 100%; background-color: white;height:340px" class="ztree" id="TOC_1"></div>' +
							'<div style="overflow: auto; width: 100%;" class="ztree" id="TOC_1"></div>' +
							'<div class="tocEventDIV">' +
								'<div class="tocEventDIV sub">' +
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + true + ');">' +
										'<span class="glyphicon glyphicon-check"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').checkAllNodes(' + false + ');">' +
										'<span class="glyphicon glyphicon-unchecked"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + true + ');">' +
										'<span class="glyphicon glyphicon-resize-full"></span>' +
									'</a>'+
									'<a onclick="javascript:_$.fn.zTree.getZTreeObj(\'' + _self.tocDivId + '\').expandAll(' + false + ');">' +
										'<span class="glyphicon glyphicon-resize-small"></span>' +
									'</a>'+
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>' +	
				'</div>' +
			'</div>');
		
		
		var table = 
			'<table class="table" style="border: 1px solid #cecece; margin-bottom: 10px;">' +
				'<tbody>' +
					'<tr>' +
						//'<td style="background-color:#cecece;" >CRS</td>' +
						'<td>CRS</td>' +
						'<td id="CRS_TEXT"></td>' +
					'</tr>' +      
					'<tr>' +
						//'<td style="background-color:#cecece;">BBOX</td>' +
						'<td>BBOX</td>' +
						'<td id="BBOX_TEXT" style="word-break: break-all; white-space:pre-line;"></td>' +
					'</tr>' +
				'</tbody>' +
			'</table>';

		if ( type_ === "WMS" || type_ === "WebWMS" ) {
			_tocDiv.find( ".panel-body" ).prepend( table );
		}

		_tocHead = _tocDiv.find( ".panel-heading" );
		_tocHead.attr( "onclick", _tocHead.attr( "onclick" ).replace( "collapseOne", _collapseId ) );
		_tocHead.find( ".accordion-toggle" ).attr( "data-parent", "#" + _self.tocAccorId );
		_tocHead.find( ".accordion-toggle" ).attr( "href", "#" + _collapseId );
		_tocHead.find( ".accordion-toggle" ).text( " " + title_ );
		_tocHead.find( ".accordion-toggle" ).prepend( _$( _iconSRC ) );

		_collapseDiv = _tocDiv.find( ".panel-collapse" ).attr( "id", _collapseId );
		_collapseDiv.find( ".ztree" ).attr( "id", _self.tocDivId );

		_$( "#" + _self.tocListDivId ).prepend( _tocDiv );
		
		if ( _self.menuOpen ) {
			$( "#" + _collapseId ).collapse( "show" );
		}
	};


	/**
	 * zTree 속성 정보를 가져온다.
	 * 
	 * @param layerSetVisible {Function} 레이어 체크 이벤트.
	 * @param layerOrderChange {Function} 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 * 
	 * @return zTreeSetting {Object} zTree 속성 정보.
	 */
	ugmp.toc.uGisTocDefault.prototype.zTreeAttribute_Legend = function(options_) {
		var _self = this._this || this;

		var funcs = new _self._zTreeFuncs();

		var zTreeSetting = {
			view : {
				selectedMulti : false,
				expandSpeed : "fast",
				addDiyDom : funcs.addDIYDom_Legend
			},
			check : {
				autoCheckTrigger : true,
				enable : true,
				chkboxType : {
					"Y" : "",
					"N" : ""
				}
			},
			data : {
				simpleData : {
					enable : true
				}
			},
			edit : {
				enable : true,
				showRemoveBtn : false,
				showRenameBtn : false,
				drag : {
					autoExpandTrigger : true,
					prev : funcs.dropPrev,
					inner : funcs.dropInner,
					next : funcs.dropNext
				}
			},
			callback : {
				onCheck : options_.layerSetVisible,
				beforeDrop : options_.layerOrderChange,
				beforeDrag : funcs.beforeDrag
			},
			async : {
				enable : true
			}
		};

		return zTreeSetting;
	};


	/**
	 * TOC 전체 펼치기.
	 * 
	 * @param state {Boolean} 펼치기 상태.
	 */
	ugmp.toc.uGisTocDefault.prototype.tocExpandAll = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).expandAll( state_ );
	};


	/**
	 * TOC 전체 체크.
	 * 
	 * @param state {Boolean} 체크 상태.
	 */
	ugmp.toc.uGisTocDefault.prototype.tocCheckAllNodes = function(state_) {
		var _self = this._this || this;
		_$.fn.zTree.getZTreeObj( _self.tocDivId ).checkAllNodes( state_ );
	};


	/**
	 * TOC DIV ID를 가져온다.
	 * 
	 * @return tocDivId {String} TOC DIV ID.
	 */
	ugmp.toc.uGisTocDefault.prototype.getTocDivId = function() {
		var _self = this._this || this;
		return _self.tocDivId;
	};


	/**
	 * TOC를 삭제한다.
	 */
	ugmp.toc.uGisTocDefault.prototype.remove = function() {
		var _self = this._this || this;
		
		_$.fn.zTree.destroy( _self.tocDivId );
		_$( "#" + _self.tocAccorId ).remove();
	};


	/**
	 * zTree 이벤트.
	 * 
	 * @private
	 * 
	 * @return {Object} zTree 이벤트 리스트.
	 */
	ugmp.toc.uGisTocDefault.prototype._zTreeFuncs = function() {
		var _this = this;

		_this.curDragNodes = null;

		// dropPrev
		function _dropPrev(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropInner
		function _dropInner(treeId, nodes, targetNode) {
			if ( targetNode && targetNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					if ( !targetNode && _this.curDragNodes[ i ].dropRoot === false ) {
						return false;
					} else if ( _this.curDragNodes[ i ].parentTId && _this.curDragNodes[ i ].getParentNode() !== targetNode
							&& _this.curDragNodes[ i ].getParentNode().childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// dropNext
		function _dropNext(treeId, nodes, targetNode) {
			var pNode = targetNode.getParentNode();
			if ( pNode && pNode.dropInner === false ) {
				return false;
			} else {
				for ( var i = 0 , l = _this.curDragNodes.length; i < l; i++ ) {
					var curPNode = _this.curDragNodes[ i ].getParentNode();
					if ( curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false ) {
						return false;
					}
				}
			}
			return true;
		}


		// beforeDrag
		function _beforeDrag(treeId, treeNodes) {
			for ( var i = 0 , l = treeNodes.length; i < l; i++ ) {
				if ( treeNodes[ i ].drag === false ) {
					_this.curDragNodes = null;
					return false;
				} else if ( treeNodes[ i ].parentTId && treeNodes[ i ].getParentNode().childDrag === false ) {
					_this.curDragNodes = null;
					return false;
				}
			}

			_this.curDragNodes = treeNodes;
			return true;
		}


		// 범례이미지 추가
		function _addDIYDom_Legend(treeId, treeNode) {
			if ( treeNode[ "parentNode" ] && treeNode[ "parentNode" ][ "id" ] !== 2 ) return;

			var aObj = _$( "#" + treeNode.tId + "_a" );
			if ( treeNode[ "isLegend" ] && treeNode[ "LegendURL" ] ) {
				aObj.empty();
				aObj.css( "height", "auto" );
				aObj.append( "<img src='" + treeNode[ "LegendURL" ] + "' title='" + treeNode[ "name" ] +"'>" );
			}
		}

		return {
			dropPrev : _dropPrev,
			dropInner : _dropInner,
			dropNext : _dropNext,
			beforeDrag : _beforeDrag,
			addDIYDom_Legend : _addDIYDom_Legend
		}
	};

} )();
