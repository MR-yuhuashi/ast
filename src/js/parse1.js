const recast = require('recast');

const code = `
  function add (a, b) {
    return a + b;
  }
`;

const ast = recast.parse(code);

const add = ast.program.body[0];

// const output = recast.print(ast);

console.log(add.body.body[0].argument.right);