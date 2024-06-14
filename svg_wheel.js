var SVG_SHOW_ORIGIN_X = 15; // SVGの画面上の位置(X)
var SVG_SHOW_ORIGIN_Y = 85; // SVGの画面上の位置(Y)

function wheel_init() {
    g_theSvgElement.addEventListener('wheel', wheel, false);
    g_theSvgElement.onmousewheel = wheel;
}

function wheel(event) {

    var viewBox = g_theSvgElement.getAttribute('viewBox');
    var viewBoxValues = viewBox.split(' ');

    for (var i=0; i < 4; i++) {
        viewBoxValues[i] = parseFloat(viewBoxValues[i]);
    }

    var beforeMagnification =viewBoxValues[2]/ PIXEL_PAGE_WIDTH_SHOW;

    var delta = event.deltaY ? -(event.deltaY) : event.wheelDelta ? event.wheelDelta : -(event.detail);
    if (delta < 0){
        zoomViewBox('zoomOut', viewBoxValues);
    } else if (delta > 0){
        zoomViewBox('zoomIn', viewBoxValues);
    }

    var afterMagnification =viewBoxValues[2]/ PIXEL_PAGE_WIDTH_SHOW;

    viewBoxValues[0] += (event.clientX - SVG_SHOW_ORIGIN_X) * (beforeMagnification - afterMagnification);
    viewBoxValues[1] += (event.clientY - SVG_SHOW_ORIGIN_Y) * (beforeMagnification - afterMagnification);
	
    g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));

    if (event.preventDefault) {
        event.preventDefault();
    }
    event.returnValue = false;
}
