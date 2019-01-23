( function() {
	"use strict";

	/**
	 * 레이어 및 TOC를 관리하는 객체.
	 * 
	 * @constructor
	 * 
	 * @example
	 * 
	 * <pre>
	 * var ugLayerManager = new ugmp.manager.uGisLayerManager( {
	 * 	uGisMap : new ugmp.uGisMap({...}),
	 * 	useMinMaxZoom : true
	 * } );
	 * </pre>
	 * 
	 * @param uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 * @param useMinMaxZoom {Boolean} MinZoom, MaxZoom 사용 여부. Default is `true`.
	 * 
	 * @class
	 */
	ugmp.manager.uGisLayerManager = ( function(opt_options) {
		var _self = this;

		this.uGisMap = null;
		this.useMinMaxZoom = null;

		this.uGisLayerNTocObjects = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			_self.uGisMap = ( options.uGisMap !== undefined ) ? options.uGisMap : undefined;
			_self.useMinMaxZoom = ( options.useMinMaxZoom !== undefined ) ? options.useMinMaxZoom : true;

			_self.uGisLayerNTocObjects = {};

			if ( !_self.uGisMap ) {
				ugmp.uGisConfig.alert_Error( "uGisMap undefined" );
				return false;
			}

			if ( _self.useMinMaxZoom ) {
				_self._activeMinMaxZoom();
			}

		} )();
		// END initialize


		return {
			_this : _self,
			get : _self.get,
			add : _self.add,
			getAll : _self.getAll,
			remove : _self.remove,
			getUgisMap : _self.getUgisMap,
			scaleVisibleRefresh : _self._scaleVisibleRefresh
		}

	} );


	/**
	 * MinZoom, MaxZoom 설정 사용
	 * 
	 * @private
	 */
	ugmp.manager.uGisLayerManager.prototype._activeMinMaxZoom = function() {
		var _self = this._this || this;

		var currentZoomLevel = null;
		var tempZoomEnd = null;

		_self.uGisMap.getMap().on( "change:view", function(evt1_) {
			ol.Observable.unByKey( tempZoomEnd );
			detectZoomChange( evt1_.target.getView() );
		} );


		detectZoomChange( _self.uGisMap.getMap().getView() );


		function detectZoomChange(view_) {
			var targetView = view_;

			var zoomEnd = function(evt2_) {
				var v = evt2_.map.getView();
				var newZoomLevel = v.getZoom();

				if ( currentZoomLevel != newZoomLevel ) {
					currentZoomLevel = newZoomLevel;

					_self._scaleVisibleRefresh();
				}

				tempZoomEnd = _self.uGisMap.getMap().once( "moveend", function(evt3_) {
					zoomEnd( evt3_ );
				} );
			};


			targetView.once( "change:resolution", function(evt4_) {
				_self.uGisMap.getMap().once( "moveend", function(evt5_) {
					zoomEnd( evt5_ );
				} );
			} );

		}
	};


	/**
	 * 레이어 및 TOC 객체를 추가한다. (레이어 키로 관리)
	 * 
	 * @param uGisLayer {ugmp.layer} {@link ugmp.layer} 객체.
	 * @param uGisToc {ugmp.toc} {@link ugmp.toc} 객체.
	 */
	ugmp.manager.uGisLayerManager.prototype.add = function(opt_options) {
		var _self = this._this || this;

		var options = opt_options || {};

		var uGisLayer = ( options.uGisLayer !== undefined ) ? options.uGisLayer : undefined;
		var uGisToc = ( options.uGisToc !== undefined ) ? options.uGisToc : undefined;

		var layerKey = uGisLayer.getLayerKey();

		var zoomChangeListenerKey;

		if ( _self.useMinMaxZoom ) {
			zoomChangeListenerKey = uGisLayer.getOlLayer().on( "change:zoom", function(e_) {
				var targetView = _self.uGisMap.getMap().getView();

				if ( ( uGisLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= uGisLayer.getMaxZoom() ) ) {
					uGisLayer.setScaleVisible( true );
				} else {
					uGisLayer.setScaleVisible( false );
				}
			} );
		}

		_self.uGisLayerNTocObjects[ layerKey ] = {
			zoomChangeListenerKey : zoomChangeListenerKey,
			uGisLayer : uGisLayer,
			uGisToc : uGisToc
		};

		_self._scaleVisibleRefresh();
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 가져온다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 * 
	 * @return uGisLayerNTocObject {Object}
	 */
	ugmp.manager.uGisLayerManager.prototype.get = function(layerKey_) {
		var _self = this._this || this;
		return _self.uGisLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * 레이어, TOC 객체 리스트를 가져온다.
	 * 
	 * @param all {Boolean} 모든 객체 리스트를 가져올지 여부를 설정한다.
	 * 
	 * `false`면 {@link ugmp.layer} 객체 리스트만 가져온다.
	 * 
	 * @return uGisLayerNTocObject {Object}
	 */
	ugmp.manager.uGisLayerManager.prototype.getAll = function(all_) {
		var _self = this._this || this;

		var list = [];

		for ( var key in _self.uGisLayerNTocObjects ) {
			if ( _self.uGisLayerNTocObjects.hasOwnProperty( key ) ) {
				if ( all_ ) {
					list.push( _self.uGisLayerNTocObjects[ key ] );
				} else {
					list.push( _self.uGisLayerNTocObjects[ key ][ "uGisLayer" ] );
				}
			}
		}

		return list;
	};


	/**
	 * 레이어 키에 해당하는 레이어, TOC 객체를 제거한다.
	 * 
	 * @param layerKey {String} 레이어 키.
	 */
	ugmp.manager.uGisLayerManager.prototype.remove = function(layerKey_) {
		var _self = this._this || this;

		var object = _self.uGisLayerNTocObjects[ layerKey_ ];

		_self.uGisMap.removeLayer( layerKey_ );

		if ( object.uGisToc ) {
			object.uGisToc.remove();
		}

		if ( object.zoomChangeListenerKey ) {
			ol.Observable.unByKey( object.zoomChangeListenerKey );
		}

		delete _self.uGisLayerNTocObjects[ layerKey_ ];
	};


	/**
	 * uGisMap 객체를 가져온다.
	 * 
	 * @return uGisMap {ugmp.uGisMap} {@link ugmp.uGisMap} 객체.
	 */
	ugmp.manager.uGisLayerManager.prototype.getUgisMap = function() {
		var _self = this._this || this;
		return _self.uGisMap;
	};


	/**
	 * 스케일 visible 새로고침.
	 * 
	 * @private
	 */
	ugmp.manager.uGisLayerManager.prototype._scaleVisibleRefresh = function() {
		var _self = this._this || this;

		var targetView = _self.uGisMap.getMap().getView();

		for ( var key in _self.uGisLayerNTocObjects ) {
			if ( _self.uGisLayerNTocObjects.hasOwnProperty( key ) ) {
				var uGisLayer = _self.uGisLayerNTocObjects[ key ][ "uGisLayer" ];

				if ( ( uGisLayer.getMinZoom() <= targetView.getZoom() ) && ( targetView.getZoom() <= uGisLayer.getMaxZoom() ) ) {
					uGisLayer.setScaleVisible( true );
				} else {
					uGisLayer.setScaleVisible( false );
				}
			}
		}
	};

} )();
