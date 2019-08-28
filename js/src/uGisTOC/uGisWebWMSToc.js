( function() {
	"use strict";

	/**
	 * Web WMS TOC 객체.
	 * 
	 * WMS 서비스의 TOC를 표현하는 객체. 원하는 레이어만 표현할 수 있다.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var uGWebWmsToc = new ugmp.toc.uGisWebWMSToc( {
	 *	uGisMap : new ugmp.uGisMap({...}),
	 *	uGisLayer : new ugmp.layer.uGisWMSLayer({...}),
	 *	capabilities : new ugmp.service.uGisGetCapabilitiesWMS({...}).data,
	 *	tocKey : 'wms_key',
	 *	tocTitle : 'WMS TOC Title',
	 *	tocListDivId : 'toc',
	 *	symbolSize : [20, 20],
	 *	visibleState : { 'LAYER_NAME1' : false, 'LAYER_NAME2' : false },
	 *	loadData : { 'LayerName' : 'ROOT', 'checked' : false, 'open' : true }
	 *	selectLayers : [ 'LAYER_NAME1', 'LAYER_NAME2' ]
	 * } );
	 * </pre>
	 * 
	 * @param opt_options {Object}
	 * @param opt_options.tocKey {String} TOC Key.
	 * @param opt_options.tocTitle {String} TOC 타이틀.
	 * @param opt_options.uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param opt_options.uGisLayer {ugmp.layer.uGisWMSLayer} {@link ugmp.layer.uGisWMSLayer} 객체.
	 * @param opt_options.tocListDivId {String} TOC가 생성될 DIV ID.
	 * 
	 * @param opt_options.symbolSize {Array.<Number>} 범례 심볼 간격. Default is `[20, 20]`.
	 * @param opt_options.visibleState {Object} { layerName : Boolean } 형태로 초기 체크 상태 설정.
	 * @param opt_options.capabilities {ugmp.service.uGisGetCapabilitiesWMS} {@link ugmp.service.uGisGetCapabilitiesWMS} WMS capabilities.
	 * @param opt_options.selectLayers {Array.<String>} TOC에 추가할 레이어 리스트.
	 * 
	 * @Extends {ugmp.toc.uGisTocDefault}
	 * 
	 * @class
	 */
	ugmp.toc.uGisWebWMSToc = ( function(opt_options) {
		var _self = this;
		var _super = null;

		this.symbolSize = null;
		this.capabilities = null;
		this.visibleState = null;
		this.selectLayers = null;

		this.key_zoomEnd = null;
		this.showLayerNames = null;
		this.key_changeResolution = null;

		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_super = ugmp.toc.uGisTocDefault.call( _self, options );

			var symbolSize = options.symbolSize;
			if ( !Array.isArray( symbolSize ) ) {
				_self.symbolSize = [ 20, 20 ];
			} else {
				_self.symbolSize = symbolSize;
			}

			_self.loadData = ( options.loadData !== undefined ) ? options.loadData : undefined;
			_self.visibleState = ( options.visibleState !== undefined ) ? options.visibleState : {};
			_self.selectLayers = ( options.selectLayers !== undefined ) ? options.selectLayers : [];
			_self.capabilities = ( options.capabilities !== undefined ) ? options.capabilities : undefined;

			if ( !_self.capabilities ) {
				ugmp.uGisConfig.alert_Error( "capabilities undefined" );
				return false;
			}

			_self.createTocDiv( "WebWMS", _self.tocTitle );

			_self.zTreeAttribute = _self.zTreeAttribute_Legend( {
				layerSetVisible : _layerSetVisible,
				layerOrderChange : _layerOrderChange
			} );

			_self._createWMSToc( false );

			_self._createReloadBtn();

			_self._activeChangeResolution();

			_$( "#" + _self.tocAccorId ).find( "#CRS_TEXT" ).text( _self.capabilities.serviceMetaData[ "crs" ] );
			_$( "#" + _self.tocAccorId ).find( "#BBOX_TEXT" ).text( _self.capabilities.serviceMetaData[ "maxExtent" ].toString() );

			_self.uGisMap.getMap().getView().dispatchEvent( {
				type : "change:resolution"
			} );
		} )();
		// END Initialize


		/**
		 * TOC 레이어 체크박스 이벤트
		 */
		function _layerSetVisible(e, treeId, treeNode) {
			_self._olWMSLayerRefresh();
		}


		/**
		 * TOC 레이어 순서 변경 이벤트
		 */
		function _layerOrderChange(treeId, treeNodes, targetNode, moveType) {
			var state = false;

			if ( treeNodes[ 0 ] ) {
				var tocID = treeNodes[ 0 ][ "tId" ].split( "_" )[ 1 ];
				if ( treeId.split( "_" )[ 1 ] !== tocID ) {
					return false;
				}
			} else {
				return false;
			}

			if ( targetNode[ "isGroupLayer" ] ) {
				state = ( targetNode[ "drop" ] ) ? true : false;
				if ( targetNode[ "LayerName" ] === "ROOT" && moveType !== "inner" ) {
					state = false;
				}
			} else {
				state = ( moveType !== "inner" ) ? true : false;
			}

			return _self._layerOrderChangeListener( state );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			reLoad : _self.reLoad,
			getSaveData : _self.getSaveData,
			getShowLayerNames : _self.getShowLayerNames
		} );

	} );


	ugmp.toc.uGisWebWMSToc.prototype = Object.create( ugmp.toc.uGisTocDefault.prototype );
	ugmp.toc.uGisWebWMSToc.prototype.constructor = ugmp.toc.uGisWebWMSToc;


	/**
	 * 레이어 순서 변경 이벤트.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._layerOrderChangeListener = function(state) {
		var _self = this._this || this;

		if ( state ) {
			_self._olWMSLayerRefresh();
			setTimeout( function() {
				_self._olWMSLayerRefresh();
			}, 100 );
		}
		return state;
	};


	/**
	 * TOC를 생성한다.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._createWMSToc = function(reload_ ) {
		var _self = this._this || this;

		var wmsZtreeLayer = _self._getWMSNodeTozTree( _self._getWMSLayerData()[ "Layers" ] );

		// 저장된 데이터 불러오기 (open, order, checked)
		if ( !reload_ && _self.loadData ) {
			var layerDataObject = _self._getLayerDataObject( wmsZtreeLayer, {} );
			wmsZtreeLayer = _self._setLoadData( layerDataObject, _$.extend( true, {}, _self.loadData ) );
		}

		if ( _self.selectLayers !== undefined ) {
			wmsZtreeLayer = _self._getSelectLayers( wmsZtreeLayer, _self.selectLayers );
		}

		_$.fn.zTree.init( _$( "#" + _self.tocDivId ), _self.zTreeAttribute, wmsZtreeLayer );

		return wmsZtreeLayer;
	};


	/**
	 * 선택된 레이어 정보를 추출한다.
	 * 
	 * @param originWebWMSztreeLayer {Object} 원본 zTree 데이터.
	 * @param selectLayers {Array.<String>} 추가할 레이어 리스트.
	 * 
	 * @private
	 * 
	 * @return {Object} wmsZtreeLayer
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getSelectLayers = function(originWebWMSztreeLayer_, selectLayers_) {
		var _self = this._this || this;

		var reLoadData = [];
		var noneGroupLayers_origin = [];
		noneGroupLayers_origin = _self._getNoneGroupLayers( originWebWMSztreeLayer_, noneGroupLayers_origin );

		var temp = [];
		for ( var i in selectLayers_ ) {
			var selectLayerName = selectLayers_[ i ];
			for ( var j in noneGroupLayers_origin ) {
				var originLayer = noneGroupLayers_origin[ j ];
				if ( originLayer[ "LayerName" ] === selectLayerName ) {
					// originLayer["checked"] = false;
					temp.push( noneGroupLayers_origin.slice( j, j + 1 )[ 0 ] );
					noneGroupLayers_origin.splice( j, 1 );
				}
			}
		}

		// reLoadData = noneGroupLayers_origin.concat( temp );
		reLoadData = temp;

		originWebWMSztreeLayer_[ "children" ] = reLoadData;

		return originWebWMSztreeLayer_;
	};


	/**
	 * _getWMSLayerData를 통해 가져온 레이어 정보로 zTree 레이어 데이터를 만든다.
	 * 
	 * @param node_ {Object} wmsLayerData
	 * 
	 * @private
	 * 
	 * @return zTree Layer Object
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSNodeTozTree = function(node_) {
		var _self = this._this || this;

		var layer = {
			id : null,
			name : null,
			children : [],
			drop : true,
			drag : true,
			open : true,
			checked : true,
			dropInner : true,
			chkDisabled : false,

			Extent : null,
			LayerName : null,
			LegendURL : null,
			MinScale : 0,
			MaxScale : Infinity,
			scaleVisible : true,
			isGroupLayer : false
		};


		for ( var i = 0; i < node_.length; i++ ) {
			layer[ "name" ] = node_[ i ][ "Title" ];
			layer[ "id" ] = node_[ i ][ "LayerName" ];
			layer[ "LayerName" ] = node_[ i ][ "LayerName" ];

			if ( typeof _self.visibleState[ layer[ "LayerName" ] ] === 'boolean' ) {
				layer[ "checked" ] = _self.visibleState[ layer[ "LayerName" ] ];
			}

			layer[ "LegendURL" ] = node_[ i ][ "LegendURL" ];

			var minScale = node_[ i ][ "MinScale" ];
			if ( typeof minScale !== "undefined" ) {
				layer[ "MinScale" ] = minScale;
			}

			var maxScale = node_[ i ][ "MaxScale" ];
			if ( typeof maxScale !== "undefined" ) {
				layer[ "MaxScale" ] = maxScale;
			}

			layer[ "Extent" ] = node_[ i ][ "Extent" ];
			layer[ "isGroupLayer" ] = node_[ i ][ "isGroupLayer" ];

			// 그룹레이어
			if ( layer[ "isGroupLayer" ] ) {
				layer[ "open" ] = ( _self.groupOpen ? true : false );
			}

			if ( layer[ "id" ] === "ROOT" ) {
				layer[ "open" ] = true;
				layer[ "drag" ] = false;
			}

			var childLayers = node_[ i ][ "ChildLayers" ];
			if ( childLayers.length > 0 ) {
				for ( var j = 0; j < childLayers.length; j++ ) {
					layer[ "children" ].push( _self._getWMSNodeTozTree( [ childLayers[ j ] ] ) );
				}
			} else {
				layer[ "drop" ] = false;
				layer[ "dropInner" ] = false;
				layer[ "iconSkin" ] = "pIconFeatureLayer";

				// 범례 오픈
				if ( !_self.legendOpen ) {
					layer[ "open" ] = false;
				}

				layer[ "children" ].push( {
					drag : false,
					drop : false,
					open : false,
					nocheck : true,
					isLegend : true,
					dropInner : false,
					LayerName : "leg_" + layer[ "LayerName" ],
					LegendURL : layer[ "LegendURL" ]
				} );
			}

		}

		return layer;
	};


	/**
	 * 해당 WMS 서비스의 capabilities를 통해 레이어 정보를 가져온다.
	 * 
	 * @private
	 * 
	 * @return wmsLayerData
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSLayerData = function() {
		var _self = this._this || this;

		var wmsLayerData = {
			CRS : _self.capabilities.serviceMetaData.crs,
			MaxExtent : _self.capabilities.serviceMetaData.maxExtent,
			Layers : []
		};

		var capabilitiesJSON = _self.capabilities.xmlJson[ "WMS_Capabilities" ][ "Capability" ][ "Layer" ];
		var layers = _self._getWMSCapabilitieLayerData( [ capabilitiesJSON ] );
		wmsLayerData[ "Layers" ].push( layers );

		return wmsLayerData;
	};


	/**
	 * 해당 WMS 서비스의 capabilitie에서 TOC 생성에 필요한 데이터를 가져온다.
	 * 
	 * @private
	 * 
	 * @return layerData
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getWMSCapabilitieLayerData = function(node_) {
		var _self = this._this || this;

		var layerData = {
			LayerName : null,
			Title : null,
			Extent : null,
			MinScale : null,
			MaxScale : null,
			LegendURL : null,
			isGroupLayer : false,
			isVisible : true,
			ChildLayers : []
		};

		for ( var i in node_ ) {
			var title = node_[ i ][ "Title" ];
			if ( typeof title !== "undefined" ) {
				title = title[ "#text" ];
			}
			var layerName = node_[ i ][ "Name" ];
			if ( typeof layerName !== "undefined" ) {
				layerName = layerName[ "#text" ];
			}
			var extent = node_[ i ][ "BoundingBox" ];
			if ( typeof extent !== "undefined" ) {
				if ( Array.isArray( extent ) ) {
					extent = extent[ 0 ];
				}
				extent = extent[ "@attributes" ];
				extent = [ parseFloat( extent[ "minx" ] ), parseFloat( extent[ "miny" ] ), parseFloat( extent[ "maxx" ] ), parseFloat( extent[ "maxy" ] ) ];
			}
			var minScale = node_[ i ][ "MinScaleDenominator" ];
			if ( typeof minScale !== "undefined" ) {
				minScale = parseFloat( minScale[ "#text" ] );
			}
			var maxScale = node_[ i ][ "MaxScaleDenominator" ];
			if ( typeof maxScale !== "undefined" ) {
				maxScale = parseFloat( maxScale[ "#text" ] );
			}
			var style = node_[ i ][ "Style" ];
			var legendURL;
			if ( typeof style !== "undefined" ) {

				if ( Array.isArray( style ) ) {
					style = style[ 0 ];
				}

				if ( typeof style[ "LegendURL" ] !== "undefined" ) {
					legendURL = style[ "LegendURL" ][ "OnlineResource" ][ "@attributes" ][ "xlink:href" ];
					legendURL += "&SYMBOL_WIDTH=" + _self.symbolSize[ 0 ];
					legendURL += "&SYMBOL_HEIGHT=" + _self.symbolSize[ 1 ];
				}
			}

			var childLayer = node_[ i ][ "Layer" ];

			if ( !Array.isArray( childLayer ) && typeof childLayer !== "undefined" ) {
				childLayer = [ childLayer ];
			}

			if ( Array.isArray( childLayer ) ) {
				layerData[ "isGroupLayer" ] = true;
				for ( var j = childLayer.length; --j >= 0; ) {
					layerData[ "ChildLayers" ].push( _self._getWMSCapabilitieLayerData( [ childLayer[ j ] ] ) );
				}
			}

			layerData[ "LayerName" ] = layerName;
			layerData[ "Title" ] = title;
			layerData[ "Extent" ] = extent;
			layerData[ "MinScale" ] = minScale;
			layerData[ "MaxScale" ] = maxScale;
			layerData[ "LegendURL" ] = legendURL;

		}

		return layerData;
	};


	/**
	 * 레이어 그룹해제
	 * 
	 * @private
	 * 
	 * @return noneGroupLayers
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getNoneGroupLayers = function(layers_, noneGroupLayers_) {
		var _self = this._this || this;

		layers_ = [ layers_ ];
		for ( var i in layers_ ) {
			var layer = layers_[ i ];

			if ( layer.isGroupLayer ) {
				var childs = layer[ "children" ];
				for ( var j in childs ) {
					var child = childs[ j ];
					_self._getNoneGroupLayers( child, noneGroupLayers_ );
				}
			} else {
				noneGroupLayers_.push( layer );
			}
		}

		return noneGroupLayers_;
	};


	/**
	 * 스케일 변경 이벤트 활성화 설정
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._activeChangeResolution = function(baseMap_) {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var view = _self.uGisMap.getMap().getView();

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( _self.key_changeResolution );

			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( view );


		function detectZoomChange(view_) {
			_self.key_changeResolution = view_.on( "change:resolution", function() {
				_changeResolution();
			} );
		}


		// 스케일 변경 이벤트
		function _changeResolution() {
			var scale = _self.uGisMap.calculateScale( {
				extent : _self.uGisMap.getMap().getView().calculateExtent( _self.uGisMap.getMap().getSize() ),
				originCRS : _self.capabilities.serviceMetaData[ "crs" ]
			} );

			scale = Math.ceil( scale );

			var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
			_updateScale( layers, scale );
			_$.fn.zTree.getZTreeObj( _self.tocDivId ).refresh();
			_self._olWMSLayerRefresh();
		}


		// 스케일 변경 시 해당 레이어의 MinScale, MaxScale 값에 따른 View 상태 처리
		function _updateScale(layer, scale) {
			if ( !layer[ "isLegend" ] ) {
				if ( ( layer[ "MinScale" ] <= scale ) && ( scale < layer[ "MaxScale" ] ) ) {
					layer.scaleVisible = true;
					layer.chkDisabled = false;
				} else {
					layer.scaleVisible = false;
					layer.chkDisabled = true;
				}
			}

			var children = layer.children;

			if ( Array.isArray( children ) ) {
				for ( var i = 0; i < children.length; i++ ) {
					var child = children[ i ];
					_updateScale( child, scale );
				}
			}
		}

	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 설정
	 * 
	 * @private
	 * 
	 * @return layerNames {String<String>} 레이어 리스트 toString
	 */
	ugmp.toc.uGisWebWMSToc.prototype.setZtreeLayerData = function() {
		var _self = this._this || this;

		var layerNames = [];
		var layers = _$.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];
		layerNames = _self._getZtreeLayerData( layers, layerNames, "show" );
		layerNames = ( typeof layerNames === "undefined" ) ? "" : layerNames.toString();
		_self.showLayerNames = layerNames;
		return layerNames;
	};


	/**
	 * TOC에서 현재 Show 상태의 레이어명 가져오기
	 * 
	 * @private
	 * 
	 * @return names {Array.<String>}
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getZtreeLayerData = function(layers, names, type) {
		var _self = this._this || this;

		var layer = [ layers ];
		for ( var i in layer ) {
			var data = layer[ i ];

			if ( ( type === "show" && data[ "checked" ] === false ) || ( type === "show" && data[ "chkDisabled" ] === true ) ) {
				return;
			}

			if ( data.isGroupLayer ) {
				var childs = data[ "children" ];
				for ( var j = childs.length; --j >= 0; ) {
					var child = childs[ j ];
					_self._getZtreeLayerData( child, names, type );
				}
			} else {
				names.push( data[ "LayerName" ] );
			}
		}

		return names;
	};


	/**
	 * 레이어 새로고침.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._olWMSLayerRefresh = function() {
		var _self = this._this || this;

		var olLayer = _self.uGisLayer.getOlLayer();

		olLayer.getSource().getParams().LAYERS = _self.setZtreeLayerData();
		olLayer.getSource().getParams().refTime = new Date().getMilliseconds();
		olLayer.getSource().updateParams( olLayer.getSource().getParams() );

		if ( olLayer.getSource().getParams().LAYERS === "" ) {
			_self.uGisLayer.setTocVisible( false );
		} else {
			if ( !( _self.uGisLayer.getVisible() ) ) {
				_self.uGisLayer.setTocVisible( true );
			}
		}
	};


	/**
	 * TOC의 모든 레이어를 { Key : Value } 형태로 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getLayerDataObject = function(layer_, layerDataObj_) {
		var _self = this._this || this;

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
				_self._getLayerDataObject( child, layerDataObj_ );
			}
		} else {
			layerDataObj_[ layer_[ "LayerName" ] ] = layer_;
		}

		return layerDataObj_;
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.getSaveData = function() {
		var _self = this._this || this;

		var zTreeNodes = $.fn.zTree.getZTreeObj( _self.tocDivId ).getNodes()[ 0 ];

		return _self._getSaveData( _$.extend( true, {}, zTreeNodes ) );
	};


	/**
	 * 저장할 TOC 목록 상태 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._getSaveData = function(layer_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children", "LayerName" ];

		for ( var key in layer_ ) {
			if ( layer_.hasOwnProperty( key ) ) {
				if ( _$.inArray( key, ignores ) === -1 ) {
					delete layer_[ key ];
				}
			}
		}

		var children = layer_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._getSaveData( child );
			}
		}

		return layer_;
	};


	/**
	 * 로드할 TOC 목록 가져오기.
	 * 
	 * @param layer_ {Object} zTree 레이어 노드.
	 * 
	 * @private
	 * 
	 * @return {Object} Layer Object.
	 */
	ugmp.toc.uGisWebWMSToc.prototype._setLoadData = function(layerDataObj_, loadData_) {
		var _self = this._this || this;

		var ignores = [ "open", "checked", "children" ];

		var data = layerDataObj_[ loadData_[ "LayerName" ] ];

		for ( var key in data ) {
			if ( data.hasOwnProperty( key ) ) {
				if ( $.inArray( key, ignores ) === -1 ) {
					loadData_[ key ] = data[ key ];
				}
			}
		}


		var children = loadData_[ "children" ];
		if ( Array.isArray( children ) ) {
			for ( var i = 0; i < children.length; i++ ) {
				var child = children[ i ];
				_self._setLoadData( layerDataObj_, child );
			}
		}

		return loadData_;
	};


	/**
	 * TOC Reload 버튼 생성.
	 * 
	 * @private
	 */
	ugmp.toc.uGisWebWMSToc.prototype._createReloadBtn = function() {
		var _self = this._this || this;

		var $btn = $( '<a/>', {
			click : function() {
				_self.reLoad();
			}
		} ).append( $( '<span/>', {
			'class' : 'glyphicon glyphicon-refresh',
			'title' : '새로고침'
		} ) );

		_$( "#" + _self.tocDivId ).parent().find( ".tocEventDIV.sub" ).prepend( $btn );
	};


	/**
	 * 현재 보여지고 있는 레이어 목록 가져오기.
	 * 
	 * uniq가 true면 중복된 레이어를 제거한다.
	 * 
	 * @return showLayerList {Array.<String>} 현재 보여지고 있는 레이어 목록.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.getShowLayerNames = function(uniq_) {
		var _self = this._this || this;

		var showLayerList = _self.showLayerNames.split( ',' );

		if ( uniq_ ) {
			showLayerList = showLayerList.reduce( function(a, b) {
				if ( a.indexOf( b ) < 0 ) a.push( b );
				return a;
			}, [] );
		}

		return showLayerList;
	};


	/**
	 * TOC를 다시 로드한다.
	 * 
	 * ※설정된 {@link ugmp.service.uGisGetCapabilitiesWMS}를 기준으로 다시 로드한다.
	 */
	ugmp.toc.uGisWebWMSToc.prototype.reLoad = function() {
		var _self = this._this || this;

		$.fn.zTree.destroy( _self.tocDivId );
		_self._createWMSToc( true );

		_self.uGisMap.getMap().getView().dispatchEvent( {
			type : "change:resolution"
		} );
	};


	/**
	 * TOC를 삭제한다.
	 * 
	 * @override
	 */
	ugmp.toc.uGisWebWMSToc.prototype.remove = function() {
		var _self = this._this || this;

		ugmp.toc.uGisTocDefault.prototype.remove.call( this );

		ol.Observable.unByKey( _self.key_changeResolution );
	};

} )();
