import { Route } from '@core/router/router';
import { FilesHttpModule } from './files/files.module';

export default [
  {
    path: 'files',
    controller: FilesHttpModule.filleControoler,
  },
] as Route[];
