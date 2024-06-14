	function getOppositeAlias(word) {
		var results = new Array();
		for (var i = 0; i < ALIAS_LIST.length; i++) {
			for (var j = 1; j < ALIAS_LIST[i].length; j++) {
				if (word == ALIAS_LIST[i][j].toLowerCase()) {
					results.push(ALIAS_LIST[i][0]);
				}
			}
		}
		return results;
	}

	function getOppositeAliasContain(word) {
		var results = new Array();
		for (var i = 0; i < ALIAS_LIST.length; i++) {
			for (var j = 1; j < ALIAS_LIST[i].length; j++) {
				if (ALIAS_LIST[i][j].toLowerCase().search(word) != -1) {
					results.push(ALIAS_LIST[i][0]);
				}
			}
		}
		return results;
	}

	var ALIAS_LIST = [
		//keyword, Alias1, Alias2, Alias3......
		['', '']
	];
