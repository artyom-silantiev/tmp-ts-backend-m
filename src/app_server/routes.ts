import { Route } from '@core/http/types';
import { FilesHttpModule } from './modules/files/files.module';

export default [
  {
    path: 'files',
    controller: FilesHttpModule.filleControoler,
  },
] as Route[];
