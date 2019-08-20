( function() {
	"use strict";

	/**
	 * Stamen 배경지도 객체.
	 * 
	 * @constructor
	 * 
	 * @Extends {ugmp.baseMap.uGisBaseMapDefault}
	 * 
	 * @class
	 */
	ugmp.baseMap.uGisBaseMapStamen = ( function(opt_options) {
		var _self = this;
		var _super = null;


		/**
		 * Initialize
		 */
		( function() {

			var options = opt_options || {};

			options.isWorld = true;
			options.isFactor = true;
			options.baseCode = "stamen";
			options.projection = "EPSG:3857";
			options.maxExtent = ol.proj.get( "EPSG:3857" ).getExtent();
			options.mapTypes = {
				toner : {
					id : "toner",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "toner"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 20
				},
				terrain : {
					id : "terrain",
					layer : function() {
						return new ol.layer.Tile( {
							source : new ol.source.Stamen( {
								layer : "terrain"
							} )
						} );
					},
					minZoom : 0,
					maxZoom : 18
				}
			};
			
			_super = ugmp.baseMap.uGisBaseMapDefault.call( _self, options );

			_self.checkIsAvailable( "ol.source.Stamen" );

			if ( !_self.isAvailable ) {
				return false;
			}

		} )();
		// END initialize


		/**
		 * 지도 줌 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:resolution>
		 */
		function syncMapZoom(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmLevel = syncData[ "zoom" ];
			_self.apiMap.getView().setZoom( osmLevel );
		}

		/**
		 * 지도 화면 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:center>
		 */
		function syncMapCenter(evt_) {
			var syncData = _self.getSyncData( evt_ );
			var osmCenter = ol.proj.transform( syncData[ "center" ], syncData[ "projection" ], "EPSG:3857" );
			_self.apiMap.getView().setCenter( osmCenter );
		}

		/**
		 * 지도 회전 이동 이벤트 동기화.
		 * 
		 * @param evt {function} <change:rotation>
		 */
		function syncMapRotation(evt_) {
			var syncData = _self.getSyncData( evt_ );
			$( "#" + _self.target ).css( "transform", 'rotate(' + syncData[ "rotation" ] + 'rad)' );
		}


		return ugmp.util.uGisUtil.objectMerge( _super, {
			_this : _self,
			syncMapZoom : syncMapZoom,
			syncMapCenter : syncMapCenter,
			syncMapRotation : syncMapRotation
		} );

	} );


	ugmp.baseMap.uGisBaseMapStamen.prototype = Object.create( ugmp.baseMap.uGisBaseMapDefault.prototype );
	ugmp.baseMap.uGisBaseMapStamen.prototype.constructor = ugmp.baseMap.uGisBaseMapStamen;


	/**
	 * Stamen 맵 생성
	 * 
	 * @override
	 * 
	 * @param target {String} 베이스맵 DIV ID.
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.createBaseMap = function(target_, type_, loadEvents_) {
		var _self = this._this || this;

		_self.target = target_;

		_self.apiMap = new ol.Map( {
			layers : [],
			controls : [ new ol.control.Attribution( {
				collapsible : false
			} ) ],
			interactions : [],
			target : target_,
			view : new ol.View( {
				center : [ 0, 0 ],
				zoom : 2
			} )
		} );

		_self.setMapType( type_, loadEvents_ );
	};


	/**
	 * 배경지도 타입을 설정한다.
	 * 
	 * @override
	 * 
	 * @param type {String} 배경지도 타입.
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.setMapType = function(type_, loadEvents_) {
		var _self = this._this || this;

		var type = type_;

		if ( !_self.mapTypes[ type ] ) {
			type = "toner";
		}

		_self._removeAllLayer( _self.apiMap.getLayers() );
		_self.apiMap.addLayer( _self.mapTypes[ type ][ "layer" ]() );

		_self._setTileLoadEvents( loadEvents_ );
	};


	/**
	 * HTML element의 크기에 맞게 변경한다.
	 * 
	 * @override
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype.updateSize = function() {
		var _self = this._this || this;
		_self.apiMap.updateSize();
	};


	/**
	 * 레이어 삭제
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype._removeAllLayer = function(layers_) {
		var _self = this._this || this;

		layers_.forEach( function(layer, idx) {
			_self.apiMap.removeLayer( layer );
		} );

		if ( _self.apiMap.getLayers().getLength() > 0 ) {
			_self._removeAllLayer( _self.apiMap.getLayers() );
		}
	};


	/**
	 * 배경지도 tile load events 설정.
	 * 
	 * @param loadEvents {Function} tile load events 함수.
	 * 
	 * @private
	 */
	ugmp.baseMap.uGisBaseMapStamen.prototype._setTileLoadEvents = function(loadEvents_) {
		var _self = this._this || this;

		var source = _self.apiMap.getLayers().item( 0 ).getSource();

		if ( !source ) return false;

		source.on( [ "imageloadstart", "tileloadstart" ], function() {
			loadEvents_.call( this, true );
		} );
		source.on( [ "imageloadend", "tileloadend" ], function() {
			loadEvents_.call( this, false );
		} );
		source.on( [ "imageloaderror", "tileloaderror" ], function() {
			loadEvents_.call( this, false );
		} );
	};

} )();
