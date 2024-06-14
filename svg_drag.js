/*
  ドラッグ処理初期化
*/
function drag_init() {
  // ドラッグ開始位置はSVG上のみ
  g_theSvgElement.addEventListener('mousedown', mousedown, false);
  document.addEventListener('mousemove', _.throttle(mousemove, 70), false);
  
  // 謎のドラッグイベントが発生しないようにしておく（svgのline要素をつかもうとすると発生するやつ）
  var dragItems = document.querySelectorAll('[draggable=true]');
  for (var i = 0; i < dragItems.length; i++) {
    dragItems[i].addEventListener('dragstart', cancel, false);
  }
}
var flag = false;
var originX = 0;
var originY = 0;
var movedX = 0;
var movedY = 0;

/*
  クリックしたとき
*/
function mousedown(event) {
  flag = true;
  originX = event.clientX;
  originY = event.clientY;
  movedX = 0.0000000;
  movedY = 0.0000000;
  $(g_theSvgElement).attr("class", "drag");

  /*
    クリック離したとき
  */
  document.onmouseup = function() {
    flag = false;
    $(g_theSvgElement).attr("class", "");
    if(document.body.releaseCapture) { document.body.releaseCapture(); }
  };

  if(document.body.setCapture) { document.body.setCapture(); }
}

/*
  ドラッグ中
*/
function mousemove(event) {
  event.preventDefault();
  if (flag) {
    var viewBox = g_theSvgElement.getAttribute('viewBox');
    var viewBoxValues = viewBox.split(' ');
    viewBoxValues[0] = parseFloat(viewBoxValues[0]);
    viewBoxValues[1] = parseFloat(viewBoxValues[1]);
    
    // ズーム率を計算する
    viewBoxValues[2] = parseFloat(viewBoxValues[2]);
    var magnification =viewBoxValues[2]/ PIXEL_PAGE_WIDTH_SHOW;
    
    // どれだけ動いたか計算する
    var movex = (event.clientX - originX - movedX);
    var movey = (event.clientY - originY - movedY);
    
    // viewboxに対してはズーム率をかけてセットしてあげる
    viewBoxValues[0] -= movex * magnification;
    viewBoxValues[1] -= movey * magnification;
    
    movedX += movex;
    movedY += movey;

    //console.log('[magnification] = ' + magnification + ' [movex] = ' + movex + ' ,[originX] = ' + originX + ' ,[event.clientX] = ' + event.clientX + ' ,[movedX] = ' + movedX + ' ,[viewBoxValues[0]] = ' + viewBoxValues[0]);
    g_theSvgElement.setAttribute('viewBox', viewBoxValues.join(' '));
  }
}
 
/*
  起きたイベントをキャンセルする
*/
function cancel(event) {
  if (event.preventDefault) {
    event.preventDefault();
  }
  return false;
}
