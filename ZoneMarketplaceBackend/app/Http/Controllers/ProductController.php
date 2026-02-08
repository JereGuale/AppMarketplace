<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    private function mapProductImages($product)
    {
        $images = is_array($product->images) ? $product->images : (json_decode($product->images, true) ?? []);
        $product->images = array_map(function($path){
            if (!$path) return $path;
            // Usa la URL del request actual para detectar automáticamente host/puerto
            return request()->getSchemeAndHttpHost() . '/storage/' . ltrim($path, '/');
        }, $images);
        return $product;
    }
    // Obtener todos los productos
    public function index()
    {
        $products = Product::with('user:id,name,email,avatar')->latest()->get();
        $products = $products->map(function($p){ return $this->mapProductImages($p); });
        return response()->json($products);
    }

    // Obtener un producto específico
    public function show($id)
    {
        $product = Product::with('user:id,name,email,avatar')->find($id);
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }
        return response()->json($this->mapProductImages($product));
    }

    // Crear producto (requiere autenticación)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'description' => 'required|string|max:1000',
            'price' => 'required|numeric|min:0.01',
            'location' => 'required|string|max:100',
            'category' => 'nullable|string|max:50',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|string',
        ]);

        try {
            $imagePaths = [];
            
            // Procesar imágenes base64
            if ($request->has('images') && is_array($request->images)) {
                foreach ($request->images as $index => $base64Image) {
                    if (strpos($base64Image, 'data:image') === 0) {
                        // Extraer datos base64
                        $imageData = explode(',', $base64Image)[1] ?? $base64Image;
                        $imageData = base64_decode($imageData);
                        
                        $filename = 'products/' . auth()->id() . '_' . time() . '_' . $index . '.jpg';
                        Storage::disk('public')->put($filename, $imageData);
                        $imagePaths[] = $filename;
                    }
                }
            }

            $product = Product::create([
                'user_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'price' => $validated['price'],
                'location' => $validated['location'],
                'category' => $validated['category'] ?? 'Otros',
                'images' => $imagePaths,
            ]);

            $product = $product->load('user:id,name,email,avatar');
            $product = $this->mapProductImages($product);
            return response()->json($product, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear producto: ' . $e->getMessage()], 500);
        }
    }

    // Actualizar producto (solo propietario)
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($product->user_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:100',
            'description' => 'sometimes|string|max:1000',
            'price' => 'sometimes|numeric|min:0.01',
            'location' => 'sometimes|string|max:100',
            'category' => 'nullable|string|max:50',
            'images' => 'nullable|array|max:6',
            'images.*' => 'nullable|string',
        ]);

        // Si se están actualizando las imágenes, procesarlas
        if ($request->has('images')) {
            $validated['images'] = $request->images;
        }

        $product->update($validated);
        $product = $product->load('user:id,name,email,avatar');
        $product = $this->mapProductImages($product);
        return response()->json(['product' => $product]);
    }

    // Actualizar imágenes del producto (solo propietario)
    public function updateImages(Request $request, $id)
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($product->user_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            $finalImages = [];
            
            // 1. Obtener imágenes existentes que se mantienen
            $existingImages = [];
            if ($request->has('existing_images')) {
                $existingImagesJson = $request->input('existing_images');
                $existingImages = json_decode($existingImagesJson, true) ?? [];
            }
            
               \Log::info('Existing images from request:', $existingImages);
            foreach ($existingImages as $img) {
                if ($img) {
                    $finalImages[] = $img;
                }
            }
            
            // 2. Procesar nuevas imágenes subidas
            if ($request->hasFile('new_images')) {
                $newImages = $request->file('new_images');
                   \Log::info('New images count:', ['count' => count($newImages)]);
                foreach ($newImages as $index => $image) {
                    if ($image && $image->isValid()) {
                        // Generar nombre único para el archivo
                        $filename = 'products/' . auth()->id() . '_' . time() . '_' . $index . '.' . $image->getClientOriginalExtension();
                        
                        // Guardar la imagen
                        $path = $image->storeAs('public/' . dirname($filename), basename($filename));
                           \Log::info('Image path:', ['path' => $path]);
                        if ($path) {
                            // Agregar solo el path relativo (sin 'public/')
                            $relativePath = str_replace('public/', '', $path);
                            $finalImages[] = $relativePath;
                        }
                    }
                }
            }
            
            // 3. Actualizar el producto con las nuevas imágenes
            $product->images = $finalImages;
            $product->save();
            
            // 4. Recargar y retornar el producto actualizado
            $product = $product->load('user:id,name,email,avatar');
            $product = $this->mapProductImages($product);
            
            return response()->json([
                'message' => 'Imágenes actualizadas correctamente',
                'product' => $product,
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar imágenes: ' . $e->getMessage()
            ], 500);
        }
    }

    // Eliminar producto (solo propietario)
    public function destroy($id)
    {
        $product = Product::find($id);
        
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        if ($product->user_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $product->delete();
        return response()->json(['message' => 'Producto eliminado']);
    }

    // Obtener productos del usuario autenticado
    public function myProducts()
    {
        $products = Product::where('user_id', auth()->id())
            ->with('user:id,name,email,avatar')
            ->latest()
            ->get();
        $products = $products->map(function($p){ return $this->mapProductImages($p); });
        return response()->json($products);
    }

    // Marcar producto como vendido (solo propietario)
    public function markSold($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }
        if ($product->user_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        // Si la columna no existe, responder amable
        if (!\Schema::hasColumn('products', 'sold')) {
            return response()->json(['message' => 'Función no disponible: falta columna sold'], 400);
        }
        $product->sold = true;
        $product->save();
        $product = $product->load('user:id,name,email,avatar');
        $product = $this->mapProductImages($product);
        return response()->json(['message' => 'Producto marcado como agotado', 'product' => $product]);
    }
}
