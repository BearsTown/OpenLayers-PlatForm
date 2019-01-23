<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@page import="java.util.Set"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Map"%>
<%@page import="java.net.URL"%>
<%@page import="java.util.Iterator"%>
<%@page import="java.util.HashMap"%>
<%@page import="java.nio.CharBuffer"%>
<%@page import="java.nio.ByteBuffer"%>
<%@page import="java.lang.Exception"%>
<%@page import="java.io.IOException"%>
<%@page import="java.io.InputStream"%>
<%@page import="java.net.URLEncoder"%>
<%@page import="java.io.OutputStream"%>
<%@page import="java.util.Enumeration"%>
<%@page import="java.io.BufferedReader"%>
<%@page import="java.nio.charset.Charset"%>
<%@page import="java.io.InputStreamReader"%>
<%@page import="java.net.HttpURLConnection"%>
<%@page import="java.io.ByteArrayOutputStream"%>
<%@page import="java.net.MalformedURLException"%>

<%
	try {
		out.clear();
	} catch ( Exception e ) {

	}
%>

<%!public static String getParam(HttpServletRequest request, String name) {
		if ( request.getAttribute( "Map" ) != null ) {
			return "";
		} else {
			String paramsToString = "";
			Enumeration<String> pNames = request.getParameterNames();

			while ( pNames.hasMoreElements() ) {
				String key = pNames.nextElement();
				String value = request.getParameter( key );

				try {
					if ( !key.equalsIgnoreCase( "URL" ) ) {
						value = URLEncoder.encode( value, "UTF-8" );
					}
				} catch ( Exception e ) {
					e.printStackTrace();
				}
				paramsToString += ("&" + key + "=" + value);
			}

			return paramsToString.replaceFirst( "&url=", "" );
		}
	}


	public static void proxy(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException, Exception {
		String urlParam = getParam( request, "URL" );

		System.out.println( urlParam );

		if ( urlParam == null || urlParam.trim().length() == 0 ) {
			response.sendError( HttpServletResponse.SC_BAD_REQUEST );
			return;
		}

		boolean doPost = request.getMethod().equalsIgnoreCase( "POST" );
		URL url = new URL( urlParam.replaceAll( " ", "%20" ) );
		HttpURLConnection http = (HttpURLConnection) url.openConnection();
		Enumeration<String> hNames = request.getHeaderNames();
		while ( hNames.hasMoreElements() ) {
			String key = hNames.nextElement();
			if ( !key.equalsIgnoreCase( "Host" ) ) {
				http.setRequestProperty( key, request.getHeader( key ) );
			}
		}

		http.setDoInput( true );
		http.setDoOutput( doPost );

		byte[] buffer = new byte[8192];
		int read = -1;

		if ( doPost ) {
			OutputStream os = http.getOutputStream();
			ServletInputStream sis = request.getInputStream();
			while ( (read = sis.read( buffer )) != -1 ) {
				os.write( buffer, 0, read );
			}
			os.close();
		}

		InputStream is = http.getInputStream();
		response.setStatus( http.getResponseCode() );

		Map<String, List<String>> headerKeys = http.getHeaderFields();
		Set<String> keySet = headerKeys.keySet();
		Iterator<String> iter = keySet.iterator();
		while ( iter.hasNext() ) {
			String key = iter.next();
			String value = http.getHeaderField( key );
			if ( key != null && value != null ) {
				if ( value.indexOf( "text/xml" ) > -1 && value.indexOf( "ISO-8859-1" ) > -1 ) {
					value = value.replaceAll( "ISO-8859-1", "UTF-8" );
				}
				if ( !(key.equals( "Transfer-Encoding" )) ) {
					response.setHeader( key, value );
				}
			}
		}

		ServletOutputStream sos = response.getOutputStream();

		response.resetBuffer();

		while ( (read = is.read( buffer )) != -1 ) {
			sos.write( buffer, 0, read );
		}
		sos.println();
		response.flushBuffer();
		sos.close();
		http.disconnect();
	}%>


<%
	try {
		out.clear();
		proxy( request, response );
	} catch ( Exception e ) {
		response.setStatus( HttpServletResponse.SC_INTERNAL_SERVER_ERROR );
		response.setContentType( "text/plain" );
%>

<%=e.getStackTrace()[0].getMethodName() + ":" + e.getStackTrace()[0].getLineNumber()%>

<%
	}
	if ( true ) {
		return;
	}
%>
