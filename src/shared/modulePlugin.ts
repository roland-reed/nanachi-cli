import * as t from 'babel-types';
import * as path from 'path';
import { resolvePackage } from './resolvePackage';

export default () => {
  return {
    visitor: {
      CallExpression: (astPath: any) => {
        if (astPath.node.callee.name === 'require') {
          const id = astPath.node.arguments[0].value;
          if (!id.startsWith('./')) {
            const realPath = resolvePackage(id, this.cwd);
            const relativePathFromNodeModules = path.relative(
              path.resolve(this.cwd, 'node_modules'),
              path.resolve(realPath)
            );
            const distPath = path.relative(
              this.getDestinationPath(),
              path.resolve(
                this.getDestinationDir(),
                relativePathFromNodeModules
              )
            );
            astPath.node.arguments[0].value = distPath;
          }
        }
      },
      ImportDeclaration: (astPath: any) => {
        const id = astPath.node.source.value;
        if (!id.startsWith('./')) {
          const realPath = resolvePackage(
            id,
            path.parse(this.getSourcePath()).dir
          );
          const relativePathFromNodeModules = path.relative(
            path.resolve(this.cwd, 'node_modules'),
            path.resolve(realPath)
          );
          const distPath = path.relative(
            path.parse(this.getDestinationPath()).dir,
            path.resolve(
              this.getDestinationDir(),
              relativePathFromNodeModules
            )
          );
          astPath.node.source.value = distPath;
        }
      },
      MemberExpression: (astPath: any) => {
        if (
          t.isMemberExpression(astPath.node) &&
          astPath.node.property.name === 'NODE_ENV'
        ) {
          if (
            t.isMemberExpression(astPath.node.object) &&
            astPath.node.object.property.name === 'env'
          ) {
            if (
              t.isIdentifier(astPath.node.object.object) &&
              astPath.node.object.object.name === 'process'
            ) {
              astPath.replaceWith(t.stringLiteral('production'));
            }
          }
        }
      }
    }
  };
};
