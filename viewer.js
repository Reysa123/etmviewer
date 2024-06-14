//A4=210×297
//[72dpiの場合] 842px X 595px
//[96dpiの場合] 1122px X 793px
var PIXEL_PAGE_WIDTH_SHOW = 785.4; //748;	// 1122*0.7=785.4
var PIXEL_PAGE_HEIGHT_SHOW = 536; //529;	//  793*0.7=555.1

//読み込んだSVGのviewBoxのオリジナル値
var g_org_viewBoxValues;
//読み込んだSVGのviewBox/widthのオリジナル値
var g_org_svgWidth;
//読み込んだSVGのviewBox/heightのオリジナル値
var g_org_svgHeight;

var g_initialize = false;

/* Globals: */
//唯一のsvgElement
var g_theSvgElement;
//前回クリックで選択したtextタグのid
var g_preSelectIndex = -1;
//履歴のインデックス
var g_currentPageIndex = -1;
//履歴：遷移前の状態を記憶
//履歴記憶タイミング：初回起動、コンボボックス変更時、検索リンククリック時。縮尺もKEEP
var g_jumpHistory = [];//JumpInfo

// 言語
var g_lang = (navigator.browserLanguage || navigator.userLanguage || navigator.language).substr(0, 2);

// IE11
var g_isIE = false;
var userAgent = window.navigator.userAgent.toLowerCase();
if (userAgent.indexOf('trident') >= 0) {
    g_isIE = true;
}

var JumpInfo = function (svgFileName, x, y, width, height, index) {
    this.svgFileName = svgFileName;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.index = index;
};

// svg_contents配下のjsから呼ばれる関数
function setSVGContents(contents) {
    var svg_div = document.getElementById('svg_div');
    svg_div.innerHTML = contents;
    var event = document.createEvent('HTMLEvents');
    event.initEvent('svg:loaded', false, false);
    document.head.dispatchEvent(event);
}

//
//@param svgFileName	コンボボックスのSVG名
//       isRecord		履歴を記憶するかどうか
//       isDefaultScale	デフォルトのスケールかどうか
function show_svg(svgFileName, x, y, width, height, index, isRecord, isDefaultScale, callback) {

    if (svgFileName == "") {
        svg_div.innerHTML = "";
        return;
    }
    getSVG(svgFileName, function () {

        var svgElement;
        for (var i = 0; i < svg_div.childNodes.length; i++) {
            if (svg_div.childNodes[i].nodeName == "svg") {
                svgElement = svg_div.childNodes[i];
                break;
            }
        }
        if (!svgElement) {
            return false;
        }

        var oldViewBox;
        var oldViewBoxValues;
        if (g_theSvgElement != null) {
            oldViewBox = g_theSvgElement.getAttribute('viewBox');
            oldViewBoxValues = oldViewBox.split(' ');
        }

        g_theSvgElement = svgElement;

        var viewBox = g_theSvgElement.getAttribute('viewBox');
        var viewBoxValues = viewBox.split(' ');
        g_org_viewBoxValues = viewBoxValues;
        g_org_svgWidth = parseFloat(g_theSvgElement.getAttribute('width'));
        g_org_svgHeight = parseFloat(g_theSvgElement.getAttribute('height'));

        if (viewBoxValues[2] > MM_PAGE_WIDTH || viewBoxValues[3] > MM_PAGE_HEIGHT) {
            //初回起動時はPIXEL_PAGE_WIDTH_SHOW,PIXEL_PAGE_HEIGHT_SHOW
            if (!g_initialize) {
                g_theSvgElement.setAttribute('viewBox', x.toString() + " " + y.toString() + " " + width.toString() + " " + height.toString());
                //デフォルトのスケール
            } else if (isDefaultScale) {
                g_theSvgElement.setAttribute('viewBox', "0 0 " + PIXEL_PAGE_WIDTH_SHOW + " " + PIXEL_PAGE_HEIGHT_SHOW);
                //[その他]引数のスケール
            } else {
                g_theSvgElement.setAttribute('viewBox', x.toString() + " " + y.toString() + " " + width.toString() + " " + height.toString());
            }
        }

        g_theSvgElement.setAttribute('width', PIXEL_PAGE_WIDTH_SHOW + "px");
        g_theSvgElement.setAttribute('height', PIXEL_PAGE_HEIGHT_SHOW + "px");

        if (isRecord) {
            if (g_jumpHistory.length > g_currentPageIndex + 1) {
                while (g_jumpHistory.length > g_currentPageIndex + 1) {
                    g_jumpHistory.pop();
                }
            }
            //初回起動時
            if (!g_initialize) {
                //初回起動時の履歴を設定(スケールは遷移時に設定)
                var jumpInfo = new JumpInfo(svgFileName, x.toString(), y.toString(), width.toString(), height.toString(), new Array(index.toString()));
                g_jumpHistory.push(jumpInfo);
            } else {
                //1つ前の履歴のスケールをSVG変更前のスケールに設定
                g_jumpHistory[g_currentPageIndex] = new JumpInfo(g_jumpHistory[g_currentPageIndex].svgFileName,
                        g_jumpHistory[g_currentPageIndex].x,
                        g_jumpHistory[g_currentPageIndex].y,
                        parseFloat(oldViewBoxValues[2]), //width.toString(),
                        parseFloat(oldViewBoxValues[3]), //height.toString(),
                        g_jumpHistory[g_currentPageIndex].index);
                //現在の履歴(スケールは遷移時に設定)
                var jumpInfo = new JumpInfo(svgFileName, x.toString(), y.toString(), width.toString(), height.toString(), new Array(index.toString()));
                g_jumpHistory.push(jumpInfo);
            }
            g_currentPageIndex++;
        }
        if (!g_initialize) {
            g_initialize = true;
        }
        drag_init();
        wheel_init();
        document.head.removeEventListener('svg:loaded', arguments.callee, false);
        change_forward_back_button();
    },
            callback);
}

/*  Constants: */
var leftArrow = 37;    // The numeric code for the left arrow key.
var upArrow = 38;
var rightArrow = 39;
var downArrow = 40;
var panRate = 25;    // Number of pixels to pan per key press.
var zoomRate = 1.1;    // Must be greater than 1. Increase this value for faster zooming (i.e., less granularity).

function processKeyPress(event) {
    var viewBox = g_theSvgElement.getAttribute('viewBox');    // Grab the object representing the SVG element's viewBox attribute.
    var viewBoxValues = viewBox.split(' ');            // Create an array and insert each individual view box attribute value (assume they're seperated by a single whitespace character).
    viewBoxValues[0] = parseFloat(viewBoxValues[0]);        // Convert string "numeric" values to actual numeric values.
    viewBoxValues[1] = parseFloat(viewBoxValues[1]);

    switch (event.keyCode) {
        case leftArrow:
            viewBoxValues[0] -= panRate;    // Increase the x-coordinate value of the viewBox attribute to pan right.
            break;
        case rightArrow:
            viewBoxValues[0] += panRate;    // Decrease the x-coordinate value of the viewBox attribute to pan left.
            break;
        case upArrow:
            viewBoxValues[1] -= panRate;    // Increase the y-coordinate value of the viewBox attribute to pan down.
            break;
        case downArrow:
            viewBoxValues[1] += panRate;    // Decrease the y-coordinate value of the viewBox attribute to pan up.
            break;
    }

    g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));    // Convert the viewBoxValues array into a string with a white space character between the given values.
}

function pan(panType) {
    var viewBox = g_theSvgElement.getAttribute('viewBox');    // Grab the object representing the SVG element's viewBox attribute.
    var viewBoxValues = viewBox.split(' ');            // Create an array and insert each individual view box attribute value (assume they're seperated by a single whitespace character).
    viewBoxValues[0] = parseFloat(viewBoxValues[0]);        // Convert string "numeric" values to actual numeric values.
    viewBoxValues[1] = parseFloat(viewBoxValues[1]);

    if (panType == 'left') {
        viewBoxValues[0] -= panRate;    // Increase the x-coordinate value of the viewBox attribute to pan right.
    } else if (panType == 'right') {
        viewBoxValues[0] += panRate;    // Decrease the x-coordinate value of the viewBox attribute to pan left.
    } else if (panType == 'up') {
        viewBoxValues[1] -= panRate;    // Increase the y-coordinate value of the viewBox attribute to pan down.
    } else if (panType == 'down') {
        viewBoxValues[1] += panRate;    // Decrease the y-coordinate value of the viewBox attribute to pan up.
    } else if (panType == 'reset') {
        viewBoxValues[0] = 0;    // Decrease the y-coordinate value of the viewBox attribute to pan up.
        viewBoxValues[1] = 0;    // Decrease the y-coordinate value of the viewBox attribute to pan up.
    } else {
        alert("function pan(panType) given invalid panType parameter.");
    }
    g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));    // Convert the viewBoxValues array into a string with a white space character between the given values.
}

function zoom(zoomType) {
    var viewBox = g_theSvgElement.getAttribute('viewBox');    // Grab the object representing the SVG element's viewBox attribute.
    var viewBoxValues = viewBox.split(' ');                // Create an array and insert each individual view box attribute value (assume they're seperated by a single whitespace character).

    viewBoxValues[2] = parseFloat(viewBoxValues[2]);        // Convert string "numeric" values to actual numeric values.
    viewBoxValues[3] = parseFloat(viewBoxValues[3]);

    zoomViewBox(zoomType, viewBoxValues);

    g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));
}

function zoomViewBox(zoomType, viewBoxValues) {

    if (zoomType == 'zoomIn') {
        viewBoxValues[2] /= zoomRate;
        viewBoxValues[3] /= zoomRate;
    } else if (zoomType == 'zoomOut') {
        viewBoxValues[2] *= zoomRate;
        viewBoxValues[3] *= zoomRate;
    } else if (zoomType == 'zoomReset') {
        viewBoxValues[2] = PIXEL_PAGE_WIDTH_SHOW;
        viewBoxValues[3] = PIXEL_PAGE_HEIGHT_SHOW;
    } else {
        alert("function zoom(zoomType) given invalid zoomType parameter.");
    }

}


//open			titlename[,searchlabel,...]
//opensearch	titlename,searchlabel
//search		searchlabel
function getParameter() {
//	resizeTo(1125 ,700);

    var query = window.location.search.substring(1);
    if (query == "") {
        return false;
    }
    var querys = query.split('&');
    var requestParams = new Array();
    for (var i = 0; i < querys.length; i++) {
        var pos = querys[i].indexOf('=');
        if (pos > 0) {
            var key = querys[i].substring(0, pos);
            var val = querys[i].substring(pos + 1);

            if (requestParams[key]) {
                if (typeof requestParams[key] === "string") {
                    requestParams[key] = [requestParams[key]];
                }
                requestParams[key].push(val);
            } else {
                requestParams[key] = val;
            }
        }
    }
    if (requestParams['type'] == null || requestParams['param'] == null) {
        window.alert('parameter error!');
        return false;
    }

    var params = []
    if (typeof requestParams['param'] === 'string') {
        params[0] = decodeURIComponent(requestParams['param']);
    } else {
        for (var i = 0; i < requestParams['param'].length; i++) {
            params[i] = decodeURIComponent(requestParams['param'][i]);
        }
    }

    if (requestParams['lang'] != null) {
        g_lang = requestParams['lang'];
    }
    setLang_combobox_value(g_lang);
    disp_search_checkbox();
    disp_category_checkbox_location();
    disp_category_checkbox_connector();
    disp_category_checkbox_wiring();

    if (requestParams['type'] == 'open') {
        if (params.length < 1) {
            window.alert('Usage: open title [label]...]');
            return false;
        }
        open_title(params);
    } else if (requestParams['type'] == 'opensearch') {
        if (params.length != 2) {
            window.alert('Usage: opensearch title label');
            return false;
        }
        opensearch(params[0], params[1]);
    } else if (requestParams['type'] == 'search') {
        if (params.length != 1) {
            window.alert('Usage: search label');
            return false;
        }

        search_label(params[0]);
    } else {
        window.alert('parameter type error!');
        return false;
    }
}

function jumpSVGFromURL(svgFileName, x, y, index) {
    //異なる図
    if (g_theSvgElement == null || svgFileName != getSVG_combobox_value()) {
        if (-x < PIXEL_PAGE_WIDTH_SHOW) {
            //ジャンプ先が画面に収まるなら(0,0)
            if (-y < PIXEL_PAGE_HEIGHT_SHOW) {
                jumpX = 0;
                jumpY = 0;
            } else {
                jumpX = 0;
                jumpY = y + 20;
            }
        } else {
            if (-y < PIXEL_PAGE_HEIGHT_SHOW) {
                jumpX = x + 20;
                jumpY = 0;
            } else {
                jumpX = x + 20;
                jumpY = y + 20;
            }
        }
        jumpSVG(svgFileName,
                jumpX,
                jumpY,
                parseFloat(PIXEL_PAGE_WIDTH_SHOW),
                parseFloat(PIXEL_PAGE_HEIGHT_SHOW),
                new Array(index.toString()),
                true,
                true);
        //同じ図
    } else {
        var viewBox = g_theSvgElement.getAttribute('viewBox');
        var viewBoxValues = viewBox.split(' ');

        var curX = parseFloat(viewBoxValues[0]);
        var curY = parseFloat(viewBoxValues[1]);
        var curW = parseFloat(viewBoxValues[2]);
        var curH = parseFloat(viewBoxValues[3]);
        var jumpX;
        var jumpY;
        // 横が収まる
        if (-x > curX && -x < curX + curW) {
            // 縦も収まる場合、座標キープ
            if (-y > curY && -y < curY + curH) {
                jumpX = parseFloat(-viewBoxValues[0]);
                jumpY = parseFloat(-viewBoxValues[1]);
                // 縦だけ収まらない場合、ｘ座標だけキープ
            } else {
                jumpX = parseFloat(-viewBoxValues[0]);
                jumpY = parseFloat(y + 20);
            }
            // 横が収まらない
        } else {
            // 縦は収まる場合、y座標キープ
            if (-y > curY && -y < curY + curH) {
                jumpX = parseFloat(x + 20);
                jumpY = parseFloat(-viewBoxValues[1]);
                // 縦も収まらない場合、座標キープしない
            } else {
                jumpX = parseFloat(x + 20);
                jumpY = parseFloat(y + 20);
            }
        }

        jumpSVG(svgFileName, jumpX, jumpY, curW, curH, new Array(index.toString()), true, false);
    }
}

function jumpSVG(svgFileName, x, y, width, height, index, isRecord, isDefaultScale) {
    if (g_jumpHistory.length != 0) {
        var preIndex = g_jumpHistory[g_currentPageIndex].index;
        for (var i = 0; i < preIndex.length; i++) {
            var preTarget = g_theSvgElement.getElementById(preIndex[i]);
            if (preTarget != null) {
                preTarget.removeAttribute("stroke");
            }
        }
    }

    // 履歴の変更
    //コンボボックスをUIから変更 or 検索結果からのJUMP
    if (isRecord) {
        if (g_jumpHistory.length > g_currentPageIndex + 1) {
            while (g_jumpHistory.length > g_currentPageIndex + 1) {
                g_jumpHistory.pop();
            }
        }

        if (g_theSvgElement != null) {
            var preViewBox = g_theSvgElement.getAttribute('viewBox');
            var preViewBoxValues = preViewBox.split(' ');
            //1つ前の履歴のスケールをSVG変更前のスケールに設定               
            g_jumpHistory[g_currentPageIndex] = new JumpInfo(g_jumpHistory[g_currentPageIndex].svgFileName,
                    parseFloat(-preViewBoxValues[0]), //x
                    parseFloat(-preViewBoxValues[1]), //y
                    parseFloat(preViewBoxValues[2]), //width,
                    parseFloat(preViewBoxValues[3]), //height,
                    g_jumpHistory[g_currentPageIndex].index);
        }

        // 異なる図
        if (isDefaultScale) {
            var jumpInfo = new JumpInfo(svgFileName, x, y, width, height, index);
            g_jumpHistory.push(jumpInfo);
            g_currentPageIndex++;
            // 同じ図
        } else {
            if (g_jumpHistory.length != 0) {
                var jumpIndex = g_jumpHistory[g_currentPageIndex].index;
                var jumpInfo = new JumpInfo(svgFileName, x, y, width, height, index);
                // 検索されていない状態から同じ図への遷移の場合は、履歴に追加しない
                if (jumpIndex.length == 0 || jumpIndex.length == 1 && jumpIndex[0] == "-1") {
                    g_jumpHistory[g_currentPageIndex] = jumpInfo;
                } else {
                    var newIndex = index.sort().join(",");
                    var oldIndex = jumpIndex.sort().join(",");
                    // 直前の検索位置と同じ位置への遷移の場合は、履歴に追加しない
                    if (newIndex == oldIndex) {
                        g_jumpHistory[g_currentPageIndex] = jumpInfo;
                    } else {
                        g_jumpHistory.push(jumpInfo);
                        g_currentPageIndex++;
                    }
                }
            }
        }
        //戻る、進むボタン
    } else {
        //1つ前の履歴のスケールをSVG変更前のスケールに設定
        if (g_theSvgElement != null) {
            var preViewBox = g_theSvgElement.getAttribute('viewBox');
            var preViewBoxValues = preViewBox.split(' ');
            g_jumpHistory[g_currentPageIndex] = new JumpInfo(g_jumpHistory[g_currentPageIndex].svgFileName,
                    parseFloat(-preViewBoxValues[0]), //x
                    parseFloat(-preViewBoxValues[1]), //y
                    parseFloat(preViewBoxValues[2]), //width,
                    parseFloat(preViewBoxValues[3]), //height,
                    g_jumpHistory[g_currentPageIndex].index);
        }
    }

    setSVG_combobox_value_from_param(svgFileName);

    // 異なる図
    if (isDefaultScale) {
        show_svg(svgFileName, x, y, PIXEL_PAGE_WIDTH_SHOW, PIXEL_PAGE_HEIGHT_SHOW, index, false, isDefaultScale, function () {
            var viewBox = g_theSvgElement.getAttribute('viewBox');
            var viewBoxValues = viewBox.split(' ');
            viewBoxValues[0] = parseFloat(-x);
            viewBoxValues[1] = parseFloat(-y);
            if (!isRecord) {
                viewBoxValues[2] = parseFloat(width);
                viewBoxValues[3] = parseFloat(height);
            }
            g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));
            set_stroke_red(index);
            document.head.removeEventListener('svg:loaded', arguments.callee, false);
        });
        //　同じ図
    } else {
        var viewBox = g_theSvgElement.getAttribute('viewBox');
        var viewBoxValues = viewBox.split(' ');
        viewBoxValues[0] = parseFloat(-x);
        viewBoxValues[1] = parseFloat(-y);
        viewBoxValues[2] = parseFloat(width);
        viewBoxValues[3] = parseFloat(height);
        g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));
        set_stroke_red(index);
    }

    change_forward_back_button();
}

function set_stroke_red(index) {
    for (var i = 0; i < index.length; i++) {
        var target = g_theSvgElement.getElementById(index[i]);
        if (target != null) {
            target.setAttribute("stroke", "red");
        }
    }
}

function change_forward_back_button() {
    var forward_button = document.getElementById('forward_button');
    if (-1 < g_currentPageIndex + 1 && g_currentPageIndex + 1 < g_jumpHistory.length) {
        forward_button.disabled = "";
        forward_button.innerHTML = "<IMG src=\"./images/forward.gif\"/>";
    } else {
        forward_button.disabled = "disabled";
        forward_button.innerHTML = "<IMG src=\"./images/forward_disabled.gif\"/>";
    }
    var back_button = document.getElementById('back_button');
    if (-1 < g_currentPageIndex - 1 && g_currentPageIndex - 1 < g_jumpHistory.length) {
        back_button.disabled = "";
        back_button.innerHTML = "<IMG src=\"./images/back.gif\"/>";
    } else {
        back_button.disabled = "disabled";
        back_button.innerHTML = "<IMG src=\"./images/back_disabled.gif\"/>";
    }
}

function forward(svgFileName) {
    if (-1 < g_currentPageIndex + 1 && g_currentPageIndex + 1 < g_jumpHistory.length) {
        jumpSVG(g_jumpHistory[g_currentPageIndex + 1].svgFileName,
                g_jumpHistory[g_currentPageIndex + 1].x,
                g_jumpHistory[g_currentPageIndex + 1].y,
                g_jumpHistory[g_currentPageIndex + 1].width,
                g_jumpHistory[g_currentPageIndex + 1].height,
                g_jumpHistory[g_currentPageIndex + 1].index,
                false,
                true);
        g_currentPageIndex++;
        change_forward_back_button();
    }
}

function back(svgFileName) {
    if (-1 < g_currentPageIndex - 1 && g_currentPageIndex - 1 < g_jumpHistory.length) {
        jumpSVG(g_jumpHistory[g_currentPageIndex - 1].svgFileName,
                g_jumpHistory[g_currentPageIndex - 1].x,
                g_jumpHistory[g_currentPageIndex - 1].y,
                g_jumpHistory[g_currentPageIndex - 1].width,
                g_jumpHistory[g_currentPageIndex - 1].height,
                g_jumpHistory[g_currentPageIndex - 1].index,
                false,
                true);
        g_currentPageIndex--;
        change_forward_back_button();
    }
}

function getSVG_combobox_index_from_title(title) {
    for (var i = 0; i < g_SVGs.length; i++) {
        if (title == g_SVGs[i][1]) {
            return i + 1;
        }
    }
    return parseInt(0);
}

function getSVG_combobox_index_from_fileName(fileName) {
    for (var i = 0; i < g_SVGs.length; i++) {
        if (fileName == g_SVGs[i][0]) {
            return i + 1;
        }
    }
    return parseInt(0);
}

function getSVG_combobox_FileName_from_title(title) {
    for (var i = 0; i < g_SVGs.length; i++) {
        if (title == g_SVGs[i][1]) {
            return g_SVGs[i][0];
        }
    }
    return "";
}

function setSVG_combobox_value(svgTitle) {
    var svg_combobox = document.getElementById('svg_combobox');
    svg_combobox.selectedIndex = getSVG_combobox_index_from_title(svgTitle);
}

function setSVG_combobox_value_from_param(fileName) {
    var svg_combobox = document.getElementById('svg_combobox');
    svg_combobox.selectedIndex = getSVG_combobox_index_from_fileName(fileName);
}

function getSVG_combobox_value() {
    var svg_combobox = document.getElementById('svg_combobox');
    var selectedIndex = svg_combobox.selectedIndex;
    return svg_combobox.options[selectedIndex].value;
}

function getSVG_combobox_name() {
    var svg_combobox = document.getElementById('svg_combobox');
    var selectedIndex = svg_combobox.selectedIndex;
    return svg_combobox.options[selectedIndex].text;
}

function svg_combobox_change(x, y, width, height, index, isRecord, isDefaultScale, callback) {
    var svgFileName = getSVG_combobox_value();
    show_svg(svgFileName, x, y, width, height, index, isRecord, isDefaultScale, callback);
}

function disp_svg_combobox() {
    document.write('<option value="">');
    for (var i = 0; i < g_SVGs.length; i++) {
        document.write('<option value="' + g_SVGs[i][0] + '">' + g_SVGs[i][1] + '</option>');
    }
}

function getLang_combobox_index_from_lang(lang) {
    var i = 0;
    for (key in g_lang_combobox) {
        if (key === g_lang) {
            return i;
        }
        i++;
    }
    return parseInt(0);
}

function setLang_combobox_value(lang) {
    var lang_combobox = document.getElementById('lang_combobox');
    lang_combobox.selectedIndex = getLang_combobox_index_from_lang(lang);
}

function getLang_combobox_value() {
    var lang_combobox = document.getElementById('lang_combobox');
    var selectedIndex = lang_combobox.selectedIndex;
    return lang_combobox.options[selectedIndex].value;
}

function lang_combobox_change() {
    g_lang = getLang_combobox_value();
    add_button_title();
    disp_search_checkbox();
    disp_category_checkbox_location();
    disp_category_checkbox_connector();
    disp_category_checkbox_wiring();
    if ($('#searchbox_result').children().length > 0) {
        search();
    }
}

function disp_lang_combobox() {
    for (key in g_lang_combobox) {
        if (key === g_lang) {
            document.write('<option value="' + key + '" selected>' + g_lang_combobox[key] + '</option>');
        }
        else {
            document.write('<option value="' + key + '">' + g_lang_combobox[key] + '</option>');
        }
    }
}

function disp_search_checkbox() {
    $("#search_check_label").empty();
    var label = g_search_option[g_lang];
    var textObj = document.createTextNode(label);
    $("#search_check_label").append(textObj);
}

function disp_category_checkbox_location() {
    $("#category_check_location_label").empty();
    var label = g_location_chk[g_lang];
    var textObj = document.createTextNode(label);
    $("#category_check_location_label").append(textObj);
}

function disp_category_checkbox_connector() {
    $("#category_check_connector_label").empty();
    var label = g_connector_chk[g_lang];
    var textObj = document.createTextNode(label);
    $("#category_check_connector_label").append(textObj);
}

function disp_category_checkbox_wiring() {
    $("#category_check_wiring_label").empty();
    var label = g_wiring_chk[g_lang];
    var textObj = document.createTextNode(label);
    $("#category_check_wiring_label").append(textObj);
}

function add_button_title() {
    document.getElementById('first_button').setAttribute("title", g_btn_home[g_lang]);
    document.getElementById('page_zoom_in_button').setAttribute("title", g_btn_page_zoom_in[g_lang]);
    document.getElementById('page_zoom_out_button').setAttribute("title", g_btn_page_zoom_out[g_lang]);
    document.getElementById('page_zoom_actual_button').setAttribute("title", g_btn_page_actual[g_lang]);
    document.getElementById('zoom_in_button').setAttribute("title", g_btn_zoom_in[g_lang]);
    document.getElementById('zoom_out_button').setAttribute("title", g_btn_zoom_out[g_lang]);
    document.getElementById('zoom_actual_button').setAttribute("title", g_btn_actual[g_lang]);
    document.getElementById('back_button').setAttribute("title", g_btn_back[g_lang]);
    document.getElementById('forward_button').setAttribute("title", g_btn_forward[g_lang]);
    document.getElementById('print_range_button').setAttribute("title", g_btn_print_range[g_lang]);
    document.getElementById('print_button').setAttribute("title", g_btn_print[g_lang]);
    document.getElementById('window_open_button').setAttribute("title", g_btn_new_window[g_lang]);
    document.getElementById('search_button').setAttribute("title", g_btn_find[g_lang]);
}

function dump_area() {
    var n1 = document.getElementById('frame_div');
    var n2 = document.getElementById('main_div');
    var n3 = document.getElementById('buttons_div');
    var n4 = document.getElementById('svg_div');
    var n5 = document.getElementById('search_div');
    var n6 = document.getElementById('searchbox');
    var n7 = document.getElementById('searchbox_result');
    alert([
        'frame_div::offHeight: ' + n1.offsetHeight + '\n',
        'frame_div::clientHeight: ' + n1.clientHeight + '\n',
        'main_div::offsetHeight: ' + n2.offsetHeight + '\n',
        'main_div::clientHeight: ' + n2.clientHeight + '\n',
        'buttons_div::offsetHeight: ' + n3.offsetHeight + '\n',
        'buttons_div::clientHeight: ' + n3.clientHeight + '\n',
        'svg_div::offsetHeight: ' + n4.offsetHeight + '\n',
        'svg_div::clientHeight: ' + n4.clientHeight + '\n',
        'search_div::offsetHeight: ' + n5.offsetHeight + '\n',
        'search_div::clientHeight: ' + n5.clientHeight + '\n',
        'searchbox::offsetHeight: ' + n6.offsetHeight + '\n',
        'searchbox::clientHeight: ' + n6.clientHeight + '\n',
        'searchbox_result::offsetHeight: ' + n7.offsetHeight + '\n',
        'searchbox_result::clientHeight: ' + n7.clientHeight + '\n'
    ]);
}
function openETM(type) {
    var param = getSVG_combobox_name();
    var win = window.open('./svg_viewer.html?type=' + type + '&param=' + encodeURI(param) + '&lang=' + g_lang, '_blank', 'width=1130, height=650, menubar=no, toolbar=no, location=no, resizable=yes, scrollbars=yes');
    win.focus();
}

function zoomPage(zoomType) {

    if (zoomType == 'zoomIn') {
        if (!window.top.document.body.style.zoom) {
            window.top.document.body.style.zoom = 1;
            window.top.document.body.style.MozTransform = 'scale(' + window.top.document.body.style.zoom + ')';
            window.top.document.body.style.MozTransformOrigin = '0 0';
        }
        var zoom = parseFloat(window.top.document.body.style.zoom);
        zoom += 0.1;
        window.top.document.body.style.zoom = zoom;
        window.top.document.body.style.MozTransform = 'scale(' + zoom + ')';
    } else if (zoomType == 'zoomOut') {
        if (!window.top.document.body.style.zoom) {
            window.top.document.body.style.zoom = 1;
            window.top.document.body.style.MozTransform = 'scale(' + window.top.document.body.style.zoom + ')';
            window.top.document.body.style.MozTransformOrigin = '0 0';
        }
        if (window.top.document.body.style.zoom > 1) {
            var zoom = parseFloat(window.top.document.body.style.zoom);
            zoom -= 0.1;
            window.top.document.body.style.zoom = zoom;
            window.top.document.body.style.MozTransform = 'scale(' + zoom + ')';
        }
    } else if (zoomType == 'zoomReset') {
        window.top.document.body.style.zoom = 1;
        window.top.document.body.style.MozTransform = 'scale(' + window.top.document.body.style.zoom + ')';
    } else {
        alert("function zoomPage(zoomType) given invalid zoomType parameter.");
    }

}
