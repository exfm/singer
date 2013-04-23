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
nunjucks.env = new nunjucks.Environment([]);
nunjucks.env.registerPrecompiled(templates);
})()
