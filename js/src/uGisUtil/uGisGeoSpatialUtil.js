( function() {
	"use strict";

	/**
	 * uGisMapPlatForm 지형 공간 유틸리티.
	 * 
	 * 지형 공간 정보 처리에 필요한 유틸리티 객체.
	 * 
	 * @namespace
	 */
	ugmp.util.uGisGeoSpatialUtil = ( function() {

		return {
			toRadians : this.toRadians,
			toDegrees : this.toDegrees,
			getGeomCenter : this.getGeomCenter,
			getLargestPolygon : this.getLargestPolygon,
			getLargestLineString : this.getLargestLineString,
			lineToArcTransForm : this.lineToArcTransForm,
			getRadianBtwPoints : this.getRadianBtwPoints,
			getDegreeBtwPoints : this.getDegreeBtwPoints,
			getDistanceBtwPotins : this.getDistanceBtwPotins
		}

	} );


	/**
	 * Radian을 Degree로 변환한다.
	 * 
	 * @param degree {Number} Degree(도).
	 * 
	 * @return {Number} Radian(라디안).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.toRadians = function(degree_) {
		return degree_ / 180.0 * Math.PI;
	};


	/**
	 * Degree를 Radian으로 변환한다.
	 * 
	 * @param radian {Number} Radian(라디안).
	 * 
	 * @return {Number} Degree(도).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.toDegrees = function(radian_) {
		return radian_ * 180.0 / Math.PI;
	};


	/**
	 * 두 점 사이의 Radian(라디안)을 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Radian(라디안).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getRadianBtwPoints = function(coordinate1, coordinate2) {
		var pX1 = coordinate1[ 0 ];
		var pY1 = coordinate1[ 1 ];
		var pX2 = coordinate2[ 0 ];
		var pY2 = coordinate2[ 1 ];

		return Math.atan2( pY2 - pY1, pX2 - pX1 );
	};


	/**
	 * 두 점 사이의 Degree(도)를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 Degree(도).
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getDegreeBtwPoints = function(coordinate1, coordinate2) {
		var radian = this.getRadianBtwPoints( coordinate1, coordinate2 );

		return this.toDegrees( radian );
	};


	/**
	 * 두 점 사이의 거리를 구한다.
	 * 
	 * @param coordinate1 {Array.<Number>} 점1 [x, y].
	 * @param coordinate2 {Array.<Number>} 점2 [x, y].
	 * 
	 * @return {Number} 두 점 사이의 거리.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getDistanceBtwPotins = function(c1, c2) {
		return Math.sqrt( Math.pow( ( c1[ 0 ] - c2[ 0 ] ), 2 ) + Math.pow( ( c1[ 1 ] - c2[ 1 ] ), 2 ) );
	};


	/**
	 * 일반 라인을 호 형태의 라인으로 변환한다.
	 * 
	 * -featureList는 피처의 속성이 `ol.geom.LineString`또는 `ol.geom.MultiLineString`이다.
	 * 
	 * @param originCRS {String} 피처 원본 좌표계.
	 * @param featureList {Array.<ol.Feature.<ol.geom.LineString|ol.geom.MultiLineString>>} 변활할 피처 리스트.
	 * 
	 * @return reData {Array.<ol.Feature.<ol.geom.LineString>>} 변환된 호 형태의 피처 리스트.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.lineToArcTransForm = function(originCRS_, featureList_) {
		var _self = this;
		var reData = [];
		var transFormFeatures = [];

		( function() {
			var features = featureList_.slice();

			for ( var i = 0; i < features.length; i++ ) {
				var geom = features[ i ].getGeometry();

				if ( !geom ) {
					continue;
				}

				if ( geom instanceof ol.geom.LineString ) {
					transFormFeatures.push( new ol.Feature( {
						geometry : geom
					} ) );
				} else if ( geom instanceof ol.geom.MultiLineString ) {
					var lineStrings = geom.getLineStrings();
					for ( var j = 0; j < lineStrings.length; j++ ) {
						transFormFeatures.push( new ol.Feature( {
							geometry : lineStrings[ j ]
						} ) );
					}
				}
			}

			_transFormArc();

		} )();


		function _transFormArc() {
			for ( var j = 0; j < transFormFeatures.length; j++ ) {
				var customCoordinates = [];
				var coords = transFormFeatures[ j ].getGeometry().getCoordinates();

				for ( var i = 0; i < coords.length - 1; i++ ) {
					var from = coords[ i ];
					var to = coords[ i + 1 ];
					var dist = _self.getDistanceBtwPotins( from, to );
					var midPoint = _draw_curve( from, to, ( dist / 5 ) );

					var line = {
						type : "Feature",
						properties : {},
						geometry : {
							type : "LineString",
							coordinates : [ from, midPoint, to ]
						}
					};

					var curved = turf.bezier( line, 3000, 1.5 );
					customCoordinates = customCoordinates.concat( curved[ "geometry" ][ "coordinates" ] );
				}

				var newFeature = new ol.Feature( {
					geometry : new ol.geom.LineString( customCoordinates )
				} );

				reData.push( newFeature );
			}
		}


		function _draw_curve(from_, to_, dist_) {
			// Find midpoint J
			var Ax = from_[ 0 ];
			var Ay = from_[ 1 ];
			var Bx = to_[ 0 ];
			var By = to_[ 1 ];

			var Jx = Ax + ( Bx - Ax ) / 5 * 3;
			var Jy = Ay + ( By - Ay ) / 5 * 3;

			var a = Bx - Ax;
			var b = By - Ay;
			var asign = ( a < 0 ? -1 : 1 );
			var bsign = ( b < 0 ? -1 : 1 );
			var theta = Math.atan( b / a );

			// Find the point that's perpendicular to J on side
			var costheta = asign * Math.cos( theta );
			var sintheta = asign * Math.sin( theta );

			// Find c and d
			var c = dist_ * sintheta;
			var d = dist_ * costheta;

			// Use c and d to find Kx and Ky
			var Kx = Jx - c;
			var Ky = Jy + d;

			return [ Kx, Ky ];
		}

		return reData;
	};


	/**
	 * MultiLineString의 가장 큰 LineString을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiLineString} MultiLineString.
	 * 
	 * @return {LineString} 가장 큰 LineString.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getLargestLineString = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_LINE_STRING ) return false;

		return geom_.getLineStrings().reduce( function(left, right) {
			return left.getLength() > right.getLength() ? left : right;
		} );
	};


	/**
	 * MultiPolygon의 가장 큰 Polygon을 가져온다.
	 * 
	 * @param geom_ {ol.geom.MultiPolygon} MultiPolygon.
	 * 
	 * @return {Polygon} 가장 큰 Polygon.
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getLargestPolygon = function(geom_) {
		if ( !geom_ || geom_.getType() !== ol.geom.GeometryType.MULTI_POLYGON ) return false;

		return geom_.getPolygons().reduce( function(left, right) {
			return left.getArea() > right.getArea() ? left : right;
		} );
	};


	/**
	 * Geometry의 중심점을 가져온다.
	 * 
	 * @param geom {ol.geom.Geometry} Geometry.
	 * 
	 * @return {Array.<Number>} 중심점[x, y].
	 */
	ugmp.util.uGisGeoSpatialUtil.prototype.getGeomCenter = function(geom_) {
		if ( !geom_ || !geom_ instanceof ol.geom.Geometry ) return false;

		var coordinate = [];
		var geometry = geom_;
		var geometryType = geometry.getType();

		switch ( geometryType ) {
			case ol.geom.GeometryType.POINT :
			case ol.geom.GeometryType.MULTI_POINT :
				coordinate = geometry.getFlatCoordinates();
				break;

			case ol.geom.GeometryType.CIRCLE :
				coordinate = geometry.getCenter();

				break;
			case ol.geom.GeometryType.LINE_STRING :
				coordinate = geometry.getFlatMidpoint();
				break;

			case ol.geom.GeometryType.MULTI_LINE_STRING :
				coordinate = this.getLargestLineString( geometry ).getFlatMidpoint();
				break;

			case ol.geom.GeometryType.POLYGON :
				coordinate = geometry.getFlatInteriorPoint();
				break;

			case ol.geom.GeometryType.MULTI_POLYGON :
				// coordinate = this.getLargestPolygon( geometry ).getInteriorPoint().getCoordinates();
				coordinate = this.getLargestPolygon( geometry ).getFlatInteriorPoint();
				break;
		}

		return coordinate;
	};


	ugmp.util.uGisGeoSpatialUtil = new ugmp.util.uGisGeoSpatialUtil();

} )();
