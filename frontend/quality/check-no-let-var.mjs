import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const extensions = /\.(?:[cm]?[jt]sx?)$/;
const roots = ['src', 'tests', 'quality', 'vite.config.ts', 'cypress.config.ts'];

const sourceFiles = (entry) => {
  if (!fs.existsSync(entry)) return [];
  const stat = fs.statSync(entry);
  if (stat.isFile()) return extensions.test(entry) ? [entry] : [];
  return fs
    .readdirSync(entry, { withFileTypes: true })
    .flatMap((child) => sourceFiles(path.join(entry, child.name)));
};

const declarationKind = (node) => {
  if (!ts.isVariableDeclarationList(node)) return null;
  if (node.flags & ts.NodeFlags.Let) return 'let';
  return node.flags & ts.NodeFlags.Const ? null : 'var';
};

const mutableDeclarations = (node, sourceFile, file) => {
  const kind = declarationKind(node);
  const own = kind
    ? node.declarations.map((declaration) => {
        const location = sourceFile.getLineAndCharacterOfPosition(
          declaration.getStart(sourceFile),
        );
        return `${file}:${location.line + 1}:${location.character + 1} ${kind} ${declaration.name.getText(sourceFile)}`;
      })
    : [];
  return [
    ...own,
    ...node
      .getChildren(sourceFile)
      .flatMap((child) => mutableDeclarations(child, sourceFile, file)),
  ];
};

const violations = roots.flatMap(sourceFiles).flatMap((file) => {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  return mutableDeclarations(sourceFile, sourceFile, file);
});

if (violations.length)
  throw new Error(`Mutable declarations are forbidden:\n${violations.join('\n')}`);

console.log('No let/var declarations found.');
