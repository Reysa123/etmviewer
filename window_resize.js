var BODY_HEIGTH_BUFF = 20;

$(document).ready(function() {
    windowResizeZoom();
});

$(window).resize(function() {
    windowResizeZoom();
});

function windowResizeZoom() {

    var scale = $(window).height() / ($("html").height() + BODY_HEIGTH_BUFF);
    // X軸, Y軸がbodyとhtml で別々になっているのはスクロールバー調整のため
    $("body").css({ MozTransformOrigin: '0 0'});
    $("html").css({ MozTransformOrigin: '0 0'});
    $("body").css({ MozTransform: 'scaleX('+ scale +')'});
    $("html").css({ MozTransform: 'scaleY('+ scale +')'});
}




