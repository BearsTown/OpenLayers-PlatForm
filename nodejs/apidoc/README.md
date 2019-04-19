<div>
	<div id="news" class="col-sm-12" style="border: 1px solid #eee; background-color: #f8f8f8; border-radius: 2px; padding: 10px; margin-bottom: 10px; width: 100%;">
		<p>
			<strong><a href="https://openlayers.org" target="_blank">OpenLayers</a></strong>를 기반으로 Web GIS 서비스 개발 시 자주 사용되는 기능들을 모듈화한 스크립트 라이브러리.
		</p>
		<p>
			A script library that modularized frequently used functions when developing Web GIS services based on <strong><a href="https://openlayers.org" target="_blank">OpenLayers</a></strong>
		</p>
	</div>
</div>

<div class="row">
	<h3 class="col-sm-12">
		<font style="vertical-align: inherit;"><font style="font-size: 20px; vertical-align: inherit;">uGisMapPlatForm 다운로드 (2019-04-19)</font></font>
	</h3>
</div>

<div class="row">
	<div class="col-sm-12">
		<table class="table table-hover">
			<tbody>
				<tr>
					<th><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">Archive</font></font></th>
					<th><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">Description</font></font></th>
				</tr>
				<tr>
					<td><a href="../download/uGisMapPlatForm v1.4.2-dist.zip"> <font style="vertical-align: inherit;">uGisMapPlatForm v1.4.2-dist.zip</font>
					</a></td>
					<td><font style="vertical-align: inherit;">라이브러리의 전체 빌드, 디버그 빌드 및 라이브러리 CSS가 포함됩니다.</font></td>
				</tr>
				<tr>
					<td><a href="../download/uGisMapPlatForm v1.4.2.zip"> <font style="vertical-align: inherit;">uGisMapPlatForm v1.4.2.zip</font>
					</a></td>
					<td><font style="vertical-align: inherit;">위의 모든 예제, API 문서 및 소스를 포함합니다.</font></td>
				</tr>
			</tbody>
		</table>
	</div>
</div>

<table>
	<tr style="font-size: 20px;">
		<th width="33.3%">Map</th>
		<th width="33.3%">Popup</th>
		<th width="33.3%">Animation</th>
	</tr>
	<tr>
		<td><p>각 타입별 [ugmp.layer](ugmp.layer.html)를 추가하여 지도에 표현할 수 있다.</p> [Overview](ugmp.uGisMap.html)<br> [Creation](ugmp.uGisMap.html#uGisMap)</td>
		<td><p>지도 위에 팝업을 표시할 수 있고, 내용에는 html 컨텐츠를 적용시킬 수 있다.</p> [Overview](ugmp.uGisPopup.html)<br> [Creation](ugmp.uGisPopup.html#uGisPopup)</td>
		<td><p>
				원하는 피처의 형태로 다양한 애니메이션 효과를 사용할 수 있고, <br> [featureAnimationDefault](ugmp.animation.featureAnimationDefault.html)를 확장하여 새로운 애니메이션 효과를 정의하여 사용할 수 있다.
			</p> [Overview](ugmp.animation.featureAnimationDefault.html)<br> [Creation](ugmp.animation.featureAnimationDefault.html#featureAnimationDefault)</td>
	</tr>
	<tr style="font-size: 20px;">
		<th>BaseMap</th>
		<th>Layer</th>
		<th>OGC Service</th>
	</tr>
	<tr>
		<td><p>
				다양하게 제공되는 지도 API를 배경지도로 사용할 수 있고, <br> [uGisBaseMapDefault](ugmp.baseMap.uGisBaseMapDefault.html)를 확장하여 새로운 지도 API를 정의하여 사용할 수 있다. <br> [uGisBaseMapCustom](ugmp.baseMap.uGisBaseMapCustom.html)를 사용하여 WMTS 서비스를 배경지도로 사용할 수 있다.
			</p> [Overview](ugmp.baseMap.uGisBaseMapDefault.html)<br> [Creation](ugmp.baseMap.uGisBaseMapDefault.html#uGisBaseMapDefault)</td>
		<td>OGC 표준의 WMS, WFS, WCS, WMTS 레이어를 생성할 수 있고, <br> [uGisLayerDefault](ugmp.layer.uGisLayerDefault.html)를 확장하여 사용자 정의 레이어를 지도에 표현할 수 있다.
			<ul>
				<li>[WMSLayer](ugmp.layer.uGisWMSLayer.html)</li>
				<li>[WFSLayer](ugmp.layer.uGisWFSLayer.html)</li>
				<li>[WCSLayer](ugmp.layer.uGisWCSLayer.html)</li>
				<li>[WMTSLayer](ugmp.layer.uGisWMTSLayer.html)</li>
			</ul> [All Layer](ugmp.layer.html)
		</td>
		<td>OGC 표준의 다양한 서비스를 요청할 수 있다.
			<ul>
				<li>[WMS GetCapabilities](ugmp.service.uGisGetCapabilitiesWMS.html)</li>
				<li>[WFS GetCapabilities](ugmp.service.uGisGetCapabilitiesWFS.html)</li>
				<li>[WCS GetCapabilities](ugmp.service.uGisGetCapabilitiesWCS.html)</li>
			</ul> [All Service](ugmp.service.html)
		</td>
	</tr>
	<tr style="font-size: 20px;">
		<th>TOC</th>
		<th>Control</th>
		<th>Capture</th>
	</tr>
	<tr>
		<td>레이어 타입별 TOC를 생성하고 레이어를 관리할 수 있다.
			<ul>
				<li>[WMS TOC](ugmp.toc.uGisWMSToc.html)</li>
				<li>[WFS TOC](ugmp.toc.uGisWFSToc.html)</li>
				<li>[WCS TOC](ugmp.toc.uGisWCSToc.html)</li>
				<li>[WMTS TOC](ugmp.toc.uGisWMTSToc.html)</li>
			</ul>
		</td>
		<td>다양한 기능으로 지도를 조작할 수 있고, [uGisControlDefault](ugmp.control.uGisControlDefault.html)를 확장하여 새로운 컨트롤을 정의하여 사용할 수 있다. <br>
			<ul>
				<li>[DragZoomIn](ugmp.control.uGisDragZoomIn.html)</li>
				<li>[DrawFeature](ugmp.control.uGisDrawFeature.html)</li>
				<li>[AreaMeasure](ugmp.control.uGisAreaMeasure.html)</li>
			</ul> [All Control](ugmp.control.html)
		</td>
		<td>
			<p>
				배경지도 및 각 타입별로 추가된 <a href="ugmp.layer.html">ugmp.layer</a>를 캡쳐할 수 있다.
			</p> [Overview](ugmp.uGisCapture.html)<br> [Creation](ugmp.uGisCapture.html#uGisCapture)
		</td>
	</tr>
</table>

