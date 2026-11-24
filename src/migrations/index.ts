import * as migration_20261124_104950_initial from './20261124_104950_initial';
import * as migration_20261124_110000_provenienta_imuabila from './20261124_110000_provenienta_imuabila';

export const migrations = [
  {
    up: migration_20261124_104950_initial.up,
    down: migration_20261124_104950_initial.down,
    name: '20261124_104950_initial',
  },
  {
    up: migration_20261124_110000_provenienta_imuabila.up,
    down: migration_20261124_110000_provenienta_imuabila.down,
    name: '20261124_110000_provenienta_imuabila'
  },
];
