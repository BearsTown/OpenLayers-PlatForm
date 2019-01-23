proj4.defs("EPSG:2096","+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs+towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43");
ol.proj.get("EPSG:2096").setExtent( [108158.32, 111012.87, 256584.86, 571234.42] );

/*proj4.defs("EPSG:2097","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs+towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43");*/
proj4.defs("EPSG:2097","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs");
ol.proj.get("EPSG:2097").setExtent( [107581.17, 52224.72, 287427.97, 537099.14] );

proj4.defs("EPSG:5174","+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs+towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43");
ol.proj.get("EPSG:5174").setExtent( [107314.04, 52227.33, 287175.27, 537096.41] );

proj4.defs("EPSG:5175","+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=550000 +ellps=bessel +units=m +no_defs+towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43");
ol.proj.get("EPSG:5175").setExtent( [114831.13, 11204.95, 200659.74, 62956.79] );

proj4.defs("EPSG:5179","+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("EPSG:5179").setExtent( [531371.84, 967246.47, 1576674.68, 2274021.31] );

/*EPSG:5181 update for naver & daum Map*/  /*ori-source -219825.99 -535028.96 819486.07 777525.22*/
proj4.defs("EPSG:5181","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("EPSG:5181").setExtent( [-30000, -60000, 494288, 988576] );

proj4.defs("epsg:5181","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("epsg:5181").setExtent( [-30000, -60000, 494288, 988576] );

proj4.defs("EPSG:5183","+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("EPSG:5183").setExtent( [-415909.65, -526336.34, 649203.95, 765410.62] );

proj4.defs("EPSG:5186","+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("EPSG:5186").setExtent( [-219825.99, -435028.96, 819486.07, 877525.22] );

proj4.defs("EPSG:5187","+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
ol.proj.get("EPSG:5187").setExtent( [-415909.65, -426336.34, 649203.95, 865410.62] );


proj4.defs("EPSG:900913","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");

ol.proj.get("EPSG:4326").setExtent( [ -180, -90, 180, 90] );


ol.proj.EPSG4326.PROJECTIONS.push( new ol.proj.EPSG4326.Projection_("epsg:4326") );
ol.proj.EPSG4326.PROJECTIONS.push( new ol.proj.EPSG4326.Projection_("OGC:CRS84") );
ol.proj.addEquivalentProjections( ol.proj.EPSG4326.PROJECTIONS );

ol.proj.EPSG3857.PROJECTIONS.push( new ol.proj.EPSG3857.Projection_("epsg:3857") );
ol.proj.EPSG3857.PROJECTIONS.push( new ol.proj.EPSG3857.Projection_("epsg:900913") );
ol.proj.addEquivalentProjections( ol.proj.EPSG3857.PROJECTIONS );

