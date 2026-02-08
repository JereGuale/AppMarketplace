<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // Obtener todas las notificaciones del usuario
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->with(['user', 'sender'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    // Marcar notificación como leída
    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $notification->read = true;
        $notification->save();

        return response()->json($notification);
    }

    // Marcar todas como leídas
    public function markAllAsRead()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }

    // Eliminar notificación
    public function destroy($id)
    {
        $notification = Notification::findOrFail($id);
        
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        if ($notification->user_id !== $user->id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $notification->delete();

        return response()->json(['message' => 'Notificación eliminada']);
    }
}
