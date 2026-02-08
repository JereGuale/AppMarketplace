<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RestoreDatabase extends Command
{
    protected $signature = 'db:restore {file : Nombre del archivo de backup a restaurar}';
    protected $description = 'Restaura la base de datos desde un archivo de backup';

    public function handle()
    {
        if (!$this->confirm('⚠️  ADVERTENCIA: Esto sobrescribirá todos los datos actuales. ¿Continuar?')) {
            $this->info('Operación cancelada');
            return Command::SUCCESS;
        }
        
        $this->info('🔄 Iniciando restauración de la base de datos...');
        
        $filename = $this->argument('file');
        $backupDir = storage_path('app/backups');
        $filepath = $backupDir . '/' . $filename;
        
        if (!file_exists($filepath)) {
            $this->error("❌ Archivo no encontrado: {$filename}");
            $this->line("\n📁 Backups disponibles:");
            
            $files = glob($backupDir . '/backup_*.sql');
            foreach ($files as $file) {
                $this->line("   - " . basename($file));
            }
            
            return Command::FAILURE;
        }
        
        $dbName = config('database.connections.pgsql.database');
        $dbUser = config('database.connections.pgsql.username');
        $dbPassword = config('database.connections.pgsql.password');
        $dbHost = config('database.connections.pgsql.host');
        $dbPort = config('database.connections.pgsql.port');
        
        // Comando psql
        $command = sprintf(
            'set PGPASSWORD=%s && psql -h %s -p %s -U %s -d %s -f "%s"',
            escapeshellarg($dbPassword),
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbName),
            $filepath
        );
        
        $this->line('Restaurando backup...');
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            $this->info("✅ Base de datos restaurada exitosamente desde: {$filename}");
            return Command::SUCCESS;
        } else {
            $this->error('❌ Error al restaurar el backup');
            return Command::FAILURE;
        }
    }
}
