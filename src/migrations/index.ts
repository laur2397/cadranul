import * as migration_20261124_104950_initial from './20261124_104950_initial';
import * as migration_20261124_110000_provenienta_imuabila from './20261124_110000_provenienta_imuabila';
import * as migration_20261124_120220_surse_de_date from './20261124_120220_surse_de_date';
import * as migration_20261124_123644_anunturi_publice from './20261124_123644_anunturi_publice';
import * as migration_20261124_123700_surse_pornite from './20261124_123700_surse_pornite';
import * as migration_20261124_130000_surse_verificate from './20261124_130000_surse_verificate';

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
    name: '20261124_120220_surse_de_date',
  },
  {
    up: migration_20261124_123644_anunturi_publice.up,
    down: migration_20261124_123644_anunturi_publice.down,
    name: '20261124_123644_anunturi_publice'
  },
  {
    up: migration_20261124_123700_surse_pornite.up,
    down: migration_20261124_123700_surse_pornite.down,
    name: '20261124_123700_surse_pornite',
  },
  {
    up: migration_20261124_130000_surse_verificate.up,
    down: migration_20261124_130000_surse_verificate.down,
    name: '20261124_130000_surse_verificate',
  },
];
