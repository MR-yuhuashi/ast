#!/usr/bin/env node
const recast = require('recast');
const {
  identifier:id,
  expressionStatement,
  memberExpression,
  assignmentExpression,
  arrowFunctionExpression,
  blockStatement
} = recast.types.builders;
const fs = require('fs');
const path = require('path');
const options = process.argv.slice(2);
//如果没有参数，或提供了-h 或--help选项，则打印帮助

console.log(options);
if(options.length===0 || options.includes('-h') || options.includes('--help')){
  console.log(`
    采用commonjs规则，将.js文件内所有函数修改为导出形式。

    选项： -r  或 --rewrite 可直接覆盖原有文件
    `)
  process.exit(0)
}

// 只要有-r 或--rewrite参数，则rewriteMode为true
let rewriteMode = options.includes('-r') || options.includes('--rewrite')

// 获取文件名
const clearFileArg = options.filter((item)=>{
  return !['-r','--rewrite','-h','--help'].includes(item)
})

// 只处理一个文件
let filename = clearFileArg[0]

const writeASTFile = function(ast, filename, rewriteMode){
  const newCode = recast.print(ast).code
  if(!rewriteMode){
    // 非覆盖模式下，将新文件写入*.export.js下
    filename = filename.split('.').slice(0,-1).concat(['export','js']).join('.')
  }
  // 将新代码写入文件
  fs.writeFileSync(path.join(process.cwd(),filename),newCode)
}

recast.run(function(ast, printSource) {
  // // 一个块级域 {}
  // console.log('\n\nstep1:')
  // printSource(blockStatement([]))

  // // 一个键头函数 ()=>{}
  // console.log('\n\nstep2:')
  // printSource(arrowFunctionExpression([],blockStatement([])))

  // // add赋值为键头函数  add = ()=>{}
  // console.log('\n\nstep3:')
  // printSource(assignmentExpression('=',id('add'),arrowFunctionExpression([],blockStatement([]))))

  // // exports.add赋值为键头函数  exports.add = ()=>{}
  // console.log('\n\nstep4:')
  // printSource(expressionStatement(assignmentExpression('=',memberExpression(id('exports'),id('add')),
  //   arrowFunctionExpression([],blockStatement([])))))

  let funcIds = [];
  recast.types.visit(ast, {
    visitFunctionDeclaration(path) {
      const node= path.node;
      const funcName = node.id;
      const params = node.params;
      const body = node.body;

      funcIds.push(funcName.name);
      const rep = expressionStatement(assignmentExpression('=', memberExpression(id('exports'), funcName),
        arrowFunctionExpression(params, body)))

        path.replace(rep);
        return false;
    }
  });

  recast.types.visit(ast, {
    // 遍历所有的函数调用
    visitCallExpression(path){
      const node = path.node;
      // 如果函数调用出现在函数定义中，则修改ast结构
      if (funcIds.includes(node.callee.name)) {
        node.callee = memberExpression(id('exports'), node.callee)
      }
      // 停止遍历
      return false
    }
  })

  writeASTFile(ast,filename,rewriteMode)
});

