import { defineModule } from 'minimal2b/module';
import { ClusterAppService } from './cluster-app.service';

export const ClusterAppModule = defineModule((ctx) => {
  const clusterAppService = new ClusterAppService();

  return ctx.useItems({
    clusterAppService,
  });
});
