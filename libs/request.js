"use strict";var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");exports.__esModule=!0,exports.Request=void 0;var _regenerator=_interopRequireDefault(require("@babel/runtime/regenerator")),_extends2=_interopRequireDefault(require("@babel/runtime/helpers/extends")),_asyncToGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator")),_axios=_interopRequireDefault(require("axios")),_constants=require("../constants"),_convertValues=require("../utils/convertValues"),_debounce=require("../utils/debounce"),_throttle=require("../utils/throttle"),Request=function(){function Request(hostname,_temp){var _ref=void 0===_temp?{}:_temp,_ref$headers=_ref.headers,headers=void 0===_ref$headers?{}:_ref$headers,_ref$response_type=_ref.response_type,response_type=void 0===_ref$response_type?"":_ref$response_type,_ref$request_timeout=_ref.request_timeout,request_timeout=void 0===_ref$request_timeout?_constants.REQUEST_TIMEOUT:_ref$request_timeout,_ref$request_throttle=_ref.request_throttle_interval,request_throttle_interval=void 0===_ref$request_throttle?_constants.REQUEST_THROTTLE_INTERVAL:_ref$request_throttle,_ref$request_debounce=_ref.request_debounce_interval,request_debounce_interval=void 0===_ref$request_debounce?_constants.REQUEST_DEBOUNCE_INTERVAL:_ref$request_debounce,_ref$request_concurre=_ref.request_concurrency,request_concurrency=void 0===_ref$request_concurre?_constants.REQUEST_CONCURRENCY:_ref$request_concurre;this.hostname=hostname,this.response_type=response_type,this.headers=headers,this.pending_requests=_constants.REQUEST_PENDING_COUNT,this.request_timeout=request_timeout,this.request_throttle_interval=request_throttle_interval,this.request_debounce_interval=request_debounce_interval,this.request_concurrency=request_concurrency}var _proto=Request.prototype;return _proto.run=function(){function run(){return _run.apply(this,arguments)}var _run=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee(url,method,body,headers){var updatedMethod,config,RequestAxiosInstance,_this=this;return _regenerator.default.wrap(function(_context){for(;;)switch(_context.prev=_context.next){case 0:void 0===url&&(url=""),void 0===method&&(method=""),void 0===body&&(body=null),void 0===headers&&(headers={}),updatedMethod=(0,_convertValues.convertStringToLowercase)(method),config={headers:(0,_extends2.default)({},this.headers,headers),responseType:this.response_type,withCredentials:!0,timeout:this.request_timeout},_axios.default.defaults.headers.common.Accept=_constants.REQUEST_ACCEPT_HEADER,_axios.default.defaults.headers.common["Content-Type"]=_constants.REQUEST_ACCEPT_HEADER,console.log(config),RequestAxiosInstance=_axios.default.create(config),RequestAxiosInstance.interceptors.request.use(function(config){return new Promise(function(resolve){var debounceInterval=(0,_debounce.debounce)(function(){return _this.pending_requests--},_this.request_debounce_interval),throttleInterval=(0,_throttle.throttle)(function(){clearInterval(throttleInterval),debounceInterval(),resolve(config)},_this.request_throttle_interval);return _this.pending_requests<=_this.request_concurrency&&(console.warn("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - (SENT)"),throttleInterval()),_this.pending_requests>_this.request_concurrency&&console.warn("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - (THROTTLED) ("+_this.pending_requests+" pending "+(1<_this.pending_requests?"requests":"request")+")"),_this.pending_requests++,config})}),function(res){return new Promise(function(resolve){return console.info("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - ("+res.status+" "+res.statusText+")"),resolve(res),res})},function(err){return new Promise(function(reject){return console.error("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - (ERROR)"),console.error("\n",err.message,"\n"),reject(err),err})},RequestAxiosInstance.interceptors.response.use(function(res){return new Promise(function(resolve){return _this.pending_requests=Math.max(0,0<_this.pending_requests?_this.pending_requests-1:0),console.info("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - ("+res.status+" "+res.statusText+") ("+_this.pending_requests+" pending "+(1<_this.pending_requests?"requests":"request")+")"),resolve(res)})}),function(err){return new Promise(function(reject){return err.response?(_this.pending_requests=Math.max(0,0<_this.pending_requests?_this.pending_requests-1:0),console.error("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - ("+err.response.status+" "+err.response.statusText+")")):err.request?(_this.pending_requests=Math.max(0,0<_this.pending_requests?_this.pending_requests-1:0),console.error("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - ("+err.request.status+" "+err.request.statusText+")")):(console.error("["+(0,_convertValues.convertStringToUppercase)(method)+"] "+url+" - (ERROR)"),console.error("\n",err.message,"\n")),reject(err)})},_context.t0=updatedMethod,_context.next="get"===_context.t0?15:"post"===_context.t0?18:21;break;case 15:return _context.next=17,RequestAxiosInstance.get(url,body);case 17:return _context.abrupt("break",22);case 18:return _context.next=20,RequestAxiosInstance.post(url,body);case 20:return _context.abrupt("break",22);case 21:throw new Error("The "+updatedMethod+" method is currently not supported.");case 22:case"end":return _context.stop();}},_callee,this)}));return run}(),Request}();exports.Request=Request;
//# sourceMappingURL=request.js.map