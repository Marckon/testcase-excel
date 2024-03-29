import { parse, ParserPlugin } from "@babel/parser";
import traverse from "@babel/traverse";

export function extractCaseDesc(
  code: string,
  testFnNam: string[],
  isTs = false,
): string[] {
  const plugins: ParserPlugin[] = ["decorators", "classProperties"];

  const ast = parse(code, {
    sourceType: "module",
    plugins: isTs ? [...plugins, "typescript"] : plugins,
  });

  const desc: string[] = [];

  traverse(ast, {
    CallExpression(path) {
      if (
        testFnNam.includes(path.node.callee.name) &&
        path.node.arguments.length > 0 &&
        (path.node.arguments[0].type === "StringLiteral" ||
          path.node.arguments[0].type === "TemplateLiteral")
      ) {
        const firstArg = path.node.arguments[0];
        desc.push(
          firstArg.type === "TemplateLiteral"
            ? (firstArg.quasis[0].value.raw as string)
            : (firstArg.value as string),
        );
      }
    },
  });

  return desc;
}
