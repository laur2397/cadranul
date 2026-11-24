import * as migration_20261124_104950_initial from './20261124_104950_initial';
import * as migration_20261124_110000_provenienta_imuabila from './20261124_110000_provenienta_imuabila';
import * as migration_20261124_120220_surse_de_date from './20261124_120220_surse_de_date';

export const migrations = [
  {
    up: migration_20261124_104950_initial.up,
    down: migration_20261124_104950_initial.down,
    name: '20261124_104950_initial',
  },
  {
    up: migration_20261124_110000_provenienta_imuabila.up,
    down: migration_20261124_110000_provenienta_imuabila.down,
    name: '20261124_110000_provenienta_imuabila',
  },
  {
    up: migration_20261124_120220_surse_de_date.up,
    down: migration_20261124_120220_surse_de_date.down,
    name: '20261124_120220_surse_de_date'
  },
];
