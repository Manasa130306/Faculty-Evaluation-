const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) process.env[k.trim()] = v.join('=').trim();
});
const { DataService } = require('./src/lib/services/data-service.ts');

async function run() {
  const res = await DataService.getDashboardMetrics(2026, 'September');
  console.log('Metrics:', res);
}
run().catch(console.error);
