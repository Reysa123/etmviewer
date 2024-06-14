var MM_PAGE_WIDTH = 297;
var MM_PAGE_HEIGHT = 210;
var PIXEL_PAGE_WIDTH = 842;
var PIXEL_PAGE_HEIGHT = 595;

// 1ページ目の開始位置を取得する
// @param pxSvgWidth  SVGの幅(pixel)
function getStartOffset(pxSvgWidth) {
    var pageNum = Math.ceil(pxSvgWidth / PIXEL_PAGE_WIDTH);
    if (pageNum == 1) {
    	return 0;
    }
    var pageOffset = pageNum / 2;
    var startOffset = pxSvgWidth / 2;

    if (pageOffset % 2 != 0) {
	startOffset -= PIXEL_PAGE_WIDTH / 2;
	pageOffset = Math.floor(pageOffset);
    }

    for (var i = pageOffset; i > 1; i--) {
	startOffset -= PIXEL_PAGE_WIDTH;
    }

    return -1 * (PIXEL_PAGE_WIDTH - startOffset);
}

// 分割印刷
function print_multi() {
    var frame_div = document.getElementById('frame_div');
    var svg_div = document.getElementById('svg_div');
    if (! frame_div || ! svg_div) {
        return false;
    }

    if (! g_org_svgWidth) {
    	return false;
    }

    if (g_org_svgWidth <= PIXEL_PAGE_WIDTH) {
		print_whole();
		return false;
	}
	
    var start_x = getStartOffset(g_org_svgWidth);
	var winPrint = window.open('./svg_viewer.html', '', 'left=0, top=0, width=1, height=1, menubar=no, toolbar=no, location=no, status=no, scrollbars=1');
    for (var i = 0; start_x < g_org_svgWidth; i = i + 1){
    	var clonedsvg_div = svg_div.cloneNode(true);
    	clonedsvg_div.setAttribute("id","svg_div"+i);
    	var svgElement;
    	for (var j = 0; j < clonedsvg_div.childNodes.length; j++) {
    		if (clonedsvg_div.childNodes[j].nodeName == "svg") {
    			svgElement = clonedsvg_div.childNodes[j];
    			break;
    		}
    	}
    	if (! svgElement) {
    		winPrint.close();
    		return false;
    	}

    	svgElement.setAttribute("id","svgElement"+i);
        if (g_isIE) {
    	    svgElement.setAttribute('width', (MM_PAGE_WIDTH-13) + "mm");
        }
        else{
    	    svgElement.setAttribute('width', MM_PAGE_WIDTH + "mm");
        }
    	svgElement.setAttribute('height', MM_PAGE_HEIGHT + "mm");

    	// 印刷では検索ハイライトを削除
    	removeHighlight(svgElement);

    	var viewBox = svgElement.getAttribute('viewBox');
    	var viewBoxValues  = viewBox.split(' ');
    	viewBoxValues[0] = parseFloat(viewBoxValues[0]);
    	viewBoxValues[1] = parseFloat(viewBoxValues[1]);
    	viewBoxValues[2] = parseFloat(viewBoxValues[2]);
    	viewBoxValues[3] = parseFloat(viewBoxValues[3]);
    	viewBoxValues[0] = start_x;
    	viewBoxValues[1] = 0;
    	viewBoxValues[2] = PIXEL_PAGE_WIDTH;
    	viewBoxValues[3] = PIXEL_PAGE_HEIGHT;
    	svgElement.setAttribute('viewBox', viewBoxValues.join(' '));

    	if (i != 0) {
    		winPrint.document.write("<br />");
    	}
    	winPrint.document.write(clonedsvg_div.innerHTML);
        if (g_isIE) {
    	    start_x += PIXEL_PAGE_WIDTH+6;
        }
        else {
    	    start_x += PIXEL_PAGE_WIDTH;
        }
    }
    	
//    	dump_value(svgElement);
    winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
}

//全体印刷(1図1ページ印刷)
function print_whole() {
    var frame_div = document.getElementById('frame_div');
    var svg_div = document.getElementById('svg_div');
    if (! frame_div || ! svg_div) {
        return false;
    }

    var clonedsvg_div = svg_div.cloneNode(true);
    var svgElement;
    for (var j = 0; j < clonedsvg_div.childNodes.length; j++) {
        if (clonedsvg_div.childNodes[j].nodeName == "svg") {
            svgElement = clonedsvg_div.childNodes[j];
            break;
        }
    }
    if (! svgElement) {
        return false;
    }

    svgElement.setAttribute("id","svgElement"); 

    // 印刷では検索ハイライトを削除
    removeHighlight(svgElement);

    var viewBoxValues = [];
    viewBoxValues[0] = parseFloat(g_org_viewBoxValues[0]);
    viewBoxValues[1] = parseFloat(g_org_viewBoxValues[1]);
    viewBoxValues[2] = parseFloat(g_org_viewBoxValues[2]);
    viewBoxValues[3] = parseFloat(g_org_viewBoxValues[3]);
    svgElement.setAttribute('viewBox', viewBoxValues.join(' '));

    if (g_isIE) {
        svgElement.setAttribute('width', (MM_PAGE_WIDTH-13) + "mm");
    }
    else {
        svgElement.setAttribute('width', MM_PAGE_WIDTH + "mm");
    }

    svgElement.setAttribute('height', MM_PAGE_HEIGHT + "mm");

    var winPrint = window.open('./svg_viewer.html', '', 'left=0, top=0, width=1, height=1, menubar=no, toolbar=no, location=no, status=no, scrollbars=1');
    winPrint.document.write(clonedsvg_div.innerHTML);

//	dump_value(svgElement);
    winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
}

//表示状態のまま印刷    
function print_as_shown() {
    var frame_div = document.getElementById('frame_div');
    var svg_div = document.getElementById('svg_div');
    if (! frame_div || ! svg_div) {
        return false;
    }

    var clonedsvg_div = svg_div.cloneNode(true);
    var svgElement;
    for (var j = 0; j < clonedsvg_div.childNodes.length; j++) {
        if (clonedsvg_div.childNodes[j].nodeName == "svg") {
            svgElement = clonedsvg_div.childNodes[j];
            break;
        }
    }
    if (! svgElement) {
        return false;
    }

    svgElement.setAttribute("id","svgElement");
    if (g_isIE) {
        svgElement.setAttribute('width', (MM_PAGE_WIDTH-13) + "mm");
        svgElement.setAttribute('height', (MM_PAGE_HEIGHT-13) + "mm");
    }
    else {
        svgElement.setAttribute('width', MM_PAGE_WIDTH + "mm");
        svgElement.setAttribute('height', MM_PAGE_HEIGHT + "mm");        
    }

    // 印刷では検索ハイライトを削除
    removeHighlight(svgElement);

    var winPrint = window.open('./svg_viewer.html', '', 'left=0, top=0, width=1, height=1, menubar=no, toolbar=no, location=no, status=no, scrollbars=1');
    winPrint.document.write("<html>");
    winPrint.document.write("<body style=\"width:");
    winPrint.document.write(MM_PAGE_WIDTH);
    winPrint.document.write("mm; height:");
    winPrint.document.write(MM_PAGE_HEIGHT);
    winPrint.document.write("mm;\">");
    winPrint.document.write("<div style=\"overflow: hidden;\">");
    winPrint.document.write(clonedsvg_div.innerHTML);
    winPrint.document.write("</div>");
    winPrint.document.write("</body>");
    winPrint.document.write("</html>");

//	dump_value(svgElement);
	winPrint.document.close();
    winPrint.focus();
    winPrint.print();
    winPrint.close();
}

function removeHighlight(svgElement) {
    if (g_jumpHistory.length != 0 ) {
    	var jumpIndex = g_jumpHistory[g_currentPageIndex].index;
    	for (var i = 0; i < jumpIndex.length; i++) {
    		var target = svgElement.getElementById(jumpIndex[i]);
    		if (target != null) {
    			target.removeAttribute("stroke");
    		}
    	}
    }
}

function dump_value(svgElement) {
	var width =  svgElement.getAttribute('width');
	var height =  svgElement.getAttribute('height');
    var viewBox = svgElement.getAttribute('viewBox');
    var viewBoxValues  = viewBox.split(' ');
    viewBoxValues[0] = parseFloat(viewBoxValues[0]);
    viewBoxValues[1] = parseFloat(viewBoxValues[1]);
    viewBoxValues[2] = parseFloat(viewBoxValues[2]);
    viewBoxValues[3] = parseFloat(viewBoxValues[3]);
    alert( [
            'width: ' + width + '\n',
            'height: ' + height + '\n',
            '0: ' + viewBoxValues[0] + '\n',
            '1: ' + viewBoxValues[1] + '\n',
            '2: ' + viewBoxValues[2] + '\n',
            '3: ' + viewBoxValues[3] + '\n',
            ] );
}