import { defineModule } from '@core/module';
import { ClusterAppService } from './cluster-app.service';

export const ClusterAppModule = defineModule((ctx) => {
  const clusterAppService = new ClusterAppService();

  return ctx.uses({
    clusterAppService,
  });
});
