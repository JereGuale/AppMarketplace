<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'db:backup {--name= : Nombre personalizado para el backup}';
    protected $description = 'Crea un backup completo de la base de datos';

    public function handle()
    {
        $this->info('🔄 Iniciando backup de la base de datos...');
        
        $dbName = config('database.connections.pgsql.database');
        $dbUser = config('database.connections.pgsql.username');
        $dbPassword = config('database.connections.pgsql.password');
        $dbHost = config('database.connections.pgsql.host');
        $dbPort = config('database.connections.pgsql.port');
        
        // Crear directorio de backups si no existe
        $backupDir = storage_path('app/backups');
        if (!file_exists($backupDir)) {
            mkdir($backupDir, 0755, true);
        }
        
        // Nombre del archivo
        $timestamp = date('Y-m-d_His');
        $customName = $this->option('name');
        $filename = $customName 
            ? "backup_{$customName}_{$timestamp}.sql"
            : "backup_{$timestamp}.sql";
        $filepath = $backupDir . '/' . $filename;
        
        // Comando pg_dump
        $command = sprintf(
            'set PGPASSWORD=%s && pg_dump -h %s -p %s -U %s -F p -f "%s" %s',
            escapeshellarg($dbPassword),
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            $filepath,
            escapeshellarg($dbName)
        );
        
        $this->line('Ejecutando backup...');
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0 && file_exists($filepath)) {
            $size = filesize($filepath);
            $sizeInMB = round($size / 1024 / 1024, 2);
            
            $this->info("✅ Backup creado exitosamente:");
            $this->line("   📁 Archivo: {$filename}");
            $this->line("   💾 Tamaño: {$sizeInMB} MB");
            $this->line("   📍 Ubicación: {$filepath}");
            
            // Limpiar backups antiguos (mantener últimos 10)
            $this->cleanOldBackups($backupDir);
            
            return Command::SUCCESS;
        } else {
            $this->error('❌ Error al crear el backup');
            $this->line('Verifica que pg_dump esté instalado y en el PATH del sistema');
            return Command::FAILURE;
        }
    }
    
    private function cleanOldBackups($backupDir)
    {
        $files = glob($backupDir . '/backup_*.sql');
        
        if (count($files) > 10) {
            // Ordenar por fecha de modificación
            usort($files, function($a, $b) {
                return filemtime($a) - filemtime($b);
            });
            
            // Eliminar los más antiguos
            $toDelete = array_slice($files, 0, count($files) - 10);
            foreach ($toDelete as $file) {
                unlink($file);
            }
            
            $this->line("🗑️  Backups antiguos eliminados: " . count($toDelete));
        }
    }
}
