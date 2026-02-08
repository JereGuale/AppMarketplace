<?php
try {
    $pdo = new PDO('pgsql:host=127.0.0.1;port=5432;dbname=zone_marketplace', 'postgres', '1234');
    $stmt = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    
    echo "===== USUARIOS EN LA BASE DE DATOS =====\n\n";
    echo "Total usuarios: " . $stmt->rowCount() . "\n\n";
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['id']}\n";
        echo "  Nombre: {$row['name']}\n";
        echo "  Email: {$row['email']}\n";
        echo "  Rol: {$row['role']}\n";
        echo "  Creado: {$row['created_at']}\n";
        echo "-----------------------------------\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
