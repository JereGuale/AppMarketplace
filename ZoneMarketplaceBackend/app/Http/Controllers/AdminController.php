<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Review;
use App\Models\Dispute;
use App\Models\DisputeEvidence;
use App\Models\AdminLog;
use App\Models\UserAccessLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Verificar permiso de admin en el constructor
     */
    public function __construct()
    {
        // El middleware de auth:sanctum ya está en las rutas
        // Solo verificamos el rol aquí
    }

    /**
     * Dashboard: Estadísticas generales
     */
    public function dashboard()
    {
        // Verificar que sea admin
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            $totalUsers = User::where('role', '!=', 'admin')->count();
            $newClientsThisWeek = User::where('role', 'client')
                ->where('created_at', '>=', now()->subWeek())
                ->count();
            $newProvidersThisWeek = User::where('role', 'provider')
                ->where('created_at', '>=', now()->subWeek())
                ->count();
            $activeBans = User::where('account_status', 'banned_temp')
                ->where('ban_expires_at', '>', now())
                ->count();
            $permanentBans = User::where('account_status', 'banned_perm')->count();
            $openDisputes = Dispute::where('status', 'open')->count();
            $hiddenReviews = Review::where('is_hidden_by_admin', true)->count();

            return response()->json([
                'total_users' => $totalUsers,
                'new_clients_this_week' => $newClientsThisWeek,
                'new_providers_this_week' => $newProvidersThisWeek,
                'active_temporary_bans' => $activeBans,
                'permanent_bans' => $permanentBans,
                'open_disputes' => $openDisputes,
                'hidden_reviews' => $hiddenReviews,
                'timestamp' => now(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener datos', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener todos los usuarios (con filtros)
     */
    public function getUsers(Request $request)
    {
        $query = User::where('role', '!=', 'admin');

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('status')) {
            $query->where('account_status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%$search%")
                ->orWhere('email', 'like', "%$search%");
        }

        $users = $query->with('accessLogs')
            ->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    /**
     * Obtener detalles de un usuario
     */
    public function getUserDetails($userId)
    {
        $user = User::with([
            'reviews',
            'givenReviews',
            'sentDisputes',
            'receivedDisputes',
            'accessLogs' => function ($query) {
                $query->latest()->limit(50);
            }
        ])->findOrFail($userId);

        return response()->json([
            'user' => $user,
            'stats' => [
                'total_reviews_received' => $user->givenReviews->count(),
                'average_rating' => $user->givenReviews->avg('rating') ?? 0,
                'disputes_involved' => $user->sentDisputes->count() + $user->receivedDisputes->count(),
                'successful_transactions' => $user->successful_transactions,
                'last_activity' => $user->last_activity_at,
            ]
        ]);
    }

    /**
     * Banear usuario temporalmente
     */
    public function banUserTemporarily(Request $request, $userId)
    {
        $request->validate([
            'hours' => 'required|integer|min:1',
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($userId);

        if ($user->isAdmin()) {
            return response()->json(['message' => 'No se puede banear a un administrador'], 403);
        }

        $banExpiresAt = now()->addHours($request->hours);

        $user->update([
            'account_status' => 'banned_temp',
            'ban_expires_at' => $banExpiresAt,
            'ban_reason' => $request->reason,
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'ban_user', 'user', $userId, [
            'type' => 'temporary',
            'hours' => $request->hours,
            'reason' => $request->reason,
            'expires_at' => $banExpiresAt
        ]);

        return response()->json([
            'message' => 'Usuario baneado temporalmente',
            'ban_expires_at' => $banExpiresAt,
        ]);
    }

    /**
     * Banear usuario permanentemente
     */
    public function banUserPermanently(Request $request, $userId)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($userId);

        if ($user->isAdmin()) {
            return response()->json(['message' => 'No se puede banear a un administrador'], 403);
        }

        $user->update([
            'account_status' => 'banned_perm',
            'ban_reason' => $request->reason,
            'ban_expires_at' => null,
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'ban_user', 'user', $userId, [
            'type' => 'permanent',
            'reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Usuario baneado permanentemente',
        ]);
    }

    /**
     * Desbanear usuario
     */
    public function unbanUser(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        if (!$user->isBanned()) {
            return response()->json(['message' => 'El usuario no está baneado'], 400);
        }

        $user->update([
            'account_status' => 'active',
            'ban_expires_at' => null,
            'ban_reason' => null,
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'unban_user', 'user', $userId, []);

        return response()->json([
            'message' => 'Usuario desbaneado exitosamente',
        ]);
    }

    /**
     * Restablecer contraseña de usuario
     */
    public function resetUserPassword(Request $request, $userId)
    {
        $request->validate([
            'new_password' => 'required|string|min:6|max:255',
        ]);

        $user = User::findOrFail($userId);

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'reset_password', 'user', $userId, [
            'user_email' => $user->email
        ]);

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente',
        ]);
    }

    /**
     * Obtener reseñas
     */
    public function getReviews(Request $request)
    {
        $query = Review::query();

        if ($request->has('has_offensive')) {
            $query->where('has_offensive_language', $request->boolean('has_offensive'));
        }

        if ($request->has('hidden')) {
            $query->where('is_hidden_by_admin', $request->boolean('hidden'));
        }

        $reviews = $query->with(['product', 'buyer', 'seller', 'hiddenByAdmin'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json($reviews);
    }

    /**
     * Ocultar reseña (no eliminar, solo ocultar)
     */
    public function hideReview(Request $request, $reviewId)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $review = Review::findOrFail($reviewId);

        $review->update([
            'is_hidden_by_admin' => true,
            'hidden_at' => now(),
            'hidden_by_admin_id' => auth()->id(),
            'hide_reason' => $request->reason,
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'hide_review', 'review', $reviewId, [
            'reason' => $request->reason,
            'product_id' => $review->product_id,
        ]);

        return response()->json([
            'message' => 'Reseña ocultada exitosamente',
        ]);
    }

    /**
     * Mostrar reseña (deshacer ocultamiento)
     */
    public function showReview($reviewId)
    {
        $review = Review::findOrFail($reviewId);

        $review->update([
            'is_hidden_by_admin' => false,
            'hidden_at' => null,
            'hidden_by_admin_id' => null,
            'hide_reason' => null,
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'show_review', 'review', $reviewId, []);

        return response()->json([
            'message' => 'Reseña mostrada exitosamente',
        ]);
    }

    /**
     * Obtener disputas
     */
    public function getDisputes(Request $request)
    {
        $query = Dispute::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $disputes = $query->with(['product', 'buyer', 'seller', 'admin', 'evidence'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return response()->json($disputes);
    }

    /**
     * Obtener detalles de una disputa
     */
    public function getDisputeDetails($disputeId)
    {
        $dispute = Dispute::with(['product', 'buyer', 'seller', 'admin', 'evidence.user'])
            ->findOrFail($disputeId);

        return response()->json($dispute);
    }

    /**
     * Resolver disputa (decisión del admin)
     */
    public function resolveDispute(Request $request, $disputeId)
    {
        $request->validate([
            'resolution' => 'required|in:favor_buyer,favor_seller,partial',
            'decision' => 'required|string|max:1000',
            'refund_percentage' => 'integer|min:0|max:100',
        ]);

        $dispute = Dispute::findOrFail($disputeId);

        $dispute->update([
            'status' => 'resolved',
            'resolution' => $request->resolution,
            'admin_decision' => $request->decision,
            'admin_id' => auth()->id(),
            'resolved_at' => now(),
        ]);

        // Registrar en log
        $this->logAdminAction(auth()->id(), 'resolve_dispute', 'dispute', $disputeId, [
            'resolution' => $request->resolution,
            'decision' => $request->decision,
            'refund_percentage' => $request->refund_percentage ?? null,
        ]);

        return response()->json([
            'message' => 'Disputa resuelta exitosamente',
            'dispute' => $dispute,
        ]);
    }

    /**
     * Añadir evidencia a una disputa
     */
    public function addDisputeEvidence(Request $request, $disputeId)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'file_path' => 'nullable|string',
            'file_type' => 'nullable|string|in:image,document,video',
        ]);

        $dispute = Dispute::findOrFail($disputeId);

        DisputeEvidence::create([
            'dispute_id' => $disputeId,
            'user_id' => auth()->id(),
            'message' => $request->message,
            'file_path' => $request->file_path,
            'file_type' => $request->file_type,
        ]);

        return response()->json([
            'message' => 'Evidencia añadida a la disputa',
        ]);
    }

    /**
     * Obtener historial de acceso de usuario
     */
    public function getUserAccessHistory($userId)
    {
        $logs = UserAccessLog::where('user_id', $userId)
            ->latest()
            ->limit(100)
            ->get();

        return response()->json($logs);
    }

    /**
     * Obtener logs de acciones admin
     */
    public function getAdminLogs(Request $request)
    {
        $query = AdminLog::query();

        if ($request->has('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->with('admin')
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }

    /**
     * Registrar acción de admin
     */
    private function logAdminAction($adminId, $action, $targetType, $targetId, $details)
    {
        AdminLog::create([
            'admin_id' => $adminId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'details' => json_encode($details),
            'ip_address' => request()->ip(),
        ]);
    }

    /**
     * Registrar login de usuario
     */
    public static function logUserAccess($userId, $deviceType = 'web')
    {
        UserAccessLog::create([
            'user_id' => $userId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_in_at' => now(),
            'device_type' => $deviceType,
        ]);
    }

    /**
     * Obtener productos de un usuario (Admin)
     */
    public function getUserProducts($userId)
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            $products = \App\Models\Product::where('user_id', $userId)
                ->latest()
                ->get();
            
            return response()->json([
                'data' => $products
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar producto como Admin
     */
    public function deleteProduct($productId)
    {
        $user = auth()->user();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            $product = \App\Models\Product::find($productId);
            if (!$product) {
                return response()->json(['message' => 'Producto no encontrado'], 404);
            }

            // Registrar en log
            $this->logAdminAction(auth()->id(), 'delete_product', 'product', $productId, [
                'product_title' => $product->title,
                'user_id' => $product->user_id,
            ]);

            $product->delete();
            return response()->json(['message' => 'Producto eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}
