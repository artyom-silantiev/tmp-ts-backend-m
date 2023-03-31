import { Route } from 'minimal2b/http/types';
import { FilesHttpModule } from './modules/files/files.module';

export default [
  {
    path: 'files',
    controller: FilesHttpModule.filleControoler,
  },
] as Route[];
