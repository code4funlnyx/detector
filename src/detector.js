
define(function(require, exports, module) {

  var versioning = require("./versioning");

  var detector = {};

  var userAgent = navigator.userAgent || "";
  var platform = navigator.platform || "";
  var vendor = navigator.vendor || "";
  var external = window.external;

  function toString(object){
    return Object.prototype.toString.call(object);
  }
  function isObject(object){
    return toString(object) === "[object Object]";
  }
  function isFunction(object){
    return toString(object) === "[object Function]";
  }
  function isArray(object){
    return toString(object) === "[object Array]";
  }
  function each(object, factory, argument){
    if(isArray(object)){
      for(var i=0,b,l=object.length; i<l; i++){
        if(factory.call(object, object[i], i) === false){break;}
      }
    }
  }

  // 硬件设备信息识别表达式。
  // 使用数组可以按优先级排序。
  var DEVICES = [
    ["nokia", function(ua){
      if(ua.indexOf("nokia ") !== -1){
        return /nokia ([0-9]+)?/;
      }else if(/nokia[\d]/.test(ua)){
        return /nokia(\d+)/;
      }else{
        return "nokia";
      }
    }],
    ["wp", function(ua){
      return ua.indexOf("windows phone ") !== -1 ||
        ua.indexOf("xblwp") !== -1 ||
        ua.indexOf("zunewp") !== -1 ||
        ua.indexOf("windows ce") !== -1;
    }],
    ["pc", "windows"],
    ["ipad", "ipad"],
    ["ipod", "ipod"],
    ["iphone", "iphone"],
    ["mac", "macintosh"],
    ["mi", function(ua){
      if(ua.indexOf("mi-one plus") !== -1){
        return {
          version: "1s"
        };
      }else{
        return /\bmi ([0-9.as]+)/;
      }
    }],
    ["meizu", /\bm([0-9]+)/],
    ["nexus", /nexus ([0-9.]+)/],
    ["android", "android"],
    ["blackberry", "blackberry"]
  ];
  // 操作系统信息识别表达式
  var OS = [
    ["wp", function(ua){
      if(ua.indexOf("windows phone ") !== -1){
        return /windows phone (?:os )?([0-9.]+)/;
      }else if(ua.indexOf("xblwp") !== -1){
        return /xblwp([0-9.]+)/;
      }else if(ua.indexOf("zunewp") !== -1){
        return /zunewp([0-9.]+)/;
      }
      return "windows phone";
    }],
    ["windows", /windows nt ([0-9.]+)/],
    ["macosx", /mac os x ([0-9._]+)/],
    ["ios", /cpu(?: iphone)? os ([0-9._]+)/],
    ["android", /android[ -]([0-9.]+)/],
    ["chromeos", /cros i686 ([0-9.]+)/],
    ["linux", "linux"],
    ["windowsce", /windows ce(?: ([0-9.]+))?/],
    ["symbian", /symbianos\/([0-9.]+)/],
    ["blackberry", "blackberry"]
  ];

  /*
   * 解析使用 Trident 内核的浏览器的 `浏览器模式` 和 `文档模式` 信息。
   * @param {String} ua, userAgent string.
   * @return {Object}
   */
  function IEMode(ua){
    if(ua.indexOf("msie ") === -1){return null;}

    var m,
        engineMode, engineVersion,
        browserMode, browserVersion,
        compatible=false;

    // IE8 及其以上提供有 Trident 信息，
    // 默认的兼容模式，UA 中 Trident 版本不发生变化。
    if(ua.indexOf("trident/") !== -1){
      m = /trident\/([0-9.]+)/.exec(ua);
      if(m && m.length>=2){
        // 真实引擎版本。
        engineVersion = m[1];
        v_version = m[1].split(".");
        v_version[0] = parseInt(v_version[0], 10) + 4;
        browserVersion = v_version.join(".");
      }
    }

    m = /msie ([0-9.]+)/.exec(ua);
    browserMode = m[1];
    var v_mode = m[1].split(".");
    if("undefined" === typeof browserVersion){
      browserVersion = browserMode;
    }
    v_mode[0] = parseInt(v_mode[0], 10) - 4;
    engineMode = v_mode.join(".");
    if("undefined" === typeof engineVersion){
      engineVersion = engineMode;
    }

    return {
      browserVersion: browserVersion,
      browserMode: browserMode,
      engineVersion: engineVersion,
      engineMode: engineMode,
      compatible: engineVersion !== engineMode
    };
  }
  var ENGINE = [
    ["trident", /msie (\d+)\.(\d)/],
    //["blink", /blink\/([0-9.+]+)/],
    ["webkit", /applewebkit\/([0-9.+]+)/],
    ["gecko", /gecko\/(\d+)/],
    ["presto", /presto\/([0-9.]+)/]
  ];
  var BROWSER = [
    /**
     * 360SE (360安全浏览器)
     **/
    ["360", function(ua) {
      //if(!detector.os.windows) return false;
      if(external) {
        try {
          return external.twGetVersion(external.twGetSecurityID(window));
        } catch(e) {
          try {
            return external.twGetRunPath.toLowerCase().indexOf("360se") !== -1 ||
              !!external.twGetSecurityID(window);
          } catch(e) {}
        }
      }
      return (/360(?:se|ee|chrome)/);
    }],
    /**
     * Maxthon (傲游)
     **/
    ["mx", function(ua){
      //if(!detector.os.windows) return false;
      if(external){
        try{
          return (external.mxVersion || external.max_version).split(".");
        }catch(e){}
      }
      return /maxthon(?:[ \/]([0-9.]+))?/;
    }],
    /**
     * [Sogou (搜狗浏览器)](http://ie.sogou.com/)
     **/
    ["sg", / se ([0-9.x]+)/],
    /**
     * TheWorld (世界之窗)
     * NOTE: 由于裙带关系，TW API 与 360 高度重合。若 TW 不提供标准信息，则可能会被识别为 360
     **/
    ["tw", function(ua){
      //if(!detector.os.windows) return false;
      if(external) {
        try{
          return external.twGetRunPath.toLowerCase().indexOf("theworld") !== -1;
        }catch(e){}
      }
      return "theworld";
    }],
    ["green", "greenbrowser"],
    ["qq", /qqbrowser\/([0-9.]+)/],
    ["tt", /tencenttraveler ([0-9.]+)/],
    ["lb", function(ua){
      if(ua.indexOf("lbbrowser") === -1){return false;}
      var version = "-1";
      if(window.external && window.external.LiebaoGetVersion){
        try{
          version = window.external.LiebaoGetVersion();
        }catch(ex){}
      }
      return {
        version: version
      };
    }],
    ["tao", /taobrowser\/([0-9.]+)/],
    ["fs", /coolnovo\/([0-9.]+)/],
    ["sy", "saayaa"],
    ["baidu", /bidubrowser[ \/]([0-9.x]+)/],
    ["mi", /miuibrowser\/([0-9.]+)/],
    // 后面会做修复版本号，这里只要能识别是 IE 即可。
    ["ie", /msie ([0-9.]+)/],
    ["chrome", / (?:chrome|crios|crmo)\/([0-9.]+)/],
    ["safari", /version\/([0-9.]+(?: beta)?)(?: mobile(?:\/[a-z0-9]+)?)? safari\//],
    ["firefox", /firefox\/([0-9.ab]+)/],
    ["opera", /opera.+version\/([0-9.ab]+)/],
    ["uc", function(ua){
      return ua.indexOf("ucbrowser") !== -1 ? /ucbrowser\/([0-9.]+)/ : /ucweb([0-9.]+)/;
    }]
  ];

  /**
   * UserAgent Detector.
   * @param {String} ua, userAgent.
   * @param {Object} expression
   * @return {Object}
   *    返回 null 表示当前表达式未匹配成功。
   */
  function detect(name, expression, ua){
    if("undefined" === typeof ua){ua = userAgent;}
    var expr = isFunction(expression) ? expression.call(null, ua) : expression;
    if(!expr){return null;}
    var info = {
      name: name,
      version: "-1",
      codename: ""
    };
    var t = toString(expr);
    if(expr === true){
      return info;
    }else if(t === "[object String]"){
      if(ua.indexOf(expr) !== -1){
        return info;
      }
    }else if(isObject(expr)){ // Object
      if(expr.hasOwnProperty("version")){
        info.version = expr.version;
      }
      return info;
    }else if(expr.exec){ // RegExp
      var m = expr.exec(ua);
      if(m){
        if(m.length >= 2 && m[1]){
          info.version = m[1].replace(/_/g, ".");
        }else{
          info.version = "-1";
        }
        return info;
      }
    }
  }

  var na = {name:"na", version:"-1"};
  // 初始化识别。
  function init(ua, patterns, factory, detector){
    var detected = na;
    each(patterns, function(pattern){
      var d = detect(pattern[0], pattern[1], ua);
      if(d){
        detected = d;
        return false;
      }
    });
    factory.call(detector, detected.name, detected.version);
  }

  /**
   * 解析 UserAgent 字符串
   * @param {String} ua, userAgent string.
   * @return {Object}
   */
  var parse = function(ua){
    ua = (ua || "").toLowerCase();
    var d = {};

    init(ua, DEVICES, function(name, version){
      var v = new versioning(version);
      d.device = {
        name: name,
        version: v
      };
      d.device[name] = v;
    }, d);

    init(ua, OS, function(name, version){
      var v = new versioning(version);
      d.os = {
        name: name,
        version: v
      };
      d.os[name] = v;
    }, d);

    var ieCore = IEMode(ua);

    init(ua, ENGINE, function(name, version){
      var mode = version;
      // IE 内核的浏览器，修复版本号及兼容模式。
      if(ieCore){
        version = ieCore.engineVersion || ieCore.engineMode;
        mode = ieCore.engineMode;
      }
      var vv = new versioning(version);
      var vm = new versioning(mode);
      d.engine = {
        name: name,
        version: vv,
        mode: vm,
        compatible: ieCore ? ieCore.compatible : false
      };
      d.engine[name] = vv;
    }, d);

    init(ua, BROWSER, function(name, version){
      var mode = version;
      // IE 内核的浏览器，修复浏览器版本及兼容模式。
      if(ieCore){
        // 仅修改 IE 浏览器的版本，其他 IE 内核的版本不修改。
        if(name === "ie"){
          version = ieCore.browserVersion;
        }
        mode = ieCore.browserMode;
      }
      var vv = new versioning(version);
      var vm = new versioning(mode);
      // Android 默认浏览器。
      if(d.os.name === "android" && name==="safari"){
        name = "android";
      }
      d.browser = {
        name: name,
        version: vv,
        mode: vm,
        compatible: ieCore ? ieCore.compatible : false
      };
      d.browser[name] = vv;
    }, d);
    return d;
  };

  detector = parse(userAgent);
  detector.detect = parse;

  module.exports = detector;
});
