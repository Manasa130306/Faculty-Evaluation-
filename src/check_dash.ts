import { DataService } from './lib/services/data-service';

async function run() {
  const res = await DataService.getDashboardMetrics(2026, 'September');
  console.log('Metrics:', res);
}
run().catch(console.error);
