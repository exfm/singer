(function() {
var templates = {};
templates["edit-service.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<form>\n    <input type=\"text\" name=\"name\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "name"));
output += runtime.suppressValue("\"/>\n    <input type=\"text\" name=\"repo\" value=\"");
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "repo"));
output += runtime.suppressValue("\"/>\n</form>");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["macros.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
var macro_t_1 = runtime.makeMacro(
["service"], 
[], 
function (l_service, kwargs) {
frame = frame.push();
kwargs = kwargs || {};
frame.set("service", l_service);
var output= "";
output += runtime.suppressValue("\n    <li><a href=\"\">");
output += runtime.suppressValue(runtime.suppressLookupValue((l_service),"name"));
output += runtime.suppressValue("</a></li>\n");
frame = frame.pop();
return output;
});
context.addExport("serviceItem");
context.setVariable("serviceItem", macro_t_1);
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
templates["main.html"] = (function() {
function root(env, context, frame, runtime) {
var lineno = null;
var colno = null;
var output = "";
try {
output += runtime.suppressValue("<div class=\"row-fluid\">\n    <div class=\"span6\">\n        <h2><a class=\"btn\" href=\"#\"><i class=\"icon-plus-sign\"></i> </a> services</h2>\n        <ul>\n            ");
frame = frame.push();
var t_2 = runtime.contextOrFrameLookup(context, frame, "services");
for(var t_1=0; t_1 < t_2.length; t_1++) {
var t_3 = t_2[t_1];
frame.set("service", t_3);
frame.set("loop.index", t_1 + 1);
frame.set("loop.index0", t_1);
frame.set("loop.revindex", t_2.length - t_1);
frame.set("loop.revindex0", t_2.length - t_1 - 1);
frame.set("loop.first", t_1 === 0);
frame.set("loop.last", t_1 === t_2.length - 1);
frame.set("loop.length", t_2.length);
output += runtime.suppressValue("\n                <li><a href=\"/service/");
output += runtime.suppressValue((lineno = 5, colno = 49, (runtime.suppressLookupValue((t_3),"get"))("name")));
output += runtime.suppressValue("\">");
output += runtime.suppressValue((lineno = 5, colno = 70, (runtime.suppressLookupValue((t_3),"get"))("name")));
output += runtime.suppressValue("</a></li>\n            ");
}
frame = frame.pop();
output += runtime.suppressValue("\n        </ul>\n        <h2><a class=\"btn\" href=\"#\"><i class=\"icon-plus-sign\"></i> </a> environments</h2>\n        <ul>\n            ");
frame = frame.push();
var t_5 = runtime.contextOrFrameLookup(context, frame, "environments");
for(var t_4=0; t_4 < t_5.length; t_4++) {
var t_6 = t_5[t_4];
frame.set("env", t_6);
frame.set("loop.index", t_4 + 1);
frame.set("loop.index0", t_4);
frame.set("loop.revindex", t_5.length - t_4);
frame.set("loop.revindex0", t_5.length - t_4 - 1);
frame.set("loop.first", t_4 === 0);
frame.set("loop.last", t_4 === t_5.length - 1);
frame.set("loop.length", t_5.length);
output += runtime.suppressValue("\n                <li><a href=\"/environment/");
output += runtime.suppressValue((lineno = 11, colno = 57, (runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "environment")),"get"))("name")));
output += runtime.suppressValue("\">");
output += runtime.suppressValue((lineno = 11, colno = 82, (runtime.suppressLookupValue((runtime.contextOrFrameLookup(context, frame, "environment")),"get"))("name")));
output += runtime.suppressValue("</a></li>\n            ");
}
frame = frame.pop();
output += runtime.suppressValue("\n        </ul>\n    </div>\n\n</div>");
return output;
} catch (e) {
  runtime.handleError(e, lineno, colno);
}
}
return {
root: root
};

})();
nunjucks.env = new nunjucks.Environment([]);
nunjucks.env.registerPrecompiled(templates);
})()
