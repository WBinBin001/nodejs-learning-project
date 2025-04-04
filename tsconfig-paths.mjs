import { resolve as resolveTs } from 'ts-node/esm';
import * as tsConfigPaths from 'tsconfig-paths';
import { pathToFileURL } from 'url';

const { absoluteBaseUrl, paths } = tsConfigPaths.loadConfig();
const matchPath = tsConfigPaths.createMatchPath(absoluteBaseUrl, paths);

export function resolve(specifier, context, nextResolve) {
  // 首先尝试使用 ts-node 的解析器
  const resolved = resolveTs(specifier, context, nextResolve);
  return resolved;
}

export { load, transformSource } from 'ts-node/esm'; 