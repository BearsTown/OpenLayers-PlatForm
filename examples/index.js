var run = ( function() {

	var exampleGroup = UGIS_PROP.EXAMPLE_GROUP;

	var $examples = $( "#examples" );

	for ( var i = 0; i < exampleGroup.length; i++ ) {
		var groupName = exampleGroup[ i ][ "name" ];

		if ( groupName ) {

			$examples.append( "<h2>" + groupName + "</h2>" );

			var $div = "<div>";

			var examples = exampleGroup[ i ][ "examples" ];

			for ( var j = 0; j < examples.length; j++ ) {
				var example = examples[ j ];

				if ( example ) {
					$div += '<div>';
					$div += '<div class="example">';
					$div += '<a target="_blank" class="mainlink" href="' + example[ "link_code" ] + '">';
					$div += '<strong>' + example[ "title" ] + '</strong> <br>';
					// $div += '<small>' + example[ "link" ] + '</small>';
					$div += '<img src="' + example[ "img" ] + '" style="display: inline;">';
					$div += '</a>';
					$div += '<p class="description">' + example[ "desc" ] + '</p>';
					$div += '<p class="tag">';

					var names = [];
					var reqs = example[ "requires" ];

					for ( var req in reqs ) {
						names.push( reqs[ req ][ "name" ] );
					}

					$div += names.join(", ") + '</p>';

					$div += '</div>';
					$div += '</div>';
				}

			}

			$div += '</div>';

			$examples.append( $( $div ) );
		}
	}


	$( '#keywords' ).on( 'keyup', function() {
		var s = new RegExp( $( this ).val(), "i" );
		var k = 0;
		$( ".example" ).each( function() {
			var text = $( this ).text();
			var t = s.test( text );
			if ( !t ) {
				$( this ).parent().hide();
			} else {
				k++;
				$( this ).parent().show();
			}
		} );
		$( "h2" ).each( function() {
			if ( $( ".example:visible", $( this ).next() ).length ) $( this ).show();
			else $( this ).hide();
		} );
		$( "#count" ).text( "(" + k + ")" );
		// Set new url
		window.history.replaceState( null, null, document.location.origin + document.location.pathname + "?q=" + $( this ).val() );
	} );

	// Decode url
	var search = window.location.search.replace( /^\?/, "" ).split( "&" );
	for ( var i = 0; i < search.length; i++ ) {
		if ( /^q=/.test( search[ i ] ) ) {
			$( "#keywords" ).val( search[ i ].split( "=" )[ 1 ] ).trigger( "keyup" );
		}
	}

} );
