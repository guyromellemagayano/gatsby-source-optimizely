"use strict";var _interopRequireDefault=require("@babel/runtime/helpers/interopRequireDefault");exports.__esModule=!0,exports.Optimizely=void 0;var _regenerator=_interopRequireDefault(require("@babel/runtime/regenerator")),_extends2=_interopRequireDefault(require("@babel/runtime/helpers/extends")),_asyncToGenerator2=_interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator")),_qs=_interopRequireDefault(require("qs")),_constants=require("../constants"),_convertValues=require("../utils/convertValues"),_isEqual=require("../utils/isEqual"),_typeCheck=require("../utils/typeCheck"),_request2=require("./request"),Optimizely=function(){function Optimizely(config){if(!config)throw new Error("Optimizely/Episerver API config required. It is required to make any call to the API");this.site_url=config.site_url,this.response_type=config.response_type,this.headers=config.headers,this.request_timeout=config.request_timeout,this.request_throttle_interval=config.request_throttle_interval,this.request_debounce_interval=config.request_debounce_interval,this.request_concurrency=config.request_concurrency,this.request_max_count=config.request_max_count,this.username=config.username,this.password=config.password,this.grant_type=config.grant_type,this.client_id=config.client_id,this.reporter=config.reporter}var _proto=Optimizely.prototype;return _proto.request=function(){function request(){return _request.apply(this,arguments)}var _request=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee6(_ref){var _ref$url,url,_ref$method,method,_ref$body,body,_ref$headers,headers,_ref$endpoint,endpoint,request,_yield$request$run,data,handleExpandKeyValues,handleExpandContentBlocks,expandedData,tempItem,_tempItem$contentBloc4,contentBlocks,_tempItem$contentBloc5,contentBlocksTop,_tempItem$contentBloc6,contentBlocksBottom,expandedContentBlocks,_tempItem$contentLink5,expandedContentBlocksTop,_tempItem$contentLink6,expandedContentBlocksBottom,_tempItem$contentLink7,_this=this;return _regenerator.default.wrap(function(_context6){for(;;)switch(_context6.prev=_context6.next){case 0:return _ref$url=_ref.url,url=void 0===_ref$url?null:_ref$url,_ref$method=_ref.method,method=void 0===_ref$method?"":_ref$method,_ref$body=_ref.body,body=void 0===_ref$body?null:_ref$body,_ref$headers=_ref.headers,headers=void 0===_ref$headers?null:_ref$headers,_ref$endpoint=_ref.endpoint,endpoint=void 0===_ref$endpoint?null:_ref$endpoint,request=new _request2.Request(this.site_url,{headers:(0,_extends2.default)({},this.headers,headers),response_type:this.response_type,request_timeout:this.request_timeout,request_throttle_interval:this.request_throttle_interval,request_debounce_interval:this.request_debounce_interval,request_max_count:this.request_max_count,request_concurrency:this.request_concurrency}),_context6.next=4,request.run({url:url,method:method,body:body,headers:headers,reporter:this.reporter});case 4:if(_yield$request$run=_context6.sent,data=_yield$request$run.data,handleExpandKeyValues=function(){var _ref2=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee2(items){var _items,expandedItemsData;return _regenerator.default.wrap(function(_context2){for(;;)switch(_context2.prev=_context2.next){case 0:return void 0===items&&(items=[]),_context2.next=3,Promise.allSettled(null===(_items=items)||void 0===_items?void 0:_items.map(function(){var _ref3=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee(item){var _tempItem,_tempItem$contentLink,tempItem,_tempItem2,_tempItem2$contentLin,_yield$request$run2,expandedItemData;return _regenerator.default.wrap(function(_context){for(;;)switch(_context.prev=_context.next){case 0:if(void 0===item&&(item={}),_context.prev=1,tempItem=(0,_extends2.default)({},item),(0,_typeCheck.isEmpty)(null===(_tempItem=tempItem)||void 0===_tempItem||null===(_tempItem$contentLink=_tempItem.contentLink)||void 0===_tempItem$contentLink?void 0:_tempItem$contentLink.id)){_context.next=9;break}return _context.next=6,request.run({url:""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===(_tempItem2=tempItem)||void 0===_tempItem2||null===(_tempItem2$contentLin=_tempItem2.contentLink)||void 0===_tempItem2$contentLin?void 0:_tempItem2$contentLin.id)+"?expand=*"),method:"get"});case 6:_yield$request$run2=_context.sent,expandedItemData=_yield$request$run2.data,(0,_typeCheck.isEmpty)(expandedItemData)||(tempItem=(0,_extends2.default)({},tempItem,expandedItemData));case 9:return _context.abrupt("return",Promise.resolve(tempItem));case 12:return _context.prev=12,_context.t0=_context["catch"](1),_this.reporter.warn("[ERROR] "+((null===_context.t0||void 0===_context.t0?void 0:_context.t0.message)||(0,_convertValues.convertObjectToString)(_context.t0)||"An error occurred. Please try again later.")),_context.abrupt("return",Promise.reject(_context.t0));case 16:case"end":return _context.stop();}},_callee,null,[[1,12]])}));return function(){return _ref3.apply(this,arguments)}}())).then(function(res){var _res$filter;return null===res||void 0===res||null===(_res$filter=res.filter(function(item){return"fulfilled"===(null===item||void 0===item?void 0:item.status)}))||void 0===_res$filter?void 0:_res$filter.map(function(item){return null===item||void 0===item?void 0:item.value})}).catch(function(err){return _this.reporter.warn("[ERROR] "+((null===err||void 0===err?void 0:err.message)||(0,_convertValues.convertObjectToString)(err)||"An error occurred. Please try again later.")),err});case 3:return expandedItemsData=_context2.sent,_context2.abrupt("return",expandedItemsData);case 5:case"end":return _context2.stop();}},_callee2)}));return function(){return _ref2.apply(this,arguments)}}(),handleExpandContentBlocks=function(){var _ref4=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee4(blocks){var _blocks,expandedBlocksData;return _regenerator.default.wrap(function(_context4){for(;;)switch(_context4.prev=_context4.next){case 0:return void 0===blocks&&(blocks=[]),_context4.next=3,Promise.allSettled(null===(_blocks=blocks)||void 0===_blocks?void 0:_blocks.map(function(){var _ref5=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee3(block){var _tempBlock$contentLin,tempBlock,_tempBlock$contentLin2,_tempBlock$contentLin3,dynamicStyles,_tempBlock$contentLin4,items,_tempBlock$contentLin5,images,_tempBlock$contentLin6,form,expandedDynamicStyles,_tempBlock$contentLin7,expandedItems,_tempBlock$contentLin8,expandedImages,_tempBlock$contentLin9,expandedForm,_tempBlock$contentLin10;return _regenerator.default.wrap(function(_context3){for(;;)switch(_context3.prev=_context3.next){case 0:if(void 0===block&&(block={}),_context3.prev=1,tempBlock=(0,_extends2.default)({},block),(0,_typeCheck.isEmpty)(null===tempBlock||void 0===tempBlock||null===(_tempBlock$contentLin=tempBlock.contentLink)||void 0===_tempBlock$contentLin?void 0:_tempBlock$contentLin.expanded)){_context3.next=29;break}if(_tempBlock$contentLin2=tempBlock.contentLink.expanded,_tempBlock$contentLin3=_tempBlock$contentLin2.dynamicStyles,dynamicStyles=void 0===_tempBlock$contentLin3?null:_tempBlock$contentLin3,_tempBlock$contentLin4=_tempBlock$contentLin2.items,items=void 0===_tempBlock$contentLin4?null:_tempBlock$contentLin4,_tempBlock$contentLin5=_tempBlock$contentLin2.images,images=void 0===_tempBlock$contentLin5?null:_tempBlock$contentLin5,_tempBlock$contentLin6=_tempBlock$contentLin2.form,form=void 0===_tempBlock$contentLin6?null:_tempBlock$contentLin6,!(0,_typeCheck.isArrayType)(dynamicStyles)||(0,_typeCheck.isEmpty)(dynamicStyles)){_context3.next=11;break}return _context3.next=8,handleExpandKeyValues(dynamicStyles);case 8:expandedDynamicStyles=_context3.sent,tempBlock.contentLink.expanded.dynamicStyles=expandedDynamicStyles,(0,_isEqual.isEqual)(tempBlock.contentLink.expanded.dynamicStyles,expandedDynamicStyles)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempBlock||void 0===tempBlock||null===(_tempBlock$contentLin7=tempBlock.contentLink)||void 0===_tempBlock$contentLin7?void 0:_tempBlock$contentLin7.id)+"?expand=*")));case 11:if(!(0,_typeCheck.isArrayType)(items)||(0,_typeCheck.isEmpty)(items)){_context3.next=17;break}return _context3.next=14,handleExpandKeyValues(items);case 14:expandedItems=_context3.sent,tempBlock.contentLink.expanded.items=expandedItems,(0,_isEqual.isEqual)(tempBlock.contentLink.expanded.items,expandedItems)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempBlock||void 0===tempBlock||null===(_tempBlock$contentLin8=tempBlock.contentLink)||void 0===_tempBlock$contentLin8?void 0:_tempBlock$contentLin8.id)+"?expand=*")));case 17:if(!(0,_typeCheck.isArrayType)(images)||(0,_typeCheck.isEmpty)(images)){_context3.next=23;break}return _context3.next=20,handleExpandKeyValues(images);case 20:expandedImages=_context3.sent,tempBlock.contentLink.expanded.images=expandedImages,(0,_isEqual.isEqual)(tempBlock.contentLink.expanded.images,expandedImages)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempBlock||void 0===tempBlock||null===(_tempBlock$contentLin9=tempBlock.contentLink)||void 0===_tempBlock$contentLin9?void 0:_tempBlock$contentLin9.id)+"?expand=*")));case 23:if(!(0,_typeCheck.isArrayType)(form)||(0,_typeCheck.isEmpty)(form)){_context3.next=29;break}return _context3.next=26,handleExpandKeyValues(form);case 26:expandedForm=_context3.sent,tempBlock.contentLink.expanded.form=expandedForm,(0,_isEqual.isEqual)(tempBlock.contentLink.expanded.form,expandedForm)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempBlock||void 0===tempBlock||null===(_tempBlock$contentLin10=tempBlock.contentLink)||void 0===_tempBlock$contentLin10?void 0:_tempBlock$contentLin10.id)+"?expand=*")));case 29:return _context3.abrupt("return",Promise.resolve(tempBlock));case 32:return _context3.prev=32,_context3.t0=_context3["catch"](1),_this.reporter.warn("[ERROR] "+((null===_context3.t0||void 0===_context3.t0?void 0:_context3.t0.message)||(0,_convertValues.convertObjectToString)(_context3.t0)||"An error occurred. Please try again later.")),_context3.abrupt("return",Promise.reject(_context3.t0));case 36:case"end":return _context3.stop();}},_callee3,null,[[1,32]])}));return function(){return _ref5.apply(this,arguments)}}())).then(function(res){var _res$filter2;return null===res||void 0===res||null===(_res$filter2=res.filter(function(item){return"fulfilled"===(null===item||void 0===item?void 0:item.status)}))||void 0===_res$filter2?void 0:_res$filter2.map(function(item){return null===item||void 0===item?void 0:item.value})}).catch(function(err){return _this.reporter.warn("[ERROR] "+((null===err||void 0===err?void 0:err.message)||(0,_convertValues.convertObjectToString)(err)||"An error occurred. Please try again later.")),err});case 3:return expandedBlocksData=_context4.sent,_context4.abrupt("return",expandedBlocksData);case 5:case"end":return _context4.stop();}},_callee4)}));return function(){return _ref4.apply(this,arguments)}}(),!(((0,_typeCheck.isArrayType)(data)||(0,_typeCheck.isObjectType)(data))&&!(0,_typeCheck.isEmpty)(data)&&endpoint!==_constants.AUTH_ENDPOINT)){_context6.next=46;break}if(!(0,_typeCheck.isArrayType)(data)){_context6.next=16;break}return _context6.next=12,Promise.allSettled(null===data||void 0===data?void 0:data.map(function(){var _ref6=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee5(item){var tempItem,_tempItem$contentBloc,contentBlocks,_tempItem$contentBloc2,contentBlocksTop,_tempItem$contentBloc3,contentBlocksBottom,expandedContentBlocks,_tempItem$contentLink2,expandedContentBlocksTop,_tempItem$contentLink3,expandedContentBlocksBottom,_tempItem$contentLink4;return _regenerator.default.wrap(function(_context5){for(;;)switch(_context5.prev=_context5.next){case 0:if(void 0===item&&(item={}),_context5.prev=1,tempItem=(0,_extends2.default)({},item),_tempItem$contentBloc=tempItem.contentBlocks,contentBlocks=void 0===_tempItem$contentBloc?null:_tempItem$contentBloc,_tempItem$contentBloc2=tempItem.contentBlocksTop,contentBlocksTop=void 0===_tempItem$contentBloc2?null:_tempItem$contentBloc2,_tempItem$contentBloc3=tempItem.contentBlocksBottom,contentBlocksBottom=void 0===_tempItem$contentBloc3?null:_tempItem$contentBloc3,!(0,_typeCheck.isArrayType)(contentBlocks)||(0,_typeCheck.isEmpty)(contentBlocks)){_context5.next=10;break}return _context5.next=7,handleExpandContentBlocks(contentBlocks);case 7:expandedContentBlocks=_context5.sent,tempItem.contentBlocks=expandedContentBlocks,(0,_isEqual.isEqual)(tempItem.contentBlocks,expandedContentBlocks)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink2=tempItem.contentLink)||void 0===_tempItem$contentLink2?void 0:_tempItem$contentLink2.id)+"?expand=*")));case 10:if(!(0,_typeCheck.isArrayType)(contentBlocksTop)||(0,_typeCheck.isEmpty)(contentBlocksTop)){_context5.next=16;break}return _context5.next=13,handleExpandContentBlocks(contentBlocksTop);case 13:expandedContentBlocksTop=_context5.sent,tempItem.contentBlocksTop=expandedContentBlocksTop,(0,_isEqual.isEqual)(tempItem.contentBlocksTop,expandedContentBlocksTop)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink3=tempItem.contentLink)||void 0===_tempItem$contentLink3?void 0:_tempItem$contentLink3.id)+"?expand=*")));case 16:if(!(0,_typeCheck.isArrayType)(contentBlocksBottom)||(0,_typeCheck.isEmpty)(contentBlocksBottom)){_context5.next=22;break}return _context5.next=19,handleExpandContentBlocks(contentBlocksBottom);case 19:expandedContentBlocksBottom=_context5.sent,tempItem.contentBlocksBottom=expandedContentBlocksBottom,(0,_isEqual.isEqual)(tempItem.contentBlocksBottom,expandedContentBlocksBottom)||_this.reporter.info("[EXPANDED] "+(""+(_this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink4=tempItem.contentLink)||void 0===_tempItem$contentLink4?void 0:_tempItem$contentLink4.id)+"?expand=*")));case 22:return _context5.abrupt("return",Promise.resolve(tempItem));case 25:return _context5.prev=25,_context5.t0=_context5["catch"](1),_this.reporter.warn("[ERROR] "+((null===_context5.t0||void 0===_context5.t0?void 0:_context5.t0.message)||(0,_convertValues.convertObjectToString)(_context5.t0)||"An error occurred. Please try again later.")),_context5.abrupt("return",Promise.reject(_context5.t0));case 29:case"end":return _context5.stop();}},_callee5,null,[[1,25]])}));return function(){return _ref6.apply(this,arguments)}}())).then(function(res){var _res$filter3;return(null===res||void 0===res||null===(_res$filter3=res.filter(function(item){return"fulfilled"===(null===item||void 0===item?void 0:item.status)}))||void 0===_res$filter3?void 0:_res$filter3.map(function(item){return null===item||void 0===item?void 0:item.value}))||res}).catch(function(err){return err});case 12:return expandedData=_context6.sent,_context6.abrupt("return",expandedData);case 16:if(_context6.prev=16,tempItem=(0,_extends2.default)({},data),_tempItem$contentBloc4=tempItem.contentBlocks,contentBlocks=void 0===_tempItem$contentBloc4?null:_tempItem$contentBloc4,_tempItem$contentBloc5=tempItem.contentBlocksTop,contentBlocksTop=void 0===_tempItem$contentBloc5?null:_tempItem$contentBloc5,_tempItem$contentBloc6=tempItem.contentBlocksBottom,contentBlocksBottom=void 0===_tempItem$contentBloc6?null:_tempItem$contentBloc6,!(0,_typeCheck.isArrayType)(contentBlocks)||(0,_typeCheck.isEmpty)(contentBlocks)){_context6.next=25;break}return _context6.next=22,handleExpandContentBlocks(contentBlocks);case 22:expandedContentBlocks=_context6.sent,tempItem.contentBlocks=expandedContentBlocks,(0,_isEqual.isEqual)(tempItem.contentBlocks,expandedContentBlocks)||this.reporter.info("[EXPANDED] "+(""+(this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink5=tempItem.contentLink)||void 0===_tempItem$contentLink5?void 0:_tempItem$contentLink5.id)+"?expand=*")));case 25:if(!(0,_typeCheck.isArrayType)(contentBlocksTop)||(0,_typeCheck.isEmpty)(contentBlocksTop)){_context6.next=31;break}return _context6.next=28,handleExpandContentBlocks(contentBlocksTop);case 28:expandedContentBlocksTop=_context6.sent,tempItem.contentBlocksTop=expandedContentBlocksTop,(0,_isEqual.isEqual)(tempItem.contentBlocksTop,expandedContentBlocksTop)||this.reporter.info("[EXPANDED] "+(""+(this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink6=tempItem.contentLink)||void 0===_tempItem$contentLink6?void 0:_tempItem$contentLink6.id)+"?expand=*")));case 31:if(!(0,_typeCheck.isArrayType)(contentBlocksBottom)||(0,_typeCheck.isEmpty)(contentBlocksBottom)){_context6.next=37;break}return _context6.next=34,handleExpandContentBlocks(contentBlocksBottom);case 34:expandedContentBlocksBottom=_context6.sent,tempItem.contentBlocksBottom=expandedContentBlocksBottom,(0,_isEqual.isEqual)(tempItem.contentBlocksBottom,expandedContentBlocksBottom)||this.reporter.info("[EXPANDED] "+(""+(this.site_url+_constants.CONTENT_ENDPOINT+(null===tempItem||void 0===tempItem||null===(_tempItem$contentLink7=tempItem.contentLink)||void 0===_tempItem$contentLink7?void 0:_tempItem$contentLink7.id)+"?expand=*")));case 37:return _context6.abrupt("return",Promise.resolve(tempItem));case 40:return _context6.prev=40,_context6.t0=_context6["catch"](16),this.reporter.warn("[ERROR] "+((null===_context6.t0||void 0===_context6.t0?void 0:_context6.t0.message)||(0,_convertValues.convertObjectToString)(_context6.t0)||"An error occurred. Please try again later.")),_context6.abrupt("return",Promise.reject(_context6.t0));case 44:_context6.next=47;break;case 46:return _context6.abrupt("return",data);case 47:case"end":return _context6.stop();}},_callee6,this,[[16,40]])}));return request}(),_proto.get=function(){function get(){return _get.apply(this,arguments)}var _get=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee7(_ref7){var _ref7$url,url,_ref7$body,body,_ref7$headers,headers,_ref7$endpoint,endpoint,results;return _regenerator.default.wrap(function(_context7){for(;;)switch(_context7.prev=_context7.next){case 0:return _ref7$url=_ref7.url,url=void 0===_ref7$url?null:_ref7$url,_ref7$body=_ref7.body,body=void 0===_ref7$body?null:_ref7$body,_ref7$headers=_ref7.headers,headers=void 0===_ref7$headers?null:_ref7$headers,_ref7$endpoint=_ref7.endpoint,endpoint=void 0===_ref7$endpoint?null:_ref7$endpoint,_context7.next=3,this.request({url:url,method:"get",body:body,headers:headers,endpoint:endpoint}).then(function(res){return res}).catch(function(err){return err});case 3:return results=_context7.sent,_context7.abrupt("return",results);case 5:case"end":return _context7.stop();}},_callee7,this)}));return get}(),_proto.post=function(){function post(){return _post.apply(this,arguments)}var _post=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee8(_ref8){var _ref8$url,url,_ref8$body,body,_ref8$headers,headers,_ref8$endpoint,endpoint,results;return _regenerator.default.wrap(function(_context8){for(;;)switch(_context8.prev=_context8.next){case 0:return _ref8$url=_ref8.url,url=void 0===_ref8$url?null:_ref8$url,_ref8$body=_ref8.body,body=void 0===_ref8$body?null:_ref8$body,_ref8$headers=_ref8.headers,headers=void 0===_ref8$headers?null:_ref8$headers,_ref8$endpoint=_ref8.endpoint,endpoint=void 0===_ref8$endpoint?null:_ref8$endpoint,_context8.next=3,this.request({url:url,method:"post",body:body,headers:headers,endpoint:endpoint}).then(function(res){return res}).catch(function(err){return err});case 3:return results=_context8.sent,_context8.abrupt("return",results);case 5:case"end":return _context8.stop();}},_callee8,this)}));return post}(),_proto.authenticate=function(){function authenticate(){return _authenticate.apply(this,arguments)}var _authenticate=(0,_asyncToGenerator2.default)(_regenerator.default.mark(function _callee9(){var config,results;return _regenerator.default.wrap(function(_context9){for(;;)switch(_context9.prev=_context9.next){case 0:return config={url:this.site_url+_constants.REQUEST_URL_SLUG+_constants.AUTH_ENDPOINT,data:_qs.default.stringify({username:this.username,password:this.password,grant_type:this.grant_type,client_id:this.client_id},{encode:!1}),headers:{Accept:_constants.REQUEST_ACCEPT_HEADER,"Content-Type":_constants.AUTH_REQUEST_CONTENT_TYPE_HEADER}},_context9.next=3,this.post({url:config.url,body:config.data,headers:config.headers,endpoint:_constants.AUTH_ENDPOINT});case 3:return results=_context9.sent,_context9.abrupt("return",results);case 5:case"end":return _context9.stop();}},_callee9,this)}));return authenticate}(),Optimizely}();exports.Optimizely=Optimizely;
//# sourceMappingURL=optimizely.js.map