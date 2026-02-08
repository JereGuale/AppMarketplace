<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ListBackups extends Command
{
    protected $signature = 'db:backups';
    protected $description = 'Lista todos los backups disponibles';

    public function handle()
    {
        $backupDir = storage_path('app/backups');
        
        if (!file_exists($backupDir)) {
            $this->info('No hay backups disponibles');
            return Command::SUCCESS;
        }
        
        $files = glob($backupDir . '/backup_*.sql');
        
        if (empty($files)) {
            $this->info('No hay backups disponibles');
            return Command::SUCCESS;
        }
        
        // Ordenar por fecha (más recientes primero)
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        $this->info('📁 Backups disponibles:');
        $this->line('');
        
        $headers = ['#', 'Archivo', 'Tamaño', 'Fecha'];
        $rows = [];
        
        foreach ($files as $index => $file) {
            $rows[] = [
                $index + 1,
                basename($file),
                round(filesize($file) / 1024 / 1024, 2) . ' MB',
                date('Y-m-d H:i:s', filemtime($file))
            ];
        }
        
        $this->table($headers, $rows);
        
        $this->line('');
        $this->line('💡 Para restaurar un backup usa: php artisan db:restore <nombre-archivo>');
        
        return Command::SUCCESS;
    }
}
