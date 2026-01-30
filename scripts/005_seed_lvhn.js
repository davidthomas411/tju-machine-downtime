const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function parseEnvFile(contents) {
  const env = {}
  contents.split(/\r?\n/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match) return
    const key = match[1]
    let value = match[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  })
  return env
}

function loadEnvLocal() {
  const root = path.resolve(__dirname, '..')
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return
  const envFile = fs.readFileSync(envPath, 'utf8')
  const env = parseEnvFile(envFile)
  Object.keys(env).forEach((key) => {
    if (!process.env[key]) {
      process.env[key] = env[key]
    }
  })
}

async function columnExists(supabase, table, column, probeColumn = 'id') {
  const { error } = await supabase
    .from(table)
    .select(`${probeColumn}, ${column}`)
    .limit(1)

  if (error?.message?.includes(`${table}.${column}`)) {
    return false
  }

  if (error) {
    console.error(`Failed to check ${table}.${column} column.`)
    console.error(error.message)
    process.exit(1)
  }

  return true
}

async function main() {
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    console.error('Missing Supabase credentials. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error: networkError } = await supabase
    .from('sites')
    .select('id, network')
    .limit(1)

  if (networkError) {
    console.error('Unable to read sites.network. Make sure you ran scripts/003_add_site_network.sql.')
    console.error(networkError.message)
    process.exit(1)
  }

  const sitePayload = {
    name: 'Lehigh Valley Health Network - Radiation Oncology',
    code: 'LVHN-RO',
    address: '1240 S Cedar Crest Blvd, Allentown, PA',
    network: 'lvhn',
  }

  const supportsSiteCode = await columnExists(supabase, 'sites', 'code')
  const supportsSiteAddress = await columnExists(supabase, 'sites', 'address')

  let existingSite
  let siteLookupError

  if (supportsSiteCode) {
    const result = await supabase
      .from('sites')
      .select('*')
      .eq('code', sitePayload.code)
      .maybeSingle()
    existingSite = result.data
    siteLookupError = result.error
  } else {
    const result = await supabase
      .from('sites')
      .select('*')
      .eq('name', sitePayload.name)
      .maybeSingle()
    existingSite = result.data
    siteLookupError = result.error
  }

  if (siteLookupError) {
    console.error('Failed to look up LVHN site.')
    console.error(siteLookupError.message)
    process.exit(1)
  }

  let site = existingSite

  if (!site) {
    const siteInsertPayload = {
      name: sitePayload.name,
      network: sitePayload.network,
      ...(supportsSiteCode ? { code: sitePayload.code } : {}),
      ...(supportsSiteAddress ? { address: sitePayload.address } : {}),
    }

    const { data: createdSite, error: siteCreateError } = await supabase
      .from('sites')
      .insert(siteInsertPayload)
      .select('*')
      .single()

    if (siteCreateError) {
      console.error('Failed to create LVHN site.')
      console.error(siteCreateError.message)
      process.exit(1)
    }

    site = createdSite
    console.log(`Created LVHN site: ${site.name} (${site.id})`)
  } else {
    console.log(`LVHN site already exists: ${site.name} (${site.id})`)
  }

  const { error: settingsError } = await supabase
    .from('site_settings')
    .upsert(
      {
        site_id: site.id,
        ...(await columnExists(supabase, 'site_settings', 'logo_url', 'site_id')
          ? { logo_url: '/brand/lehigh-valley-jefferson-health.png' }
          : {}),
        ...(await columnExists(supabase, 'site_settings', 'primary_color', 'site_id')
          ? { primary_color: '#0b2c5a' }
          : {}),
        ...(await columnExists(supabase, 'site_settings', 'secondary_color', 'site_id')
          ? { secondary_color: '#29b3a2' }
          : {}),
        ...(await columnExists(supabase, 'site_settings', 'rotation_interval', 'site_id')
          ? { rotation_interval: 30 }
          : {}),
        ...(await columnExists(supabase, 'site_settings', 'display_mode', 'site_id')
          ? { display_mode: 'grid' }
          : {}),
      },
      { onConflict: 'site_id' }
    )

  if (settingsError) {
    console.error('Failed to upsert LVHN site settings.')
    console.error(settingsError.message)
    process.exit(1)
  }

  const { data: existingMachines, error: machinesError } = await supabase
    .from('machines')
    .select('id, name')
    .eq('site_id', site.id)

  if (machinesError) {
    console.error('Failed to fetch existing LVHN machines.')
    console.error(machinesError.message)
    process.exit(1)
  }

  const existingNames = new Set((existingMachines || []).map((machine) => machine.name))
  const models = ['Varian TrueBeam', 'Varian Halcyon', 'Elekta Versa HD', 'Elekta Unity']
  const locations = ['Vault A', 'Vault B', 'Vault C', 'Vault D']
  const supportsMachineModel = await columnExists(supabase, 'machines', 'model', 'id')
  const supportsMachineLocation = await columnExists(supabase, 'machines', 'location', 'id')
  const supportsMachineDisplayOrder = await columnExists(supabase, 'machines', 'display_order', 'id')
  const supportsMachineIsActive = await columnExists(supabase, 'machines', 'is_active', 'id')

  const machineDefinitions = Array.from({ length: 4 }).map((_, index) => ({
    name: `LINAC ${index + 1}`,
    model: models[Math.floor(Math.random() * models.length)],
    location: locations[index] || `Vault ${index + 1}`,
    display_order: index + 1,
  }))

  const machinesToInsert = machineDefinitions
    .filter((machine) => !existingNames.has(machine.name))
    .map((machine) => ({
      site_id: site.id,
      ...(supportsMachineIsActive ? { is_active: true } : {}),
      name: machine.name,
      ...(supportsMachineModel ? { model: machine.model } : {}),
      ...(supportsMachineLocation ? { location: machine.location } : {}),
      ...(supportsMachineDisplayOrder ? { display_order: machine.display_order } : {}),
    }))

  if (machinesToInsert.length > 0) {
    const { error: insertMachinesError } = await supabase
      .from('machines')
      .insert(machinesToInsert)

    if (insertMachinesError) {
      console.error('Failed to insert LVHN machines.')
      console.error(insertMachinesError.message)
      process.exit(1)
    }

    console.log(`Inserted ${machinesToInsert.length} LVHN machines.`)
  } else {
    console.log('LVHN machines already present; no new machines inserted.')
  }

  const { data: allMachines, error: allMachinesError } = await supabase
    .from('machines')
    .select('id, name')
    .eq('site_id', site.id)

  if (allMachinesError) {
    console.error('Failed to fetch LVHN machines for status initialization.')
    console.error(allMachinesError.message)
    process.exit(1)
  }

  const machineIds = (allMachines || []).map((machine) => machine.id)
  if (machineIds.length === 0) {
    console.log('No LVHN machines found to initialize statuses.')
    return
  }

  const { data: existingStatuses, error: statusFetchError } = await supabase
    .from('machine_statuses')
    .select('machine_id')
    .in('machine_id', machineIds)

  if (statusFetchError) {
    console.error('Failed to fetch existing machine statuses.')
    console.error(statusFetchError.message)
    process.exit(1)
  }

  const statusSet = new Set((existingStatuses || []).map((status) => status.machine_id))
  const supportsStatusNotes = await columnExists(supabase, 'machine_statuses', 'notes', 'machine_id')
  const statusesToInsert = machineIds
    .filter((id) => !statusSet.has(id))
    .map((id) => ({
      machine_id: id,
      status: 'on_time',
      ...(supportsStatusNotes ? { notes: null } : {}),
    }))

  if (statusesToInsert.length > 0) {
    const { error: statusInsertError } = await supabase
      .from('machine_statuses')
      .insert(statusesToInsert)

    if (statusInsertError) {
      console.error('Failed to insert LVHN machine statuses.')
      console.error(statusInsertError.message)
      process.exit(1)
    }

    console.log(`Initialized ${statusesToInsert.length} machine statuses.`)
  } else {
    console.log('Machine statuses already initialized.')
  }

  console.log('LVHN seed complete.')
}

main().catch((error) => {
  console.error('Seed failed with unexpected error:')
  console.error(error)
  process.exit(1)
})
