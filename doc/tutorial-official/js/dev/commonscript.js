(function () {
    window.addScript = function (url) {
        document.write('<script src="' + url + '"></script>');
    }

    addScript("../common/jquery/jquery-3.7.1.min.js");
    addScript("../common/jquery/jquery-ui.min.js");
    addScript("../common/jstree/jstree.min.js");
    addScript("../common/bootstrap/bootstrap.min.js");
    addScript("../common/zlib/zlib.min.js");
    addScript("../common/chart/Chart.min.js");
    addScript("../common/filesaver/FileSaver.min.js");
    addScript("../common/dateformat.js");
    addScript("../common/license.js");

    //addScript("../common/pako/pako.min.js");
    //addScript("../common/jsts/jsts.min.js");
    //addScript("../common/require/require.js");
    //addScript("../common/require/config.js");
    //addScript("../common/proj4/proj4.js");

    // document.write(`<div class=\"execute-popup\"><button >직접해보기</button></div>`);
    // document.write('<script id="execute-event">\n' +
    //     '      $(\'.execute-popup\').click(function() {\n' +
    //     '             window.open(\'./runner.html?url=baseLayer.html&title=VWorld 배경지도\');\n' +
    //     '         })\n' +
    //     '         </script>');


    window.innerNet = false;

}());