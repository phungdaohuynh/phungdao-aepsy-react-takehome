import base from '../base.json';
import library from '../library.json';
import nextjs from '../nextjs.json';

type TsConfigShape = {
  compilerOptions?: Record<string, unknown>;
};

function assertConfig(name: string, config: TsConfigShape) {
  if (!config.compilerOptions) {
    throw new Error(`Missing compilerOptions in ${name}`);
  }
}

assertConfig('base.json', base as TsConfigShape);
assertConfig('library.json', library as TsConfigShape);
assertConfig('nextjs.json', nextjs as TsConfigShape);
