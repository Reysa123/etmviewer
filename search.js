function pasteIntoSearch(svgTextElement) {
	var id = svgTextElement.getAttribute('id');
	var search_text = document.getElementById('search_text');
	search_text.value = svgTextElement.textContent;
	search();
}

function isAlias(arg, text) {
	//完全一致の別名を取得(逆方向)
	var alias = getOppositeAlias(arg);
	for (var i = 0; i < alias.length; i++) {
		//別名検索文字にエスケープ文字追加
		if (escapeSearchWord(text) == escapeSearchWord(alias[i])) {
			return true;
		}
	}
	return false;
}
    
function isAliasContain(arg, text) {
	//完全一致の別名を取得(逆方向)
    var alias = getOppositeAliasContain(arg);
    for (var i = 0; i < alias.length; i++) {
    	//別名検索文字にエスケープ文字追加
    	if (escapeSearchWord(text).search(escapeSearchWord(alias[i])) != -1) {
    		return true;
    	}
    }
    return false;
}

function escapeSearchWord(word) {
	//.   ^   $   [   ]   *   +   ?   |   (   )
	word = word.replace(/\./g,'\\.');
	word = word.replace(/\^/g,'\\^');
	word = word.replace(/\$/g,'\\$');
	word = word.replace(/\[/g,'\\[');
	word = word.replace(/\]/g,'\\]');
	word = word.replace(/\*/g,'\\*');
	word = word.replace(/\+/g,'\\+');
	word = word.replace(/\?/g,'\\?');
	word = word.replace(/\|/g,'\\|');
	word = word.replace(/\(/g,'\\(');
	word = word.replace(/\)/g,'\\)');
	//大文字小文字区別なくす
	return word.toLowerCase();
}
    
String.prototype.replaceAll = function (org, dest) {  
	return this.split(org).join(dest);
}  
    
/*
 * labelに一致する結果を取得してソートする
 */
function getSearchResult(title, label) {
	var results = new Array();

	label = escapeSearchWord(label);

	//完全一致
	var checked = document.getElementById('search_check').checked;
    	
	// title -> filename
	var filename = getSVG_combobox_FileName_from_title(title);
	if (filename == "") {
		return results;
	}
	var texts = getSVGTexts(filename);
	filename = filename.replace(/\'/g,"\\'");
	for (var j = 0; j < texts.length; j++) {
		if ((checked &&
				(escapeSearchWord(texts[j][1]) == label ||
				isAlias(label, texts[j][1]))) ||
			(!checked &&
				(escapeSearchWord(texts[j][1]).search(label) != -1 ||
				isAliasContain(label, texts[j][1])))) {
			var id = texts[j][0];
			var textContent = texts[j][1];
			var transform = texts[j][2];

			//matrix(1 0 0 1 2597.0898 38.6821)
			var transformArray = split_transform(transform);

			//<a>要素の作成と属性の指定
			var newAnchor = document.createElement("a");
			var newTxt = document.createTextNode( textContent + " [" + title + "] ");
			newAnchor.appendChild( newTxt );
			newAnchor.setAttribute("href", "" );
			newAnchor.setAttribute("onclick", "jumpSVGFromURL(\'" + filename + "\'," 
					+ parseFloat(-transformArray[4]) + "," 
					+ parseFloat(-transformArray[5]) + "," 
					+ id
					+ ");return false;");
			newAnchor.setAttribute("target", "_blank" );

			results.push(newAnchor);
		}
	}

	return results;
}

/*
 * 指定したタイトルの検索結果アンカーを作成する
 */
function createAnchor(title) {
	var results = new Array();

	// title -> filename
	var filename = getSVG_combobox_FileName_from_title(title);
	if (filename == "") {
		return results;
	}
	filename = filename.replace(/\'/g,"\\'");
  //<a>要素の作成と属性の指定
  var newAnchor = document.createElement("a");
  var newTxt = document.createTextNode( " [" + title + "] ");
  newAnchor.appendChild( newTxt );
  newAnchor.setAttribute("href", "" );
  newAnchor.setAttribute("onclick", "jumpSVGFromURL(\'" + filename + "\'," 
      + parseFloat('-0') + "," 
      + parseFloat('-0') + "," 
      + 0
      + ");return false;");
  newAnchor.setAttribute("target", "_blank" );

  results.push(newAnchor);

	return results;
}

/*
 * 検索結果をドキュメントに追加する
 */
function addSearchResult(results, isSort) {
	if( isSort ) {
    results.sort(cmp_search_result);
  }

	for (var i = 0; i < results.length; i++){
		//<div>要素の作成
		var newDiv = document.createElementNS("http://www.w3.org/1999/xhtml","div");
		newDiv.setAttribute("align","left");
		newDiv.appendChild (results[i]);
		var list = document.getElementById("searchbox_result");
		list.appendChild( newDiv );
	}
}

/*
 * anchor要素を検索文字列でソートする.
 */
function cmp_search_result(a, b) {
	var aValue = a.firstChild.nodeValue;
	var bValue = b.firstChild.nodeValue;
	aValue = aValue.substring(0, aValue.lastIndexOf("["));
	bValue = bValue.substring(0, bValue.lastIndexOf("["));
	return aValue > bValue;
}
    
function search_label(label) {
	var search_text = document.getElementById('search_text');
	search_text.value = label;
	search();
}

// open title [label]...
function open_title(params) {
	if (params.length < 0) {
		return false;
	}

	var title = params[0];
	setSVG_combobox_value(title);
	svg_combobox_change(0, 0, PIXEL_PAGE_WIDTH_SHOW, PIXEL_PAGE_HEIGHT_SHOW, -1, true, true, function(){
		//完全一致
		var checked = document.getElementById('search_check').checked;

		// title -> filename
		var filename = getSVG_combobox_FileName_from_title(title);
		if (filename == "") {
			return;
		}

		var indexList = [];
		var texts = getSVGTexts(filename);
		for (var i = 1; i < params.length; i++) {
			for (var j = 0; j < texts.length; j++) {
				var label = params[i];
				label = escapeSearchWord(label);
				if ((checked &&
						(escapeSearchWord(texts[j][1]) == label ||
						isAlias(label, texts[j][1]))) ||
		    		(!checked &&
		    			(texts[j][1].toLowerCase().search(label) != -1 ||
						isAliasContain(label, texts[j][1])))) {
		    		var id = texts[j][0];
		    		var textContent = texts[j][1];
		    		var transform = texts[j][2];
		    		var transformArray = split_transform(transform);

		    		var target = g_theSvgElement.getElementById(id);
		    		target.setAttribute("stroke","red");

		    		indexList.push(id);
				}
			}
		}

		g_jumpHistory[g_currentPageIndex].index = indexList;
	});
}

function search() {
	remove_search_result();
	document.getElementById("searchbox_result").scrollTop = 0;

	var arg = document.getElementById('search_text').value;

	document.body.style.cursor = "wait";
	document.getElementById('search_button').style.cursor = "wait";

	// カテゴリ毎に検索
  if( document.getElementById('category_check_location').checked == true ){
  	  search_category(arg, "Location", g_location_search[g_lang]);	// 配置図
  	  addBreakToSeachResult();
  }
  if( document.getElementById('category_check_connector').checked == true ){
      search_category(arg, "Connector", g_connector_search[g_lang]);	// コネクター情報
      addBreakToSeachResult();
  }
  if( document.getElementById('category_check_wiring').checked == true ){
      search_category(arg, "Wiring", g_wiring_search[g_lang]);		// 回路図
  }

	document.body.style.cursor = "default";
	document.getElementById('search_button').style.cursor = "default";
}

function addBreakToSeachResult() {
	var newText = document.createTextNode("　");
	var newDiv = document.createElementNS("http://www.w3.org/1999/xhtml","div");
	newDiv.setAttribute("align","left");
	newDiv.appendChild (newText);
	var list = document.getElementById("searchbox_result");
	list.appendChild(newDiv);
}
    
function search_category(label, categoryType, categoryName) {
	var newText = document.createTextNode(categoryName);
	var newDiv = document.createElementNS("http://www.w3.org/1999/xhtml","div");
	newDiv.setAttribute("align","left");
	newDiv.appendChild (newText);
	var list = document.getElementById("searchbox_result");
	list.appendChild( newDiv );

	var allResults = new Array();
	for (var i = 0; i < g_SVGs.length; i++) {
		if (g_SVGs[i][2] != categoryType) {
			continue;
		}
    var results;
    if(label == null || label == "") {
      results = createAnchor(g_SVGs[i][1]);
    } else {
		  results = getSearchResult(g_SVGs[i][1], label);
    }
		allResults = allResults.concat(results);
	}

	addSearchResult(allResults, false);
}
    
function opensearch(titlename, searchlabel) {
	remove_search_result();

	setSVG_combobox_value(titlename);
	svg_combobox_change(0, 0, PIXEL_PAGE_WIDTH_SHOW, PIXEL_PAGE_HEIGHT_SHOW, -1, true, true);

	var results = getSearchResult(titlename, searchlabel);
	addSearchResult(results);
}

function split_transform(arg) {
	if (arg.search("matrix") != -1) {
		var ret =arg.substring("matrix".length + 1, arg.length-1);
		ret = ret.split(" ");
		return ret;
	}
	return "";
}
    
function remove_search_result() {
	var noNeedsvg_div = document.getElementById('searchbox_result');
	if (noNeedsvg_div && noNeedsvg_div.hasChildNodes()) {
		while (noNeedsvg_div.childNodes.length > 0) {
			noNeedsvg_div.removeChild(noNeedsvg_div.firstChild);
		}
	}
}
