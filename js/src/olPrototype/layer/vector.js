( function() {
	"use strict";

	/**
	 * Vector 애니메이션 효과 프로토타입
	 * 
	 * @param workFeature {Object} animateFeature 옵션
	 */
	ol.layer.Vector.prototype.animateFeature = ( function(workFeature_) {
		var _self = this;
		var workFeature = workFeature_;

		var step = 0;

		// postcompose 등록
		var listenerKey = _self.on( 'postcompose', animate );

		if ( _self.changed ) {
			_self.changed();
		}


		/**
		 * 애니메이션
		 * 
		 * @param e {function} postcompose 리스너 함수
		 */
		function animate(e) {
			if ( _self.isStop ) {
				workFeature.extent = false;
				e.frameState.animate = true;
				return;
			}

			var fanim = _self.animations[ step ];
			var famimProp = fanim.getProperties();
			var viewExtent = e.frameState.extent;

			workFeature.vectorContext = e.vectorContext;
			workFeature.frameState = e.frameState;
			if ( !workFeature.extent ) {
				workFeature.extent = e.frameState.extent;
				workFeature.start = e.frameState.time - workFeature.interval;
				workFeature.context = e.context;
			}

			workFeature.time = e.frameState.time - workFeature.start;
			workFeature.elapsed = workFeature.time / famimProp.duration;

			if ( workFeature.elapsed > 1 ) {
				workFeature.elapsed = 1;
			}

			if ( !fanim.animate( workFeature ) ) {

				workFeature.nowNB++;
				// 애니메이션 반복 횟수
				if ( workFeature.nowNB < famimProp.repeat ) {
					workFeature.extent = false;
				}
				// 다음 단계 애니메이션
				else if ( step < _self.animations.length - 1 ) {
					step++;
					workFeature.nowNB = 0;
					workFeature.extent = false;
				}

			}

			// tell OL3 to continue postcompose animation
			e.frameState.animate = true;
		}

		return listenerKey;
	} );

} )();
