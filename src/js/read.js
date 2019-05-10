#!/usr/bin/env node
const recast = require('recast');
const TNT = recast.types.namedTypes;
console.log(recast.types.builders);
recast.run(function (ast, printSource) {
  // console.log(ast);
  // printSource(ast);
  recast.visit(ast, {
    visitExpressionStatement: function (path) {
      const node = path.value;
      if (TNT.ExpressionStatement.check(node)) {
        // console.log('这是一个ExpressionStatement');
      }
      TNT.ExpressionStatement.assert(node)
      this.traverse(path);
    }
  });
});