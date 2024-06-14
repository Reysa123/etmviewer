function getSVG(path, callback, callback2) {
	var element = document.createElement('script');
	element.type = 'text/javascript';
	element.src = 'svg/contents/'+path+'.js';
	document.head.appendChild(element);
	document.head.addEventListener('svg:loaded', callback);
	document.head.addEventListener('svg:loaded', callback2);
}
