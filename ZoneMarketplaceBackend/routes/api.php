<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;

// Auth routes (sin autenticación)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Product routes (públicas)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);

// User routes (protegidas con Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::put('/products/{id}/sold', [ProductController::class, 'markSold']);
    Route::post('/products/{id}/images', [ProductController::class, 'updateImages']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/my-products', [ProductController::class, 'myProducts']);
    
    // Mensajes/Conversaciones
    Route::get('/conversations', [MessageController::class, 'index']);
    Route::get('/conversations/{id}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::delete('/conversations/{id}', [MessageController::class, 'destroy']);
    
    // Notificaciones
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
});

// Admin routes (protegidas, solo para admins)
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    
    // Gestión de usuarios
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::get('/users/{id}', [AdminController::class, 'getUserDetails']);
    Route::post('/users/{id}/ban-temporary', [AdminController::class, 'banUserTemporarily']);
    Route::post('/users/{id}/ban-permanent', [AdminController::class, 'banUserPermanently']);
    Route::post('/users/{id}/unban', [AdminController::class, 'unbanUser']);
    Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
    Route::get('/users/{id}/access-history', [AdminController::class, 'getUserAccessHistory']);
    
    // Gestión de reseñas
    Route::get('/reviews', [AdminController::class, 'getReviews']);
    Route::post('/reviews/{id}/hide', [AdminController::class, 'hideReview']);
    Route::post('/reviews/{id}/show', [AdminController::class, 'showReview']);
    
    // Gestión de disputas
    Route::get('/disputes', [AdminController::class, 'getDisputes']);
    Route::get('/disputes/{id}', [AdminController::class, 'getDisputeDetails']);
    Route::post('/disputes/{id}/resolve', [AdminController::class, 'resolveDispute']);
    Route::post('/disputes/{id}/evidence', [AdminController::class, 'addDisputeEvidence']);
    
    // Gestión de productos
    Route::get('/users/{userId}/products', [AdminController::class, 'getUserProducts']);
    Route::post('/products/{id}/delete', [AdminController::class, 'deleteProduct']);
    
    // Logs
    Route::get('/logs', [AdminController::class, 'getAdminLogs']);
});
