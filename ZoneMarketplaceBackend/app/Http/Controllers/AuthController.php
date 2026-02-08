<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;


class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'min:3',
                'max:80',
                'regex:/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]+$/', // Solo letras, espacios y acentos
            ],
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'city' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s\-,]+$/', // Letras, espacios, guiones y comas para ciudades como "Las Palmas"
            ],
            'password' => 'required|string|min:6|max:255',
        ], [
            'name.regex' => 'El nombre solo puede contener letras, espacios y acentos',
            'name.min' => 'El nombre debe tener al menos 3 caracteres',
            'name.max' => 'El nombre no puede exceder 80 caracteres',
            'city.regex' => 'La ciudad contiene caracteres no válidos',
            'city.max' => 'La ciudad no puede exceder 100 caracteres',
            'password.max' => 'La contraseña no puede exceder 255 caracteres',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'city' => $request->city,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('api_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
                'login_type' => 'nullable|in:user,admin', // 'user' o 'admin'
            ]);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }

            $credentials = $validator->validated();
            $loginType = $credentials['login_type'] ?? 'user';

            // Auth::attempt maneja verificación de hash y dispara eventos de login
            if (!Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
                return response()->json(['message' => 'Credenciales inválidas'], 401);
            }

            /** @var \App\Models\User $user */
            $user = Auth::user();

            // Si es admin login, verificar que sea admin
            if ($loginType === 'admin' && $user->role !== 'admin') {
                return response()->json(['message' => 'No tienes permisos de administrador'], 403);
            }

            // Si es usuario normal, no puede ser admin
            if ($loginType === 'user' && $user->role === 'admin') {
                return response()->json(['message' => 'Debes iniciar sesión como administrador'], 403);
            }

            // Verificar si el usuario está baneado
            if ($user->isBanned()) {
                if ($user->account_status === 'banned_temp' && $user->ban_expires_at) {
                    return response()->json([
                        'message' => 'Tu cuenta ha sido baneada temporalmente',
                        'ban_reason' => $user->ban_reason,
                        'ban_expires_at' => $user->ban_expires_at,
                    ], 403);
                } elseif ($user->account_status === 'banned_perm') {
                    return response()->json([
                        'message' => 'Tu cuenta ha sido baneada permanentemente',
                        'ban_reason' => $user->ban_reason,
                    ], 403);
                }
            }

            // Registrar login en logs de acceso
            \App\Http\Controllers\AdminController::logUserAccess($user->id, $request->header('User-Agent') ? 'mobile' : 'web');

            // Actualizar última actividad
            $user->updateLastActivity();

            $token = $user->createToken('api_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'login_type' => $loginType,
            ], 200, ['Content-Type' => 'application/json']);
        } catch (\Throwable $e) {
            // Retorna JSON siempre, incluso en errores inesperados
            return response()->json([
                'message' => 'Error interno al iniciar sesión',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'No autenticado'], 401);
            }

            $validator = Validator::make($request->all(), [
                'city' => 'nullable|string|max:100',
                'password' => 'nullable|string|min:6',
                'old_password' => 'required_with:password|string',
            ]);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }

            // Actualizar ciudad si se proporciona
            if ($request->has('city') && $request->city) {
                $user->city = $request->city;
                $user->location = $request->city;
            }

            // Actualizar contraseña si se proporciona
            if ($request->has('password') && $request->password) {
                if (!Hash::check($request->old_password, $user->password)) {
                    return response()->json(['message' => 'La contraseña actual es incorrecta'], 422);
                }
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return response()->json([
                'message' => 'Perfil actualizado correctamente',
                'user' => $user,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al actualizar perfil',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function uploadAvatar(Request $request)
    {
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'No autenticado'], 401);
            }

            $validator = Validator::make($request->all(), [
                'avatar' => 'required|image|max:5120', // 5MB
            ]);

            if ($validator->fails()) {
                return response()->json(['message' => $validator->errors()->first()], 422);
            }

            $file = $request->file('avatar');

            $disk = Storage::disk('public');

            // Limpia cualquier avatar previo del usuario para evitar referencias cruzadas
            if ($user->avatar) {
                $oldPath = ltrim(str_replace('/storage/', '', parse_url($user->avatar, PHP_URL_PATH)), '/');
                if ($oldPath) {
                    $disk->delete($oldPath);
                }
            }

            // Además elimina archivos huérfanos que usen el prefijo del usuario
            $prefix = 'avatars/user_' . $user->id . '_';
            foreach ($disk->files('avatars') as $existing) {
                if (str_starts_with($existing, $prefix)) {
                    $disk->delete($existing);
                }
            }

            $extension = $file->getClientOriginalExtension() ?: 'jpg';
            $filename = 'user_' . $user->id . '_' . time() . '.' . $extension;
            $path = $file->storeAs('avatars', $filename, 'public');
            // Genera URL dinámica basada en el request actual
            $url = request()->getSchemeAndHttpHost() . '/storage/' . $path;

            $user->avatar = $url;
            $user->save();

            return response()->json([
                'message' => 'Avatar actualizado',
                'avatar' => $url,
                'user' => $user,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Error al subir avatar',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
