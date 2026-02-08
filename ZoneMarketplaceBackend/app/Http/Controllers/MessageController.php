<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Notification;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            \Log::error('❌ No authenticated user found');
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        
        \Log::info('📂 Fetching conversations for user', ['user_id' => $user->id]);
        
        $conversations = Conversation::where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('seller_id', $user->id);
            })
            ->with([
                'user:id,name,email,avatar',
                'seller:id,name,email,avatar',
                'product',
                'messages' => function($query) {
                    $query->with('sender:id,name,email,avatar')->orderBy('created_at', 'desc')->limit(1);
                }
            ])
            ->orderBy('updated_at', 'desc')
            ->get();
        
        \Log::info('✅ Conversations fetched', ['count' => $conversations->count()]);
        return response()->json($conversations);
    }
    
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        \Log::info('📂 Fetching specific conversation', ['user_id' => $user->id, 'conversation_id' => $id]);
        
        $conversation = Conversation::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('seller_id', $user->id);
            })
            ->with([
                'user:id,name,email,avatar',
                'seller:id,name,email,avatar',
                'product',
                'messages' => function($query) {
                    $query->with('sender:id,name,email,avatar')->orderBy('created_at', 'asc');
                }
            ])
            ->first();
        
        if (!$conversation) {
            \Log::error('❌ Conversation not found', ['conversation_id' => $id]);
            return response()->json(['message' => 'Conversation not found'], 404);
        }
        
        \Log::info('✅ Conversation found with messages', ['messages_count' => $conversation->messages->count()]);
        
        // Mark messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $user->id)
            ->where('read', false)
            ->update(['read' => true]);
        
        return response()->json($conversation);
    }
    
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'text' => 'nullable|string',
            'image' => 'nullable|string',
            'conversation_id' => 'nullable|exists:conversations,id',
            'seller_id' => 'required_without:conversation_id|exists:users,id',
            'product_id' => 'nullable|exists:products,id',
        ]);
        
        // Find or create conversation
        if (isset($validated['conversation_id'])) {
            $conversation = Conversation::find($validated['conversation_id']);
        } else {
            $conversation = Conversation::firstOrCreate([
                'user_id' => $user->id,
                'seller_id' => $validated['seller_id'],
                'product_id' => $validated['product_id'] ?? null,
            ]);
        }
        
        // Create message
        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'text' => $validated['text'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);
        
        // Update conversation timestamp
        $conversation->touch();
        
        // Create notification for recipient
        $recipientId = $conversation->user_id == $user->id 
            ? $conversation->seller_id 
            : $conversation->user_id;
        
        Notification::create([
            'user_id' => $recipientId,
            'sender_id' => $user->id,
            'type' => 'message',
            'content' => 'te ha enviado un mensaje nuevo',
        ]);
        
        $message->load('sender:id,name,email,avatar');

        return response()->json([
            'message' => $message,
            'conversation_id' => $conversation->id,
            'conversation' => $conversation->load(['user:id,name,email,avatar', 'seller:id,name,email,avatar', 'product']),
        ], 201);
    }
    
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $conversation = Conversation::where('id', $id)
            ->where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhere('seller_id', $user->id);
            })
            ->first();
        
        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found'], 404);
        }
        
        $conversation->delete();
        
        return response()->json(['message' => 'Conversation deleted']);
    }
}
