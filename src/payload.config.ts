import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ro } from '@payloadcms/translations/languages/ro'
import sharp from 'sharp'
import { Users } from './collections/Users'
import { Regions } from './collections/Regions'
import { Counties } from './collections/Counties'
import { Sections } from './collections/Sections'
import { Authors } from './collections/Authors'
import { Tags } from './collections/Tags'
import { Articles } from './collections/Articles'
import { Provenance } from './collections/Provenance'
import { LiveBlogs } from './collections/LiveBlogs'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { Redirects } from './collections/Redirects'
import { Frontpages } from './collections/Frontpages'
import { RoadEvents } from './collections/RoadEvents'
import { TravelTimes } from './collections/TravelTimes'
import { Outages } from './collections/Outages'
import { WeatherAlerts } from './collections/WeatherAlerts'
import { WeatherCities } from './collections/WeatherCities'
import { EnergyPrices } from './collections/EnergyPrices'
import { FuelPrices } from './collections/FuelPrices'
import { Pharmacies } from './collections/Pharmacies'
import { Jobs } from './collections/Jobs'
import { DataSources, SourceRuns } from './collections/DataSources'
import { Site } from './globals/Site'
import { Momentul } from './globals/Momentul'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' · Cadranul redacție' },
    importMap: { baseDir: path.resolve(dirname) },
  },
  i18n: { supportedLanguages: { ro }, fallbackLanguage: 'ro' },
  collections: [
    Articles, Frontpages, LiveBlogs, Authors, Media, Provenance,
    RoadEvents, TravelTimes, Outages, WeatherAlerts, WeatherCities, EnergyPrices, FuelPrices, Pharmacies, Jobs, DataSources, SourceRuns,
    Sections, Regions, Counties, Tags, Pages, Redirects, Users,
  ],
  globals: [Momentul, Site],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || '' }, push: false }),
  sharp,
  telemetry: false,
})
