const { exec } = require('child_process')
const { promisify } = require('util')
const fs = require('fs')
const path = require('path')

const execAsync = promisify(exec)

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const backupDir = path.join(process.cwd(), 'backups')
  const backupFile = path.join(backupDir, `scalemate-backup-${timestamp}.sql`)
  
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
      console.log('📁 Created backup directory')
    }
    
    console.log(`📦 Creating backup: ${backupFile}`)
    
    // Create database dump
    await execAsync(`pg_dump "${connectionString}" --verbose --clean --no-acl --no-owner > "${backupFile}"`)
    
    // Verify backup file was created
    if (fs.existsSync(backupFile)) {
      const stats = fs.statSync(backupFile)
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
      
      console.log(`✅ Backup completed successfully!`)
      console.log(`📁 File: ${backupFile}`)
      console.log(`📊 Size: ${fileSizeInMB} MB`)
      
      // Create a manifest file with backup info
      const manifest = {
        timestamp: new Date().toISOString(),
        filename: path.basename(backupFile),
        fileSize: stats.size,
        fileSizeMB: fileSizeInMB,
        databaseUrl: connectionString.replace(/:[^:]*@/, ':***@'), // Hide password
        backupType: 'full',
        status: 'success'
      }
      
      const manifestFile = path.join(backupDir, `manifest-${timestamp}.json`)
      fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))
      
      console.log(`📄 Manifest created: ${manifestFile}`)
      
    } else {
      throw new Error('Backup file was not created')
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    
    // Create error manifest
    const errorManifest = {
      timestamp: new Date().toISOString(),
      backupType: 'full',
      status: 'failed',
      error: error.message
    }
    
    const errorFile = path.join(backupDir, `error-${timestamp}.json`)
    fs.writeFileSync(errorFile, JSON.stringify(errorManifest, null, 2))
    
    process.exit(1)
  }
}

async function cleanOldBackups(retentionDays = 7) {
  const backupDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    return
  }
  
  try {
    console.log(`🧹 Cleaning backups older than ${retentionDays} days...`)
    
    const files = fs.readdirSync(backupDir)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    let deletedCount = 0
    
    for (const file of files) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.mtime < cutoffDate && (file.endsWith('.sql') || file.endsWith('.json'))) {
        fs.unlinkSync(filePath)
        deletedCount++
        console.log(`🗑️  Deleted old backup: ${file}`)
      }
    }
    
    if (deletedCount === 0) {
      console.log('🎉 No old backups to clean')
    } else {
      console.log(`🎉 Cleaned ${deletedCount} old backup files`)
    }
    
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error.message)
  }
}

async function listBackups() {
  const backupDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupDir)) {
    console.log('📂 No backup directory found')
    return
  }
  
  try {
    const files = fs.readdirSync(backupDir)
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort().reverse()
    
    if (sqlFiles.length === 0) {
      console.log('📂 No backup files found')
      return
    }
    
    console.log('📋 Available backups:')
    console.log('──────────────────────────────────────')
    
    for (const file of sqlFiles) {
      const filePath = path.join(backupDir, file)
      const stats = fs.statSync(filePath)
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
      const date = stats.mtime.toISOString().split('T')[0]
      
      console.log(`📁 ${file}`)
      console.log(`   📅 Date: ${date}`)
      console.log(`   📊 Size: ${fileSizeInMB} MB`)
      console.log('──────────────────────────────────────')
    }
    
  } catch (error) {
    console.error('❌ Error listing backups:', error.message)
  }
}

async function restoreBackup(backupFile) {
  if (!backupFile) {
    console.error('❌ Backup file is required')
    process.exit(1)
  }
  
  const backupDir = path.join(process.cwd(), 'backups')
  const fullPath = path.isAbsolute(backupFile) ? backupFile : path.join(backupDir, backupFile)
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Backup file not found: ${fullPath}`)
    process.exit(1)
  }
  
  try {
    console.log(`🔄 Restoring backup: ${fullPath}`)
    console.log('⚠️  WARNING: This will overwrite the current database!')
    
    // Note: In production, you might want to add a confirmation prompt here
    
    await execAsync(`psql "${connectionString}" < "${fullPath}"`)
    
    console.log('✅ Database restored successfully!')
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    process.exit(1)
  }
}

async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'create':
      await createBackup()
      await cleanOldBackups()
      break
      
    case 'list':
      await listBackups()
      break
      
    case 'restore':
      const backupFile = process.argv[3]
      await restoreBackup(backupFile)
      break
      
    case 'clean':
      const retentionDays = parseInt(process.argv[3]) || 7
      await cleanOldBackups(retentionDays)
      break
      
    default:
      console.log('🚀 ScaleMate Database Backup Tool')
      console.log('')
      console.log('Usage:')
      console.log('  node scripts/backup.js create     - Create a new backup')
      console.log('  node scripts/backup.js list       - List available backups')
      console.log('  node scripts/backup.js restore <file> - Restore from backup')
      console.log('  node scripts/backup.js clean [days]   - Clean old backups (default: 7 days)')
      console.log('')
      console.log('Examples:')
      console.log('  node scripts/backup.js create')
      console.log('  node scripts/backup.js restore scalemate-backup-2024-01-15.sql')
      console.log('  node scripts/backup.js clean 14')
      break
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Run the backup tool
main() 