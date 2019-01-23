( function() {
	"use strict";

	/**
	 * WFS DWithin filter
	 * 
	 * Initialize
	 * 
	 * @return ol.format.filter.DWithin
	 */
	ol.format.filter.dwithin = ( function(geometryName, geometry, opt_srsName, distance, opt_units) {
		var _self = this;


		/**
		 * Initialize
		 */
		( function() {

			ol.format.filter.DWithin = _DWithin;

			ol.inherits( ol.format.filter.DWithin, ol.format.filter.Spatial );

			ol.format.WFS.GETFEATURE_SERIALIZERS_[ "http://www.opengis.net/ogc" ][ "DWithin" ] = ol.xml.makeChildAppender( _writeWithinFilter );

		} )();
		// END initialize


		function _DWithin(geometryName, geometry, opt_srsName, distance, opt_units) {
			ol.format.filter.Spatial.call( this, "DWithin", geometryName, geometry, opt_srsName );

			this.distance = distance;
			this.units = opt_units || "m"; // http://www.opengeospatial.org/se/units/metre
		}


		function _writeWithinFilter(node, filter, objectStack) {
			var context = objectStack[ objectStack.length - 1 ];
			context[ "srsName" ] = filter.srsName;

			ol.format.WFS.writeOgcPropertyName_( node, filter.geometryName );
			ol.format.GML3.prototype.writeGeometryElement( node, filter.geometry, objectStack );

			var distanceNode = ol.xml.createElementNS( "http://www.opengis.net/ogc", "Distance" );
			distanceNode.setAttribute( "units", filter.units );
			ol.format.XSD.writeStringTextNode( distanceNode, filter.distance + "" );
			node.appendChild( distanceNode );
		}

		
		return new ol.format.filter.DWithin( geometryName, geometry, opt_srsName, distance, opt_units );
	} );

} )();
